import axios from 'axios';
import { http } from '../unauthed.js';
import { version } from '../../package.json';

import { vi } from 'vitest';

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

const mockedAxios = vi.mocked(axios);

describe('http/index', () => {
  describe('http.get()', () => {
    it('supports making unauthed requests', async () => {
      await http.get({
        url: 'some/endpoint/path',
        env: 'qa',
      });

      expect(mockedAxios).toHaveBeenCalledWith({
        baseURL: `https://api.hubapiqa.com`,
        url: 'some/endpoint/path',
        headers: {
          'User-Agent': `HubSpot Local Dev Lib/${version}`,
        },
        timeout: 15000,
        params: {},
        transitional: {
          clarifyTimeoutError: true,
        },
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
