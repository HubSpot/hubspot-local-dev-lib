import { vi, describe, it, expect, afterEach } from 'vitest';
import { httpClient } from '../../http/client.js';
import { ENVIRONMENTS } from '../../constants/environments.js';
import { fetchAccessToken, getHubletFromToken } from '../personalAccessKey.js';

vi.mock('../../config');
vi.mock('../../http/client');

const mockedHttpClient = vi.mocked(httpClient);

const TOKEN_FIELDS = [0x0a, 0x03, ...Buffer.from('key'), 0x10, 0x7b];
const HUBLET_FIELD = [0x4a, 0x03, ...Buffer.from('eu1')];

const TOKEN_WITHOUT_HUBLET = Buffer.from(TOKEN_FIELDS).toString('base64url');
const EU1_TOKEN = Buffer.from([...TOKEN_FIELDS, ...HUBLET_FIELD]).toString(
  'base64url'
);

describe('utils/personalAccessKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getHubletFromToken()', () => {
    it('returns the hublet from the token', () => {
      expect(getHubletFromToken(EU1_TOKEN)).toBe('eu1');
    });

    it('returns undefined when the token has no hublet', () => {
      expect(getHubletFromToken(TOKEN_WITHOUT_HUBLET)).toBeUndefined();
    });
  });

  describe('fetchAccessToken()', () => {
    it('uses the hublet from the personal access key', async () => {
      await fetchAccessToken(EU1_TOKEN, ENVIRONMENTS.QA);

      expect(mockedHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api-eu1.hubapiqa.com',
        })
      );
    });
  });
});
