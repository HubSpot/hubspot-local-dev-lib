import moment from 'moment';
import {
  getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded,
  getAccountConfig as __getAccountConfig,
  updateAccountConfig as __updateAccountConfig,
} from '../../config';
import { fetchAccessToken as __fetchAccessToken } from '../../api/localDevAuth';
import { fetchSandboxHubData as __fetchSandboxHubData } from '../../api/sandboxHubs';
import { ENVIRONMENTS } from '../../constants/environments';
import {
  accessTokenForPersonalAccessKey,
  updateConfigWithPersonalAccessKey,
} from '../personalAccessKey';
import { AuthType } from '../../types/Accounts';

jest.mock('../../config');
jest.mock('../logging/logger');
jest.mock('../../api/localDevAuth');
jest.mock('../../api/sandboxHubs');

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

describe('personalAccessKey', () => {
  describe('accessTokenForPersonalAccessKey', () => {
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
      });

      const secondRefreshedAccessToken =
        await accessTokenForPersonalAccessKey(accountId);
      expect(secondRefreshedAccessToken).toEqual(secondAccessToken);
    });
  });

  describe('updateConfigWithPersonalAccessKey', () => {
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
      });
    });

    it('updates the config with the new account', async () => {
      fetchAccessToken.mockClear();

      await updateConfigWithPersonalAccessKey(
        'pak_123',
        'account-name',
        ENVIRONMENTS.QA
      );

      expect(updateAccountConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          personalAccessKey: 'pak_123',
          name: 'account-name',
          authType: 'personalaccesskey',
          sandboxAccountType: null,
          parentAccountId: null,
        })
      );
    });

    it('updates the config with the new account for sandbox accounts', async () => {
      fetchSandboxHubData.mockResolvedValue({
        type: 'developer',
        parentHubId: 789,
      });

      await updateConfigWithPersonalAccessKey(
        'pak_123',
        'account-name',
        ENVIRONMENTS.QA
      );

      expect(updateAccountConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 123,
          personalAccessKey: 'pak_123',
          name: 'account-name',
          authType: 'personalaccesskey',
          sandboxAccountType: 'developer',
          parentAccountId: 789,
        })
      );
    });
  });
});
