import axios from 'axios';
import { trackUsage } from '../trackUsage';
import {
  getAccountConfig as __getAccountConfig,
  getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded,
} from '../../config';
import { AuthType } from '../../types/Accounts';
import { ENVIRONMENTS } from '../../constants/environments';

jest.mock('axios');
jest.mock('../../config');

const mockedAxios = jest.mocked(axios);
const getAccountConfig = __getAccountConfig as jest.MockedFunction<
  typeof __getAccountConfig
>;
const getAndLoadConfigIfNeeded =
  __getAndLoadConfigIfNeeded as jest.MockedFunction<
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
      mockedAxios.mockClear();
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
