import axios from 'axios';
import moment from 'moment';

import { getHubSpotApiOrigin } from '../lib/urls.js';
import { getValidEnv } from '../lib/environment.js';
import {
  OAuthConfigAccount,
  WriteTokenInfoFunction,
  RefreshTokenResponse,
  ExchangeProof,
} from '../types/Accounts.js';
import { logger } from '../lib/logger.js';
import { i18n } from '../utils/lang.js';

const i18nKey = 'models.OAuth2Manager';

export class OAuth2Manager {
  account: OAuthConfigAccount;
  writeTokenInfo?: WriteTokenInfoFunction;
  refreshTokenRequest: Promise<RefreshTokenResponse> | null;

  constructor(
    account: OAuthConfigAccount,
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
    if (!this.account.auth.tokenInfo.refreshToken) {
      throw new Error(
        i18n(`${i18nKey}.errors.missingRefreshToken`, {
          accountId: this.account.accountId,
        })
      );
    }

    if (
      !this.account.auth.tokenInfo.accessToken ||
      moment()
        .add(5, 'minutes')
        .isAfter(moment(new Date(this.account.auth.tokenInfo.expiresAt || '')))
    ) {
      await this.refreshAccessToken();
    }
    return this.account.auth.tokenInfo.accessToken;
  }

  async fetchAccessToken(exchangeProof: ExchangeProof): Promise<void> {
    logger.debug(
      i18n(`${i18nKey}.fetchingAccessToken`, {
        accountId: this.account.accountId,
        clientId: this.account.auth.clientId,
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
      if (!this.account.auth.tokenInfo) {
        this.account.auth.tokenInfo = {};
      }
      this.account.auth.tokenInfo.refreshToken = refreshToken;
      this.account.auth.tokenInfo.accessToken = accessToken;
      this.account.auth.tokenInfo.expiresAt = moment()
        .add(Math.round(parseInt(expiresIn) * 0.75), 'seconds')
        .toString();
      if (this.writeTokenInfo) {
        logger.debug(
          i18n(`${i18nKey}.updatingTokenInfo`, {
            accountId: this.account.accountId,
            clientId: this.account.auth.clientId,
          })
        );
        this.writeTokenInfo(this.account.auth.tokenInfo);
      }
    } finally {
      this.refreshTokenRequest = null;
    }
  }

  async exchangeForTokens(exchangeProof: ExchangeProof): Promise<void> {
    if (this.refreshTokenRequest) {
      logger.debug(
        i18n(`${i18nKey}.refreshingAccessToken`, {
          accountId: this.account.accountId,
          clientId: this.account.auth.clientId,
        })
      );
      await this.refreshTokenRequest;
    } else {
      await this.fetchAccessToken(exchangeProof);
    }
  }

  async refreshAccessToken(): Promise<void> {
    const refreshTokenProof = {
      grant_type: 'refresh_token',
      client_id: this.account.auth.clientId,
      client_secret: this.account.auth.clientSecret,
      refresh_token: this.account.auth.tokenInfo.refreshToken,
    };
    await this.exchangeForTokens(refreshTokenProof);
  }
}
