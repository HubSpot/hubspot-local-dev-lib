import moment from 'moment';
import { ENVIRONMENTS } from '../constants/environments';
import { PERSONAL_ACCESS_KEY_AUTH_METHOD } from '../constants/auth';
import {
  fetchAccessToken,
  fetchScopeAuthorizationData,
} from '../api/localDevAuth';
import { fetchSandboxHubData } from '../api/sandboxHubs';
import {
  CLIAccount,
  PersonalAccessKeyAccount,
  ScopeGroupAuthorization,
} from '../types/Accounts';
import { Environment } from '../types/Config';
import {
  getAccountConfig,
  updateAccountConfig,
  writeConfig,
  getEnv,
  updateDefaultAccount,
} from '../config';
import { HUBSPOT_ACCOUNT_TYPES } from '../constants/config';
import { fetchDeveloperTestAccountData } from '../api/developerTestAccounts';
import { logger } from './logger';
import { CLIConfiguration } from '../config/CLIConfiguration';
import { i18n } from '../utils/lang';
import { isHubSpotHttpError } from '../errors';
import { AccessToken } from '../types/Accounts';

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
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  accountId: number
): Promise<AccessToken> {
  const accessTokenResponse = await getAccessToken(
    personalAccessKey,
    env,
    accountId
  );
  const { accessToken, expiresAt } = accessTokenResponse;
  const config = getAccountConfig(accountId);

  updateAccountConfig({
    env,
    ...config,
    accountId,
    tokenInfo: {
      accessToken,
      expiresAt: expiresAt,
    },
  });
  writeConfig();

  return accessTokenResponse;
}

async function getNewAccessToken(
  accountId: number,
  personalAccessKey: string,
  expiresAt: string | undefined,
  env: Environment
): Promise<AccessToken> {
  const key = getRefreshKey(personalAccessKey, expiresAt);
  if (refreshRequests.has(key)) {
    return refreshRequests.get(key);
  }
  let accessTokenResponse: AccessToken;
  try {
    const refreshAccessPromise = refreshAccessToken(
      personalAccessKey,
      env,
      accountId
    );
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
  const account = getAccountConfig(accountId) as PersonalAccessKeyAccount;
  if (!account) {
    throw new Error(i18n(`${i18nKey}.errors.accountNotFound`, { accountId }));
  }
  const { auth, personalAccessKey, env } = account;

  const accessTokenResponse = await getNewAccessToken(
    accountId,
    personalAccessKey,
    auth?.tokenInfo?.expiresAt,
    env
  );
  return accessTokenResponse;
}

export async function accessTokenForPersonalAccessKey(
  accountId: number,
  forceRefresh = false
): Promise<string | undefined> {
  const account = getAccountConfig(accountId) as PersonalAccessKeyAccount;
  if (!account) {
    throw new Error(i18n(`${i18nKey}.errors.accountNotFound`, { accountId }));
  }
  const { auth, personalAccessKey, env } = account;
  const authTokenInfo = auth && auth.tokenInfo;
  const authDataExists = authTokenInfo && auth?.tokenInfo?.accessToken;

  if (
    !authDataExists ||
    forceRefresh ||
    moment().add(5, 'minutes').isAfter(moment(authTokenInfo.expiresAt))
  ) {
    return getNewAccessToken(
      accountId,
      personalAccessKey,
      authTokenInfo && authTokenInfo.expiresAt,
      env
    ).then(tokenInfo => tokenInfo.accessToken);
  }

  return auth?.tokenInfo?.accessToken;
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

export async function authorizedScopesForPortalAndUser(
  accountId: number
): Promise<Array<ScopeGroupAuthorization>> {
  return (await fetchScopeAuthorizationData(accountId)).data.results;
}

export async function updateConfigWithAccessToken(
  token: AccessToken,
  personalAccessKey: string,
  env?: Environment,
  name?: string,
  makeDefault = false
): Promise<CLIAccount | null> {
  const { portalId, accessToken, expiresAt, accountType } = token;
  const accountEnv = env || getEnv(name);

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

  const updatedAccount = updateAccountConfig({
    accountId: portalId,
    accountType,
    personalAccessKey,
    name,
    authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    tokenInfo: { accessToken, expiresAt },
    parentAccountId,
    env: accountEnv,
  });
  if (!CLIConfiguration.isActive()) {
    writeConfig();
  }

  if (makeDefault && name) {
    updateDefaultAccount(name);
  }

  return updatedAccount;
}
