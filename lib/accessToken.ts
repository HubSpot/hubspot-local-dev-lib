import moment from 'moment';
import { ACCESS_TOKEN_AUTH_METHOD } from '../constants/auth.js';
import {
  HUBSPOT_CONFIG_ERROR_TYPES,
  HUBSPOT_CONFIG_OPERATIONS,
} from '../constants/config.js';
import { getConfigAccountById } from '../config/index.js';
import { HubSpotConfigError } from '../models/HubSpotConfigError.js';
import { i18n } from '../utils/lang.js';

const i18nKey = 'lib.accessToken';

function throwAccountError(message: string): never {
  throw new HubSpotConfigError(
    message,
    HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ACCOUNT,
    HUBSPOT_CONFIG_OPERATIONS.READ
  );
}

export function accessTokenForInjectedAccessToken(accountId: number): string {
  const account = getConfigAccountById(accountId);

  if (!account) {
    return throwAccountError(
      i18n(`${i18nKey}.errors.accountNotFound`, { accountId })
    );
  }

  if (account.authType !== ACCESS_TOKEN_AUTH_METHOD.value) {
    return throwAccountError(
      i18n(`${i18nKey}.errors.invalidAuthType`, { accountId })
    );
  }

  const { accessToken, expiresAt } = account.auth.tokenInfo;

  if (!accessToken) {
    return throwAccountError(
      i18n(`${i18nKey}.errors.missingAccessToken`, { accountId })
    );
  }

  if (expiresAt && moment().isAfter(moment(expiresAt))) {
    return throwAccountError(
      i18n(`${i18nKey}.errors.expired`, { accountId, expiresAt })
    );
  }

  return accessToken;
}
