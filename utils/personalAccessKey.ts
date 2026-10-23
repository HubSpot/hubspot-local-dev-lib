import { AxiosPromise } from 'axios';
import { httpClient } from '../http/client.js';
import { getAxiosConfig } from '../http/getAxiosConfig.js';
import { ENVIRONMENTS } from '../constants/environments.js';
import { LOCALDEVAUTH_ACCESS_TOKEN_PATH } from '../constants/endpoints.js';
import { AccessTokenResponse, Environment } from '../types/Accounts.js';
import { DeveloperTestAccount } from '../types/developerTestAccounts.js';
import { SandboxHubData } from '../types/Sandbox.js';
import { HubSpotPromise } from '../types/Http.js';

const SANDBOX_API_PATH = 'sandbox-hubs/v1';
const TEST_ACCOUNTS_API_PATH = 'integrators/test-portals/v2';

const VARINT_WIRE_TYPE = 0;
const LENGTH_DELIMITED_WIRE_TYPE = 2;
const HUBLET_FIELD_NUMBER = 9;

export function getHubletFromToken(token: string): string | undefined {
  const buffer = Buffer.from(token, 'base64url');
  let offset = 0;

  function readVarint(): number {
    let value = 0;
    let shift = 0;
    let byte;
    do {
      byte = buffer[offset];
      offset += 1;
      value += (byte & 0x7f) * 2 ** shift;
      shift += 7;
    } while (byte & 0x80);
    return value;
  }

  while (offset < buffer.length) {
    const tag = readVarint();
    const wireType = tag & 0x7;

    if (wireType === VARINT_WIRE_TYPE) {
      readVarint();
    } else if (wireType === LENGTH_DELIMITED_WIRE_TYPE) {
      const length = readVarint();
      if (tag >> 3 === HUBLET_FIELD_NUMBER) {
        return buffer.toString('utf8', offset, offset + length);
      }
      offset += length;
    } else {
      return undefined;
    }
  }

  return undefined;
}

export function fetchAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  portalId?: number
): HubSpotPromise<AccessTokenResponse> {
  const axiosConfig = getAxiosConfig({
    env,
    hublet: getHubletFromToken(personalAccessKey),
    localHostOverride: true,
    url: LOCALDEVAUTH_ACCESS_TOKEN_PATH,
    data: {
      encodedOAuthRefreshToken: personalAccessKey,
    },
    params: portalId ? { portalId } : {},
  });

  return httpClient<AccessTokenResponse>({
    ...axiosConfig,
    method: 'post',
  });
}

export function fetchSandboxHubData(
  accessToken: string,
  accountId: number,
  env: Environment = ENVIRONMENTS.PROD
): AxiosPromise<SandboxHubData> {
  const axiosConfig = getAxiosConfig({
    env,
    hublet: getHubletFromToken(accessToken),
    url: `${SANDBOX_API_PATH}/self`,
    params: { portalId: accountId },
  });
  const reqWithToken = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return httpClient<SandboxHubData>(reqWithToken);
}

export function fetchDeveloperTestAccountData(
  accessToken: string,
  accountId: number,
  env: Environment = ENVIRONMENTS.PROD
): HubSpotPromise<DeveloperTestAccount> {
  const axiosConfig = getAxiosConfig({
    env,
    hublet: getHubletFromToken(accessToken),
    url: `${TEST_ACCOUNTS_API_PATH}/self`,
    params: { portalId: accountId },
  });
  const reqWithToken = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return httpClient<DeveloperTestAccount>(reqWithToken);
}
