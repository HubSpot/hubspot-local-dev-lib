import OAuth2Manager from '../models/OAuth2Manager';
import { AUTH_METHODS } from '../constants/auth';
import { FlatAccountFields } from '../types/Accounts';
import { throwError } from '../errors/standardErrors';
import { debug } from '../utils/logger';
import { BaseError } from '../types/Error';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { makeTypedLogger } from '../utils/logger';
import { getAccountIdentifier } from '../utils/getAccountIdentifier';
import { updateAccountConfig, writeConfig } from '../config';

const i18nKey = 'lib.oauth';

const addOauthToAccountConfigCallbackKeys = ['init', 'success'] as const;

const oauthManagers = new Map<number, OAuth2Manager>();

function writeOauthTokenInfo(accountConfig: FlatAccountFields): void {
  const accountId = getAccountIdentifier(accountConfig);

  debug(`${i18nKey}.writeTokenInfo`, { portalId: accountId || '' });

  updateAccountConfig(accountConfig);
  writeConfig();
}

export function getOauthManager(
  accountId: number,
  accountConfig: FlatAccountFields
) {
  if (!oauthManagers.has(accountId)) {
    oauthManagers.set(
      accountId,
      OAuth2Manager.fromConfig(accountConfig, () =>
        writeOauthTokenInfo(accountConfig)
      )
    );
  }
  return oauthManagers.get(accountId);
}

export function addOauthToAccountConfig(
  oauth: OAuth2Manager,
  logCallbacks: LogCallbacksArg<typeof addOauthToAccountConfigCallbackKeys>
) {
  const logger =
    makeTypedLogger<typeof addOauthToAccountConfigCallbackKeys>(logCallbacks);
  logger('init', `${i18nKey}.addOauthToAccountConfig.init`);
  try {
    updateAccountConfig({
      ...oauth.account,
      authType: AUTH_METHODS.oauth.value,
    });
    writeConfig();
    logger('success', `${i18nKey}.addOauthToAccountConfig.success`);
  } catch (err) {
    throwError(err as BaseError);
  }
}
