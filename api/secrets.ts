import { http } from '../http/index.js';
import { FetchSecretsResponse } from '../types/Secrets.js';
import { HubSpotPromise } from '../types/Http.js';

const SECRETS_API_PATH = 'cms/v3/functions/secrets';

export function addSecret(
  accountId: number,
  key: string,
  value: string
): HubSpotPromise<void> {
  return http.post(accountId, {
    url: SECRETS_API_PATH,
    data: {
      key,
      secret: value,
    },
  });
}

export function updateSecret(
  accountId: number,
  key: string,
  value: string
): HubSpotPromise<void> {
  return http.put(accountId, {
    url: SECRETS_API_PATH,
    data: {
      key,
      secret: value,
    },
  });
}

export function deleteSecret(
  accountId: number,
  key: string
): HubSpotPromise<void> {
  return http.delete(accountId, {
    url: `${SECRETS_API_PATH}/${key}`,
  });
}

export function fetchSecrets(
  accountId: number
): HubSpotPromise<FetchSecretsResponse> {
  return http.get<FetchSecretsResponse>(accountId, {
    url: `${SECRETS_API_PATH}`,
  });
}
