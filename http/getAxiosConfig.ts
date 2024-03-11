import { version } from '../package.json';
import { getAndLoadConfigIfNeeded } from '../config';
import { getHubSpotApiOrigin } from '../lib/urls';
import { AxiosConfigOptions } from '../types/Http';
import { CLIConfig } from '../types/Config';
import { AxiosRequestConfig } from 'axios';

export const DEFAULT_USER_AGENT_HEADERS = {
  'User-Agent': `HubSpot Local Dev Lib/${version}`,
};

const DEFAULT_TRANSITIONAL = {
  clarifyTimeoutError: true,
};

export function getAxiosConfig(
  options: AxiosConfigOptions
): AxiosRequestConfig {
  const { env, localHostOverride, headers, ...rest } = options;
  const { httpTimeout, httpUseLocalhost } =
    getAndLoadConfigIfNeeded() as CLIConfig;

  return {
    baseURL: getHubSpotApiOrigin(
      env,
      localHostOverride ? false : httpUseLocalhost
    ),
    headers: {
      ...DEFAULT_USER_AGENT_HEADERS,
      ...(headers || {}),
    },
    timeout: httpTimeout || 15000,
    transitional: DEFAULT_TRANSITIONAL,
    ...rest,
  };
}
