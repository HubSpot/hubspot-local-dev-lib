import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';

export function getValidEnv(
  env?: string | null,
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
