import axios, { AxiosError } from 'axios';
import moment from 'moment';

import { getHubSpotApiOrigin } from '../lib/urls';
import { getValidEnv } from '../lib/environment';
import { FlatAccountFields, TokenInfo } from '../types/Accounts';
import { logger } from '../lib/logger';
import { getAccountIdentifier } from '../utils/getAccountIdentifier';
import { AUTH_METHODS } from '../constants/auth';
import {
  throwError,
  throwErrorWithMessage,
  throwAuthErrorWithMessage,
} from '../errors/standardErrors';
import { BaseError } from '../types/Error';
import { Environment } from '../types/Config';
import { i18n } from '../utils/lang';

type OAuth2ManagerAccountConfig = {
  name?: string;
  accountId?: number;
  clientId?: string;
  clientSecret?: string;
  scopes?: Array<string>;
  env?: Environment;
  environment?: Environment;
  tokenInfo?: TokenInfo;
  authType?: 'oauth2';
};

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
  account: OAuth2ManagerAccountConfig;
  writeTokenInfo?: WriteTokenInfoFunction;
  refreshTokenRequest: Promise<RefreshTokenResponse> | null;

  constructor(
    account: OAuth2ManagerAccountConfig,
    writeTokenInfo?: WriteTokenInfoFunction
  ) {
    this.writeTokenInfo = writeTokenInfo;
    this.refreshTokenRequest = null;
    this.account = account;

    if (this.account.env) {
      this.account.env = getValidEnv(this.account.env, '');
    }
  }

  async accessToken(): Promise<string | undefined> {
    if (!this.account.tokenInfo?.refreshToken) {
      throwErrorWithMessage(`${i18nKey}.errors.missingRefreshToken`, {
        accountId: getAccountIdentifier(this.account)!,
      });
    }

    if (
      !this.account.tokenInfo?.accessToken ||
      moment()
        .add(5, 'minutes')
        .isAfter(moment(new Date(this.account.tokenInfo.expiresAt || '')))
    ) {
      await this.refreshAccessToken();
    }
    return this.account.tokenInfo.accessToken;
  }

  async fetchAccessToken(exchangeProof: ExchangeProof): Promise<void> {
    logger.debug(
      i18n(`${i18nKey}.fetchingAccessToken`, {
        accountId: getAccountIdentifier(this.account)!,
        clientId: this.account.clientId || '',
      })
    );

    try {
      const { data } = await axios({
        url: `${getHubSpotApiOrigin(
          getValidEnv(this.account.env)
        )}/oauth/v1/token`,
        method: 'post',
        data: exchangeProof,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      this.refreshTokenRequest = data;

      const {
        refresh_token: refreshToken,
        access_token: accessToken,
        expires_in: expiresIn,
      } = data;
      if (!this.account.tokenInfo) {
        this.account.tokenInfo = {};
      }
      this.account.tokenInfo.refreshToken = refreshToken;
      this.account.tokenInfo.accessToken = accessToken;
      this.account.tokenInfo.expiresAt = moment()
        .add(Math.round(parseInt(expiresIn) * 0.75), 'seconds')
        .toString();
      if (this.writeTokenInfo) {
        logger.debug(
          i18n(`${i18nKey}.updatingTokenInfo`, {
            accountId: getAccountIdentifier(this.account)!,
            clientId: this.account.clientId || '',
          })
        );
        this.writeTokenInfo(this.account.tokenInfo);
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
        logger.debug(
          i18n(`${i18nKey}.refreshingAccessToken`, {
            accountId: getAccountIdentifier(this.account)!,
            clientId: this.account.clientId || '',
          })
        );
        await this.refreshTokenRequest;
      } else {
        await this.fetchAccessToken(exchangeProof);
      }
    } catch (e) {
      const error = e as AxiosError<{ message: string }>;
      if (error.response) {
        throwAuthErrorWithMessage(
          `${i18nKey}.errors.auth`,
          {
            token: error.response.data.message || '',
          },
          error
        );
      } else {
        throwError(error);
      }
    }
  }

  async refreshAccessToken(): Promise<void> {
    const refreshTokenProof = {
      grant_type: 'refresh_token',
      client_id: this.account.clientId,
      client_secret: this.account.clientSecret,
      refresh_token: this.account.tokenInfo?.refreshToken,
    };
    await this.exchangeForTokens(refreshTokenProof);
  }

  static fromConfig(
    accountConfig: FlatAccountFields,
    writeTokenInfo: WriteTokenInfoFunction
  ) {
    return new OAuth2Manager(
      {
        ...accountConfig,
        authType: AUTH_METHODS.oauth.value,
        ...(accountConfig.auth || {}),
      },
      writeTokenInfo
    );
  }
}

export default OAuth2Manager;
