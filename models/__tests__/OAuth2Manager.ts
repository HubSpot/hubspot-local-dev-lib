import axios from 'axios';
import moment from 'moment';
import OAuth2Manager from '../OAuth2Manager';
import { ENVIRONMENTS } from '../../constants/environments';

jest.mock('axios');

const mockRefreshTokenResponse = {
  refresh_token: 'new-token',
  access_token: 'new-access-token',
  expires_in: moment().add(2, 'hours').toISOString(),
};

const postSpy = jest
  .spyOn(axios, 'post')
  .mockResolvedValue({ data: mockRefreshTokenResponse });

const initialRefreshToken = '84d22710-4cb7-5581-ba05-35f9945e5e8e';

const oauthAccount = {
  accountId: 123,
  env: ENVIRONMENTS.PROD,
  authType: 'oauth2' as const,
  auth: {
    clientId: 'd996372f-2b53-30d3-9c3b-4fdde4bce3a2',
    clientSecret: 'f90a6248-fbc0-3b03-b0db-ec58c95e791',
    scopes: ['content'],
    tokenInfo: {
      expiresAt: moment().add(2, 'hours').toISOString(),
      refreshToken: initialRefreshToken,
      accessToken: 'let-me-in',
    },
  },
};

describe('models/Oauth2Manager', () => {
  describe('constructor()', () => {
    it('initializes', async () => {
      const oauthManager = new OAuth2Manager(oauthAccount, () => undefined);
      expect(oauthManager.refreshTokenRequest).toBe(null);
      expect(oauthManager.account).toBe(oauthAccount);
    });
  });

  describe('toObj()', () => {
    it('returns an account object', async () => {
      const oauthManager = new OAuth2Manager(oauthAccount, () => undefined);

      const accountObj = oauthManager.toObj();
      expect(accountObj.clientSecret).toBe(oauthAccount.auth.clientSecret);
      expect(accountObj.tokenInfo?.refreshToken).toBe(
        oauthAccount.auth.tokenInfo.refreshToken
      );
    });
  });

  describe('fromConfig()', () => {
    it('initializes an oauth manager instance', async () => {
      const oauthManager = OAuth2Manager.fromConfig(
        oauthAccount,
        () => undefined
      );

      expect(oauthManager.refreshTokenRequest).toBe(null);
      expect(oauthManager.account).toMatchObject(oauthAccount);
    });
  });

  describe('refreshAccessToken()', () => {
    it('refreshes the oauth access token', async () => {
      const oauthManager = OAuth2Manager.fromConfig(
        oauthAccount,
        () => undefined
      );

      await oauthManager.refreshAccessToken();

      expect(postSpy).toHaveBeenCalledWith(
        'https://api.hubapi.com/oauth/v1/token',
        {
          form: {
            client_id: oauthAccount.auth.clientId,
            client_secret: oauthAccount.auth.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: initialRefreshToken,
          },
          json: true,
        }
      );
      expect(oauthManager.account.auth?.tokenInfo?.refreshToken).toBe(
        mockRefreshTokenResponse.refresh_token
      );
      expect(oauthManager.account.auth?.tokenInfo?.accessToken).toBe(
        mockRefreshTokenResponse.access_token
      );
    });
  });
});
