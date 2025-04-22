import { http } from '../http';
import { HubSpotPromise } from '../types/Http';

const DEV_APP_SECRETS_API_PATH = 'dev-secrets/management/v3/secrets/app/';

export function addAppSecret(
  accountId: number,
  appId: number,
  key: string,
  value: string
): HubSpotPromise<void> {
  return http.post(accountId, {
    url: `${DEV_APP_SECRETS_API_PATH}${appId}/upsert`,
    data: {
      key,
      value,
    },
  });
}

// export function updateAppSecret(
//   accountId: number,
//   appId: string,
//   key: string,
//   value: string
// ): HubSpotPromise<void> {
//   return http.put(accountId, {
//     url: `${DEV_APP_SECRETS_API_PATH}${appId}/upsert`,
//     data: {
//       key,
//       value,
//     },
//   });
// }

export function deleteAppSecret(
  accountId: number,
  appId: number,
  key: string
): HubSpotPromise<void> {
  return http.delete(accountId, {
    url: `${DEV_APP_SECRETS_API_PATH}${appId}`,
    data: {
      key,
    },
  });
}

// export function fetchAppSecrets(
//   accountId: number,
//   appId: string
// ): HubSpotPromise<FetchSecretsResponse> {
//   return http.get<FetchSecretsResponse>(accountId, {
//     url: `${DEV_APP_SECRETS_API_PATH}${appId}`,
//   });
// }
