import axios from 'axios';
import { trackUsage } from '../trackUsage';
import {
  getConfigAccountById as __getConfigAccountById,
  getConfig as __getConfig,
} from '../../config';
import { HubSpotConfigAccount } from '../../types/Accounts';
import { ENVIRONMENTS } from '../../constants/environments';

jest.mock('axios');
jest.mock('../../config');

const mockedAxios = jest.mocked(axios);
const getConfigAccountById = __getConfigAccountById as jest.MockedFunction<
  typeof __getConfigAccountById
>;
const getConfig = __getConfig as jest.MockedFunction<typeof __getConfig>;

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
      const requestArgs = mockedAxios.mock.lastCall
        ? mockedAxios.mock.lastCall[0]
        : ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(mockedAxios).toHaveBeenCalled();
      expect(requestArgs!.data.eventName).toEqual('test-action');
      expect(requestArgs!.url.includes('authenticated')).toBeTruthy();
      expect(getConfigAccountById).toHaveBeenCalled();
    });
  });
});
