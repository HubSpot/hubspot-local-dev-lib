import path from 'path';
import fs from 'fs-extra';
import {
  isPathToFile,
  isPathToModule,
  isPathToRoot,
  recurseFolder,
  fetchFolderFromApi,
  getTypeDataFromPath,
  downloadFileOrFolder,
} from '../fileMapper';
import {
  download as __download,
  fetchFileStream as __fetchFileStream,
} from '../../api/fileMapper';
import folderWithoutSources from './fixtures/fileMapper/folderWithoutSources.json';
import { mockAxiosResponse } from './__utils__/mockAxiosResponse';

jest.mock('../../api/fileMapper');
const utimesSpy = jest.spyOn(fs, 'utimes');
const ensureDirSpy = jest.spyOn(fs, 'ensureDir');
const pathExistsSpy = jest.spyOn(fs, 'pathExists');

const download = __download as jest.MockedFunction<typeof __download>;
const fetchFileStream = __fetchFileStream as jest.MockedFunction<
  typeof __fetchFileStream
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
      pathExistsSpy.mockImplementationOnce(() => false);
      download.mockResolvedValueOnce(
        mockAxiosResponse({
          name: '',
          createdAt: 1,
          updatedAt: 1,
          source: null,
          path: '',
          folder: true,
          children: [],
        })
      );
      await downloadFileOrFolder(accountId, '/a/b/c', './');
      expect(ensureDirSpy).toHaveBeenCalled();
    });
  });
});
