import { vi, describe, it, expect, afterEach, MockedFunction } from 'vitest';
import { getConfig as __getConfig } from '../../config/index.js';
import { httpClient } from '../../http/client.js';
import { ENVIRONMENTS } from '../../constants/environments.js';
import {
  fetchAccessToken,
  fetchDeveloperTestAccountData,
  fetchSandboxHubData,
  getHubletFromPersonalAccessKey,
} from '../personalAccessKey.js';

vi.mock('../../config');
vi.mock('../../http/client');

const getConfig = __getConfig as MockedFunction<typeof __getConfig>;
const mockedHttpClient = vi.mocked(httpClient);

function encodeVarint(value: number): Array<number> {
  const bytes = [];
  let remaining = value;
  while (remaining >= 0x80) {
    bytes.push((remaining % 0x80) | 0x80);
    remaining = Math.floor(remaining / 0x80);
  }
  bytes.push(remaining);
  return bytes;
}

function varintField(fieldNumber: number, value: number): Array<number> {
  return [...encodeVarint(fieldNumber * 8), ...encodeVarint(value)];
}

function stringField(fieldNumber: number, value: string): Array<number> {
  const bytes = [...Buffer.from(value, 'utf8')];
  return [
    ...encodeVarint(fieldNumber * 8 + 2),
    ...encodeVarint(bytes.length),
    ...bytes,
  ];
}

function fixedField(fieldNumber: number, wireType: 1 | 5): Array<number> {
  const length = wireType === 1 ? 8 : 4;
  return [
    ...encodeVarint(fieldNumber * 8 + wireType),
    ...new Array(length).fill(0xff),
  ];
}

function buildPersonalAccessKey(...fields: Array<Array<number>>): string {
  return Buffer.from(fields.flat()).toString('base64url');
}

const EU1_PERSONAL_ACCESS_KEY = buildPersonalAccessKey(
  stringField(1, 'eu1-00000000-0000-0000-0000-000000000000'),
  varintField(2, 918597597),
  varintField(3, 4294967295),
  stringField(5, 'signature'),
  stringField(9, 'eu1')
);

describe('utils/personalAccessKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getHubletFromPersonalAccessKey()', () => {
    it('returns the hublet field from the key', () => {
      expect(getHubletFromPersonalAccessKey(EU1_PERSONAL_ACCESS_KEY)).toBe(
        'eu1'
      );
    });

    it('skips fixed-width fields before the hublet field', () => {
      const personalAccessKey = buildPersonalAccessKey(
        fixedField(6, 1),
        fixedField(7, 5),
        stringField(9, 'na2')
      );

      expect(getHubletFromPersonalAccessKey(personalAccessKey)).toBe('na2');
    });

    it('returns undefined when the key has no hublet field', () => {
      const personalAccessKey = buildPersonalAccessKey(
        stringField(1, '00000000-0000-0000-0000-000000000000'),
        varintField(2, 123)
      );

      expect(getHubletFromPersonalAccessKey(personalAccessKey)).toBeUndefined();
    });

    it('returns undefined when a field length runs past the end of the key', () => {
      const personalAccessKey = Buffer.from([
        ...encodeVarint(9 * 8 + 2),
        ...encodeVarint(10),
        ...Buffer.from('eu1'),
      ]).toString('base64url');

      expect(getHubletFromPersonalAccessKey(personalAccessKey)).toBeUndefined();
    });

    it('returns undefined for an unsupported wire type', () => {
      const personalAccessKey = Buffer.from([
        ...encodeVarint(1 * 8 + 3),
        ...stringField(9, 'eu1'),
      ]).toString('base64url');

      expect(getHubletFromPersonalAccessKey(personalAccessKey)).toBeUndefined();
    });

    it('returns undefined for an empty key', () => {
      expect(getHubletFromPersonalAccessKey('')).toBeUndefined();
    });
  });

  describe('hublet-aware requests', () => {
    afterEach(() => {
      mockedHttpClient.mockReset();
    });

    it('sends the access token request to the qa hublet from the key', async () => {
      getConfig.mockReturnValue({ accounts: [] });

      await fetchAccessToken(EU1_PERSONAL_ACCESS_KEY, ENVIRONMENTS.QA);

      expect(mockedHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api-eu1.hubapiqa.com',
          url: 'localdevauth/v1/auth/refresh',
          method: 'post',
        })
      );
    });

    it('sends the access token request to the default prod origin', async () => {
      getConfig.mockReturnValue({ accounts: [] });

      await fetchAccessToken(EU1_PERSONAL_ACCESS_KEY, ENVIRONMENTS.PROD);

      expect(mockedHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.hubapi.com',
        })
      );
    });

    it('sends the sandbox request to the provided qa hublet', async () => {
      getConfig.mockReturnValue({ accounts: [] });

      await fetchSandboxHubData('access-token', 123, ENVIRONMENTS.QA, 'eu1');

      expect(mockedHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api-eu1.hubapiqa.com',
          url: 'sandbox-hubs/v1/self',
        })
      );
    });

    it('sends the developer test account request to the provided qa hublet', async () => {
      getConfig.mockReturnValue({ accounts: [] });

      await fetchDeveloperTestAccountData(
        'access-token',
        123,
        ENVIRONMENTS.QA,
        'eu1'
      );

      expect(mockedHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api-eu1.hubapiqa.com',
          url: 'integrators/test-portals/v2/self',
        })
      );
    });
  });
});
