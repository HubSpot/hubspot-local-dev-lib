import { scopeGroupsForPersonalAccessKey as __scopeGroupsForPersonalAccessKey } from '../personalAccessKey';
import { PrivateAppUserTokenManager } from '../PrivateAppUserTokenManager';
import {
  fetchPrivateAppUserToken as __fetchPrivateAppUserToken,
  createPrivateAppUserToken as __createPrivateAppUserToken,
  updatePrivateAppUserToken as __updatePrivateAppUserToken,
  PrivateAppUserTokenResponse,
} from '../../api/privateAppUserToken';

import { AxiosError, AxiosHeaders } from 'axios';
import { setLogLevel, LOG_LEVEL } from '../logger';
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

jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2024, 5, 1, 0, 0, 0)));
jest.spyOn(global, 'setInterval');
setLogLevel(LOG_LEVEL.DEBUG);
describe('lib/PrivateAppUserTokenManager', () => {
  const accountId = 123;
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
  const pakScopesTokenEnabled = Promise.resolve([
    'developer.private_app.temporary_token.read',
    'developer.private_app.temporary_token.write',
  ]);
  const pakScopesTokenDisabled = Promise.resolve(['developer.projects.read']);
  const headers = new AxiosHeaders();
  const config = { url: 'https://api.hubspot.com', headers: headers };

  const notFoundError = new AxiosError('msg', 'code', config, undefined, {
    status: 404,
    data: { message: 'Not Found' },
    statusText: 'Not Found',
    config,
    headers,
  });
  it('should initialize the PrivateAppUserTokenManager', async () => {
    scopeGroupsForPersonalAccessKey.mockReturnValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    expect(manager.isEnabled()).toBe(true);
    manager.cleanup();
  });
  it('should not initialize the PrivateAppUserTokenManager if the scopes are not enabled', async () => {
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenDisabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    expect(manager.isEnabled()).toBe(false);
    manager.cleanup();
  });
  it('should fetch a existing valid Private App User Token', async () => {
    fetchPrivateAppUserToken.mockResolvedValue(token);
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    const result = await manager.getPrivateAppToken(token.appId);
    expect(result).toEqual(token.userTokenKey);
    manager.cleanup();
  });
  it('should used cached Private App User Token', async () => {
    fetchPrivateAppUserToken.mockResolvedValue(token);
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    await manager.getPrivateAppToken(token.appId);
    const result = await manager.getPrivateAppToken(token.appId);
    expect(result).toEqual(token.userTokenKey);
    expect(fetchPrivateAppUserToken).toHaveBeenCalledTimes(1);
    manager.cleanup();
  });
  it('should refresh existing expired Private App User Token', async () => {
    fetchPrivateAppUserToken.mockResolvedValue(expiredToken);
    updatePrivateAppUserToken.mockResolvedValue(token);
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    const result = await manager.getPrivateAppToken(token.appId);
    expect(result).toEqual(token.userTokenKey);
    expect(updatePrivateAppUserToken).toHaveBeenCalledTimes(1);
    manager.cleanup();
  });
  it('should create a new Private App User Token if none exist', async () => {
    fetchPrivateAppUserToken.mockImplementation(() => {
      throw notFoundError;
    });
    createPrivateAppUserToken.mockResolvedValue(token);
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    const result = await manager.getPrivateAppToken(token.appId);
    expect(result).toEqual(token.userTokenKey);
    expect(createPrivateAppUserToken).toHaveBeenCalledTimes(1);
    manager.cleanup();
  });
  it('should not no opt if not initialized', async () => {
    const manager = new PrivateAppUserTokenManager(accountId);
    const result = await manager.getPrivateAppToken(token.appId);
    expect(result).toBeUndefined();
  });
  it('should refresh cached token if it is about to expire', async () => {
    fetchPrivateAppUserToken.mockResolvedValue(token);
    updatePrivateAppUserToken.mockResolvedValue(refreshedToken);
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    const tokenKey = await manager.getPrivateAppToken(token.appId);
    expect(tokenKey).toEqual(token.userTokenKey);
    jest.advanceTimersByTime(60 * 60 * 1000);
    expect(updatePrivateAppUserToken).toHaveBeenCalledTimes(1);
    manager.cleanup();
  });
  it('should update token is missing scopes', async () => {
    fetchPrivateAppUserToken.mockResolvedValue(token);
    updatePrivateAppUserToken.mockResolvedValue(tokenWithMoreScopes);
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    await manager.getPrivateAppToken(token.appId);
    const tokenKey = await manager.getPrivateAppToken(
      token.appId,
      tokenWithMoreScopes.scopeGroups
    );
    expect(tokenKey).toEqual(token.userTokenKey);
    expect(fetchPrivateAppUserToken).toHaveBeenCalledTimes(1);
    expect(updatePrivateAppUserToken).toHaveBeenCalledTimes(1);
    manager.cleanup();
  });
  it('should clear token refresh if cleanup is called', async () => {
    fetchPrivateAppUserToken.mockResolvedValue(token);
    scopeGroupsForPersonalAccessKey.mockResolvedValue(pakScopesTokenEnabled);
    const manager = new PrivateAppUserTokenManager(accountId);
    await manager.init();
    await manager.getPrivateAppToken(token.appId);
    manager.cleanup();
    jest.advanceTimersByTime(60 * 60 * 1000);
    expect(updatePrivateAppUserToken).not.toHaveBeenCalled();
  });
});
