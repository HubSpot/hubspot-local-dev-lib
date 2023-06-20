import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';

export function getValidEnv(
  env?: Environment,
  maskedProductionValue?: Environment
): Environment {
  const prodValue = maskedProductionValue
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
