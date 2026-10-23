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

const HUBLET_PROTO_FIELD_NUMBER = 9;

const PROTO_WIRE_TYPES = {
  VARINT: 0,
  FIXED64: 1,
  LENGTH_DELIMITED: 2,
  FIXED32: 5,
} as const;

function readVarint(
  buffer: Buffer,
  offset: number
): { value: number; nextOffset: number } | undefined {
  let value = 0;
  let shift = 0;
  let currentOffset = offset;

  while (currentOffset < buffer.length) {
    const byte = buffer[currentOffset];
    currentOffset += 1;
    value += (byte & 0x7f) * 2 ** shift;

    if ((byte & 0x80) === 0) {
      return { value, nextOffset: currentOffset };
    }
    shift += 7;
  }

  return undefined;
}

export function getHubletFromPersonalAccessKey(
  personalAccessKey: string
): string | undefined {
  const buffer = Buffer.from(personalAccessKey, 'base64url');
  let offset = 0;

  while (offset < buffer.length) {
    const tag = readVarint(buffer, offset);
    if (!tag) {
      return undefined;
    }

    const fieldNumber = Math.floor(tag.value / 8);
    const wireType = tag.value % 8;
    offset = tag.nextOffset;

    if (wireType === PROTO_WIRE_TYPES.VARINT) {
      const varint = readVarint(buffer, offset);
      if (!varint) {
        return undefined;
      }
      offset = varint.nextOffset;
    } else if (wireType === PROTO_WIRE_TYPES.FIXED64) {
      offset += 8;
    } else if (wireType === PROTO_WIRE_TYPES.FIXED32) {
      offset += 4;
    } else if (wireType === PROTO_WIRE_TYPES.LENGTH_DELIMITED) {
      const length = readVarint(buffer, offset);
      if (!length) {
        return undefined;
      }

      const end = length.nextOffset + length.value;
      if (end > buffer.length) {
        return undefined;
      }

      if (fieldNumber === HUBLET_PROTO_FIELD_NUMBER) {
        return buffer.toString('utf8', length.nextOffset, end);
      }
      offset = end;
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
    hublet: getHubletFromPersonalAccessKey(personalAccessKey),
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
  env: Environment = ENVIRONMENTS.PROD,
  hublet?: string
): AxiosPromise<SandboxHubData> {
  const axiosConfig = getAxiosConfig({
    env,
    hublet,
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
  env: Environment = ENVIRONMENTS.PROD,
  hublet?: string
): HubSpotPromise<DeveloperTestAccount> {
  const axiosConfig = getAxiosConfig({
    env,
    hublet,
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
