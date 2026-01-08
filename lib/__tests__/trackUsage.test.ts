import { vi, MockedFunction } from 'vitest';
import { httpClient } from '../../http/client';
import { trackUsage } from '../trackUsage';
import {
  getConfigAccountById as __getConfigAccountById,
  getConfig as __getConfig,
} from '../../config';
import { HubSpotConfigAccount } from '../../types/Accounts';
import { ENVIRONMENTS } from '../../constants/environments';
import {
  FILE_MAPPER_API_PATH,
  CMS_CLI_USAGE_PATH,
  VSCODE_USAGE_PATH,
} from '../../constants/endpoints';
import { logger } from '../logger';
import { http } from '../../http';

vi.mock('../../config');
vi.mock('../logger');
vi.mock('../../http');
vi.mock('../../http/client');

const mockedAxios = vi.mocked(httpClient);
const mockedLogger = vi.mocked(logger);
const mockedHttp = vi.mocked(http);
const getConfigAccountById = __getConfigAccountById as MockedFunction<
  typeof __getConfigAccountById
>;
const getConfig = __getConfig as MockedFunction<typeof __getConfig>;

mockedAxios.mockResolvedValue({});
getConfig.mockReturnValue({ accounts: [] });

const account: HubSpotConfigAccount = {
  name: 'test-account',
  accountId: 12345,
  authType: 'personalaccesskey',
  personalAccessKey: 'let-me-in-3',
  auth: {
    tokenInfo: {
      expiresAt: '',
      accessToken: 'test-token',
    },
  },
  env: ENVIRONMENTS.QA,
};

const usageTrackingMeta = {
  action: 'cli-command',
  command: 'test-command',
};

describe('lib/trackUsage', () => {
  describe('trackUsage()', () => {
    beforeEach(() => {
      getConfigAccountById.mockReset();
      getConfigAccountById.mockReturnValue(account);
      mockedAxios.mockReset();
      mockedLogger.debug.mockReset();
      mockedHttp.post.mockReset();
    });

    it('tracks correctly for unauthenticated accounts', async () => {
      await trackUsage('test-action', 'INTERACTION', usageTrackingMeta);
      const requestArgs = mockedAxios.mock.lastCall
        ? mockedAxios.mock.lastCall[0]
        : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(mockedAxios).toHaveBeenCalled();
      expect(requestArgs!.data.eventName).toEqual('test-action');
      expect(requestArgs!.url.includes('authenticated')).toBeFalsy();
      expect(getConfigAccountById).not.toHaveBeenCalled();
    });

    it('tracks correctly for authenticated accounts', async () => {
      await trackUsage('test-action', 'INTERACTION', usageTrackingMeta, 12345);

      expect(mockedHttp.post).toHaveBeenCalledWith(12345, {
        url: `${FILE_MAPPER_API_PATH}/authenticated`,
        data: {
          accountId: 12345,
          eventName: 'test-action',
          eventClass: 'INTERACTION',
          meta: usageTrackingMeta,
        },
        resolveWithFullResponse: true,
      });
      expect(getConfigAccountById).toHaveBeenCalled();
    });

    describe('eventName routing - unauthenticated requests', () => {
      it('routes cli-interaction eventName to CMS_CLI_USAGE_PATH', async () => {
        await trackUsage('cli-interaction', 'INTERACTION', usageTrackingMeta);
        const requestArgs = mockedAxios.mock.lastCall
          ? mockedAxios.mock.lastCall[0]
          : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        expect(mockedAxios).toHaveBeenCalled();
        expect(requestArgs!.url).toBe(CMS_CLI_USAGE_PATH);
        expect(requestArgs!.data.eventName).toBe('cli-interaction');
        expect(mockedLogger.debug).not.toHaveBeenCalledWith(
          expect.stringContaining('invalidEvent')
        );
      });

      it('routes vscode-extension-interaction eventName to VSCODE_USAGE_PATH', async () => {
        await trackUsage(
          'vscode-extension-interaction',
          'INTERACTION',
          usageTrackingMeta
        );
        const requestArgs = mockedAxios.mock.lastCall
          ? mockedAxios.mock.lastCall[0]
          : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        expect(mockedAxios).toHaveBeenCalled();
        expect(requestArgs!.url).toBe(VSCODE_USAGE_PATH);
        expect(requestArgs!.data.eventName).toBe(
          'vscode-extension-interaction'
        );
        expect(mockedLogger.debug).not.toHaveBeenCalledWith(
          expect.stringContaining('invalidEvent')
        );
      });

      it('routes unknown eventName to FILE_MAPPER_API_PATH and logs debug message', async () => {
        const unknownEventName = 'unknown-event-type';
        await trackUsage(unknownEventName, 'INTERACTION', usageTrackingMeta);
        const requestArgs = mockedAxios.mock.lastCall
          ? mockedAxios.mock.lastCall[0]
          : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        expect(mockedAxios).toHaveBeenCalled();
        expect(requestArgs!.url).toBe(FILE_MAPPER_API_PATH);
        expect(requestArgs!.data.eventName).toBe(unknownEventName);
        expect(mockedLogger.debug).toHaveBeenCalledWith(
          `Usage tracking event ${unknownEventName} is not a valid event type.`
        );
      });
    });

    describe('eventName routing - authenticated requests', () => {
      it('routes cli-interaction eventName to authenticated CMS_CLI_USAGE_PATH for authenticated accounts', async () => {
        await trackUsage(
          'cli-interaction',
          'INTERACTION',
          usageTrackingMeta,
          12345
        );

        expect(mockedHttp.post).toHaveBeenCalledWith(12345, {
          url: `${CMS_CLI_USAGE_PATH}/authenticated`,
          data: {
            accountId: 12345,
            eventName: 'cli-interaction',
            eventClass: 'INTERACTION',
            meta: usageTrackingMeta,
          },
          resolveWithFullResponse: true,
        });
        expect(getConfigAccountById).toHaveBeenCalledWith(12345);
        expect(mockedLogger.debug).not.toHaveBeenCalledWith(
          expect.stringContaining('invalidEvent')
        );
      });

      it('routes vscode-extension-interaction eventName to authenticated VSCODE_USAGE_PATH for authenticated accounts', async () => {
        await trackUsage(
          'vscode-extension-interaction',
          'INTERACTION',
          usageTrackingMeta,
          12345
        );

        expect(mockedHttp.post).toHaveBeenCalledWith(12345, {
          url: `${VSCODE_USAGE_PATH}/authenticated`,
          data: {
            accountId: 12345,
            eventName: 'vscode-extension-interaction',
            eventClass: 'INTERACTION',
            meta: usageTrackingMeta,
          },
          resolveWithFullResponse: true,
        });
        expect(getConfigAccountById).toHaveBeenCalledWith(12345);
        expect(mockedLogger.debug).not.toHaveBeenCalledWith(
          expect.stringContaining('invalidEvent')
        );
      });

      it('routes unknown eventName to authenticated FILE_MAPPER_API_PATH and logs debug message for authenticated accounts', async () => {
        const unknownEventName = 'another-unknown-event';
        await trackUsage(
          unknownEventName,
          'INTERACTION',
          usageTrackingMeta,
          12345
        );

        expect(mockedHttp.post).toHaveBeenCalledWith(12345, {
          url: `${FILE_MAPPER_API_PATH}/authenticated`,
          data: {
            accountId: 12345,
            eventName: unknownEventName,
            eventClass: 'INTERACTION',
            meta: usageTrackingMeta,
          },
          resolveWithFullResponse: true,
        });
        expect(getConfigAccountById).toHaveBeenCalledWith(12345);
        expect(mockedLogger.debug).toHaveBeenCalledWith(
          `Usage tracking event ${unknownEventName} is not a valid event type.`
        );
      });

      it('falls back to unauthenticated request when authenticated request fails', async () => {
        mockedHttp.post.mockRejectedValueOnce(new Error('Auth failed'));

        await trackUsage(
          'cli-interaction',
          'INTERACTION',
          usageTrackingMeta,
          12345
        );

        // Should try authenticated first
        expect(mockedHttp.post).toHaveBeenCalledWith(12345, {
          url: `${CMS_CLI_USAGE_PATH}/authenticated`,
          data: {
            accountId: 12345,
            eventName: 'cli-interaction',
            eventClass: 'INTERACTION',
            meta: usageTrackingMeta,
          },
          resolveWithFullResponse: true,
        });

        // Then fall back to unauthenticated
        const requestArgs = mockedAxios.mock.lastCall
          ? mockedAxios.mock.lastCall[0]
          : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        expect(mockedAxios).toHaveBeenCalled();
        expect(requestArgs!.url).toBe(CMS_CLI_USAGE_PATH);
        expect(requestArgs!.data.eventName).toBe('cli-interaction');
      });
    });
  });
});
