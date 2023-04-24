import config from '../CLIConfiguration';

// TODO write tests for CLIConfiguration.ts
describe('config/CLIConfiguration', () => {
  describe('constructor', () => {
    it('initializes correctly', () => {
      expect(config).toBeDefined();
      expect(config.options).toBeDefined();
      expect(config.useEnvConfig).toBe(false);
      expect(config.config).toBe(null);
    });
  });
});
