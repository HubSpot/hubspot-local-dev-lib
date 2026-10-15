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
  const betaSecretsPath = `developers/secrets/2027-03-beta/apps/${appId}/secrets`;
  const stableSecretsPath = `developers/secrets/2027-03/apps/${appId}/secrets`;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-02-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createAppSecret', () => {
    it('should call http.post with correct arguments', async () => {
      await createAppSecret(accountId, appId, key, value);
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: betaSecretsPath,
        data: { key, value },
      });
    });

    it('should use the stable version path from the stable start date', async () => {
      vi.setSystemTime(new Date('2027-03-01T00:00:00Z'));
      await createAppSecret(accountId, appId, key, value);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: stableSecretsPath,
        data: { key, value },
      });
    });
  });

  describe('fetchAppSecrets', () => {
    it('should call http.get with correct arguments', async () => {
      await fetchAppSecrets(accountId, appId);
      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(httpGetMock).toHaveBeenCalledWith(accountId, {
        url: betaSecretsPath,
      });
    });

    it('should use the stable version path from the stable start date', async () => {
      vi.setSystemTime(new Date('2027-03-01T00:00:00Z'));
      await fetchAppSecrets(accountId, appId);
      expect(httpGetMock).toHaveBeenCalledWith(accountId, {
        url: stableSecretsPath,
      });
    });
  });

  describe('updateAppSecret', () => {
    it('should call http.patch with correct arguments', async () => {
      await updateAppSecret(accountId, appId, key, value);
      expect(httpPatchMock).toHaveBeenCalledTimes(1);
      expect(httpPatchMock).toHaveBeenCalledWith(accountId, {
        url: betaSecretsPath,
        data: { key, value },
      });
    });

    it('should use the stable version path from the stable start date', async () => {
      vi.setSystemTime(new Date('2027-03-01T00:00:00Z'));
      await updateAppSecret(accountId, appId, key, value);
      expect(httpPatchMock).toHaveBeenCalledWith(accountId, {
        url: stableSecretsPath,
        data: { key, value },
      });
    });
  });

  describe('deleteAppSecret', () => {
    it('should call http.post on the delete path with correct arguments', async () => {
      await deleteAppSecret(accountId, appId, key);
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: `${betaSecretsPath}/delete`,
        data: { key },
      });
    });

    it('should use the stable version path from the stable start date', async () => {
      vi.setSystemTime(new Date('2027-03-01T00:00:00Z'));
      await deleteAppSecret(accountId, appId, key);
      expect(httpPostMock).toHaveBeenCalledWith(accountId, {
        url: `${stableSecretsPath}/delete`,
        data: { key },
      });
    });
  });
});
