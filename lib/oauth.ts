import { OAuth2Manager } from '../models/OAuth2Manager.js';
import { OAuthConfigAccount } from '../types/Accounts.js';
import { logger } from './logger.js';
import { updateConfigAccount } from '../config/index.js';
import { i18n } from '../utils/lang.js';

const i18nKey = 'lib.oauth';

const oauthManagers = new Map<number, OAuth2Manager>();

function writeOauthTokenInfo(account: OAuthConfigAccount): void {
  logger.debug(
    i18n(`${i18nKey}.writeTokenInfo`, { portalId: account.accountId })
  );

  updateConfigAccount(account);
}

export function getOauthManager(account: OAuthConfigAccount) {
  if (!oauthManagers.has(account.accountId)) {
    oauthManagers.set(
      account.accountId,
      new OAuth2Manager(account, () => writeOauthTokenInfo(account))
    );
  }
  return oauthManagers.get(account.accountId);
}

export function addOauthToAccountConfig(oauth: OAuth2Manager) {
  logger.log(i18n(`${i18nKey}.addOauthToAccountConfig.init`));
  updateConfigAccount(oauth.account);
  logger.success(i18n(`${i18nKey}.addOauthToAccountConfig.success`));
}
