import { vi, describe, it, expect } from 'vitest';
import { addOauthToAccountConfig, getOauthManager } from '../oauth.js';

vi.mock('../../config');
vi.mock('../logger');
vi.mock('../../errors');
vi.mock('../../models/OAuth2Manager');

import { updateConfigAccount } from '../../config';
import * as OAuth2ManagerModule from '../../models/OAuth2Manager';
import { ENVIRONMENTS } from '../../constants/environments';
import { AUTH_METHODS } from '../../constants/auth';
import { logger } from '../logger';
import { HubSpotConfigAccount } from '../../types/Accounts';

const UnmockedOAuth2Manager = await vi.importActual<typeof OAuth2ManagerModule>(
  '../../models/OAuth2Manager'
);
const OAuth2Manager = UnmockedOAuth2Manager.OAuth2Manager;

const OAuth2ManagerMock = vi.spyOn(OAuth2ManagerModule, 'OAuth2Manager');

describe('lib/oauth', () => {
  const accountId = 123;
  const account: HubSpotConfigAccount = {
    name: 'my-account',
    accountId,
    env: ENVIRONMENTS.QA,
    authType: AUTH_METHODS.oauth.value,
    auth: {
      clientId: 'my-client-id',
      clientSecret: "shhhh, it's a secret",
      scopes: [],
      tokenInfo: {},
    },
  };

  describe('getOauthManager', () => {
    it('should create a OAuth2Manager for accounts that are not cached', () => {
      getOauthManager(account);
      expect(OAuth2ManagerMock).toHaveBeenCalledTimes(1);
      expect(OAuth2ManagerMock).toHaveBeenCalledWith(
        account,
        expect.any(Function)
      );
    });

    it('should use the cached OAuth2Manager if it exists', () => {
      getOauthManager(account);
      expect(OAuth2ManagerMock).not.toHaveBeenCalled();
    });

    vi.clearAllMocks();
  });

  describe('addOauthToAccountConfig', () => {
    it('should update the config', () => {
      const oauthManager = new OAuth2Manager(account, () => null);
      console.log('oauthManager', oauthManager.account);
      addOauthToAccountConfig(oauthManager);
      expect(updateConfigAccount).toHaveBeenCalledTimes(1);
      expect(updateConfigAccount).toHaveBeenCalledWith(account);
    });

    it('should log messages letting the user know the status of the operation', () => {
      addOauthToAccountConfig(new OAuth2Manager(account));
      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith('Updating configuration');
      expect(logger.success).toHaveBeenCalledTimes(1);
      expect(logger.success).toHaveBeenCalledWith('Configuration updated');
    });
  });
});
