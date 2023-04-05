import { getValidEnv } from '../environment';
import { ENVIRONMENTS } from '../../constants';

// TODO write tests for environment.ts
describe('config/environment', () => {
  describe('getValidEnv method', () => {
    it('defaults to prod when no args are passed', () => {
      const env = getValidEnv();

      expect(env).toBe(ENVIRONMENTS.PROD);
    });
  });
});
