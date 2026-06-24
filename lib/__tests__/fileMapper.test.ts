import path from 'path';
import fs from 'fs-extra';
import {
  isPathToFile,
  isPathToModule,
  isPathToRoot,
  recurseFolder,
  fetchFolderFromApi,
  getTypeDataFromPath,
  getFileMapperQueryValues,
  downloadFileOrFolder,
} from '../fileMapper.js';
import {
  download as __download,
  fetchFileStream as __fetchFileStream,
  getDirectoryMetaByPath as __getDirectoryMetaByPath,
} from '../../api/fileMapper.js';
import folderWithoutSources from './fixtures/fileMapper/folderWithoutSources.json' with { type: 'json' };
import { mockAxiosResponse } from './__utils__/mockAxiosResponse.js';
import { vi, type MockedFunction } from 'vitest';

vi.mock('../../api/fileMapper');
const utimesSpy = vi.spyOn(fs, 'utimes');
const ensureDirSpy = vi.spyOn(fs, 'ensureDir');
const pathExistsSpy = vi.spyOn(fs, 'pathExists');

const download = __download as MockedFunction<typeof __download>;
const fetchFileStream = __fetchFileStream as MockedFunction<
  typeof __fetchFileStream
>;
const getDirectoryMetaByPath = __getDirectoryMetaByPath as MockedFunction<
  typeof __getDirectoryMetaByPath
>;

const rootPaths = ['', '/', '\\'];
const filePaths = ['a/b/c.js', '/a/b/c.js', 'x.html', '/x.html'];
const modulePaths = ['a/b/c.module', '/a/b/c.module', 'x.module', '/x.module'];
const folderPaths = ['a/b/c', '/a/b/c', 'a/b/c/', '/a/b/c/', 'x'];
const invalidPaths = [null, undefined, '.', './'];

function testPathDeterminationFunction(
  name: string,
  pathType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: any,
  truthy: Array<string>,
  falsey: Array<string>
) {
  describe(name, () => {
    it('should be a function', () => {
      expect(typeof fn).toBe('function');
    });
    it('should return false for invalid paths', () => {
      invalidPaths.forEach(filepath => {
        expect(fn(filepath)).toBe(false);
      });
    });
    it(`should return true for a ${pathType} path, false otherwise`, () => {
      truthy.forEach(filepath => {
        expect(fn(filepath)).toBe(true);
      });
      falsey.forEach(filepath => {
        expect(fn(filepath)).toBe(false);
      });
    });
    it('should handle extra whitespace', () => {
      const TAB = '\t';
      const addWhitespace = (x: string) => ` ${TAB}${x} ${TAB} `;
      truthy.map(addWhitespace).forEach(filepath => {
        expect(fn(filepath)).toBe(true);
      });
      falsey.map(addWhitespace).forEach(filepath => {
        expect(fn(filepath)).toBe(false);
      });
    });
  });
}

describe('lib/fileMapper', () => {
  testPathDeterminationFunction(
    'isPathToFile',
    'file',
    isPathToFile,
    [...filePaths],
    [...folderPaths, ...modulePaths, ...rootPaths]
  );
  testPathDeterminationFunction(
    'isPathToModule',
    'module',
    isPathToModule,
    [...modulePaths],
    [...filePaths, ...folderPaths, ...rootPaths]
  );
  testPathDeterminationFunction(
    'isPathToRoot',
    'root',
    isPathToRoot,
    [...rootPaths],
    [...filePaths, ...folderPaths, ...modulePaths]
  );

  describe('recurseFolder()', () => {
    const totalNodesInTree = 11;
    const rootNodePath = '/cms-theme-boilerplate/templates';

    const testRelativePaths = (rootNodeName: string, passRootNode: boolean) => {
      recurseFolder(
        folderWithoutSources,
        (node, filepath, depth) => {
          const isRootFolderNode = node.folder && depth === 0;
          if (isRootFolderNode) {
            expect(filepath).toBe(rootNodeName);
            return false;
          } else {
            const relativePath = node.path.slice(rootNodePath.length);
            expect(filepath).toBe(path.join(rootNodeName, relativePath));
            return true;
          }
        },
        passRootNode ? rootNodeName : ''
      );
    };

    it('should be a function', () => {
      expect(typeof recurseFolder).toBe('function');
    });
    it('should recurse over each node in the tree', () => {
      let count = 0;
      recurseFolder(folderWithoutSources, node => {
        expect(node === Object(node)).toBe(true);
        ++count;
        return true;
      });
      expect(count).toBe(totalNodesInTree);
    });
    it('should pass the current folder depth to the callback', () => {
      const isUInt = (x?: number) => typeof x === 'number' && x === x >>> 0;
      const depthCounts: { [k: number]: number } = {
        0: 0,
        1: 0,
        2: 0,
      };
      recurseFolder(folderWithoutSources, (node, filepath, depth) => {
        expect(isUInt(depth)).toBe(true);
        if (typeof depth === 'number') {
          depthCounts[depth] += 1;
        }
        return true;
      });
      expect(depthCounts[0]).toBe(1);
      expect(depthCounts[1]).toBe(7);
      expect(depthCounts[2]).toBe(3);
    });
    it('should pass the relative filepath to the callback', () => {
      testRelativePaths('templates', false);
    });
    it('should pass the relative filepath with a specified root to the callback', () => {
      testRelativePaths('foo', true);
    });
    it('should exit recursion when `false` is returned by the callback', () => {
      const exitAt = 5;
      let count = 0;
      recurseFolder(folderWithoutSources, () => {
        ++count;
        if (count === exitAt) return false;
        return true;
      });
      expect(count).toBe(exitAt);
    });
  });

  describe('getTypeDataFromPath()', () => {
    it('should return file flags per the request input', () => {
      filePaths.forEach(async p => {
        const { isFile, isModule, isFolder, isRoot } = getTypeDataFromPath(p);
        expect(isFile).toBe(true);
        expect(isModule).toBe(false);
        expect(isFolder).toBe(false);
        expect(isRoot).toBe(false);
      });
    });
    it('should return folder flags per the request input', () => {
      folderPaths.forEach(p => {
        const { isFile, isModule, isFolder, isRoot } = getTypeDataFromPath(p);
        expect(isFile).toBe(false);
        expect(isModule).toBe(false);
        expect(isFolder).toBe(true);
        expect(isRoot).toBe(false);
      });
    });
    it('should return root folder flags per the request input', () => {
      rootPaths.forEach(p => {
        const { isFile, isModule, isFolder, isRoot } = getTypeDataFromPath(p);
        expect(isFile).toBe(false);
        expect(isModule).toBe(false);
        expect(isFolder).toBe(true);
        expect(isRoot).toBe(true);
      });
    });
    it('should return module folder flags per the request input', () => {
      modulePaths.forEach(p => {
        const { isFile, isModule, isFolder, isRoot } = getTypeDataFromPath(p);
        expect(isFile).toBe(false);
        expect(isModule).toBe(true);
        expect(isFolder).toBe(true);
        expect(isRoot).toBe(false);
      });
    });
  });

  describe('fetchFolderFromApi()', () => {
    const accountId = 67890;

    it('folder: should execute the download client per the request input', async () => {
      const src = '1234';
      download.mockResolvedValueOnce(mockAxiosResponse());

      await fetchFolderFromApi(accountId, src);
      const queryParams = {
        params: {
          buffer: false,
          environmentId: 1,
          version: undefined,
        },
      };
      expect(download).toHaveBeenCalledWith(accountId, src, queryParams);
    });
    it('module: should execute the download client per the request input', async () => {
      const src = 'cms-theme-boilerplate/modules/Card section.module';
      download.mockResolvedValueOnce(mockAxiosResponse());

      await fetchFolderFromApi(accountId, src);
      const queryParams = {
        params: {
          buffer: false,
          environmentId: 1,
          version: undefined,
        },
      };
      expect(download).toHaveBeenCalledWith(accountId, src, queryParams);
    });
    it('fetch all: should execute the download client per the request input', async () => {
      const src = '/';
      download.mockResolvedValueOnce(mockAxiosResponse());

      await fetchFolderFromApi(accountId, src);
      const queryParams = {
        params: {
          buffer: false,
          environmentId: 1,
          version: undefined,
        },
      };
      expect(download).toHaveBeenCalledWith(accountId, '@root', queryParams);
    });
  });

  describe('downloadFileOrFolder()', () => {
    const accountId = 67890;

    beforeEach(() => {
      utimesSpy.mockImplementationOnce(() => null);
      ensureDirSpy.mockImplementationOnce(() => true);

      fetchFileStream.mockResolvedValueOnce({
        name: '',
        createdAt: 1,
        updatedAt: 1,
        source: null,
        path: '',
        folder: false,
        children: [],
      });
    });

    it('should execute downloadFile', async () => {
      await downloadFileOrFolder(accountId, '/a/b/c.js', './');
      expect(fetchFileStream).toHaveBeenCalled();
      expect(utimesSpy).toHaveBeenCalled();
    });
    it('should execute downloadFolder', async () => {
      getDirectoryMetaByPath.mockResolvedValue(
        mockAxiosResponse({
          name: 'c',
          path: '/a/b/c',
          folder: true,
          children: [],
        })
      );
      await downloadFileOrFolder(accountId, '/a/b/c', './');
      expect(ensureDirSpy).toHaveBeenCalled();
    });
  });

  describe('getFileMapperQueryValues()', () => {
    it('should include timeout when provided', () => {
      const result = getFileMapperQueryValues(undefined, { timeout: 60_000 });
      expect(result.timeout).toBe(60_000);
    });

    it('should omit timeout when not provided', () => {
      const result = getFileMapperQueryValues(undefined, {});
      expect('timeout' in result).toBe(false);
    });
  });

  describe('downloadFolder via downloadFileOrFolder()', () => {
    const testAccountId = 67890;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('downloads files discovered via /meta/', async () => {
      getDirectoryMetaByPath.mockResolvedValue(
        mockAxiosResponse({
          name: 'templates',
          path: '/templates',
          folder: true,
          children: ['page.html'],
        })
      );
      pathExistsSpy.mockImplementation(async () => false);
      fetchFileStream.mockResolvedValue({
        name: 'page.html',
        createdAt: 1,
        updatedAt: 1,
        source: null,
        path: '/templates/page.html',
        folder: false,
        children: [],
      });
      utimesSpy.mockImplementation(async () => undefined);

      await downloadFileOrFolder(testAccountId, '/templates', './');

      expect(fetchFileStream).toHaveBeenCalledWith(
        testAccountId,
        '/templates/page.html',
        expect.stringContaining('page.html'),
        expect.any(Object)
      );
    });

    it('tracks failed file downloads without throwing from the queue', async () => {
      getDirectoryMetaByPath.mockResolvedValue(
        mockAxiosResponse({
          name: 'templates',
          path: '/templates',
          folder: true,
          children: ['bad.html', 'good.html'],
        })
      );
      pathExistsSpy.mockImplementation(async () => false);
      fetchFileStream.mockImplementation(async (_accountId, filePath) => {
        if (filePath === '/templates/bad.html') throw new Error('network error');
        return {
          name: 'good.html',
          createdAt: 1,
          updatedAt: 1,
          source: null,
          path: filePath,
          folder: false,
          children: [],
        };
      });
      utimesSpy.mockImplementation(async () => undefined);

      await expect(
        downloadFileOrFolder(testAccountId, '/templates', './')
      ).rejects.toThrow('Not all files in folder');

      expect(fetchFileStream).toHaveBeenCalledWith(
        testAccountId,
        '/templates/good.html',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('wraps /meta/ failures as failedToFetchFolder', async () => {
      getDirectoryMetaByPath.mockRejectedValue(new Error('server error'));

      await expect(
        downloadFileOrFolder(testAccountId, '/templates', './')
      ).rejects.toThrow('Failed fetch of folder');
    });

    it('injects @hubspot into children for root paths', async () => {
      getDirectoryMetaByPath
        .mockResolvedValueOnce(
          mockAxiosResponse({
            name: '',
            path: '/',
            folder: true,
            children: ['templates'],
          })
        )
        .mockResolvedValueOnce(
          mockAxiosResponse({
            name: '@hubspot',
            path: '/@hubspot',
            folder: true,
            children: [],
          })
        )
        .mockResolvedValueOnce(
          mockAxiosResponse({
            name: 'templates',
            path: '/templates',
            folder: true,
            children: [],
          })
        );

      await downloadFileOrFolder(testAccountId, '/', './');

      const calls = getDirectoryMetaByPath.mock.calls.map(c => c[1]);
      expect(calls).toContain('@hubspot');
    });

    it('strips trailing slash from src before building child paths', async () => {
      getDirectoryMetaByPath
        .mockResolvedValueOnce(
          mockAxiosResponse({
            name: 'ThemeDirectory',
            path: '/ThemeDirectory',
            folder: true,
            children: ['modules'],
          })
        )
        .mockResolvedValueOnce(
          mockAxiosResponse({
            name: 'modules',
            path: '/ThemeDirectory/modules',
            folder: true,
            children: [],
          })
        );
      ensureDirSpy.mockImplementation(async () => undefined);

      await downloadFileOrFolder(testAccountId, 'ThemeDirectory/', './');

      const metaCalls = getDirectoryMetaByPath.mock.calls.map(
        c => c[1] as string
      );
      expect(metaCalls.some(p => p.includes('//'))).toBe(false);
      expect(metaCalls).toContain('ThemeDirectory/modules');
    });
  });
});
