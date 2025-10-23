import axios from 'axios';
import { trackUsage } from '../trackUsage.js';
import {
  getAccountConfig as __getAccountConfig,
  getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded,
} from '../../config/index.js';
import { AuthType } from '../../types/Accounts.js';
import { ENVIRONMENTS } from '../../constants/environments.js';
import { vi, type MockedFunction } from 'vitest';

vi.mock('axios');
vi.mock('../../config');

const mockedAxios = vi.mocked(axios);
const getAccountConfig = __getAccountConfig as MockedFunction<
  typeof __getAccountConfig
>;
const getAndLoadConfigIfNeeded = __getAndLoadConfigIfNeeded as MockedFunction<
  typeof __getAndLoadConfigIfNeeded
>;

mockedAxios.mockResolvedValue({});
getAndLoadConfigIfNeeded.mockReturnValue({});

const account = {
  accountId: 12345,
  authType: 'personalaccesskey' as AuthType,
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
      getAccountConfig.mockReset();
      getAccountConfig.mockReturnValue(account);
    });

    it('tracks correctly for unauthenticated accounts', async () => {
      await trackUsage('test-action', 'INTERACTION', usageTrackingMeta);
      const requestArgs = mockedAxios.mock.lastCall
        ? mockedAxios.mock.lastCall[0]
        : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(mockedAxios).toHaveBeenCalled();
      expect(requestArgs!.data.eventName).toEqual('test-action');
      expect(requestArgs!.url.includes('authenticated')).toBeFalsy();
      expect(getAccountConfig).not.toHaveBeenCalled();
    });

    it('tracks correctly for authenticated accounts', async () => {
      await trackUsage('test-action', 'INTERACTION', usageTrackingMeta, 12345);
      const requestArgs = mockedAxios.mock.lastCall
        ? mockedAxios.mock.lastCall[0]
        : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(mockedAxios).toHaveBeenCalled();
      expect(requestArgs!.data.eventName).toEqual('test-action');
      expect(requestArgs!.url.includes('authenticated')).toBeTruthy();
      expect(getAccountConfig).toHaveBeenCalled();
    });
  });
});
