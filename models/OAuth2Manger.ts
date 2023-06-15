import request from 'request-promise-native';
import moment from 'moment';

import { ENVIRONMENTS } from '../constants/environments';
import { getHubSpotApiOrigin } from '../lib/urls';
import { getValidEnv } from '../lib/environment';
import { FlatAccountFields, OAuthAccount, TokenInfo } from '../types/Accounts';
import { debug } from '../utils/logger';
import { AUTH_METHODS } from '../constants/auth';
import {
  throwError,
  throwErrorWithMessage,
  throwAuthErrorWithMessage,
} from '../errors/standardErrors';
import { BaseError } from '../types/Error';

type WriteTokenInfoFunction = (tokenInfo: TokenInfo) => void;

type RefreshTokenResponse = {
  refresh_token: string;
  access_token: string;
  expires_in: string;
};

type ExchangeProof = {
  grant_type: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
};

const i18nKey = 'models.OAuth2Manager';

class OAuth2Manager {
  account: OAuthAccount;
  writeTokenInfo: WriteTokenInfoFunction;
  refreshTokenRequest: Promise<RefreshTokenResponse> | null;

  constructor(account: OAuthAccount, writeTokenInfo: WriteTokenInfoFunction) {
    this.account = account;
    this.writeTokenInfo = writeTokenInfo;
    this.refreshTokenRequest = null;
  }

  async accessToken(): Promise<string | undefined> {
    if (!this.account.auth.tokenInfo?.refreshToken) {
      throwErrorWithMessage(`${i18nKey}.missingRefreshToken`, {
        accountId: this.account.accountId,
      });
    }
    if (
      !this.account.auth.tokenInfo?.accessToken ||
      moment()
        .add(5, 'minutes')
        .isAfter(moment(this.account.auth?.tokenInfo.expiresAt))
    ) {
      await this.refreshAccessToken();
    }
    return this.account.auth?.tokenInfo.accessToken;
  }

  async fetchAccessToken(exchangeProof: ExchangeProof): Promise<void> {
    debug(`${i18nKey}.fetchingAccessToken`, {
      accountId: this.account.accountId,
      clientId: this.account.auth.clientId || '',
    });

    try {
      this.refreshTokenRequest = request.post(
        `${getHubSpotApiOrigin(getValidEnv(this.account.env))}/oauth/v1/token`,
        {
          form: exchangeProof,
          json: true,
        }
      );

      const response = await this.refreshTokenRequest;
      const {
        refresh_token: refreshToken,
        access_token: accessToken,
        expires_in: expiresIn,
      } = response;
      if (!this.account.auth.tokenInfo) {
        this.account.auth.tokenInfo = {};
      }
      this.account.auth.tokenInfo.refreshToken = refreshToken;
      this.account.auth.tokenInfo.accessToken = accessToken;
      this.account.auth.tokenInfo.expiresAt = moment()
        .add(Math.round(parseInt(expiresIn) * 0.75), 'seconds')
        .toString();
      if (this.writeTokenInfo) {
        debug(`${i18nKey}.updatingTokenInfo`, {
          accountId: this.account.accountId,
          clientId: this.account.auth.clientId || '',
        });
        this.writeTokenInfo(this.account.auth.tokenInfo);
      }
      this.refreshTokenRequest = null;
    } catch (e) {
      this.refreshTokenRequest = null;
      throwError(e as BaseError);
    }
  }

  async exchangeForTokens(exchangeProof: ExchangeProof): Promise<void> {
    try {
      if (this.refreshTokenRequest) {
        debug(`${i18nKey}.refreshingAccessToken`, {
          accountId: this.account.accountId,
          clientId: this.account.auth.clientId || '',
        });
        await this.refreshTokenRequest;
      } else {
        await this.fetchAccessToken(exchangeProof);
      }
    } catch (e) {
      if (e.response) {
        throwAuthErrorWithMessage(`${i18nKey}.auth`, {
          token: e.response.body.message,
          e,
        });
      } else {
        throwError(e as BaseError);
      }
    }
  }

  async refreshAccessToken(): Promise<void> {
    const refreshTokenProof = {
      grant_type: 'refresh_token',
      client_id: this.account.auth.clientId,
      client_secret: this.account.auth.clientSecret,
      refresh_token: this.account.auth.tokenInfo?.refreshToken,
    };
    await this.exchangeForTokens(refreshTokenProof);
  }

  toObj() {
    return {
      environment: this.account.env ? ENVIRONMENTS.QA : ENVIRONMENTS.PROD,
      clientSecret: this.account.auth.clientSecret,
      clientId: this.account.auth.clientId,
      scopes: this.account.auth.scopes,
      tokenInfo: this.account.auth.tokenInfo,
      name: this.account.name,
      accountId: this.account.accountId,
    };
  }

  static fromConfig(
    accountConfig: FlatAccountFields,
    writeTokenInfo: WriteTokenInfoFunction
  ) {
    return new OAuth2Manager(
      {
        ...accountConfig,
        authType: AUTH_METHODS.oauth.value,
        auth: accountConfig.auth || {},
      },
      writeTokenInfo
    );
  }
}

export default OAuth2Manager;
