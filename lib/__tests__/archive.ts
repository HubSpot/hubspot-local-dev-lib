import os from 'os';

jest.mock('fs-extra');

jest.mock('extract-zip', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(''),
}));

jest.mock('os');

jest.mock('../logger');

import { extractZipArchive } from '../archive';
import { logger } from '../logger';
import fs from 'fs-extra';
import extract from 'extract-zip';

const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
const makeDirMock = fs.mkdtemp as jest.MockedFunction<typeof fs.mkdtemp>;
const readDirMock = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
const osTmpDirMock = os.tmpdir as jest.MockedFunction<typeof os.tmpdir>;

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

    it('should successly extract a zip archive', async () => {
      const result = await extractZipArchive(zip, name, dest);

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

      expect(logger.log).toHaveBeenCalledWith('Extracting project source...');

      expect(fs.readdir).toHaveBeenCalledTimes(1);
      expect(fs.readdir).toHaveBeenCalledWith(tmpExtractPath);
      // TODO, create a test that branches off of this where readdir returns null

      expect(fs.copy).toHaveBeenCalledTimes(1);
      expect(fs.copy).toHaveBeenCalledWith(
        `${tmpExtractPath}/${rootDir}`,
        dest
      );

      expect(fs.remove).toHaveBeenCalledTimes(1);
      expect(fs.remove).toHaveBeenCalledWith(tmpDirName);

      expect(result).toBe(true);
    });

    it('should throw a file system error if the write fails', async () => {
      writeFileMock.mockImplementationOnce(() => {
        throw new Error('failed to do the thing');
      });

      await expect(extractZipArchive(zip, name, '')).rejects.toThrow(
        `An error occurred while writing to "${tmpZipPath}"`
      );
      expect(fs.mkdtemp).toHaveBeenCalledWith(tmpDirName);
      expect(fs.ensureFile).toHaveBeenCalledWith(tmpZipPath);
      expect(fs.writeFile).toHaveBeenCalledWith(tmpZipPath, zip, {
        mode: 0o777,
      });
    });

    it('should throw a generic error if the write fails', async () => {
      makeDirMock.mockImplementationOnce(() => {
        throw new Error('failed to do the thing');
      });

      await expect(extractZipArchive(zip, name, '')).rejects.toThrow(
        'An error occured writing temp project source.'
      );
      expect(fs.mkdtemp).toHaveBeenCalledWith(`/tmp/hubspot-temp-${name}-`);
      expect(fs.ensureFile).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });
});
