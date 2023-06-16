import request from 'request-promise-native';
import { getRequestOptions } from '../../http/requestOptions';
import { ENVIRONMENTS } from '../../constants/environments';
import { ValueOf } from '../../types/Utils';

const LOCALDEVAUTH_API_AUTH_PATH = 'localdevauth/v1/auth';

export async function fetchAccessToken(
  personalAccessKey: string,
  env: ValueOf<typeof ENVIRONMENTS> = ENVIRONMENTS.PROD,
  portalId: number
) {
  const query = portalId ? { portalId } : {};
  const requestOptions = getRequestOptions({
    env,
    localHostOverride: true,

    uri: `${LOCALDEVAUTH_API_AUTH_PATH}/refresh`,
    body: {
      encodedOAuthRefreshToken: personalAccessKey,
    },
    qs: query,
  });

  return request.post(requestOptions);
}
