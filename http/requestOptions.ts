import { version } from '../package.json';
import config from '../config/CLIConfiguration';
import { getHubSpotApiOrigin } from '../lib/urls';
import { CoreOptions, UriOptions } from 'request';

export const DEFAULT_USER_AGENT_HEADERS = {
  'User-Agent': `HubSpot Local Dev Lib/${version}`,
};

type GetRequestOptionsOptions = {
  uri: string;
  env?: string;
  localHostOverride?: boolean;
  qs?: { portalId?: number };
  body: {
    [key: string]: string;
  };
};

type RequestOptions = CoreOptions & UriOptions;

export function getRequestOptions(
  options: GetRequestOptionsOptions
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
    timeout: httpTimeout || 15000,
    ...options,
  };
}
