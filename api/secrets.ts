import { AxiosPromise } from 'axios';
import http from '../http';

const SECRETS_API_PATH = 'cms/v3/functions/secrets';

type FetchSecretsResponse = {
  results: Array<string>;
};

export function addSecret(
  accountId: number,
  key: string,
  value: string
): AxiosPromise<void> {
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
): AxiosPromise<void> {
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
): AxiosPromise<void> {
  return http.delete(accountId, {
    url: `${SECRETS_API_PATH}/${key}`,
  });
}

export function fetchSecrets(
  accountId: number
): AxiosPromise<FetchSecretsResponse> {
  return http.get<FetchSecretsResponse>(accountId, {
    url: `${SECRETS_API_PATH}`,
  });
}
