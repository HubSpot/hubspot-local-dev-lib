import { vi, describe, it, expect, afterEach, MockedFunction } from 'vitest';
import moment from 'moment';
import { getConfigAccountById as __getConfigAccountById } from '../../config/index.js';
import { ENVIRONMENTS } from '../../constants/environments.js';
import { accessTokenForInjectedAccessToken } from '../accessToken.js';
import { HubSpotConfigAccount } from '../../types/Accounts.js';

vi.mock('../../config');

const getConfigAccountById = __getConfigAccountById as MockedFunction<
  typeof __getConfigAccountById
>;

const ACCOUNT_ID = 123;

function buildAccount(
  tokenInfo: { accessToken?: string; expiresAt?: string } = {}
): HubSpotConfigAccount {
  return {
    name: 'test-account',
    accountId: ACCOUNT_ID,
    authType: 'accesstoken',
    env: ENVIRONMENTS.QA,
    auth: { tokenInfo },
  };
}

describe('lib/accessToken', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    getConfigAccountById.mockReset();
  });

  describe('accessTokenForInjectedAccessToken()', () => {
    it('returns the stored access token', () => {
      getConfigAccountById.mockReturnValue(
        buildAccount({
          accessToken: 'injected-token',
          expiresAt: moment().add(1, 'hours').toISOString(),
        })
      );

      expect(accessTokenForInjectedAccessToken(ACCOUNT_ID)).toBe(
        'injected-token'
      );
    });

    it('returns the stored access token when expiresAt is absent', () => {
      getConfigAccountById.mockReturnValue(
        buildAccount({ accessToken: 'injected-token' })
      );

      expect(accessTokenForInjectedAccessToken(ACCOUNT_ID)).toBe(
        'injected-token'
      );
    });

    it('throws when the access token is expired', () => {
      getConfigAccountById.mockReturnValue(
        buildAccount({
          accessToken: 'injected-token',
          expiresAt: moment().subtract(1, 'minutes').toISOString(),
        })
      );

      expect(() => accessTokenForInjectedAccessToken(ACCOUNT_ID)).toThrow(
        /expired/
      );
    });

    it('throws when the access token is missing', () => {
      getConfigAccountById.mockReturnValue(buildAccount());

      expect(() => accessTokenForInjectedAccessToken(ACCOUNT_ID)).toThrow(
        /missing an access token/
      );
    });

    it('throws when the account uses a different auth type', () => {
      getConfigAccountById.mockReturnValue({
        name: 'test-account',
        accountId: ACCOUNT_ID,
        authType: 'apikey',
        apiKey: 'abc',
        env: ENVIRONMENTS.QA,
      });

      expect(() => accessTokenForInjectedAccessToken(ACCOUNT_ID)).toThrow(
        /other than accesstoken/
      );
    });
  });
});
