jest.mock('fs-extra', () => ({
  mkdtemp: jest.fn().mockImplementation(value => {
    return Promise.resolve(value);
  }),
  ensureFile: jest.fn().mockResolvedValue(''),
  writeFile: jest.fn().mockResolvedValue(''),
  readdir: jest.fn().mockResolvedValue(['rootdir']),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  copy: jest.fn().mockResolvedValue(null),
}));

jest.mock('extract-zip', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(''),
}));

jest.mock('os', () => ({
  tmpdir: jest.fn().mockReturnValue('/tmp'),
}));

jest.mock('../logger');

import { extractZipArchive } from '../archive';
import { logger } from '../logger';
import fs from 'fs-extra';

describe('lib/archive', () => {
  describe('extractZipArchive', () => {
    it('should return false when zip is undefined', async () => {
      const result = await extractZipArchive(undefined!, '', '');
      expect(result).toBe(false);
    });

    it('should log an init message when hideLogs defaults to false', async () => {
      await extractZipArchive(Buffer.from(''), '', '');
      expect(logger.log).toHaveBeenCalledWith('Extracting project source...');
    });

    it('should write the zip file to disk', async () => {
      const name = 'my-archive-name';
      const tmpDirName = `/tmp/hubspot-temp-${name}-`;
      const tmpZipPath = `${tmpDirName}/hubspot-temp.zip`;
      const zip = Buffer.from('This is my zip file');

      await extractZipArchive(zip, name, '');
      expect(fs.mkdtemp).toHaveBeenCalledWith(tmpDirName);
      expect(fs.ensureFile).toHaveBeenCalledWith(tmpZipPath);
      expect(fs.writeFile).toHaveBeenCalledWith(tmpZipPath, zip, {
        mode: 0o777,
      });
    });
  });
});
