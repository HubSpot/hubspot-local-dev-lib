import request from 'request-promise-native';
import { getRequestOptions } from '../http/requestOptions';
import { ENVIRONMENTS } from '../constants/environments';
import { ValueOf } from '../types/Utils';

const SANDBOX_HUBS_API_PATH = 'sandbox-hubs/v1/self';

export async function fetchSandboxHubData(
  accessToken: string,
  portalId: number,
  env: ValueOf<typeof ENVIRONMENTS> = ENVIRONMENTS.PROD
) {
  const requestOptions = getRequestOptions({
    env,
    uri: `${SANDBOX_HUBS_API_PATH}`,
    qs: { portalId },
  });
  const reqWithToken = {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return request.get(reqWithToken);
}
