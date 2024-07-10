import http from '../http';

const LOCALDEVAUTH_API_PRIVATE_APP_USER_TOKEN_PATH =
  'localdevauth/v1/private-app/user-token';

export type PrivateAppUserTokenResponse = {
  userId: number;
  portalId: number;
  appId: number;
  scopeGroups: Array<string>;
  userTokenKey: string;
  expiresAt: string;
  clientId: string;
};

export async function fetchPrivateAppUserToken(
  accountId: number,
  appId: number
): Promise<PrivateAppUserTokenResponse> {
  return http.get(accountId, {
    url: `${LOCALDEVAUTH_API_PRIVATE_APP_USER_TOKEN_PATH}/${appId}`,
  });
}

export async function createPrivateAppUserToken(
  accountId: number,
  appId: number,
  scopeGroups?: Array<string>,
  expiresAt?: string
): Promise<PrivateAppUserTokenResponse> {
  return http.post(accountId, {
    url: `${LOCALDEVAUTH_API_PRIVATE_APP_USER_TOKEN_PATH}/${appId}`,
    data: {
      ...(scopeGroups && { scopeGroups: scopeGroups }),
      ...(expiresAt && { expiresAt: expiresAt }),
    },
  });
}

export async function updatePrivateAppUserToken(
  accountId: number,
  appId: number,
  userTokenKey: string,
  scopeGroups?: Array<string>,
  expiresAt?: string
): Promise<PrivateAppUserTokenResponse> {
  return http.put(accountId, {
    url: `${LOCALDEVAUTH_API_PRIVATE_APP_USER_TOKEN_PATH}/${appId}`,
    data: {
      privateAppUserTokenKey: userTokenKey,
      ...(scopeGroups && { scopeGroups: scopeGroups }),
      ...(expiresAt && { expiresAt: expiresAt }),
    },
  });
}
