import moment from 'moment';
import { AxiosError } from 'axios';
import { ENVIRONMENTS } from '../constants/environments';
import { PERSONAL_ACCESS_KEY_AUTH_METHOD } from '../constants/auth';
import {
  throwAuthErrorWithMessage,
  throwErrorWithMessage,
  throwError,
} from '../errors/standardErrors';
import { fetchAccessToken } from '../api/localDevAuth';
import { fetchSandboxHubData } from '../api/sandboxHubs';
import { BaseError } from '../types/Error';
import {
  AccountType,
  CLIAccount,
  PersonalAccessKeyAccount,
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

const i18nKey = 'lib.personalAccessKey';

const refreshRequests = new Map();

function getRefreshKey(personalAccessKey: string, expiration?: string): string {
  return `${personalAccessKey}-${expiration || 'fresh'}`;
}

type AccessToken = {
  portalId: number;
  accessToken: string;
  expiresAt: string;
  scopeGroups: Array<string>;
  enabledFeatures?: { [key: string]: number };
  encodedOAuthRefreshToken: string;
  hubName: string;
};

export async function getAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  accountId?: number
): Promise<AccessToken> {
  let response;
  try {
    response = await fetchAccessToken(personalAccessKey, env, accountId);
  } catch (e) {
    const error = e as AxiosError<{ message?: string }>;
    if (error.response) {
      throwAuthErrorWithMessage(
        `${i18nKey}.errors.invalidPersonalAccessKey`,
        { errorMessage: error.response.data.message || '' },
        error
      );
    } else {
      throwError(e as BaseError);
    }
  }
  return {
    portalId: response.hubId,
    accessToken: response.oauthAccessToken,
    expiresAt: moment(response.expiresAtMillis).toISOString(),
    scopeGroups: response.scopeGroups,
    enabledFeatures: response.enabledFeatures,
    encodedOAuthRefreshToken: response.encodedOAuthRefreshToken,
    hubName: response.hubName,
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
  let accessTokenResponse;
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

export async function accessTokenForPersonalAccessKey(
  accountId: number
): Promise<string | undefined> {
  const account = getAccountConfig(accountId) as PersonalAccessKeyAccount;
  if (!account) {
    throwErrorWithMessage(`${i18nKey}.errors.accountNotFound`, { accountId });
  }
  const { auth, personalAccessKey, env } = account;
  const authTokenInfo = auth && auth.tokenInfo;
  const authDataExists = authTokenInfo && auth?.tokenInfo?.accessToken;

  if (
    !authDataExists ||
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
  const account = getAccountConfig(accountId) as PersonalAccessKeyAccount;
  if (!account) {
    throwErrorWithMessage(`${i18nKey}.errors.accountNotFound`, { accountId });
  }
  const { auth, personalAccessKey, env } = account;
  const authTokenInfo = auth && auth.tokenInfo;

  const accessTokenResponse = await getNewAccessToken(
    accountId,
    personalAccessKey,
    authTokenInfo && authTokenInfo.expiresAt,
    env
  );
  return accessTokenResponse?.enabledFeatures;
}

export async function updateConfigWithAccessToken(
  token: AccessToken,
  personalAccessKey: string,
  env?: Environment,
  name?: string,
  makeDefault = false
): Promise<CLIAccount | null> {
  const { portalId, accessToken, expiresAt } = token;
  const accountEnv = env || getEnv(name);

  let hubInfo;
  try {
    hubInfo = await fetchSandboxHubData(accessToken, portalId, accountEnv);
  } catch (err) {
    // Ignore error, returns 404 if account is not a sandbox
  }

  let accountType: AccountType = HUBSPOT_ACCOUNT_TYPES.STANDARD;
  let sandboxAccountType = null;
  let parentAccountId;
  if (hubInfo) {
    if (hubInfo.type !== undefined) {
      const sandboxHubType = hubInfo.type ? hubInfo.type.toUpperCase() : null;
      switch (sandboxHubType) {
        case 'DEVELOPER':
          accountType = HUBSPOT_ACCOUNT_TYPES.DEVELOPER_SANDBOX;
          sandboxAccountType = 'DEVELOPER';
          break;
        case 'STANDARD':
          accountType = HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX;
          sandboxAccountType = 'STANDARD';
          break;
        default:
          accountType = HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX;
          sandboxAccountType = 'STANDARD';
          break;
      }
    }

    if (hubInfo.parentHubId) {
      parentAccountId = hubInfo.parentHubId;
    }
  }

  const updatedConfig = updateAccountConfig({
    accountId: portalId,
    accountType,
    personalAccessKey,
    name,
    authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    tokenInfo: { accessToken, expiresAt },
    sandboxAccountType,
    parentAccountId,
    env: accountEnv,
  });
  writeConfig();

  if (makeDefault && name) {
    updateDefaultAccount(name);
  }

  return updatedConfig;
}
