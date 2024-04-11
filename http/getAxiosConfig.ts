import { version } from '../package.json';
import { getAndLoadConfigIfNeeded } from '../config';
import { getHubSpotApiOrigin } from '../lib/urls';
import { AxiosConfigOptions } from '../types/Http';
import { CLIConfig } from '../types/Config';
import { AxiosRequestConfig } from 'axios';

export const USER_AGENTS: { [key: string]: string } = {
  'HubSpot Local Dev Lib': version,
};

export function getDefaultUserAgentHeader(): { 'User-Agent': string } {
  let userAgentString = '';

  Object.keys(USER_AGENTS).forEach((userAgentKey, i) => {
    userAgentString += `${i > 0 ? ', ' : ''}${userAgentKey}/${
      USER_AGENTS[userAgentKey]
    }`;
  });

  return {
    'User-Agent': userAgentString,
  };
}

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
      ...getDefaultUserAgentHeader(),
      ...(headers || {}),
    },
    timeout: httpTimeout || 15000,
    transitional: DEFAULT_TRANSITIONAL,
    ...rest,
  };
}
