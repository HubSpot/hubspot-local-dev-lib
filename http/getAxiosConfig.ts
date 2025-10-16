import { version } from '../package.json';
import { getAndLoadConfigIfNeeded } from '../config/index.js';
import { getHubSpotApiOrigin } from '../lib/urls.js';
import { HttpOptions } from '../types/Http.js';
import { AxiosRequestConfig } from 'axios';
import https from 'https';
import http from 'http';

// Total number of sockets across all hosts
const MAX_TOTAL_SOCKETS = 25;

// Total number of sockets per each host
const MAX_SOCKETS_PER_HOST = 5;

const httpAgent = new http.Agent({
  keepAlive: true,
  maxTotalSockets: MAX_TOTAL_SOCKETS,
  maxSockets: MAX_SOCKETS_PER_HOST,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxTotalSockets: MAX_TOTAL_SOCKETS,
  maxSockets: MAX_SOCKETS_PER_HOST,
});

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

export function getAxiosConfig(options: HttpOptions): AxiosRequestConfig {
  const { env, localHostOverride, headers, ...rest } = options;
  const config = getAndLoadConfigIfNeeded();

  let httpTimeout = 15000;
  let httpUseLocalhost = false;

  if (config && config.httpTimeout) {
    httpTimeout = config.httpTimeout;
  }

  if (config && config.httpUseLocalhost) {
    httpUseLocalhost = config.httpUseLocalhost;
  }

  return {
    baseURL: getHubSpotApiOrigin(
      env,
      localHostOverride ? false : httpUseLocalhost
    ),
    headers: {
      ...getDefaultUserAgentHeader(),
      ...(headers || {}),
    },
    timeout: httpTimeout,
    transitional: DEFAULT_TRANSITIONAL,
    httpAgent,
    httpsAgent,
    ...rest,
  };
}
