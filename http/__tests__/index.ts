import axios from 'axios';
import fs from 'fs-extra';
//import moment from 'moment';
import {
  getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded,
  getAccountConfig as __getAccountConfig,
} from '../../config';
import { ENVIRONMENTS } from '../../constants/environments';
import http from '../';
//import { version } from '../../package.json';
import { StatusCodeError } from '../../types/Error';

jest.mock('fs-extra');
jest.mock('axios');
jest.mock('../../config');
jest.mock('../../lib/logging/logger');

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

describe('http', () => {
  afterEach(() => {
    jest.clearAllMocks();
    getAndLoadConfigIfNeeded.mockReset();
    getAccountConfig.mockReset();
  });

  describe('getOctetStream', () => {
    beforeEach(() => {
      getAndLoadConfigIfNeeded.mockReturnValue({
        httpTimeout: 1000,
        portals: [
          {
            portalId: 123,
            apiKey: 'abc',
            env: ENVIRONMENTS.QA,
          },
        ],
      });
      getAccountConfig.mockReturnValue({
        portalId: 123,
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
      expect(fs.createWriteStream).toBeCalledWith('path/to/local/file', {
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
        const error = e as StatusCodeError;
        errorNotThrown = false;

        expect(error.status).toBe(404);
        expect(fs.createWriteStream).not.toBeCalled();
      }
      if (errorNotThrown) {
        throw new Error('Expected http.getOctetStream to throw an error');
      }
    });
  });
  // describe('get()', () => {
  //   it('adds authorization header when using OAuth2 with valid access token', async () => {
  //     const accessToken = 'let-me-in';
  //     const account = {
  //       portalId: 123,
  //       authType: 'oauth2',
  //       clientId: 'd996372f-2b53-30d3-9c3b-4fdde4bce3a2',
  //       clientSecret: 'f90a6248-fbc0-3b03-b0db-ec58c95e791',
  //       scopes: ['content'],
  //       tokenInfo: {
  //         expiresAt: moment().add(2, 'hours').toISOString(),
  //         refreshToken: '84d22710-4cb7-5581-ba05-35f9945e5e8e',
  //         accessToken,
  //       },
  //     };
  //     getAndLoadConfigIfNeeded.mockReturnValue({
  //       accounts: [account],
  //     });
  //     getAccountConfig.mockReturnValue(account);
  //     await http.get(123, {
  //       uri: 'some/endpoint/path',
  //     });

  //     expect(requestPN.get).toBeCalledWith({
  //       baseUrl: `https://api.hubapi.com`,
  //       uri: 'some/endpoint/path',
  //       headers: {
  //         'User-Agent': `HubSpot CLI/${version}`,
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //       json: true,
  //       simple: true,
  //       timeout: 15000,
  //       qs: {
  //         portalId: 123,
  //       },
  //     });
  //   });
  //   it('adds authorization header when using a user token', async () => {
  //     const accessToken = 'let-me-in';
  //     const account = {
  //       portalId: 123,
  //       authType: 'personalaccesskey',
  //       personalAccessKey: 'some-secret',
  //       auth: {
  //         tokenInfo: {
  //           expiresAt: moment().add(2, 'hours').toISOString(),
  //           accessToken,
  //         },
  //       },
  //     };
  //     getAndLoadConfigIfNeeded.mockReturnValue({
  //       accounts: [account],
  //     });
  //     getAccountConfig.mockReturnValue(account);
  //     await http.get(123, {
  //       uri: 'some/endpoint/path',
  //     });

  //     expect(requestPN.get).toBeCalledWith({
  //       baseUrl: `https://api.hubapi.com`,
  //       uri: 'some/endpoint/path',
  //       headers: {
  //         'User-Agent': `HubSpot CLI/${version}`,
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //       json: true,
  //       simple: true,
  //       timeout: 15000,
  //       qs: {
  //         portalId: 123,
  //       },
  //     });
  //   });

  //   it('supports setting a custom timeout', async () => {
  //     getAndLoadConfigIfNeeded.mockReturnValue({
  //       httpTimeout: 1000,
  //       accounts: [
  //         {
  //           portalId: 123,
  //           apiKey: 'abc',
  //         },
  //       ],
  //     });
  //     getAccountConfig.mockReturnValue({
  //       portalId: 123,
  //       apiKey: 'abc',
  //     });

  //     await http.get(123, {
  //       uri: 'some/endpoint/path',
  //     });

  //     expect(requestPN.get).toBeCalledWith({
  //       baseUrl: `https://api.hubapi.com`,
  //       uri: 'some/endpoint/path',
  //       headers: {
  //         'User-Agent': `HubSpot CLI/${version}`,
  //       },
  //       json: true,
  //       simple: true,
  //       timeout: 1000,
  //       qs: {
  //         portalId: 123,
  //         hapikey: 'abc',
  //       },
  //     });
  //   });
  //});
});
