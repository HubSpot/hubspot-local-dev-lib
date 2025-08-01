import { HUBSPOT_ACCOUNT_TYPES } from '../../constants/config';
import { ENVIRONMENTS } from '../../constants/environments';
import { CLIConfiguration as config } from '../CLIConfiguration';

describe('config/CLIConfiguration', () => {
  afterAll(() => {
    config.setActive(false);
  });

  describe('constructor()', () => {
    it('initializes correctly', () => {
      expect(config).toBeDefined();
      expect(config.options).toBeDefined();
      expect(config.useEnvConfig).toBe(false);
      expect(config.config).toBe(null);
      expect(config.active).toBe(false);
    });
  });

  describe('isActive()', () => {
    it('returns true when the class is being used', () => {
      expect(config.isActive()).toBe(false);
      config.setActive(true);
      expect(config.isActive()).toBe(true);
    });
  });

  describe('getAccount()', () => {
    it('returns null when no config is loaded', () => {
      expect(config.getAccount('account-name')).toBe(null);
    });
  });

  describe('isConfigFlagEnabled()', () => {
    it('returns default value when no config is loaded', () => {
      expect(config.isConfigFlagEnabled('allowUsageTracking', false)).toBe(
        false
      );
    });
  });

  describe('getAccountId()', () => {
    it('returns null when it cannot find the account in the config', () => {
      expect(config.getAccountId('account-name')).toBe(null);
    });
  });

  describe('getDefaultAccount()', () => {
    it('returns null when no config is loaded', () => {
      expect(config.getDefaultAccount()).toBe(null);
    });
  });

  describe('getAccountIndex()', () => {
    it('returns -1 when no config is loaded', () => {
      expect(config.getAccountIndex(123)).toBe(-1);
    });
  });

  describe('isAccountInConfig()', () => {
    it('returns false when no config is loaded', () => {
      expect(config.isAccountInConfig(123)).toBe(false);
    });
  });

  describe('getEnv()', () => {
    it('returns PROD when no config is loaded', () => {
      expect(config.getEnv(123)).toBe(ENVIRONMENTS.PROD);
    });
  });

  describe('getAccountType()', () => {
    it('returns STANDARD when no accountType or sandboxAccountType is specified', () => {
      expect(config.getAccountType()).toBe(HUBSPOT_ACCOUNT_TYPES.STANDARD);
    });
    it('handles sandboxAccountType transforms correctly', () => {
      expect(config.getAccountType(undefined, 'DEVELOPER')).toBe(
        HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX
      );
      expect(config.getAccountType(undefined, 'STANDARD')).toBe(
        HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX
      );
    });
    it('handles accountType arg correctly', () => {
      expect(
        config.getAccountType(HUBSPOT_ACCOUNT_TYPES.STANDARD, 'DEVELOPER')
      ).toBe(HUBSPOT_ACCOUNT_TYPES.STANDARD);
    });
  });

  describe('updateDefaultAccount()', () => {
    it('throws when no config is loaded', () => {
      expect(() => {
        config.updateDefaultAccount('account-name');
      }).toThrow();
    });
  });

  describe('renameAccount()', () => {
    it('throws when no config is loaded', () => {
      expect(() => {
        config.renameAccount('account-name', 'new-account-name');
      }).toThrow();
    });
  });

  describe('removeAccountFromConfig()', () => {
    it('throws when no config is loaded', () => {
      expect(() => {
        config.removeAccountFromConfig('account-name');
      }).toThrow();
    });
  });

  describe('updateDefaultCmsPublishMode()', () => {
    it('throws when no config is loaded', () => {
      expect(() => {
        config.updateDefaultCmsPublishMode('draft');
      }).toThrow();
    });
  });

  describe('updateHttpTimeout()', () => {
    it('throws when no config is loaded', () => {
      expect(() => {
        config.updateHttpTimeout('1000');
      }).toThrow();
    });
  });

  describe('updateAllowUsageTracking()', () => {
    it('throws when no config is loaded', () => {
      expect(() => {
        config.updateAllowUsageTracking(true);
      }).toThrow();
    });
  });

  describe('isTrackingAllowed()', () => {
    it('returns true when no config is loaded', () => {
      expect(config.isTrackingAllowed()).toBe(true);
    });
  });

  describe('hasLocalStateFlag()', () => {
    it('returns false when no config is loaded', () => {
      expect(config.hasLocalStateFlag('test-flag')).toBe(false);
    });

    it('returns false when flag is not in config flags array', () => {
      config.config = { accounts: [], flags: ['other-flag'] };
      expect(config.hasLocalStateFlag('test-flag')).toBe(false);
    });

    it('returns true when flag is in config flags array', () => {
      config.config = { accounts: [], flags: ['test-flag', 'other-flag'] };
      expect(config.hasLocalStateFlag('test-flag')).toBe(true);
    });
  });

  describe('addLocalStateFlag()', () => {
    beforeEach(() => {
      // Mock the write method to prevent actual file operations
      jest.spyOn(config, 'write').mockImplementation(() => null);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('throws when no config is loaded', () => {
      config.config = null;
      expect(() => {
        config.addLocalStateFlag('test-flag');
      }).toThrow();
    });

    it('adds flag when flags array does not exist', () => {
      config.config = { accounts: [] };
      config.addLocalStateFlag('test-flag');

      expect(config.config.flags).toEqual(['test-flag']);
      expect(config.write).toHaveBeenCalled();
    });

    it('adds flag to existing flags array', () => {
      config.config = { accounts: [], flags: ['existing-flag'] };
      config.addLocalStateFlag('test-flag');

      expect(config.config.flags).toEqual(['existing-flag', 'test-flag']);
      expect(config.write).toHaveBeenCalled();
    });
  });

  describe('removeLocalStateFlag()', () => {
    beforeEach(() => {
      // Mock the write method to prevent actual file operations
      jest.spyOn(config, 'write').mockImplementation(() => null);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('throws when no config is loaded', () => {
      config.config = null;
      expect(() => {
        config.removeLocalStateFlag('test-flag');
      }).toThrow();
    });

    it('removes flag from flags array', () => {
      config.config = { accounts: [], flags: ['test-flag', 'other-flag'] };
      config.removeLocalStateFlag('test-flag');

      expect(config.config.flags).toEqual(['other-flag']);
      expect(config.write).toHaveBeenCalled();
    });

    it('handles removing non-existent flag gracefully', () => {
      config.config = { accounts: [], flags: ['existing-flag'] };
      config.removeLocalStateFlag('non-existent-flag');

      expect(config.config.flags).toEqual(['existing-flag']);
      expect(config.write).toHaveBeenCalled();
    });
  });
});
