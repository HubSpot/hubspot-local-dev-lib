import { http } from '../http/index.js';
import { HubSpotPromise } from '../types/Http.js';
import { AppSecret, FetchAppSecretsResponse } from '../types/AppSecrets.js';

const APP_SECRETS_API_PATH = 'developers/secrets/2027-03';

function getAppSecretsPath(appId: number): string {
  return `${APP_SECRETS_API_PATH}/apps/${appId}/secrets`;
}

export function createAppSecret(
  accountId: number,
  appId: number,
  key: string,
  value: string
): HubSpotPromise<AppSecret> {
  return http.post<AppSecret>(accountId, {
    url: getAppSecretsPath(appId),
    data: { key, value },
  });
}

export function fetchAppSecrets(
  accountId: number,
  appId: number
): HubSpotPromise<FetchAppSecretsResponse> {
  return http.get<FetchAppSecretsResponse>(accountId, {
    url: getAppSecretsPath(appId),
  });
}

export function updateAppSecret(
  accountId: number,
  appId: number,
  key: string,
  value: string
): HubSpotPromise<AppSecret> {
  return http.patch<AppSecret>(accountId, {
    url: getAppSecretsPath(appId),
    data: { key, value },
  });
}

export function deleteAppSecret(
  accountId: number,
  appId: number,
  key: string
): HubSpotPromise<void> {
  return http.post(accountId, {
    url: `${getAppSecretsPath(appId)}/delete`,
    data: { key },
  });
}
