import CLIConfiguration from '../CLIConfiguration';

// TODO write tests for CLIConfiguration.ts
describe('config/CLIConfiguration', () => {
  describe('constructor', () => {
    it('initializes correctly', () => {
      const config = new CLIConfiguration({});

      expect(config).toBeDefined();
      expect(config.active).toBe(false);
      expect(config.options).toBeDefined();
      expect(config.useEnvConfig).toBe(false);
      expect(config.config).toBe(null);
    });
  });
});
