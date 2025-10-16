import fs, { PathLike } from 'fs-extra';
import findup from 'findup-sync';
import { getCwd } from '../path.js';
import { fetchFileFromRepository as __fetchFileFromRepository } from '../github.js';
import { vi, type MockedFunction } from 'vitest';
import {
  createFunction,
  isObjectOrFunction,
  createEndpoint,
  createConfig,
} from '../cms/functions.js';

vi.mock('fs-extra');
vi.mock('findup-sync');
vi.mock('../path');
vi.mock('../github');

const mockedGetCwd = getCwd as MockedFunction<typeof getCwd>;
const mockedFindup = findup as MockedFunction<typeof findup>;
const mockedFsExistsSync = fs.existsSync as MockedFunction<
  typeof fs.existsSync
>;
const mockedFsReadFileSync = fs.readFileSync as MockedFunction<
  typeof fs.readFileSync
>;

const fetchFileFromRepository = __fetchFileFromRepository as MockedFunction<
  typeof __fetchFileFromRepository
>;

describe('lib/cms/functions', () => {
  describe('createFunction', () => {
    const mockFunctionInfo = {
      functionsFolder: 'testFolder',
      filename: 'testFunction',
      endpointPath: '/api/test',
      endpointMethod: 'GET',
    };
    const mockDest = '/mock/dest';

    beforeEach(() => {
      mockedGetCwd.mockReturnValue('/mock/cwd');
      mockedFindup.mockReturnValue(null);

      // Set up fs.existsSync to return different values for different paths
      mockedFsExistsSync.mockImplementation((path: PathLike) => {
        if (path === '/mock/dest/testFolder.functions/testFunction.js') {
          return false;
        }
        if (path === '/mock/dest/testFolder.functions/serverless.json') {
          return true;
        }
        if (path === '/mock/dest/testFolder.functions') {
          return true;
        }
        return false;
      });

      // Mock fs.readFileSync to return a valid JSON for the config file
      mockedFsReadFileSync.mockReturnValue(
        JSON.stringify({
          endpoints: {},
        })
      );
    });

    it('should create a new function successfully', async () => {
      const functionSourceCode = 'function code';
      fetchFileFromRepository.mockResolvedValue(functionSourceCode);

      await createFunction(mockFunctionInfo, mockDest);

      expect(fs.mkdirp).not.toHaveBeenCalled();

      expect(fetchFileFromRepository).toHaveBeenCalledWith(
        'HubSpot/cms-sample-assets',
        'functions/sample-function.js',
        'main'
      );

      // Check that the config file was updated
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/dest/testFolder.functions/testFunction.js',
        functionSourceCode
      );

      // Check that the config file was updated
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/dest/testFolder.functions/serverless.json',
        expect.any(String)
      );
    });
  });

  describe('isObjectOrFunction', () => {
    it('should return true for objects', () => {
      expect(isObjectOrFunction({})).toBe(true);
    });

    it('should return true for functions', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(isObjectOrFunction(() => {})).toBe(true);
    });

    it('should return false for null', () => {
      // @ts-expect-error test case
      expect(isObjectOrFunction(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      // @ts-expect-error test case
      expect(isObjectOrFunction(5)).toBe(false);
      // @ts-expect-error test case
      expect(isObjectOrFunction('string')).toBe(false);
      // @ts-expect-error test case
      expect(isObjectOrFunction(true)).toBe(false);
    });
  });

  describe('createEndpoint', () => {
    it('should create an endpoint object', () => {
      const result = createEndpoint('POST', 'test.js');
      expect(result).toEqual({
        method: 'POST',
        file: 'test.js',
      });
    });

    it('should default to GET method if not provided', () => {
      const result = createEndpoint('', 'test.js');
      expect(result).toEqual({
        method: 'GET',
        file: 'test.js',
      });
    });
  });

  describe('createConfig', () => {
    it('should create a config object', () => {
      const result = createConfig({
        endpointPath: '/api/test',
        endpointMethod: 'POST',
        functionFile: 'test.js',
      });

      expect(result).toEqual({
        runtime: 'nodejs18.x',
        version: '1.0',
        environment: {},
        secrets: [],
        endpoints: {
          '/api/test': {
            method: 'POST',
            file: 'test.js',
          },
        },
      });
    });
  });
});
