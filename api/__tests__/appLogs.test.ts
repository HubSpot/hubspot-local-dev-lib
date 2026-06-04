vi.mock('../../http');
import { http } from '../../http/index.js';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { searchAppLogs, getAppLogDetails } from '../appLogs.js';
import type { SearchLogsRequest } from '../../types/AppLogs.js';

describe('api/appLogs', () => {
  const accountId = 999999;
  const appId = 123456;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchAppLogs', () => {
    const requestBody: SearchLogsRequest = {
      query: {
        loggingSystemType: 'WEBHOOKS',
        limit: 10,
        offset: 0,
        errorTypes: [],
        resultsOrder: 'DESC',
      },
      limit: 10,
    };

    it('should call http.post with the correct url and body', async () => {
      await searchAppLogs(accountId, appId, requestBody);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `developers/logs/search/${appId}`,
        data: requestBody,
      });
    });

    it('should include optional after cursor when provided', async () => {
      const bodyWithCursor: SearchLogsRequest = {
        ...requestBody,
        after: 'abc123',
      };
      await searchAppLogs(accountId, appId, bodyWithCursor);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `developers/logs/search/${appId}`,
        data: bodyWithCursor,
      });
    });
  });

  describe('getAppLogDetails', () => {
    const systemType = 'WEBHOOKS' as const;
    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    it('should call http.get with the correct url', async () => {
      await getAppLogDetails(accountId, appId, systemType, uuid);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developers/logs/details/${appId}/${systemType}/${uuid}`,
      });
    });

    it('should include the systemType in the url path', async () => {
      await getAppLogDetails(accountId, appId, 'API_CALL', uuid);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developers/logs/details/${appId}/API_CALL/${uuid}`,
      });
    });
  });
});
