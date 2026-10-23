import { http } from '../../http/index.js';
import { vi, type MockedFunction } from 'vitest';
import {
  createAppSecret,
  updateAppSecret,
  deleteAppSecret,
  fetchAppSecrets,
} from '../appSecrets.js';

vi.mock('../../http');

const httpPostMock = http.post as MockedFunction<typeof http.post>;
const httpPatchMock = http.patch as MockedFunction<typeof http.patch>;
const httpGetMock = http.get as MockedFunction<typeof http.get>;

describe('api/appSecrets', () => {
  const accountId = 123;
  const appId = 456;
  const key = 'SECRET_KEY';
  const value = 'SECRET_VALUE';
  const secretsPath = `developers/secrets/2027-03/apps/${appId}/secrets`;

  describe('createAppSecret', () => {
    it('should call http.post with correct arguments', async () => {
      await createAppSecret(accountId, appId, key, value);
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: secretsPath,
        data: { key, value },
      });
    });
  });

  describe('fetchAppSecrets', () => {
    it('should call http.get with correct arguments', async () => {
      await fetchAppSecrets(accountId, appId);
      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(httpGetMock).toHaveBeenCalledWith(accountId, {
        url: secretsPath,
      });
    });
  });

  describe('updateAppSecret', () => {
    it('should call http.patch with correct arguments', async () => {
      await updateAppSecret(accountId, appId, key, value);
      expect(httpPatchMock).toHaveBeenCalledTimes(1);
      expect(httpPatchMock).toHaveBeenCalledWith(accountId, {
        url: secretsPath,
        data: { key, value },
      });
    });
  });

  describe('deleteAppSecret', () => {
    it('should call http.post on the delete path with correct arguments', async () => {
      await deleteAppSecret(accountId, appId, key);
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: `${secretsPath}/delete`,
        data: { key },
      });
    });
  });
});
