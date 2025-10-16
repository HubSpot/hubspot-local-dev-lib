vi.mock('../../http');
import { http } from '../../http/index.js';
import { vi, type MockedFunction } from 'vitest';
import {
  addAppSecret,
  updateAppSecret,
  deleteAppSecret,
  fetchAppSecrets,
} from '../devSecrets.js';

const httpPostMock = http.post as MockedFunction<typeof http.post>;
const httpPatchMock = http.patch as MockedFunction<typeof http.patch>;
const httpDeleteMock = http.delete as MockedFunction<typeof http.delete>;
const httpGetMock = http.get as MockedFunction<typeof http.get>;

describe('api/devSecrets', () => {
  const accountId = 123;
  const appId = 456;
  const key = 'SECRET_KEY';
  const value = 'SECRET_VALUE';
  const DEV_APP_SECRETS_API_PATH = 'dev-secrets/management/v3/';

  describe('addAppSecret', () => {
    it('should call http.post with correct arguments', async () => {
      await addAppSecret(accountId, appId, key, value);
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: `${DEV_APP_SECRETS_API_PATH}secrets/app/${appId}`,
        data: { key, value },
      });
    });
  });

  describe('updateAppSecret', () => {
    it('should call addAppSecret (http.post) with correct arguments', async () => {
      await updateAppSecret(accountId, appId, key, value);
      expect(httpPatchMock).toHaveBeenCalledTimes(1);
      expect(httpPatchMock).toHaveBeenCalledWith(accountId, {
        url: `${DEV_APP_SECRETS_API_PATH}secrets/app/${appId}`,
        data: { key, value },
      });
    });
  });

  describe('deleteAppSecret', () => {
    it('should call http.delete with correct arguments', async () => {
      await deleteAppSecret(accountId, appId, key);
      expect(httpDeleteMock).toHaveBeenCalledTimes(1);
      expect(httpDeleteMock).toHaveBeenCalledWith(accountId, {
        url: `${DEV_APP_SECRETS_API_PATH}secrets/app/${appId}`,
        data: { key },
      });
    });
  });

  describe('fetchAppSecrets', () => {
    it('should call http.get with correct arguments', async () => {
      await fetchAppSecrets(accountId, appId);
      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(httpGetMock).toHaveBeenCalledWith(accountId, {
        url: `${DEV_APP_SECRETS_API_PATH}keys/app/${appId}`,
      });
    });
  });
});
