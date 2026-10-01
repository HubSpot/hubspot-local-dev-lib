import moment from 'moment';
import { ACCESS_TOKEN_AUTH_METHOD } from '../constants/auth.js';
import { getConfigAccountById } from '../config/index.js';
import { i18n } from '../utils/lang.js';

const i18nKey = 'lib.accessToken';

export function accessTokenForInjectedAccessToken(accountId: number): string {
  const account = getConfigAccountById(accountId);

  if (!account) {
    throw new Error(i18n(`${i18nKey}.errors.accountNotFound`, { accountId }));
  }

  if (account.authType !== ACCESS_TOKEN_AUTH_METHOD.value) {
    throw new Error(i18n(`${i18nKey}.errors.invalidAuthType`, { accountId }));
  }

  const { accessToken, expiresAt } = account.auth.tokenInfo;

  if (!accessToken) {
    throw new Error(
      i18n(`${i18nKey}.errors.missingAccessToken`, { accountId })
    );
  }

  if (expiresAt && moment().isAfter(moment(expiresAt))) {
    throw new Error(
      i18n(`${i18nKey}.errors.expired`, { accountId, expiresAt })
    );
  }

  return accessToken;
}
