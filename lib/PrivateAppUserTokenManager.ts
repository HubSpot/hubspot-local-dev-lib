import {
  fetchPrivateAppUserToken,
  createPrivateAppUserToken,
  updatePrivateAppUserToken,
  PrivateAppUserTokenResponse,
} from '../api/privateAppUserToken';
import { scopeGroupsForPersonalAccessKey } from './personalAccessKey';
import { logger } from './logger';
import { i18n } from '../utils/lang';
import moment from 'moment';
import { AxiosError, isAxiosError } from 'axios';
import {
  getAxiosErrorWithContext,
  isSpecifiedError,
} from '../errors/apiErrors';
import { throwErrorWithMessage } from '../errors/standardErrors';
import { BaseError } from '../types/Error';

const USER_TOKEN_READ = 'developer.private_app.temporary_token.read';
const USER_TOKEN_WRITE = 'developer.private_app.temporary_token.write';
const i18nKey = 'lib.PrivateAppUserTokenManager';

type CachedPrivateAppUserToken = {
  token: PrivateAppUserTokenResponse;
  requestedScopeGroups: string[];
  refreshInterval: NodeJS.Timeout;
};

export class PrivateAppUserTokenManager {
  accountId: number;
  private tokenMap: Map<number, CachedPrivateAppUserToken>;
  private enabled: boolean;

  constructor(accountId: number) {
    this.accountId = accountId;
    this.tokenMap = new Map<number, CachedPrivateAppUserToken>();
    this.enabled = false;
  }

  async init(): Promise<void> {
    const scopeGroups = new Set<string>(
      await scopeGroupsForPersonalAccessKey(this.accountId)
    );
    if (
      !scopeGroups.has(USER_TOKEN_READ) ||
      !scopeGroups.has(USER_TOKEN_WRITE)
    ) {
      throwErrorWithMessage(`${i18nKey}.errors.noScopes`, {
        accountId: this.accountId,
      });
    } else {
      logger.debug(
        i18n(`${i18nKey}.enabled`, {
          accountId: this.accountId,
        })
      );
      this.enabled = true;
    }
  }

  cleanup() {
    this.tokenMap.forEach(cachedValue =>
      clearInterval(cachedValue.refreshInterval)
    );
    this.tokenMap.clear();
  }

  async getPrivateAppUserToken(
    appId: number,
    scopeGroups: string[] = []
  ): Promise<string | undefined> {
    if (!this.enabled) {
      logger.debug(
        i18n(`${i18nKey}.disabled`, {
          accountId: this.accountId,
          appId: appId,
        })
      );
      return;
    }
    try {
      if (
        this.doesTokenHaveAllScopes(
          this.tokenMap.get(appId)?.token,
          scopeGroups
        )
      ) {
        logger.debug(
          i18n(`${i18nKey}.cached`, {
            appId: appId,
          })
        );
        return this.tokenMap.get(appId)!.token.userTokenKey;
      } else {
        const token = await this.createOrGetActiveToken(appId, scopeGroups);
        this.setCacheAndRefresh(appId, token, scopeGroups);
        return token.userTokenKey;
      }
    } catch (err) {
      let messageDetail = 'Unknown error';
      if (isAxiosError(err)) {
        messageDetail = getAxiosErrorWithContext(err as AxiosError).message;
      } else if (err instanceof Error) {
        messageDetail = err.message;
      }
      throwErrorWithMessage(
        `${i18nKey}.errors.apiError`,
        {
          accountId: this.accountId,
          appId: appId,
          messageDetail: messageDetail,
        },
        isAxiosError(err) ? undefined : (err as BaseError) // Only pass the error if it's not an AxiosError, api error message is good enough
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private setCacheAndRefresh(
    appId: number,
    token: PrivateAppUserTokenResponse,
    requestedScopeGroups: string[]
  ) {
    if (!token) {
      throwErrorWithMessage(`${i18nKey}.errors.refreshFailed`, {
        accountId: this.accountId,
        appId: appId,
      });
    }
    if (this.tokenMap.has(appId)) {
      clearInterval(this.tokenMap.get(appId)!.refreshInterval);
    }
    const now = moment.utc();
    const refreshTime = moment.utc(token.expiresAt).subtract(5, 'minutes');
    const refreshDelayMillis = Math.max(
      refreshTime.diff(now, 'milliseconds'),
      0
    );
    const refreshInterval = setInterval(
      () => this.refreshToken(appId, token.userTokenKey, requestedScopeGroups),
      refreshDelayMillis
    );

    const cachedValue: CachedPrivateAppUserToken = {
      token,
      requestedScopeGroups,
      refreshInterval,
    };
    this.tokenMap.set(appId, cachedValue);
    logger.debug(
      i18n(`${i18nKey}.refreshScheduled`, {
        appId: appId,
        expiresAt: token.expiresAt,
        refreshTime: now.add(refreshDelayMillis, 'milliseconds').toISOString(),
      })
    );
  }

  private async createOrGetActiveToken(
    appId: number,
    scopeGroups: string[]
  ): Promise<PrivateAppUserTokenResponse> {
    const existingToken = await this.getExistingToken(appId);
    if (existingToken === null) {
      logger.debug(
        i18n(`${i18nKey}.create`, {
          appId: appId,
        })
      );
      return createPrivateAppUserToken(this.accountId, appId, scopeGroups);
    } else if (
      moment
        .utc()
        .add(5, 'minutes')
        .isAfter(moment.utc(existingToken.expiresAt)) ||
      !this.doesTokenHaveAllScopes(existingToken, scopeGroups)
    ) {
      logger.debug(
        i18n(`${i18nKey}.refresh`, {
          appId: appId,
        })
      );
      return updatePrivateAppUserToken(
        this.accountId,
        appId,
        existingToken.userTokenKey,
        scopeGroups
      );
    }
    return existingToken;
  }

  private doesTokenHaveAllScopes(
    token: PrivateAppUserTokenResponse | undefined,
    requestedScopes: string[]
  ): boolean {
    if (token === undefined) {
      return false;
    }
    return requestedScopes.every(scopeGroup =>
      token.scopeGroups.includes(scopeGroup)
    );
  }

  private async getExistingToken(
    appId: number
  ): Promise<PrivateAppUserTokenResponse | null> {
    try {
      return await fetchPrivateAppUserToken(this.accountId, appId);
    } catch (err) {
      if (isSpecifiedError(err as AxiosError, { statusCode: 404 })) {
        return null;
      }
      throw err;
    }
  }

  private async refreshToken(
    appId: number,
    userTokenKey: string,
    requestedScopes: string[]
  ) {
    logger.debug(
      i18n(`${i18nKey}.refresh`, {
        appId: appId,
      })
    );
    const newToken = await updatePrivateAppUserToken(
      this.accountId,
      appId,
      userTokenKey,
      requestedScopes
    );
    if (newToken) {
      this.setCacheAndRefresh(appId, newToken, requestedScopes);
    } else {
      throwErrorWithMessage(`${i18nKey}.errors.refreshFailed`, {
        accountId: this.accountId,
        appId: appId,
      });
    }
  }
}
