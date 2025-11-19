import moment from 'moment';
import {
  getConfig as __getConfig,
  getConfigAccountById as __getConfigAccountById,
  updateConfigAccount as __updateConfigAccount,
  addConfigAccount as __addConfigAccount,
  setConfigAccountAsDefault as __setConfigAccountAsDefault,
  getConfigAccountIfExists as __getConfigAccountIfExists,
  getConfigDefaultAccountIfExists as __getConfigDefaultAccountIfExists,
} from '../../config';
import { fetchAccessToken as __fetchAccessToken } from '../../api/localDevAuth';
import { fetchSandboxHubData as __fetchSandboxHubData } from '../../api/sandboxHubs';
import { fetchDeveloperTestAccountData as __fetchDeveloperTestAccountData } from '../../api/developerTestAccounts';
import { ENVIRONMENTS } from '../../constants/environments';
import { HUBSPOT_ACCOUNT_TYPES } from '../../constants/config';
import {
  accessTokenForPersonalAccessKey,
  getAccessToken,
  updateConfigWithAccessToken,
} from '../personalAccessKey';
import { HubSpotConfigAccount } from '../../types/Accounts';
import { mockAxiosResponse } from './__utils__/mockAxiosResponse';

jest.mock('../../config');
jest.mock('../logger');
jest.mock('../../api/localDevAuth');
jest.mock('../../api/sandboxHubs');
jest.mock('../../api/developerTestAccounts');

const updateConfigAccount = __updateConfigAccount as jest.MockedFunction<
  typeof __updateConfigAccount
>;
const addConfigAccount = __addConfigAccount as jest.MockedFunction<
  typeof __addConfigAccount
>;
const setConfigAccountAsDefault =
  __setConfigAccountAsDefault as jest.MockedFunction<
    typeof __setConfigAccountAsDefault
  >;
const getConfigAccountIfExists =
  __getConfigAccountIfExists as jest.MockedFunction<
    typeof __getConfigAccountIfExists
  >;
const getConfigDefaultAccountIfExists =
  __getConfigDefaultAccountIfExists as jest.MockedFunction<
    typeof __getConfigDefaultAccountIfExists
  >;
const getConfigAccountById = __getConfigAccountById as jest.MockedFunction<
  typeof __getConfigAccountById
>;
const getConfig = __getConfig as jest.MockedFunction<typeof __getConfig>;
const fetchAccessToken = __fetchAccessToken as jest.MockedFunction<
  typeof __fetchAccessToken
>;
const fetchSandboxHubData = __fetchSandboxHubData as jest.MockedFunction<
  typeof __fetchSandboxHubData
>;
const fetchDeveloperTestAccountData =
  __fetchDeveloperTestAccountData as jest.MockedFunction<
    typeof __fetchDeveloperTestAccountData
  >;

describe('lib/personalAccessKey', () => {
  describe('accessTokenForPersonalAccessKey()', () => {
    it('refreshes access token when access token is missing', async () => {
      const accountId = 123;
      const account: HubSpotConfigAccount = {
        name: 'test-account',
        accountId,
        authType: 'personalaccesskey',
        personalAccessKey: 'let-me-in',
        env: ENVIRONMENTS.QA,
        auth: {
          tokenInfo: {},
        },
      };
      getConfig.mockReturnValue({
        accounts: [account],
      });
      getConfigAccountById.mockReturnValue(account);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in',
          scopeGroups: ['content'],
          hubId: accountId,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );
      const accessToken = await accessTokenForPersonalAccessKey(accountId);
      expect(accessToken).toEqual(freshAccessToken);
    });
    it('uses accountId when refreshing token', async () => {
      const accountId = 123;
      const account: HubSpotConfigAccount = {
        accountId,
        name: 'test-account',
        authType: 'personalaccesskey',
        personalAccessKey: 'let-me-in-2',
        env: ENVIRONMENTS.PROD,
        auth: {
          tokenInfo: {},
        },
      };
      getConfig.mockReturnValue({
        accounts: [account],
      });
      getConfigAccountById.mockReturnValue(account);

      await accessTokenForPersonalAccessKey(accountId);
      expect(fetchAccessToken).toHaveBeenCalledWith(
        'let-me-in-2',
        ENVIRONMENTS.PROD,
        accountId
      );
    });
    it('refreshes access token when the existing token is expired', async () => {
      const accountId = 123;
      const account: HubSpotConfigAccount = {
        name: 'test-account',
        accountId,
        authType: 'personalaccesskey',
        personalAccessKey: 'let-me-in-3',
        auth: {
          tokenInfo: {
            expiresAt: moment().subtract(1, 'hours').toISOString(),
            accessToken: 'test-token',
          },
        },
        env: ENVIRONMENTS.QA,
      };
      getConfig.mockReturnValue({
        accounts: [account],
      });
      getConfigAccountById.mockReturnValue(account);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-3',
          scopeGroups: ['content'],
          hubId: accountId,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );
      const accessToken = await accessTokenForPersonalAccessKey(accountId);
      expect(accessToken).toEqual(freshAccessToken);
    });
    it('refreshes access tokens multiple times', async () => {
      const accountId = 123;
      const accessKey = 'let-me-in-4';
      const userId = 456;
      function mockAccount(
        expiresAt: string,
        accessToken: string
      ): HubSpotConfigAccount {
        return {
          name: 'test-account',
          accountId,
          authType: 'personalaccesskey',
          personalAccessKey: accessKey,
          auth: {
            tokenInfo: {
              expiresAt,
              accessToken,
            },
          },
          env: ENVIRONMENTS.QA,
        };
      }
      const initialAccountConfig = mockAccount(
        moment().subtract(2, 'hours').toISOString(),
        'test-token'
      );
      getConfig.mockReturnValueOnce({
        accounts: [initialAccountConfig],
      });
      getConfigAccountById.mockReturnValueOnce(initialAccountConfig);

      const firstAccessToken = 'fresh-token';
      const expiresAtMillis = moment().subtract(1, 'hours').valueOf();

      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: firstAccessToken,
          expiresAtMillis,
          encodedOAuthRefreshToken: accessKey,
          scopeGroups: ['content'],
          hubId: accountId,
          userId,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );
      const firstRefreshedAccessToken =
        await accessTokenForPersonalAccessKey(accountId);
      expect(firstRefreshedAccessToken).toEqual(firstAccessToken);
      const updatedAccountConfig = mockAccount(
        moment(expiresAtMillis).toISOString(),
        firstAccessToken
      );
      getConfig.mockReturnValueOnce({
        accounts: [updatedAccountConfig],
      });
      getConfigAccountById.mockReturnValueOnce(updatedAccountConfig);

      const secondAccessToken = 'another-fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: secondAccessToken,
          expiresAtMillis,
          encodedOAuthRefreshToken: accessKey,
          scopeGroups: ['content'],
          hubId: accountId,
          userId,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const secondRefreshedAccessToken =
        await accessTokenForPersonalAccessKey(accountId);
      expect(secondRefreshedAccessToken).toEqual(secondAccessToken);
    });
  });

  describe('updateConfigWithPersonalAccessKey()', () => {
    it('updates the config with the new account', async () => {
      const existingAccount = {
        accountId: 123,
        name: 'account-name',
        authType: 'personalaccesskey' as const,
        personalAccessKey: 'old-key',
        env: ENVIRONMENTS.QA,
        auth: {
          tokenInfo: {
            accessToken: 'old-token',
            expiresAt: moment().add(1, 'hours').toISOString(),
          },
        },
      };
      getConfigAccountIfExists.mockReturnValue(existingAccount);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-5',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'account-name'
      );

      expect(updateConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
          personalAccessKey: 'pak_123',
          name: 'account-name',
          authType: 'personalaccesskey',
        })
      );
    });

    it('updates the config with the new account for sandbox accounts', async () => {
      const existingAccount = {
        accountId: 123,
        name: 'account-name',
        authType: 'personalaccesskey' as const,
        personalAccessKey: 'old-key',
        env: ENVIRONMENTS.QA,
        auth: {
          tokenInfo: {
            accessToken: 'old-token',
            expiresAt: moment().add(1, 'hours').toISOString(),
          },
        },
      };
      getConfigAccountIfExists.mockReturnValue(existingAccount);

      fetchSandboxHubData.mockResolvedValue(
        mockAxiosResponse({
          type: 'DEVELOPER',
          parentHubId: 789,
        })
      );

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-5',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'account-name'
      );

      expect(updateConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          accountType: HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX,
          personalAccessKey: 'pak_123',
          name: 'account-name',
          authType: 'personalaccesskey',
          parentAccountId: 789,
        })
      );
    });

    it('updates the config with the new account for developer test accounts', async () => {
      const existingAccount = {
        accountId: 123,
        name: 'Dev test portal',
        authType: 'personalaccesskey' as const,
        personalAccessKey: 'old-key',
        env: ENVIRONMENTS.QA,
        auth: {
          tokenInfo: {
            accessToken: 'old-token',
            expiresAt: moment().add(1, 'hours').toISOString(),
          },
        },
      };
      getConfigAccountIfExists.mockReturnValue(existingAccount);

      fetchSandboxHubData.mockRejectedValue(new Error('Not a sandbox'));
      fetchDeveloperTestAccountData.mockResolvedValue(
        mockAxiosResponse({
          parentPortalId: 999,
          testPortalId: 123,
          accountName: 'Dev test portal',
          createdAt: '123',
          updatedAt: '123',
          status: 'ACTIVE',
        })
      );

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-5',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.DEVELOPER_TEST,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'Dev test portal'
      );

      expect(updateConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          accountType: HUBSPOT_ACCOUNT_TYPES.DEVELOPER_TEST,
          personalAccessKey: 'pak_123',
          name: 'Dev test portal',
          authType: 'personalaccesskey',
          parentAccountId: 999,
        })
      );
    });

    it('adds a new account when account does not exist', async () => {
      getConfigAccountIfExists.mockReturnValue(undefined);
      getConfigDefaultAccountIfExists.mockReturnValue(undefined);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-6',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'new-account'
      );

      expect(addConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
          personalAccessKey: 'pak_123',
          name: 'new-account',
          authType: 'personalaccesskey',
        })
      );
      expect(updateConfigAccount).not.toHaveBeenCalled();
    });

    it('updates existing account when account exists', async () => {
      const existingAccount = {
        accountId: 123,
        name: 'existing-account',
        authType: 'personalaccesskey' as const,
        personalAccessKey: 'old-key',
        env: ENVIRONMENTS.PROD,
        auth: {
          tokenInfo: {
            accessToken: 'old-token',
            expiresAt: moment().add(1, 'hours').toISOString(),
          },
        },
      };
      getConfigAccountIfExists.mockReturnValue(existingAccount);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-7',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'existing-account'
      );

      expect(updateConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          personalAccessKey: 'pak_123',
          name: 'existing-account',
        })
      );
      expect(addConfigAccount).not.toHaveBeenCalled();
    });

    it('sets account as default when makeDefault is true', async () => {
      getConfigAccountIfExists.mockReturnValue(undefined);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-8',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'default-account',
        true
      );

      expect(setConfigAccountAsDefault).toHaveBeenCalledWith(123);
    });

    it('does not set account as default when makeDefault is false', async () => {
      getConfigAccountIfExists.mockReturnValue(undefined);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-9',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'not-default-account',
        false
      );

      expect(setConfigAccountAsDefault).not.toHaveBeenCalled();
    });

    it('defaults environment to PROD when not provided and no existing account', async () => {
      getConfigAccountIfExists.mockReturnValue(undefined);
      getConfigDefaultAccountIfExists.mockReturnValue(undefined);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-10',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', undefined, 123);

      await updateConfigWithAccessToken(token, 'pak_123', undefined, 'account');

      expect(addConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          env: ENVIRONMENTS.PROD,
        })
      );
    });

    it('uses existing account environment when env not provided', async () => {
      const existingAccount = {
        accountId: 123,
        name: 'existing-account',
        authType: 'personalaccesskey' as const,
        personalAccessKey: 'old-key',
        env: ENVIRONMENTS.QA,
        auth: {
          tokenInfo: {
            accessToken: 'old-token',
            expiresAt: moment().add(1, 'hours').toISOString(),
          },
        },
      };
      getConfigAccountIfExists.mockReturnValue(existingAccount);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-11',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'test-hub',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.PROD, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        undefined,
        'existing-account'
      );

      expect(updateConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          env: ENVIRONMENTS.QA,
        })
      );
    });

    it('uses token hubName when name not provided and no existing account', async () => {
      getConfigAccountIfExists.mockReturnValue(undefined);
      getConfigDefaultAccountIfExists.mockReturnValue(undefined);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-12',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'hub-from-token',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(token, 'pak_123', ENVIRONMENTS.QA);

      expect(addConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'hub-from-token',
        })
      );
    });

    it('uses existing account name when updating by name', async () => {
      const existingAccount = {
        accountId: 123,
        name: 'existing-name',
        authType: 'personalaccesskey' as const,
        personalAccessKey: 'old-key',
        env: ENVIRONMENTS.PROD,
        auth: {
          tokenInfo: {
            accessToken: 'old-token',
            expiresAt: moment().add(1, 'hours').toISOString(),
          },
        },
      };
      getConfigAccountIfExists.mockReturnValue(existingAccount);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue(
        mockAxiosResponse({
          oauthAccessToken: freshAccessToken,
          expiresAtMillis: moment().add(1, 'hours').valueOf(),
          encodedOAuthRefreshToken: 'let-me-in-13',
          scopeGroups: ['content'],
          hubId: 123,
          userId: 456,
          hubName: 'hub-from-token',
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
        })
      );

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'existing-name'
      );

      expect(updateConfigAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'existing-name',
        })
      );
    });
  });
});
