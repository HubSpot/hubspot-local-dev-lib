import { getValidEnv } from '../../lib/environment';
import { ENVIRONMENTS } from '../../constants/environments';

// TODO write tests for environment.ts
describe('config/environment', () => {
  describe('getValidEnv()', () => {
    it('defaults to prod when no args are passed', () => {
      const env = getValidEnv();

      expect(env).toBe(ENVIRONMENTS.PROD);
    });
  });
});
