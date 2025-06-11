import os from 'os';

jest.mock('fs-extra');
jest.mock('extract-zip');
jest.mock('os');
jest.mock('../logger');
jest.mock('../fs');

import { extractZipArchive } from '../archive';
import { logger } from '../logger';
import fs from 'fs-extra';
import extract from 'extract-zip';
import { walk } from '../fs';

const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
const makeDirMock = fs.mkdtemp as jest.MockedFunction<typeof fs.mkdtemp>;
const readDirMock = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
const osTmpDirMock = os.tmpdir as jest.MockedFunction<typeof os.tmpdir>;
const extractMock = extract as jest.MockedFunction<typeof extract>;
const fsCopyMock = fs.copy as jest.MockedFunction<typeof fs.copy>;
const fsRemoveMock = fs.remove as jest.MockedFunction<typeof fs.remove>;
const fsExistsSyncMock = fs.existsSync as jest.MockedFunction<
  typeof fs.existsSync
>;
const walkMock = walk as jest.MockedFunction<typeof walk>;

describe('lib/archive', () => {
  const rootDir = 'rootdir';
  const name = 'my-archive-name';
  const tmpDir = '/tmp';
  const tmpDirName = `${tmpDir}/hubspot-temp-${name}-`;
  const tmpExtractPath = `${tmpDirName}/extracted`;
  const tmpZipPath = `${tmpDirName}/hubspot-temp.zip`;
  const zip = Buffer.from('This is my zip file');
  const dest = 'where/to/save/';

  beforeEach(() => {
    makeDirMock.mockImplementation(value => Promise.resolve(value));
    readDirMock.mockImplementation(() => [rootDir]);
    osTmpDirMock.mockImplementation(() => tmpDir);
  });

  describe('extractZipArchive', () => {
    it('should return false when zip is undefined', async () => {
      const result = await extractZipArchive(undefined!, '', '');
      expect(result).toBe(false);
    });

    it('should successfully extract a zip archive', async () => {
      const result = await extractZipArchive(zip, name, dest);

      // Verify the behavior of extractZip
      expect(fs.mkdtemp).toHaveBeenCalledTimes(1);
      expect(fs.mkdtemp).toHaveBeenCalledWith(tmpDirName);
      expect(fs.ensureFile).toHaveBeenCalledTimes(1);
      expect(fs.ensureFile).toHaveBeenCalledWith(tmpZipPath);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(tmpZipPath, zip, {
        mode: 0o777,
      });
      expect(extract).toHaveBeenCalledTimes(1);
      expect(extract).toHaveBeenCalledWith(tmpZipPath, {
        dir: tmpExtractPath,
      });
      expect(logger.debug).toHaveBeenCalledWith(
        'Completed project source extraction.'
      );

      // Verify the behavior of copySourceToDest
      expect(logger.log).toHaveBeenCalledWith('Extracting project source...');
      expect(fs.readdir).toHaveBeenCalledTimes(1);
      expect(fs.readdir).toHaveBeenCalledWith(tmpExtractPath);
      expect(fs.copy).toHaveBeenCalledTimes(1);
      expect(fs.copy).toHaveBeenCalledWith(
        `${tmpExtractPath}/${rootDir}`,
        dest
      );

      // Verify behavior of cleanupTempDir
      expect(fs.remove).toHaveBeenCalledTimes(1);
      expect(fs.remove).toHaveBeenCalledWith(tmpDirName);

      // Verify expected return value
      expect(result).toBe(true);
    });

    it('should ensure the dest directory if the root path is undefined', async () => {
      readDirMock.mockImplementationOnce(() => []);
      const result = await extractZipArchive(zip, name, dest);
      expect(fs.ensureDir).toHaveBeenCalledWith(dest);
      expect(result).toBe(true);
    });

    it('should throw a file system error if the write fails', async () => {
      writeFileMock.mockImplementationOnce(() => {
        throw new Error('failed to do the thing');
      });

      await expect(extractZipArchive(zip, name, '')).rejects.toThrow(
        `An error occurred while writing to "${tmpZipPath}"`
      );
    });

    it('should throw a generic error if the write fails', async () => {
      makeDirMock.mockImplementationOnce(() => {
        throw new Error('failed to do the thing');
      });

      await expect(extractZipArchive(zip, name, '')).rejects.toThrow(
        'An error occurred writing temp project source.'
      );
    });

    it('should throw a generic error when extract fails', async () => {
      extractMock.mockImplementationOnce(() => {
        throw new Error('failed to do the thing');
      });

      await expect(extractZipArchive(zip, name, '')).rejects.toThrow(
        'An error occurred extracting project source.'
      );
    });

    it('should throw a file system error if the copy fails', async () => {
      fsCopyMock.mockImplementationOnce(() => {
        throw new Error('failed to do the thing');
      });

      await expect(extractZipArchive(zip, name, '')).rejects.toThrow(
        `An error occurred while writing to a file or folder.`
      );
    });

    it('should log a debug message when cleanup fails', async () => {
      fsRemoveMock.mockImplementationOnce(() => {
        throw new Error('failed to do the thing');
      });

      await extractZipArchive(zip, name, '');
      expect(logger.debug).toHaveBeenCalledWith(
        `Failed to clean up temp dir: ${tmpDirName}`
      );
    });

    it('should copy multiple source directories when sourceDir is an array', async () => {
      const sourceDir1 = 'sourceDir1';
      const sourceDir2 = 'sourceDir2';

      const sourceDir = [sourceDir1, sourceDir2];

      const result = await extractZipArchive(zip, name, dest, {
        sourceDir,
      });

      expect(fs.copy).toHaveBeenCalledTimes(sourceDir.length);
      expect(fs.copy).toHaveBeenCalledWith(
        `${tmpExtractPath}/${rootDir}/${sourceDir1}`,
        dest
      );
      expect(fs.copy).toHaveBeenCalledWith(
        `${tmpExtractPath}/${rootDir}/${sourceDir2}`,
        dest
      );
      expect(result).toBe(true);
    });

    it('should call handleCollision when destination exists and collisions are detected', async () => {
      const sourceDir = 'sourceDir';
      const handleCollisionMock = jest.fn();

      fsExistsSyncMock.mockReturnValue(true);
      walkMock
        .mockResolvedValueOnce([
          `${dest}/file1.txt`,
          `${dest}/subfolder/file2.js`,
          `${dest}/README.md`,
        ])
        .mockResolvedValueOnce([
          `${tmpExtractPath}/${rootDir}/${sourceDir}/file1.txt`,
          `${tmpExtractPath}/${rootDir}/${sourceDir}/different.txt`,
          `${tmpExtractPath}/${rootDir}/${sourceDir}/README.md`,
        ]);

      await extractZipArchive(zip, name, dest, {
        sourceDir,
        handleCollision: handleCollisionMock,
      });

      expect(handleCollisionMock).toHaveBeenCalledWith({
        dest,
        src: `${tmpExtractPath}/${rootDir}/${sourceDir}`,
        collisions: ['file1.txt', 'README.md'],
      });
      expect(fs.copy).not.toHaveBeenCalled();
    });

    it('should call handleCollision for each source directory when multiple dirs have collisions', async () => {
      const sourceDir = ['sourceDir1', 'sourceDir2'];
      const handleCollisionMock = jest.fn();

      fsExistsSyncMock.mockReturnValue(true);
      walkMock
        .mockResolvedValueOnce([`${dest}/shared.txt`])
        .mockResolvedValueOnce([
          `${tmpExtractPath}/${rootDir}/sourceDir1/shared.txt`,
        ])
        .mockResolvedValueOnce([`${dest}/shared.txt`])
        .mockResolvedValueOnce([
          `${tmpExtractPath}/${rootDir}/sourceDir2/other.txt`,
        ]);

      await extractZipArchive(zip, name, dest, {
        sourceDir,
        handleCollision: handleCollisionMock,
      });

      expect(handleCollisionMock).toHaveBeenCalledTimes(1);
      expect(handleCollisionMock).toHaveBeenCalledWith({
        dest,
        src: `${tmpExtractPath}/${rootDir}/sourceDir1`,
        collisions: ['shared.txt'],
      });
    });

    it('should not call handleCollision when destination does not exist', async () => {
      const sourceDir = 'sourceDir';
      const handleCollisionMock = jest.fn();

      fsExistsSyncMock.mockReturnValue(false);

      await extractZipArchive(zip, name, dest, {
        sourceDir,
        handleCollision: handleCollisionMock,
      });

      expect(handleCollisionMock).not.toHaveBeenCalled();
      expect(fs.copy).toHaveBeenCalledWith(
        `${tmpExtractPath}/${rootDir}/${sourceDir}`,
        dest
      );
    });

    it('should not call handleCollision when no collision handler is provided', async () => {
      const sourceDir = 'sourceDir';

      fsExistsSyncMock.mockReturnValue(true);

      await extractZipArchive(zip, name, dest, {
        sourceDir,
      });

      expect(walkMock).not.toHaveBeenCalled();
      expect(fs.copy).toHaveBeenCalledWith(
        `${tmpExtractPath}/${rootDir}/${sourceDir}`,
        dest
      );
    });

    it('should not call handleCollisions where there are no collisions', async () => {
      const sourceDir = 'sourceDir';
      const handleCollisionMock = jest.fn();

      fsExistsSyncMock.mockReturnValue(true);
      walkMock
        .mockResolvedValueOnce([`${dest}/existing.txt`])
        .mockResolvedValueOnce([
          `${tmpExtractPath}/${rootDir}/${sourceDir}/new.txt`,
        ]);

      await extractZipArchive(zip, name, dest, {
        sourceDir,
        handleCollision: handleCollisionMock,
      });

      expect(handleCollisionMock).not.toHaveBeenCalled();
    });

    it('should normalize paths when detecting collisions', async () => {
      const sourceDir = 'sourceDir';
      const handleCollisionMock = jest.fn();

      fsExistsSyncMock.mockReturnValue(true);
      walkMock
        .mockResolvedValueOnce([`${dest}/path/to/file.txt`])
        .mockResolvedValueOnce([
          `${tmpExtractPath}/${rootDir}/${sourceDir}/path/to/file.txt`,
        ]);

      await extractZipArchive(zip, name, dest, {
        sourceDir,
        handleCollision: handleCollisionMock,
      });

      expect(handleCollisionMock).toHaveBeenCalledWith({
        dest,
        src: `${tmpExtractPath}/${rootDir}/${sourceDir}`,
        collisions: ['path/to/file.txt'],
      });
    });
  });
});
