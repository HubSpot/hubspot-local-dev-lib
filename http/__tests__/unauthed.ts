import { vi } from 'vitest';

import { httpClient } from '../client.js';
import { getConfig as __getConfig } from '../../config/index.js';
import { http } from '../unauthed.js';
import pkg from '../../package.json' with { type: 'json' };

vi.mock('../client');
vi.mock('../../config');

vi.mock('axios');

vi.mock('http', () => ({
  default: {
    Agent: vi.fn().mockReturnValue({
      options: { keepAlive: true, maxSockets: 5, maxTotalSockets: 25 },
    }),
  },
}));

vi.mock('https', () => ({
  default: {
    Agent: vi.fn().mockReturnValue({
      options: { keepAlive: true, maxSockets: 6, maxTotalSockets: 26 },
    }),
  },
}));

const mockedAxios = jest.mocked(httpClient);
const getConfig = __getConfig as jest.MockedFunction<typeof __getConfig>;

describe('http/index', () => {
  describe('http.get()', () => {
    it('supports making unauthed requests', async () => {
      getConfig.mockReturnValue({
        accounts: [],
      });

      await http.get({
        url: 'some/endpoint/path',
        env: 'qa',
      });

      expect(mockedAxios).toHaveBeenCalledWith({
        baseURL: `https://api.hubapiqa.com`,
        url: 'some/endpoint/path',
        headers: {
          'User-Agent': `HubSpot Local Dev Lib/${pkg.version}`,
        },
        timeout: 15000,
        params: {},
        transitional: {
          clarifyTimeoutError: true,
        },
        proxy: false,
        httpAgent: {
          options: { keepAlive: true, maxSockets: 5, maxTotalSockets: 25 },
        },
        httpsAgent: {
          options: { keepAlive: true, maxSockets: 6, maxTotalSockets: 26 },
        },
      });
    });
  });
});
