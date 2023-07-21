import OAuth2Manager from '../models/OAuth2Manger';
import { AUTH_METHODS } from '../constants/auth';
import { FlatAccountFields } from '../types/Accounts';
import { throwError } from '../errors/standardErrors';
import { debug } from '../utils/logger';
import { BaseError } from '../types/Error';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { makeTypedLogger } from '../utils/logger';
import { getAccountIdentifier } from '../utils/getAccountIdentifier';
import { updateAccountConfig, writeConfig } from '../config';

const oauthManagers = new Map<number, OAuth2Manager>();

function writeOauthTokenInfo(accountConfig: FlatAccountFields): void {
  const accountId = getAccountIdentifier(accountConfig);

  debug('oauth.writeTokenInfo', { portalId: accountId || '' });

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

const addOauthToAccountConfigCallbackKeys = ['init', 'success'];

export function addOauthToAccountConfig(
  oauth: OAuth2Manager,
  logCallbacks: LogCallbacksArg<typeof addOauthToAccountConfigCallbackKeys>
) {
  const logger = makeTypedLogger<typeof addOauthToAccountConfigCallbackKeys>(
    logCallbacks,
    'oauth.addOauthToAccountConfig'
  );
  logger('init');
  try {
    updateAccountConfig({
      ...oauth.toObj(),
      authType: AUTH_METHODS.oauth.value,
    });
    writeConfig();
    logger('success');
  } catch (err) {
    throwError(err as BaseError);
  }
}
