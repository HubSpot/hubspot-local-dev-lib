import { debug } from '../utils/logger';
import http from '../http';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { getAccountConfig, getEnv } from '../config';
import { FILE_MAPPER_API_PATH } from '../api/fileMapper';

export async function trackUsage(
  eventName: string,
  eventClass: string,
  meta = {},
  accountId: number
): Promise<void> {
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

  const accountConfig = accountId && getAccountConfig(accountId);

  if (accountConfig && accountConfig.authType === 'personalaccesskey') {
    debug(`${i18nKey}.sendingEventAuthenticated`);
    return http.post(accountId, {
      url: `${path}/authenticated`,
      body: usageEvent,
      resolveWithFullResponse: true,
    });
  }

  const env = getEnv(accountId);
  const axiosConfig = getAxiosConfig({
    env,
    url: path,
    body: usageEvent,
    resolveWithFullResponse: true,
  });
  debug(`${i18nKey}.sendingEventUnauthenticated`);
  http.post<void>(accountId, axiosConfig);
}
