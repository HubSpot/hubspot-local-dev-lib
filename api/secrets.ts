import { http, HubSpotResponse } from '../http';
import { FetchSecretsResponse } from '../types/Secrets';

const SECRETS_API_PATH = 'cms/v3/functions/secrets';

export function addSecret(
  accountId: number,
  key: string,
  value: string
): HubSpotResponse<void> {
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
): HubSpotResponse<void> {
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
): HubSpotResponse<void> {
  return http.delete(accountId, {
    url: `${SECRETS_API_PATH}/${key}`,
  });
}

export function fetchSecrets(
  accountId: number
): HubSpotResponse<FetchSecretsResponse> {
  return http.get<FetchSecretsResponse>(accountId, {
    url: `${SECRETS_API_PATH}`,
  });
}
