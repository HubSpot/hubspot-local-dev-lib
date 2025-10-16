import { loadConfigFromEnvironment } from '../environment.js';
import { ENVIRONMENT_VARIABLES } from '../../constants/environments.js';
import { PERSONAL_ACCESS_KEY_AUTH_METHOD } from '../../constants/auth.js';

describe('config/environment', () => {
  describe('loadConfigFromEnvironment()', () => {
    const INITIAL_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...INITIAL_ENV };
    });

    afterAll(() => {
      process.env = INITIAL_ENV;
    });

    it('returns null when no accountId exists', () => {
      const config = loadConfigFromEnvironment();
      expect(config).toBe(null);
    });

    it('returns null when no env exists', () => {
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] = '1234';

      const config = loadConfigFromEnvironment();
      expect(config).toBe(null);
    });

    it('generates a personal access key config from the env', () => {
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] = '1234';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT] = 'qa';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_PERSONAL_ACCESS_KEY] =
        'personal-access-key';

      const config = loadConfigFromEnvironment();
      expect(config).toMatchObject({
        accounts: [
          {
            authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
            accountId: 1234,
            env: 'qa',
            personalAccessKey: 'personal-access-key',
          },
        ],
      });
    });
  });
});
