import axios, { AxiosResponse, isAxiosError } from 'axios';
import { HubSpotHttpError } from '../models/HubSpotHttpError.js';
import { logger } from '../lib/logger.js';
import { LOCALDEVAUTH_ACCESS_TOKEN_PATH } from '../api/localDevAuth.js';
import { FIREALARM_API_AUTH_PATH } from '../api/fireAlarm.js';
import * as util from 'util';
import { CMS_CLI_USAGE_PATH, VSCODE_USAGE_PATH } from '../lib/trackUsage.js';

// Create an isolated axios instance for this copy of local-dev-lib.
// This prevents issues when multiple copies are loaded and share the global
// axios, where each copy would register interceptors on the shared instance
// causing errors to be wrapped multiple times.
export const httpClient = axios.create();

const IGNORE_URLS_NETWORK_DEBUG = [
  LOCALDEVAUTH_ACCESS_TOKEN_PATH,
  CMS_CLI_USAGE_PATH,
  VSCODE_USAGE_PATH,
  FIREALARM_API_AUTH_PATH,
];

function logRequest(response: AxiosResponse) {
  try {
    if (!process.env.HUBSPOT_NETWORK_LOGGING) {
      return;
    }

    if (
      !process.env.HUBSPOT_DEBUG_LOGGING_VERBOSE &&
      IGNORE_URLS_NETWORK_DEBUG.some(
        url => response?.config?.url && response.config.url.includes(url)
      )
    ) {
      return;
    }

    logger.debug(
      util.inspect(
        {
          method: response.config.method,
          baseURL: response.config.baseURL,
          url: response.config.url,
          data: response.data,
          status: response.status,
        },
        false,
        null,
        true
      )
    );
  } catch (error) {
    // Ignore any errors that occur while logging the response
  }
}

// Register interceptor on our isolated instance
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logRequest(response);
    return response;
  },
  error => {
    try {
      if (isAxiosError(error) && error.response) {
        logRequest(error.response);
      }
    } catch (e) {
      // Ignore any errors that occur while logging the response
    }

    // Wrap all axios errors in our own Error class. Attach the error
    // as the cause for the new error, so we maintain the stack trace
    return Promise.reject(
      new HubSpotHttpError(error.message, { cause: error })
    );
  }
);
