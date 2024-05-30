import axios, { AxiosError } from 'axios';
import fs from 'fs-extra';
import moment from 'moment';
import {
  getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded,
  getAccountConfig as __getAccountConfig,
} from '../../config';
import { ENVIRONMENTS } from '../../constants/environments';
import http from '../';
import { version } from '../../package.json';
import { AuthType } from '../../types/Accounts';

jest.mock('fs-extra');
jest.mock('axios');
jest.mock('../../config');
jest.mock('../../lib/logger');

jest.mock('http', () => ({
  Agent: jest.fn().mockReturnValue({
    options: { keepAlive: true, maxSockets: 5, maxTotalSockets: 25 },
  }),
}));

jest.mock('https', () => ({
  Agent: jest.fn().mockReturnValue({
    options: { keepAlive: true, maxSockets: 6, maxTotalSockets: 26 },
  }),
}));

const mockedAxios = jest.mocked(axios);
const getAndLoadConfigIfNeeded =
  __getAndLoadConfigIfNeeded as jest.MockedFunction<
    typeof __getAndLoadConfigIfNeeded
  >;
const getAccountConfig = __getAccountConfig as jest.MockedFunction<
  typeof __getAccountConfig
>;

fs.createWriteStream = jest.fn().mockReturnValue({
  on: jest.fn((event, callback) => {
    if (event === 'close') {
      callback();
    }
  }),
});

describe('http/index', () => {
  afterEach(() => {
    jest.clearAllMocks();
    getAndLoadConfigIfNeeded.mockReset();
    getAccountConfig.mockReset();
  });

  describe('http.getOctetStream()', () => {
    beforeEach(() => {
      getAndLoadConfigIfNeeded.mockReturnValue({
        httpTimeout: 1000,
        accounts: [
          {
            accountId: 123,
            apiKey: 'abc',
            env: ENVIRONMENTS.QA,
          },
        ],
      });
      getAccountConfig.mockReturnValue({
        accountId: 123,
        apiKey: 'abc',
        env: ENVIRONMENTS.QA,
      });
    });

    it('makes a get request', async () => {
      mockedAxios.mockResolvedValue({
        status: 200,
        headers: [],
        data: {
          pipe: jest.fn(),
        },
      });
      await http.getOctetStream(
        123,
        { url: 'some/endpoint/path' },
        'path/to/local/file'
      );

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          responseType: 'stream',
          url: 'some/endpoint/path',
        })
      );
      expect(fs.createWriteStream).toHaveBeenCalledWith('path/to/local/file', {
        encoding: 'binary',
      });
    });
    it('fails to fetch a file and does not attempt to write to disk', async () => {
      mockedAxios.mockResolvedValue({
        status: 404,
        headers: [],
        data: {
          pipe: jest.fn(),
        },
      });

      let errorNotThrown = true;
      try {
        await http.getOctetStream(
          123,
          { url: 'some/nonexistent/path' },
          'path/to/local/file'
        );
      } catch (e) {
        const error = e as AxiosError;
        errorNotThrown = false;

        expect(error.status).toBe(404);
        expect(fs.createWriteStream).not.toBeCalled();
      }
      if (errorNotThrown) {
        throw new Error('Expected http.getOctetStream to throw an error');
      }
    });
  });

  describe('http.get()', () => {
    it('adds authorization header when using OAuth2 with valid access token', async () => {
      const accessToken = 'let-me-in';
      const account = {
        accountId: 123,
        env: ENVIRONMENTS.PROD,
        authType: 'oauth2' as AuthType,
        auth: {
          clientId: 'd996372f-2b53-30d3-9c3b-4fdde4bce3a2',
          clientSecret: 'f90a6248-fbc0-3b03-b0db-ec58c95e791',
          scopes: ['content'],
          tokenInfo: {
            expiresAt: moment().add(2, 'hours').toISOString(),
            refreshToken: '84d22710-4cb7-5581-ba05-35f9945e5e8e',
            accessToken,
          },
        },
      };
      getAndLoadConfigIfNeeded.mockReturnValue({
        accounts: [account],
      });
      getAccountConfig.mockReturnValue(account);

      await http.get(123, { url: 'some/endpoint/path' });

      expect(mockedAxios).toHaveBeenCalledWith({
        baseURL: `https://api.hubapi.com`,
        url: 'some/endpoint/path',
        headers: {
          'User-Agent': `HubSpot Local Dev Lib/${version}`,
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15000,
        params: {
          portalId: 123,
        },
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
    it('adds authorization header when using a user token', async () => {
      const accessToken = 'let-me-in';
      const account = {
        accountId: 123,
        env: ENVIRONMENTS.PROD,
        authType: 'personalaccesskey' as AuthType,
        personalAccessKey: 'some-secret',
        auth: {
          tokenInfo: {
            expiresAt: moment().add(2, 'hours').toISOString(),
            accessToken,
          },
        },
      };
      getAndLoadConfigIfNeeded.mockReturnValue({
        accounts: [account],
      });
      getAccountConfig.mockReturnValue(account);

      await http.get(123, { url: 'some/endpoint/path' });

      expect(mockedAxios).toHaveBeenCalledWith({
        baseURL: `https://api.hubapi.com`,
        url: 'some/endpoint/path',
        headers: {
          'User-Agent': `HubSpot Local Dev Lib/${version}`,
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15000,
        params: {
          portalId: 123,
        },
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

    it('supports setting a custom timeout', async () => {
      getAndLoadConfigIfNeeded.mockReturnValue({
        httpTimeout: 1000,
        accounts: [
          {
            accountId: 123,
            apiKey: 'abc',
            env: ENVIRONMENTS.PROD,
          },
        ],
      });
      getAccountConfig.mockReturnValue({
        accountId: 123,
        apiKey: 'abc',
        env: ENVIRONMENTS.PROD,
      });

      await http.get(123, { url: 'some/endpoint/path' });

      expect(mockedAxios).toHaveBeenCalledWith({
        baseURL: `https://api.hubapi.com`,
        url: 'some/endpoint/path',
        headers: {
          'User-Agent': `HubSpot Local Dev Lib/${version}`,
        },
        timeout: 1000,
        params: {
          portalId: 123,
          hapikey: 'abc',
        },
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
