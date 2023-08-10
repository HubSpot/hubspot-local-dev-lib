import { version } from '../package.json';
import { getAndLoadConfigIfNeeded } from '../config';
import { getHubSpotApiOrigin } from '../lib/urls';
import { GetRequestOptionsOptions } from '../types/Http';
import { CLIConfig } from '../types/Config';
import { AxiosRequestConfig } from 'axios';

export const DEFAULT_USER_AGENT_HEADERS = {
  'User-Agent': `HubSpot Local Dev Lib/${version}`,
};

export function getAxiosConfig(
  options: GetRequestOptionsOptions
): AxiosRequestConfig {
  const { env, localHostOverride, ...rest } = options;
  const { httpTimeout, httpUseLocalhost } =
    getAndLoadConfigIfNeeded() as CLIConfig;
  return {
    baseURL: getHubSpotApiOrigin(
      env,
      localHostOverride ? false : httpUseLocalhost
    ),
    headers: {
      ...DEFAULT_USER_AGENT_HEADERS,
    },
    timeout: httpTimeout || 15000,
    ...rest,
  };
}
