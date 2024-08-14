import {
  generateConfig,
  getOrderedAccount,
  getOrderedConfig,
} from '../configUtils';
import { CLIConfig } from '../../types/Config';
import {
  CLIAccount,
  OAuthAccount,
  PersonalAccessKeyAccount,
} from '../../types/Accounts';

const PAK_ACCOUNT: PersonalAccessKeyAccount = {
  accountId: 111,
  authType: 'personalaccesskey',
  name: 'pak-account-1',
  auth: {
    tokenInfo: {
      accessToken: 'pak-access-token',
      expiresAt: '',
    },
  },
  personalAccessKey: 'pak-12345',
  env: '',
};

const OAUTH_ACCOUNT: OAuthAccount = {
  accountId: 222,
  authType: 'oauth2',
  name: 'oauth-account-1',
  auth: {
    clientId: 'oauth-client-id',
    clientSecret: 'oauth-client-secret',
    scopes: [],
    tokenInfo: {
      refreshToken: 'oauth-refresh-token',
    },
  },
  env: '',
};

const APIKEY_ACCOUNT: CLIAccount = {
  accountId: 333,
  name: 'apikey-account-1',
  authType: 'apikey',
  apiKey: 'api-key',
  env: '',
};

const CONFIG: CLIConfig = {
  defaultAccount: PAK_ACCOUNT.name,
  accounts: [PAK_ACCOUNT, OAUTH_ACCOUNT, APIKEY_ACCOUNT],
};

describe('config/configUtils', () => {
  describe('getOrderedAccount()', () => {
    it('returns an ordered account', () => {
      const orderedAccount = getOrderedAccount(PAK_ACCOUNT);
      const keys = Object.keys(orderedAccount);

      expect(keys[0]).toBe('name');
      expect(keys[1]).toBe('accountId');
    });
  });

  describe('getOrderedConfig()', () => {
    it('returns an ordered config', () => {
      const orderedConfig = getOrderedConfig(CONFIG);
      const keys = Object.keys(orderedConfig);

      expect(keys[0]).toBe('defaultAccount');
      expect(keys[keys.length - 1]).toBe('accounts');
    });
    it('returns a config with accounts ordered', () => {
      const orderedConfig = getOrderedConfig(CONFIG);
      const accountKeys = Object.keys(orderedConfig.accounts[0]);

      expect(accountKeys[0]).toBe('name');
      expect(accountKeys[1]).toBe('accountId');
    });
  });

  describe('generateConfig()', () => {
    it('returns a personal access key auth account', () => {
      const pakConfig = generateConfig('personalaccesskey', {
        accountId: 111,
        personalAccessKey: 'pak-12345',
        env: 'prod',
      });

      expect(pakConfig).toBeDefined();
      if (pakConfig) {
        expect(pakConfig.accounts).toBeDefined();
        expect(pakConfig.accounts[0].authType).toBe('personalaccesskey');
      }
    });
    it('returns an oauth auth account', () => {
      const oauthConfig = generateConfig('oauth2', {
        accountId: 111,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
        scopes: [],
        env: 'prod',
      });

      expect(oauthConfig).toBeDefined();
      if (oauthConfig) {
        expect(oauthConfig.accounts).toBeDefined();
        expect(oauthConfig.accounts[0].authType).toBe('oauth2');
      }
    });
    it('returns an apikey account', () => {
      const apikeyConfig = generateConfig('apikey', {
        accountId: 111,
        apiKey: 'api-key',
        env: 'prod',
      });

      expect(apikeyConfig).toBeDefined();
      if (apikeyConfig) {
        expect(apikeyConfig.accounts).toBeDefined();
        expect(apikeyConfig.accounts[0].authType).toBe('apikey');
      }
    });
  });
});
