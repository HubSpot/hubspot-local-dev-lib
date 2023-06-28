import { debug } from '../utils/logger';
import CLIConfiguration from '../config/CLIConfiguration';
import http from '../http';
import { getRequestOptions } from '../http/requestOptions';

import { FILE_MAPPER_API_PATH } from '../api/filemapper';

export async function trackUsage(
  eventName: string,
  eventClass: string,
  meta = {},
  accountId: number
) {
  const i18nKey = 'api.filemapper.trackUsage';
  const usageEvent = {
    accountId,
    eventName,
    eventClass,
    meta,
  };
  const EVENT_TYPES = {
    VSCODE_EXTENSION_INTERACTION: 'vscode-extension-interaction',
    CLI_INTERACTION: 'cli-interaction',
  };

  let analyticsEndpoint;

  switch (eventName) {
    case EVENT_TYPES.CLI_INTERACTION:
      analyticsEndpoint = 'cms-cli-usage';
      break;
    case EVENT_TYPES.VSCODE_EXTENSION_INTERACTION:
      analyticsEndpoint = 'vscode-extension-usage';
      break;
    default:
      debug(`${i18nKey}.invalidEvent`, { eventName });
  }

  const path = `${FILE_MAPPER_API_PATH}/${analyticsEndpoint}`;

  const accountConfig = accountId && CLIConfiguration.getAccount(accountId);

  if (accountConfig && accountConfig.authType === 'personalaccesskey') {
    debug(`${i18nKey}.sendingEventAuthenticated`);
    return http.post(accountId, {
      uri: `${path}/authenticated`,
      body: usageEvent,
      resolveWithFullResponse: true,
    });
  }

  const env = CLIConfiguration.getEnv(accountId);
  const requestOptions = getRequestOptions({
    env,
    uri: path,
    body: usageEvent,
    resolveWithFullResponse: true,
  });
  debug(`${i18nKey}.sendingEventUnauthenticated`);
  return http.post(accountId, requestOptions);
}
