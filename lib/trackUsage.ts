import axios from 'axios';
import { getAxiosConfig } from '../http/getAxiosConfig.js';
import { logger } from './logger.js';
import { http } from '../http/index.js';
import { getAccountConfig, getEnv } from '../config/index.js';
import { FILE_MAPPER_API_PATH } from '../api/fileMapper.js';
import { i18n } from '../utils/lang.js';

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

  let analyticsEndpoint;

  switch (eventName) {
    case EVENT_TYPES.CLI_INTERACTION:
      analyticsEndpoint = 'cms-cli-usage';
      break;
    case EVENT_TYPES.VSCODE_EXTENSION_INTERACTION:
      analyticsEndpoint = 'vscode-extension-usage';
      break;
    default:
      logger.debug(i18n(`${i18nKey}.invalidEvent`, { eventName }));
  }

  const path = `${FILE_MAPPER_API_PATH}/${analyticsEndpoint}`;

  const accountConfig = accountId && getAccountConfig(accountId);

  if (accountConfig && accountConfig.authType === 'personalaccesskey') {
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

  const env = getEnv(accountId);
  const axiosConfig = getAxiosConfig({
    env,
    url: path,
    data: usageEvent,
    resolveWithFullResponse: true,
  });
  logger.debug(i18n(`${i18nKey}.sendingEventUnauthenticated`));
  return axios({ ...axiosConfig, method: 'post' });
}
