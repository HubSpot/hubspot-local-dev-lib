import { httpClient } from '../http/client.js';
import { getAxiosConfig } from '../http/getAxiosConfig.js';
import { logger } from './logger.js';
import { http } from '../http/index.js';
import {
  getConfigAccountById,
  getConfigAccountEnvironment,
} from '../config/index.js';
import {
  FILE_MAPPER_API_PATH,
  CMS_CLI_USAGE_PATH,
  VSCODE_USAGE_PATH,
} from '../constants/endpoints.js';
import { i18n } from '../utils/lang.js';
import { getValidEnv } from './environment.js';

const i18nKey = 'lib.trackUsage';

export async function trackUsage(
  eventName: string,
  eventClass: string,
  meta = {},
  accountId?: number
): Promise<void> {
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

  let path = FILE_MAPPER_API_PATH;

  switch (eventName) {
    case EVENT_TYPES.CLI_INTERACTION:
      path = CMS_CLI_USAGE_PATH;
      break;
    case EVENT_TYPES.VSCODE_EXTENSION_INTERACTION:
      path = VSCODE_USAGE_PATH;
      break;
    default:
      logger.debug(i18n(`${i18nKey}.invalidEvent`, { eventName }));
  }

  const account = accountId && getConfigAccountById(accountId);

  if (account && account.authType === 'personalaccesskey') {
    logger.debug(i18n(`${i18nKey}.sendingEventAuthenticated`));
    try {
      await http.post(accountId, {
        url: `${path}/authenticated`,
        data: usageEvent,
        resolveWithFullResponse: true,
      });
      return;
    } catch (e) {
      logger.debug(i18n(`${i18nKey}.retryingEventUnauthenticated`));
    }
  }

  const env = accountId
    ? getConfigAccountEnvironment(accountId)
    : getValidEnv();
  const axiosConfig = getAxiosConfig({
    env,
    url: path,
    data: usageEvent,
    resolveWithFullResponse: true,
  });
  logger.debug(i18n(`${i18nKey}.sendingEventUnauthenticated`));

  try {
    await httpClient({ ...axiosConfig, method: 'post' });
  } catch (e) {
    logger.debug(i18n(`${i18nKey}.unauthenticatedSendFailed`));
  }
}
