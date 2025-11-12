import axios from 'axios';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { logger } from './logger';
import { http } from '../http';
import { getConfigAccountById, getConfigAccountEnvironment } from '../config';
import { FILE_MAPPER_API_PATH } from '../api/fileMapper';
import { i18n } from '../utils/lang';
import { getValidEnv } from './environment';

const i18nKey = 'lib.trackUsage';
export const CMS_CLI_USAGE_PATH = `${FILE_MAPPER_API_PATH}/cms-cli-usage`;
export const VSCODE_USAGE_PATH = `${FILE_MAPPER_API_PATH}/vscode-extension-usage`;

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
  return axios({ ...axiosConfig, method: 'post' });
}
