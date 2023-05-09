import { version } from '../../package.json';
import config from '../config/CLIConfiguration';
import { getHubSpotApiOrigin } from '../lib/urls';

export const DEFAULT_USER_AGENT_HEADERS = {
  'User-Agent': `HubSpot Local Dev Lib/${version}`,
};

type GetRequestOptionsOptions = {
  env?: string;
  localHostOverride?: boolean;
};

type RequestOptions = {
  baseUrl: string;
  headers: {
    'User-Agent': string;
  };
  json: boolean;
  simple: boolean;
  timeout: number;
  env?: string;
  localHostOverride?: boolean;
};

export function getRequestOptions(
  options: GetRequestOptionsOptions = {},
  requestOptions = {}
): RequestOptions {
  const { env, localHostOverride } = options;
  const { httpTimeout, httpUseLocalhost } = config.getAndLoadConfigIfNeeded();
  return {
    baseUrl: getHubSpotApiOrigin(
      env,
      localHostOverride ? false : httpUseLocalhost
    ),
    headers: {
      ...DEFAULT_USER_AGENT_HEADERS,
    },
    json: true,
    simple: true,
    timeout: httpTimeout || 15000,
    ...requestOptions,
  };
}
