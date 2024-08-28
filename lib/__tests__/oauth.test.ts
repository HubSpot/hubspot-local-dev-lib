import { addOauthToAccountConfig, getOauthManager } from '../oauth';

jest.mock('../../utils/getAccountIdentifier');
jest.mock('../../config');
jest.mock('../logger');
jest.mock('../../errors');

import { updateAccountConfig, writeConfig } from '../../config';
import { OAuth2Manager } from '../../models/OAuth2Manager';
import { FlatAccountFields_NEW } from '../../types/Accounts';
import { ENVIRONMENTS } from '../../constants/environments';
import { AUTH_METHODS } from '../../constants/auth';
import { logger } from '../logger';

const OAuth2ManagerFromConfigMock = jest.spyOn(OAuth2Manager, 'fromConfig');

describe('lib/oauth', () => {
  const accountId = 123;
  const accountConfig: FlatAccountFields_NEW = {
    accountId,
    env: ENVIRONMENTS.QA,
    clientId: 'my-client-id',
    clientSecret: "shhhh, it's a secret",
    scopes: [],
    apiKey: '',
    personalAccessKey: '',
  };
  const account = {
    name: 'my-account',
  };
  describe('getOauthManager', () => {
    it('should create a OAuth2Manager for accounts that are not cached', () => {
      getOauthManager(accountId, accountConfig);
      expect(OAuth2ManagerFromConfigMock).toHaveBeenCalledTimes(1);
      expect(OAuth2ManagerFromConfigMock).toHaveBeenCalledWith(
        accountConfig,
        expect.any(Function)
      );
    });

    it('should use the cached OAuth2Manager if it exists', () => {
      getOauthManager(accountId, accountConfig);
      expect(OAuth2ManagerFromConfigMock).not.toHaveBeenCalled();
    });
  });

  describe('addOauthToAccountConfig', () => {
    it('should update the config', () => {
      addOauthToAccountConfig(new OAuth2Manager(account));
      expect(updateAccountConfig).toHaveBeenCalledTimes(1);
      expect(updateAccountConfig).toHaveBeenCalledWith({
        ...account,
        authType: AUTH_METHODS.oauth.value,
      });
    });

    it('should write the updated config', () => {
      addOauthToAccountConfig(new OAuth2Manager(account));
      expect(writeConfig).toHaveBeenCalledTimes(1);
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
