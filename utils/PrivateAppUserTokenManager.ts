import {
  fetchPrivateAppUserToken,
  createPrivateAppUserToken,
  updatePrivateAppUserToken,
  PrivateAppUserTokenResponse,
} from '../api/privateAppUserToken';
import { scopeGroupsForPersonalAccessKey } from '../lib/personalAccessKey';
import { logger } from '../lib/logger';
import { i18n } from './lang';
import moment from 'moment';
import { AxiosError } from 'axios';
import { getAxiosErrorWithContext } from '../errors/apiErrors';

const USER_TOKEN_READ = 'developer.private_app.temporary_token.read';
const USER_TOKEN_WRITE = 'developer.private_app.temporary_token.write';
const i18nKey = 'utils.PrivateAppUserTokenManager';

export class PrivateAppUserTokenManager {
  accountId: number;
  tokenMap: Map<number, PrivateAppUserTokenResponse>;
  tokenMapIntervalId: Map<number, NodeJS.Timeout>;
  enabled: boolean;

  constructor(accountId: number) {
    this.accountId = accountId;
    this.tokenMap = new Map<number, PrivateAppUserTokenResponse>();
    this.tokenMapIntervalId = new Map<number, NodeJS.Timeout>();
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
      logger.warn(
        i18n(`${i18nKey}.errors.noScopes`, {
          accountId: this.accountId,
        })
      );
    } else {
      this.enabled = true;
    }
  }

  async getToken(
    appId: number,
    scopeGroups: string[] = []
  ): Promise<PrivateAppUserTokenResponse | undefined> {
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
        this.tokenMap.has(appId) &&
        PrivateAppUserTokenManager.doesTokenHaveAllScopes(
          this.tokenMap.get(appId),
          scopeGroups
        )
      ) {
        return this.tokenMap.get(appId);
      } else {
        const token = await this.createOrGetActiveToken(appId, scopeGroups);
        this.setCacheAndRefresh(appId, token, scopeGroups);
        return token;
      }
    } catch (err) {
      let messageDetail = 'Unknown error';
      if (err instanceof AxiosError) {
        messageDetail = getAxiosErrorWithContext(err as AxiosError).message;
      } else if (err instanceof Error) {
        messageDetail = err.message;
      }
      logger.warn(
        i18n(`${i18nKey}.errors.apiError`, {
          accountId: this.accountId,
          appId: appId,
          messageDetail: messageDetail,
        })
      );
    }
  }

  private setCacheAndRefresh(
    appId: number,
    token: PrivateAppUserTokenResponse,
    scopeGroups: string[]
  ) {
    this.tokenMap.set(appId, token);
    if (this.tokenMapIntervalId.has(appId)) {
      clearInterval(this.tokenMapIntervalId.get(appId));
    }
    const now = moment.utc();
    const refreshDelayMillis = Math.max(
      moment
        .utc(token.expiresAt)
        .subtract(5, 'minutes')
        .diff(now, 'milliseconds'),
      0
    );
    this.tokenMapIntervalId.set(
      appId,
      setInterval(
        () => this.refreshToken(appId, token.userTokenKey, scopeGroups),
        refreshDelayMillis
      )
    );
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
    const maybeToken = await this.getExistingToken(appId);
    if (maybeToken === null) {
      logger.debug(
        i18n(`${i18nKey}.create`, {
          appId: appId,
        })
      );
      return createPrivateAppUserToken(this.accountId, appId, scopeGroups);
    } else if (
      moment().add(5, 'minutes').isAfter(moment.utc(maybeToken.expiresAt)) ||
      !PrivateAppUserTokenManager.doesTokenHaveAllScopes(
        maybeToken,
        scopeGroups
      )
    ) {
      logger.debug(
        i18n(`${i18nKey}.refresh`, {
          appId: appId,
        })
      );
      return updatePrivateAppUserToken(
        this.accountId,
        appId,
        maybeToken.userTokenKey,
        scopeGroups
      );
    }
    return maybeToken;
  }

  private static doesTokenHaveAllScopes(
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
      const responseErr = err as AxiosError;
      if (responseErr.status == 404) {
        return null;
      }
      throw err;
    }
  }

  private async refreshToken(
    appId: number,
    userTokenKey: string,
    scopeGroups: string[]
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
      scopeGroups
    );
    this.setCacheAndRefresh(appId, newToken, scopeGroups);
  }
}
