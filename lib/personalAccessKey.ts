import moment from 'moment';
import CLIConfiguration from '../config/CLIConfiguration';
import { getValidEnv } from '../lib/environment';
import { ENVIRONMENTS } from '../constants/environments';
import { PERSONAL_ACCESS_KEY_AUTH_METHOD } from '../constants/auth';
import {
  throwAuthErrorWithMessage,
  throwErrorWithMessage,
  throwError,
} from '../errors/standardErrors';
import { fetchAccessToken } from '../api/localDevAuth/unauthenticated';
import { fetchSandboxHubData } from '../api/hubs';
import { BaseError, StatusCodeError } from '../types/Error';
import { CLIAccount, PersonalAccessKeyAccount } from '../types/Accounts';
import { Environment } from '../types/Config';

const refreshRequests = new Map();

function getRefreshKey(personalAccessKey: string, expiration?: string): string {
  return `${personalAccessKey}-${expiration || 'fresh'}`;
}

type AccessToken = {
  portalId: number;
  accessToken: string;
  expiresAt: string;
  scopeGroups: Array<string>;
  encodedOauthRefreshToken: string;
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
    const error = e as StatusCodeError;
    if (error.response) {
      if (error.response.statusCode === 401) {
        // Before adjusting the error message below, please verify that changes do not break regex match in cli/commands/sandbox/delete.js
        // For future changes: if response.statusCode is passed into the new error below, sandboxes can skip the regex check and pull the statusCode instead
        throwAuthErrorWithMessage(
          'personalAccessKey.invalidPersonalAccessKey401',
          { errorMessage: error.response.body.message },
          error
        );
      } else {
        throwAuthErrorWithMessage(
          'personalAccessKey.invalidPersonalAccessKey',
          { errorMessage: error.response.body.message },
          error
        );
      }
    } else {
      throwError(e as BaseError);
    }
  }
  return {
    portalId: response.hubId,
    accessToken: response.oauthAccessToken,
    expiresAt: moment(response.expiresAtMillis).toISOString(),
    scopeGroups: response.scopeGroups,
    encodedOauthRefreshToken: response.encodedOauthRefreshToken,
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
  const config = CLIConfiguration.getAccount(accountId);

  CLIConfiguration.updateAccount({
    env,
    ...config,
    accountId,
    tokenInfo: {
      accessToken,
      expiresAt: expiresAt,
    },
  });
  CLIConfiguration.write();

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
  const account = CLIConfiguration.getAccount(
    accountId
  ) as PersonalAccessKeyAccount;
  if (!account) {
    throwErrorWithMessage('personalAccessKey.accountNotFound', { accountId });
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

// Adds a account to the config using authType: personalAccessKey
export const updateConfigWithPersonalAccessKey = async (
  personalAccessKey: string,
  name: string,
  env: Environment,
  makeDefault = false
): Promise<CLIAccount | null> => {
  const accountEnv = env || CLIConfiguration.getEnv(name);

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

  const updatedConfig = CLIConfiguration.updateAccount({
    accountId: portalId,
    personalAccessKey,
    name,
    env: getValidEnv(accountEnv, ''),
    authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    tokenInfo: { accessToken, expiresAt },
    sandboxAccountType,
    parentAccountId,
  });
  CLIConfiguration.write();

  if (makeDefault) {
    CLIConfiguration.updateDefaultAccount(name);
  }

  return updatedConfig;
};
