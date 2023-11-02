import axios from 'axios';
import fs from 'fs-extra';
import {
  getAndLoadConfigIfNeeded as __getAndLoadConfigIfNeeded,
  getAccountConfig as __getAccountConfig,
} from '../../config';
import { ENVIRONMENTS } from '../../constants/environments';
import http from '../';
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

  describe('getOctetStream()', () => {
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
  // NOTE: there are more tests to add, but I'm stopping here to keep the PR smaller
});
