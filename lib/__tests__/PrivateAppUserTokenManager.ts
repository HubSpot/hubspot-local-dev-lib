import { scopeGroupsForPersonalAccessKey as __scopeGroupsForPersonalAccessKey } from '../personalAccessKey';
import { PrivateAppUserTokenManager } from '../PrivateAppUserTokenManager';
import {
  fetchPrivateAppUserToken as __fetchPrivateAppUserToken,
  createPrivateAppUserToken as __createPrivateAppUserToken,
  updatePrivateAppUserToken as __updatePrivateAppUserToken,
  PrivateAppUserTokenResponse,
} from '../../api/privateAppUserToken';
import { AxiosError, AxiosHeaders } from 'axios';

jest.mock('../personalAccessKey');
jest.mock('../../api/privateAppUserToken');

const scopeGroupsForPersonalAccessKey =
  __scopeGroupsForPersonalAccessKey as jest.MockedFunction<
    typeof __scopeGroupsForPersonalAccessKey
  >;

const fetchPrivateAppUserToken =
  __fetchPrivateAppUserToken as jest.MockedFunction<
    typeof __fetchPrivateAppUserToken
  >;
const createPrivateAppUserToken =
  __createPrivateAppUserToken as jest.MockedFunction<
    typeof __createPrivateAppUserToken
  >;
const updatePrivateAppUserToken =
  __updatePrivateAppUserToken as jest.MockedFunction<
    typeof __updatePrivateAppUserToken
  >;

describe('lib/PrivateAppUserTokenManager', () => {
  const accountId = 123;
  const pakScopesTokenEnabled = Promise.resolve([
    'developer.private_app.temporary_token.read',
    'developer.private_app.temporary_token.write',
  ]);
  const pakScopesTokenDisabled = Promise.resolve(['developer.projects.read']);

  let manager: PrivateAppUserTokenManager;

  describe('init()', () => {
    beforeEach(() => {
      manager = new PrivateAppUserTokenManager(accountId);
    });

    afterEach(() => {
      manager.cleanup();
    });

    it('should enable PrivateAppUserTokenManager when personal access key has all scopes', async () => {
      scopeGroupsForPersonalAccessKey.mockReturnValue(pakScopesTokenEnabled);
      await manager.init();
      expect(manager.isEnabled()).toBe(true);
    });
    it('should not enable PrivateAppUserTokenManager if the personal access key does not contain scopes', async () => {
      scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenDisabled);
      try {
        await manager.init();
      } catch (e) {
        expect(e).toBeDefined();
      }
      expect(manager.isEnabled()).toBe(false);
    });
  });

  describe('getPrivateAppToken()', () => {
    const systemTime = new Date(Date.UTC(2024, 5, 1, 0, 0, 0));

    const token: PrivateAppUserTokenResponse = {
      userId: 111,
      portalId: 123,
      appId: 345,
      scopeGroups: ['crm.objects.contacts.read'],
      userTokenKey: 'pat-na1-u-FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
      clientId: 'my-client-id',
      expiresAt: '2024-06-01T01:00:00Z',
    };
    const tokenWithMoreScopes = {
      ...token,
      scopeGroups: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
    };
    const refreshedToken = { ...token, expiresAt: '2024-06-01T02:00:00Z' };
    const expiredToken = { ...token, expiresAt: '2024-05-30T00:00:00Z' };
    const headers = new AxiosHeaders();
    const config = { url: 'https://api.hubspot.com', headers: headers };

    const notFoundError = new AxiosError('msg', 'code', config, undefined, {
      status: 404,
      data: { message: 'Not Found' },
      statusText: 'Not Found',
      config,
      headers,
    });

    beforeEach(() => {
      jest.resetAllMocks();
      scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
      jest.spyOn(global, 'setInterval');
      jest.useFakeTimers();
      jest.setSystemTime(systemTime);
      manager = new PrivateAppUserTokenManager(accountId);
      manager.init();
    });

    afterEach(() => {
      manager.cleanup();
      jest.clearAllTimers();
    });

    it('should no opt if not initialized', async () => {
      manager = new PrivateAppUserTokenManager(accountId); // set to new instance not initialized
      const result = await manager.getPrivateAppToken(accountId);
      expect(result).toBeUndefined();
    });
    it('should no opt if disabled', async () => {
      scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenDisabled);
      manager = new PrivateAppUserTokenManager(accountId); // set to new instance not initialized
      try {
        await manager.init();
      } catch (e) {
        expect(e).toBeDefined();
      }
      const result = await manager.getPrivateAppToken(accountId);
      expect(result).toBeUndefined();
    });
    it('should fetch a existing valid Private App User Token', async () => {
      fetchPrivateAppUserToken.mockResolvedValue(token);
      const result = await manager.getPrivateAppToken(token.appId);
      expect(result).toEqual(token.userTokenKey);
    });
    it('should used cached Private App User Token', async () => {
      fetchPrivateAppUserToken.mockResolvedValue(token);
      await manager.getPrivateAppToken(token.appId);
      const result = await manager.getPrivateAppToken(token.appId);
      expect(result).toEqual(token.userTokenKey);
      expect(fetchPrivateAppUserToken).toHaveBeenCalledTimes(1);
    });
    it('should refresh existing expired Private App User Token', async () => {
      fetchPrivateAppUserToken.mockResolvedValue(expiredToken);
      updatePrivateAppUserToken.mockResolvedValue(token);
      const result = await manager.getPrivateAppToken(token.appId);
      expect(result).toEqual(token.userTokenKey);
      expect(updatePrivateAppUserToken).toHaveBeenCalledTimes(1);
    });
    it('should create a new Private App User Token if none exist', async () => {
      fetchPrivateAppUserToken.mockImplementation(() => {
        throw notFoundError;
      });
      createPrivateAppUserToken.mockResolvedValue(token);
      const result = await manager.getPrivateAppToken(token.appId);
      expect(result).toEqual(token.userTokenKey);
      expect(createPrivateAppUserToken).toHaveBeenCalledTimes(1);
    });
    it('should refresh cached token if it is about to expire', async () => {
      fetchPrivateAppUserToken.mockResolvedValue(token);
      updatePrivateAppUserToken.mockResolvedValue(refreshedToken);
      const tokenKey = await manager.getPrivateAppToken(token.appId);
      expect(tokenKey).toEqual(token.userTokenKey);
      jest.advanceTimersByTime(60 * 60 * 1000);
      expect(updatePrivateAppUserToken).toHaveBeenCalledTimes(1);
    });
    it('should update token is missing scopes', async () => {
      fetchPrivateAppUserToken.mockResolvedValue(token);
      updatePrivateAppUserToken.mockResolvedValue(tokenWithMoreScopes);
      await manager.getPrivateAppToken(token.appId);
      const tokenKey = await manager.getPrivateAppToken(
        token.appId,
        tokenWithMoreScopes.scopeGroups
      );
      expect(tokenKey).toEqual(token.userTokenKey);
      expect(fetchPrivateAppUserToken).toHaveBeenCalledTimes(2); // initial get, and then fetches again when scopes don't match in cached token
      expect(updatePrivateAppUserToken).toHaveBeenCalledTimes(1);
    });
    it('should clear token refresh if cleanup is called', async () => {
      fetchPrivateAppUserToken.mockResolvedValue(token);
      await manager.getPrivateAppToken(token.appId);
      manager.cleanup();
      jest.advanceTimersByTime(60 * 60 * 1000);
      expect(updatePrivateAppUserToken).not.toHaveBeenCalled();
    });
  });
});
