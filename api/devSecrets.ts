import { http } from '../http';
import { HubSpotPromise } from '../types/Http';
import { FetchDevSecretsResponse } from '../types/DevSecrets';

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

export function updateAppSecret(
  accountId: number,
  appId: number,
  key: string,
  value: string
): HubSpotPromise<void> {
  return addAppSecret(accountId, appId, key, value);
}

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

export function fetchAppSecrets(
  accountId: number,
  appId: number
): HubSpotPromise<FetchDevSecretsResponse> {
  return http.get<FetchDevSecretsResponse>(accountId, {
    url: `${DEV_APP_SECRETS_API_PATH}${appId}`,
  });
}
