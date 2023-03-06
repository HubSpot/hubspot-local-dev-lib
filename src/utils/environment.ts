import { ENVIRONMENTS } from '../constants';

export function getValidEnv(
  env: string,
  maskedProductionValue?: string
): string {
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
