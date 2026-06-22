import { http } from '../../http/index.js';
import { vi, type MockedFunction } from 'vitest';
import {
  fetchDeveloperTestAccounts,
  createDeveloperTestAccount,
  deleteDeveloperTestAccount,
  installOauthAppIntoDeveloperTestAccount,
  fetchDeveloperTestAccountOauthAppInstallStatus,
  fetchDeveloperTestAccountGateSyncStatus,
  generateDeveloperTestAccountPersonalAccessKey,
} from '../developerTestAccounts.js';
import { SANDBOX_TIMEOUT } from '../../constants/api.js';

vi.mock('../../http');

const httpGetMock = http.get as MockedFunction<typeof http.get>;
const httpPostMock = http.post as MockedFunction<typeof http.post>;
const httpDeleteMock = http.delete as MockedFunction<typeof http.delete>;

describe('api/developerTestAccounts', () => {
  const accountId = 123;
  const testAccountId = 456;
  const TEST_ACCOUNTS_API_PATH = 'integrators/test-portals/v2';
  const TEST_ACCOUNTS_API_PATH_V3 = 'integrators/test-portals/v3';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchDeveloperTestAccounts', () => {
    it('should call http.get with correct arguments including SANDBOX_TIMEOUT', async () => {
      await fetchDeveloperTestAccounts(accountId);
      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(httpGetMock).toHaveBeenCalledWith(accountId, {
        url: TEST_ACCOUNTS_API_PATH,
        timeout: SANDBOX_TIMEOUT,
      });
    });
  });

  describe('createDeveloperTestAccount', () => {
    it('should call http.post with v2 path when accountInfo is a string', async () => {
      await createDeveloperTestAccount(accountId, 'my-account');
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: TEST_ACCOUNTS_API_PATH,
        data: { accountName: 'my-account', generatePersonalAccessKey: true },
        timeout: SANDBOX_TIMEOUT,
      });
    });

    it('should call http.post with v3 path when accountInfo is an object', async () => {
      const accountInfo = { accountName: 'my-account' };
      await createDeveloperTestAccount(accountId, accountInfo);
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: TEST_ACCOUNTS_API_PATH_V3,
        data: accountInfo,
        timeout: SANDBOX_TIMEOUT,
      });
    });
  });

  describe('deleteDeveloperTestAccount', () => {
    it('should call http.delete with v2 path by default', async () => {
      await deleteDeveloperTestAccount(accountId, testAccountId);
      expect(httpDeleteMock).toHaveBeenCalledTimes(1);
      expect(httpDeleteMock).toHaveBeenCalledWith(accountId, {
        url: `${TEST_ACCOUNTS_API_PATH}/${testAccountId}`,
      });
    });

    it('should call http.delete with v3 path when useV3 is true', async () => {
      await deleteDeveloperTestAccount(accountId, testAccountId, true);
      expect(httpDeleteMock).toHaveBeenCalledTimes(1);
      expect(httpDeleteMock).toHaveBeenCalledWith(accountId, {
        url: `${TEST_ACCOUNTS_API_PATH_V3}/${testAccountId}`,
      });
    });
  });

  describe('installOauthAppIntoDeveloperTestAccount', () => {
    it('should call http.post with correct arguments', async () => {
      const projectName = 'my-project';
      const appUId = 'my-app-uid';
      await installOauthAppIntoDeveloperTestAccount(
        accountId,
        testAccountId,
        projectName,
        appUId
      );
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: `${TEST_ACCOUNTS_API_PATH_V3}/install-apps`,
        data: {
          testPortalId: testAccountId,
          developerQualifiedSymbol: {
            developerSymbol: appUId,
            projectName,
          },
        },
        timeout: SANDBOX_TIMEOUT,
      });
    });
  });

  describe('fetchDeveloperTestAccountOauthAppInstallStatus', () => {
    it('should call http.post with correct arguments', async () => {
      const projectName = 'my-project';
      const appUId = 'my-app-uid';
      await fetchDeveloperTestAccountOauthAppInstallStatus(
        accountId,
        projectName,
        appUId
      );
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: `${TEST_ACCOUNTS_API_PATH_V3}/install-apps/readiness`,
        data: {
          developerQualifiedSymbol: {
            developerSymbol: appUId,
            projectName,
          },
        },
        timeout: SANDBOX_TIMEOUT,
      });
    });
  });

  describe('fetchDeveloperTestAccountGateSyncStatus', () => {
    it('should call http.get with correct arguments', async () => {
      await fetchDeveloperTestAccountGateSyncStatus(accountId, testAccountId);
      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(httpGetMock).toHaveBeenCalledWith(accountId, {
        url: `${TEST_ACCOUNTS_API_PATH_V3}/gate-sync-status/${testAccountId}`,
      });
    });
  });

  describe('generateDeveloperTestAccountPersonalAccessKey', () => {
    it('should call http.get with correct arguments', async () => {
      await generateDeveloperTestAccountPersonalAccessKey(
        accountId,
        testAccountId
      );
      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(httpGetMock).toHaveBeenCalledWith(accountId, {
        url: `${TEST_ACCOUNTS_API_PATH_V3}/generate-pak/${testAccountId}`,
      });
    });
  });
});
