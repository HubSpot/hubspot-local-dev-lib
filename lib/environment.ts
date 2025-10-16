import { ENVIRONMENTS } from '../constants/environments.js';
import { Environment } from '../types/Config.js';

export function getValidEnv(
  env?: Environment | null,
  maskedProductionValue?: Environment
): Environment {
  const prodValue =
    typeof maskedProductionValue === 'string'
      ? maskedProductionValue
      : ENVIRONMENTS.PROD;

  const returnVal =
    typeof env &&
    typeof env === 'string' &&
    env.toLowerCase() === ENVIRONMENTS.QA
      ? ENVIRONMENTS.QA
      : prodValue;

  return returnVal;
}
