import { version } from '../package.json';
import { getAndLoadConfigIfNeeded } from '../config';
import { getHubSpotApiOrigin } from '../lib/urls';
import { RequestOptions, GetRequestOptionsOptions } from '../types/Http';
import { CLIConfig } from '../types/Config';

export const DEFAULT_USER_AGENT_HEADERS = {
  'User-Agent': `HubSpot Local Dev Lib/${version}`,
};

export function getRequestOptions(
  options: GetRequestOptionsOptions
): RequestOptions {
  const { env, localHostOverride } = options;
  const { httpTimeout, httpUseLocalhost } =
    getAndLoadConfigIfNeeded() as CLIConfig;
  return {
    baseUrl: getHubSpotApiOrigin(
      env,
      localHostOverride ? false : httpUseLocalhost
    ),
    headers: {
      ...DEFAULT_USER_AGENT_HEADERS,
    },
    json: true,
    timeout: httpTimeout || 15000,
    ...options,
  };
}
