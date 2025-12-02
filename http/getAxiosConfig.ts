import { version } from '../package.json';
import { getConfig } from '../config';
import { getHubSpotApiOrigin } from '../lib/urls';
import { HttpOptions } from '../types/Http';
import { HubSpotConfig } from '../types/Config';
import { AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

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

function getHttpProxyAgent(): HttpProxyAgent<string> | null {
  const proxyUrl =
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy;
  if (!proxyUrl) {
    return null;
  }
  return new HttpProxyAgent(proxyUrl, {
    keepAlive: true,
    maxTotalSockets: MAX_TOTAL_SOCKETS,
    maxSockets: MAX_SOCKETS_PER_HOST,
  });
}

function getHttpsProxyAgent(): HttpsProxyAgent<string> | null {
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy;
  if (!proxyUrl) {
    return null;
  }
  return new HttpsProxyAgent(proxyUrl, {
    keepAlive: true,
    maxTotalSockets: MAX_TOTAL_SOCKETS,
    maxSockets: MAX_SOCKETS_PER_HOST,
  });
}

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

export function hostnameMatchesNoProxyPattern(
  hostname: string,
  pattern: string
): boolean {
  const normalizedHostname = hostname.toLowerCase();
  const normalizedPattern = pattern.trim().toLowerCase();

  if (normalizedPattern === '*') {
    return true;
  }

  if (normalizedPattern.startsWith('.')) {
    return normalizedHostname.endsWith(normalizedPattern);
  }

  return (
    normalizedHostname === normalizedPattern ||
    normalizedHostname.endsWith(`.${normalizedPattern}`)
  );
}

export function shouldUseProxy(baseURL: string): boolean {
  if (
    !process.env.HTTPS_PROXY &&
    !process.env.https_proxy &&
    !process.env.HTTP_PROXY &&
    !process.env.http_proxy &&
    !process.env.ALL_PROXY &&
    !process.env.all_proxy
  ) {
    return false;
  }

  const noProxy = process.env.NO_PROXY || process.env.no_proxy;
  if (noProxy) {
    const hostname = new URL(baseURL).hostname;
    const noProxyList = noProxy.split(',').filter(Boolean);
    if (
      noProxyList.some(pattern =>
        hostnameMatchesNoProxyPattern(hostname, pattern)
      )
    ) {
      return false;
    }
  }

  return true;
}

export function getAxiosConfig(options: HttpOptions): AxiosRequestConfig {
  const { env, localHostOverride, headers, ...rest } = options;
  let config: HubSpotConfig | null;
  try {
    config = getConfig();
  } catch (e) {
    config = null;
  }

  let httpTimeout = 15000;
  let httpUseLocalhost = false;

  if (config && config.httpTimeout) {
    httpTimeout = config.httpTimeout;
  }

  if (config && config.httpUseLocalhost) {
    httpUseLocalhost = config.httpUseLocalhost;
  }

  const baseURL = getHubSpotApiOrigin(
    env,
    localHostOverride ? false : httpUseLocalhost
  );

  return {
    baseURL,
    headers: {
      ...getDefaultUserAgentHeader(),
      ...(headers || {}),
    },
    timeout: httpTimeout,
    transitional: DEFAULT_TRANSITIONAL,
    // Disable axios's built-in proxy handling - we use custom agents instead
    proxy: false,
    httpAgent: shouldUseProxy(baseURL) ? getHttpProxyAgent() || httpAgent : httpAgent,
    httpsAgent: shouldUseProxy(baseURL) ? getHttpsProxyAgent() || httpsAgent : httpsAgent,
    ...rest,
  };
}
