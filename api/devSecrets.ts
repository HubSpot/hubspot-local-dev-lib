import { http } from '../http';
import { HubSpotPromise } from '../types/Http';
import { FetchDevSecretsResponse } from '../types/DevSecrets';

const DEV_SECRETS_API_PATH = 'dev-secrets/management/v3';

export function addAppSecret(
  accountId: number,
  appId: number,
  key: string,
  value: string
): HubSpotPromise<void> {
  return http.post(accountId, {
    url: `${DEV_SECRETS_API_PATH}/secrets/app/${appId}`,
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
  return http.patch(accountId, {
    url: `${DEV_SECRETS_API_PATH}/secrets/app/${appId}`,
    data: {
      key,
      value,
    },
  });
}

export function deleteAppSecret(
  accountId: number,
  appId: number,
  key: string
): HubSpotPromise<void> {
  return http.delete(accountId, {
    url: `${DEV_SECRETS_API_PATH}/secrets/app/${appId}`,
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
    url: `${DEV_SECRETS_API_PATH}/keys/app/${appId}`,
  });
}
