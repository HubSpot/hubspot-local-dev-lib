import moment from 'moment';
import {
  getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded,
  getAccountConfig as __getAccountConfig,
  updateAccountConfig as __updateAccountConfig,
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
import { AuthType } from '../../types/Accounts';

jest.mock('../../config');
jest.mock('../logging/logger');
jest.mock('../../api/localDevAuth');
jest.mock('../../api/sandboxHubs');
jest.mock('../../api/developerTestAccounts');

const updateAccountConfig = __updateAccountConfig as jest.MockedFunction<
  typeof __updateAccountConfig
>;
const getAccountConfig = __getAccountConfig as jest.MockedFunction<
  typeof __getAccountConfig
>;
const getAndLoadConfigIfNeeded =
  __getAndLoadConfigIfNeeded as jest.MockedFunction<
    typeof __getAndLoadConfigIfNeeded
  >;
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
      const account = {
        accountId,
        authType: 'personalaccesskey' as AuthType,
        personalAccessKey: 'let-me-in',
        env: ENVIRONMENTS.QA,
      };
      getAndLoadConfigIfNeeded.mockReturnValue({
        accounts: [account],
      });
      getAccountConfig.mockReturnValue(account);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue({
        oauthAccessToken: freshAccessToken,
        expiresAtMillis: moment().add(1, 'hours').valueOf(),
        encodedOAuthRefreshToken: 'let-me-in',
        scopeGroups: ['content'],
        hubId: accountId,
        userId: 456,
        hubName: 'test-hub',
      });
      const accessToken = await accessTokenForPersonalAccessKey(accountId);
      expect(accessToken).toEqual(freshAccessToken);
    });
    it('uses accountId when refreshing token', async () => {
      const accountId = 123;
      const account = {
        accountId,
        authType: 'personalaccesskey' as AuthType,
        personalAccessKey: 'let-me-in-2',
        env: ENVIRONMENTS.PROD,
      };
      getAndLoadConfigIfNeeded.mockReturnValue({
        accounts: [account],
      });
      getAccountConfig.mockReturnValue(account);

      await accessTokenForPersonalAccessKey(accountId);
      expect(fetchAccessToken).toHaveBeenCalledWith(
        'let-me-in-2',
        ENVIRONMENTS.PROD,
        accountId
      );
    });
    it('refreshes access token when the existing token is expired', async () => {
      const accountId = 123;
      const account = {
        accountId,
        authType: 'personalaccesskey' as AuthType,
        personalAccessKey: 'let-me-in-3',
        auth: {
          tokenInfo: {
            expiresAt: moment().subtract(1, 'hours').toISOString(),
            accessToken: 'test-token',
          },
        },
        env: ENVIRONMENTS.QA,
      };
      getAndLoadConfigIfNeeded.mockReturnValue({
        accounts: [account],
      });
      getAccountConfig.mockReturnValue(account);

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue({
        oauthAccessToken: freshAccessToken,
        expiresAtMillis: moment().add(1, 'hours').valueOf(),
        encodedOAuthRefreshToken: 'let-me-in-3',
        scopeGroups: ['content'],
        hubId: accountId,
        userId: 456,
        hubName: 'test-hub',
      });
      const accessToken = await accessTokenForPersonalAccessKey(accountId);
      expect(accessToken).toEqual(freshAccessToken);
    });
    it('refreshes access tokens multiple times', async () => {
      const accountId = 123;
      const accessKey = 'let-me-in-4';
      const userId = 456;
      const mockAccount = (expiresAt: string, accessToken: string) => ({
        accountId,
        authType: 'personalaccesskey' as AuthType,
        personalAccessKey: accessKey,
        auth: {
          tokenInfo: {
            expiresAt,
            accessToken,
          },
        },
        env: ENVIRONMENTS.QA,
      });
      const initialAccountConfig = mockAccount(
        moment().subtract(2, 'hours').toISOString(),
        'test-token'
      );
      getAndLoadConfigIfNeeded.mockReturnValueOnce({
        accounts: [initialAccountConfig],
      });
      getAccountConfig.mockReturnValueOnce(initialAccountConfig);

      const firstAccessToken = 'fresh-token';
      const expiresAtMillis = moment().subtract(1, 'hours').valueOf();

      fetchAccessToken.mockResolvedValue({
        oauthAccessToken: firstAccessToken,
        expiresAtMillis,
        encodedOAuthRefreshToken: accessKey,
        scopeGroups: ['content'],
        hubId: accountId,
        userId,
        hubName: 'test-hub',
      });
      const firstRefreshedAccessToken =
        await accessTokenForPersonalAccessKey(accountId);
      expect(firstRefreshedAccessToken).toEqual(firstAccessToken);
      const updatedAccountConfig = mockAccount(
        moment(expiresAtMillis).toISOString(),
        firstAccessToken
      );
      getAndLoadConfigIfNeeded.mockReturnValueOnce({
        accounts: [updatedAccountConfig],
      });
      getAccountConfig.mockReturnValueOnce(updatedAccountConfig);

      const secondAccessToken = 'another-fresh-token';
      fetchAccessToken.mockResolvedValue({
        oauthAccessToken: secondAccessToken,
        expiresAtMillis,
        encodedOAuthRefreshToken: accessKey,
        scopeGroups: ['content'],
        hubId: accountId,
        userId,
        hubName: 'test-hub',
      });

      const secondRefreshedAccessToken =
        await accessTokenForPersonalAccessKey(accountId);
      expect(secondRefreshedAccessToken).toEqual(secondAccessToken);
    });
  });

  describe('updateConfigWithPersonalAccessKey()', () => {
    beforeEach(() => {
      fetchAccessToken.mockClear();
      updateAccountConfig.mockClear();

      const freshAccessToken = 'fresh-token';
      fetchAccessToken.mockResolvedValue({
        oauthAccessToken: freshAccessToken,
        expiresAtMillis: moment().add(1, 'hours').valueOf(),
        encodedOAuthRefreshToken: 'let-me-in-5',
        scopeGroups: ['content'],
        hubId: 123,
        userId: 456,
        hubName: 'test-hub',
      });
    });

    it('updates the config with the new account', async () => {
      fetchAccessToken.mockClear();

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'account-name'
      );

      expect(updateAccountConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          accountType: HUBSPOT_ACCOUNT_TYPES.STANDARD,
          personalAccessKey: 'pak_123',
          name: 'account-name',
          authType: 'personalaccesskey',
          sandboxAccountType: null,
        })
      );
    });

    it('updates the config with the new account for sandbox accounts', async () => {
      fetchSandboxHubData.mockResolvedValue({
        type: 'DEVELOPER',
        parentHubId: 789,
      });

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'account-name'
      );

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'account-name'
      );

      expect(updateAccountConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          accountType: HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX,
          personalAccessKey: 'pak_123',
          name: 'account-name',
          authType: 'personalaccesskey',
          sandboxAccountType: 'DEVELOPER',
          parentAccountId: 789,
        })
      );
    });

    it('updates the config with the new account for developer test accounts', async () => {
      fetchSandboxHubData.mockRejectedValue(new Error('Not a sandbox'));
      fetchDeveloperTestAccountData.mockResolvedValue({
        parentPortalId: 999,
        testPortalId: 123,
        accountName: 'Dev test portal',
        createdAt: '123',
        updatedAt: '123',
        status: 'ACTIVE',
      });

      const token = await getAccessToken('pak_123', ENVIRONMENTS.QA, 123);

      await updateConfigWithAccessToken(
        token,
        'pak_123',
        ENVIRONMENTS.QA,
        'Dev test portal'
      );

      expect(updateAccountConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          accountType: HUBSPOT_ACCOUNT_TYPES.DEVELOPER_TEST,
          personalAccessKey: 'pak_123',
          name: 'Dev test portal',
          authType: 'personalaccesskey',
          sandboxAccountType: null,
          parentAccountId: 999,
        })
      );
    });
  });
});
