import moment from 'moment';
import { ENVIRONMENTS } from '../constants/environments.js';
import { PERSONAL_ACCESS_KEY_AUTH_METHOD } from '../constants/auth.js';
import {
  fetchAccessToken,
  fetchSandboxHubData,
  fetchDeveloperTestAccountData,
} from '../utils/personalAccessKey.js';
import {
  PersonalAccessKeyConfigAccount,
  Environment,
} from '../types/Accounts.js';

import {
  getConfigAccountById,
  getConfigAccountIfExists,
  updateConfigAccount,
  addConfigAccount,
  setConfigAccountAsDefault,
} from '../config/index.js';
import { HUBSPOT_ACCOUNT_TYPES } from '../constants/config.js';
import { logger } from './logger.js';
import { i18n } from '../utils/lang.js';
import { isHubSpotHttpError } from '../errors/index.js';
import { AccessToken } from '../types/Accounts.js';

const i18nKey = 'lib.personalAccessKey';

const refreshRequests = new Map();

function getRefreshKey(personalAccessKey: string, expiration?: string): string {
  return `${personalAccessKey}-${expiration || 'fresh'}`;
}

export async function getAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  accountId?: number
): Promise<AccessToken> {
  const axiosResponse = await fetchAccessToken(
    personalAccessKey,
    env,
    accountId
  );
  const response = axiosResponse.data;

  return {
    portalId: response.hubId,
    accessToken: response.oauthAccessToken,
    expiresAt: moment(response.expiresAtMillis).toISOString(),
    scopeGroups: response.scopeGroups,
    enabledFeatures: response.enabledFeatures,
    encodedOAuthRefreshToken: response.encodedOAuthRefreshToken,
    hubName: response.hubName,
    accountType: response.accountType,
  };
}

async function refreshAccessToken(
  account: PersonalAccessKeyConfigAccount
): Promise<AccessToken> {
  const { personalAccessKey, env, accountId } = account;
  const accessTokenResponse = await getAccessToken(
    personalAccessKey,
    env,
    accountId
  );
  const { accessToken, expiresAt } = accessTokenResponse;

  updateConfigAccount({
    ...account,
    auth: {
      tokenInfo: {
        accessToken,
        expiresAt: expiresAt,
      },
    },
  });

  return accessTokenResponse;
}

async function getNewAccessToken(
  account: PersonalAccessKeyConfigAccount
): Promise<AccessToken> {
  const { personalAccessKey, auth } = account;
  const key = getRefreshKey(personalAccessKey, auth.tokenInfo.expiresAt);
  if (refreshRequests.has(key)) {
    return refreshRequests.get(key);
  }
  let accessTokenResponse: AccessToken;
  try {
    const refreshAccessPromise = refreshAccessToken(account);
    if (key) {
      refreshRequests.set(key, refreshAccessPromise);
    }
    accessTokenResponse = await refreshAccessPromise;
  } catch (e) {
    if (key) {
      refreshRequests.delete(key);
    }
    throw e;
  }
  return accessTokenResponse;
}

async function getNewAccessTokenByAccountId(
  accountId: number
): Promise<AccessToken> {
  const account = getConfigAccountById(accountId);
  if (!account) {
    throw new Error(i18n(`${i18nKey}.errors.accountNotFound`, { accountId }));
  }
  if (account.authType !== PERSONAL_ACCESS_KEY_AUTH_METHOD.value) {
    throw new Error(
      i18n(`${i18nKey}.errors.invalidAuthType`, {
        accountId,
      })
    );
  }

  const accessTokenResponse = await getNewAccessToken(account);
  return accessTokenResponse;
}

export async function accessTokenForPersonalAccessKey(
  accountId: number,
  forceRefresh = false
): Promise<string | undefined> {
  const account = getConfigAccountById(accountId);
  if (!account) {
    throw new Error(i18n(`${i18nKey}.errors.accountNotFound`, { accountId }));
  }
  if (account.authType !== PERSONAL_ACCESS_KEY_AUTH_METHOD.value) {
    throw new Error(
      i18n(`${i18nKey}.errors.invalidAuthType`, {
        accountId,
      })
    );
  }

  const { auth } = account;
  const authTokenInfo = auth && auth.tokenInfo;
  const authDataExists = authTokenInfo && auth?.tokenInfo?.accessToken;

  if (
    !authDataExists ||
    forceRefresh ||
    moment().add(5, 'minutes').isAfter(moment(authTokenInfo.expiresAt))
  ) {
    return getNewAccessToken(account).then(tokenInfo => tokenInfo.accessToken);
  }

  return auth.tokenInfo?.accessToken;
}

export async function enabledFeaturesForPersonalAccessKey(
  accountId: number
): Promise<{ [key: string]: number } | undefined> {
  const accessTokenResponse = await getNewAccessTokenByAccountId(accountId);
  return accessTokenResponse?.enabledFeatures;
}

export async function scopesOnAccessToken(
  accountId: number
): Promise<Array<string>> {
  return (await getNewAccessTokenByAccountId(accountId)).scopeGroups;
}

export async function updateConfigWithAccessToken(
  token: AccessToken,
  personalAccessKey: string,
  env?: Environment,
  name?: string,
  makeDefault = false
): Promise<PersonalAccessKeyConfigAccount> {
  const { portalId, accessToken, expiresAt, accountType } = token;
  const account = getConfigAccountIfExists(portalId);
  const accountEnv = env || account?.env || ENVIRONMENTS.PROD;

  let parentAccountId;
  try {
    if (
      accountType === HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX ||
      accountType === HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX
    ) {
      const { data: sandboxDataResponse } = await fetchSandboxHubData(
        accessToken,
        portalId,
        accountEnv
      );
      if (sandboxDataResponse.parentHubId) {
        parentAccountId = sandboxDataResponse.parentHubId;
      }
    }
  } catch (err) {
    // Log error but do not throw
    if (isHubSpotHttpError(err)) {
      logger.debug(err.message);
    }
    logger.debug(err);
  }

  try {
    if (accountType === HUBSPOT_ACCOUNT_TYPES.DEVELOPER_TEST) {
      const { data: developerTestAccountResponse } =
        await fetchDeveloperTestAccountData(accessToken, portalId, accountEnv);
      if (developerTestAccountResponse) {
        parentAccountId = developerTestAccountResponse.parentPortalId;
      }
    }
  } catch (err) {
    // Log error but do not throw
    if (isHubSpotHttpError(err)) {
      logger.debug(err.message);
    }
    logger.debug(err);
  }

  const updatedAccount = {
    accountId: portalId,
    accountType,
    personalAccessKey,
    name: name || account?.name,
    authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    auth: { tokenInfo: { accessToken, expiresAt } },
    parentAccountId,
    env: accountEnv,
  } as PersonalAccessKeyConfigAccount; // Account may temporarily not have a name before prompted to add one in the CLI

  // Add new account if it doesn't exist, otherwise update existing account
  if (account) {
    updateConfigAccount(updatedAccount);
  } else {
    addConfigAccount(updatedAccount);
  }

  if (makeDefault) {
    setConfigAccountAsDefault(updatedAccount.accountId);
  }

  return updatedAccount;
}
