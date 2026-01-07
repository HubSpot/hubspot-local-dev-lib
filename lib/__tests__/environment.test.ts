import { getValidEnv } from '../environment.js';
import { ENVIRONMENTS } from '../../constants/environments.js';

const { QA, PROD } = ENVIRONMENTS;

describe('lib/environment', () => {
  describe('getValidEnv', () => {
    it('should default to prod when no args are provided', () => {
      expect(getValidEnv()).toEqual(PROD);
    });

    it('should return prod when the provided env is not equal to QA', () => {
      expect(getValidEnv('notQA')).toEqual(PROD);
    });

    it('should return QA when the provided env is QA', () => {
      expect(getValidEnv(ENVIRONMENTS.QA)).toEqual(QA);
    });

    it('should return the maskedProductionValue when the provided env is not QA', () => {
      const somethingElse = 'somethingElse';
      // @ts-expect-error purposefully causing an error
      expect(getValidEnv('notQA', somethingElse)).toEqual(somethingElse);
    });
  });
});
