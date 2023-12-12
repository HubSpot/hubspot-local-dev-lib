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
import { CLIAccount, PersonalAccessKeyAccount } from '../types/Accounts';
import { Environment } from '../types/Config';
import {
  getAccountConfig,
  updateAccountConfig,
  writeConfig,
  getEnv,
  updateDefaultAccount,
} from '../config';

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
  encodedOAuthRefreshToken: string;
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
    if (error.response && error.response.data) {
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
    encodedOAuthRefreshToken: response.encodedOAuthRefreshToken,
  };
}

async function refreshAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  accountId: number
): Promise<string> {
  const { accessToken, expiresAt } = await getAccessToken(
    personalAccessKey,
    env,
    accountId
  );
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

  return accessToken;
}

async function getNewAccessToken(
  accountId: number,
  personalAccessKey: string,
  expiresAt: string | undefined,
  env: Environment
): Promise<string> {
  const key = getRefreshKey(personalAccessKey, expiresAt);
  if (refreshRequests.has(key)) {
    return refreshRequests.get(key);
  }
  let accessToken;
  try {
    const refreshAccessPromise = refreshAccessToken(
      personalAccessKey,
      env,
      accountId
    );
    if (key) {
      refreshRequests.set(key, refreshAccessPromise);
    }
    accessToken = await refreshAccessPromise;
  } catch (e) {
    if (key) {
      refreshRequests.delete(key);
    }
    throw e;
  }
  return accessToken;
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
    );
  }

  return auth?.tokenInfo?.accessToken;
}

// Adds an account to the config using authType: personalAccessKey
export const updateConfigWithPersonalAccessKey = async (
  personalAccessKey: string,
  env?: Environment,
  name?: string,
  makeDefault = false
): Promise<CLIAccount | null> => {
  const accountEnv = env || getEnv(name);

  let token;
  try {
    token = await getAccessToken(personalAccessKey, accountEnv);
  } catch (err) {
    throwError(err as BaseError);
  }
  const { portalId, accessToken, expiresAt } = token;

  let hubInfo;
  try {
    hubInfo = await fetchSandboxHubData(accessToken, portalId, accountEnv);
  } catch (err) {
    // Ignore error, returns 404 if account is not a sandbox
  }

  let sandboxAccountType = null;
  let parentAccountId = null;
  if (hubInfo) {
    if (hubInfo.type !== undefined) {
      sandboxAccountType = hubInfo.type === null ? 'STANDARD' : hubInfo.type;
    }
    if (hubInfo.parentHubId) {
      parentAccountId = hubInfo.parentHubId;
    }
  }

  const updatedConfig = updateAccountConfig({
    accountId: portalId,
    personalAccessKey,
    name,
    authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    tokenInfo: { accessToken, expiresAt },
    sandboxAccountType,
    parentAccountId,
  });
  writeConfig();

  if (makeDefault && name) {
    updateDefaultAccount(name);
  }

  return updatedConfig;
};
