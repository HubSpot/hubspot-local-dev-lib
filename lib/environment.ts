import { ENVIRONMENTS } from '../constants/environments.js';
import { Environment } from '../types/Accounts.js';

export function getValidEnv(
  env?: string | null,
  maskedProductionValue?: Environment
): Environment {
  const prodValue =
    typeof maskedProductionValue === 'string'
      ? maskedProductionValue
      : ENVIRONMENTS.PROD;

  const returnVal =
    env && typeof env === 'string' && env.toLowerCase() === ENVIRONMENTS.QA
      ? ENVIRONMENTS.QA
      : prodValue;

  return returnVal;
}
