import fs, { Stats } from 'fs';
import { flattenAndRemoveSymlinks, getFileInfoAsync } from '../fs';
import { STAT_TYPES } from '../../constants/files';

jest.mock('fs');

function buildLstatMock(opts: {
  isFile?: boolean;
  isDirectory?: boolean;
  isSymbolicLink?: boolean;
}) {
  return function (
    _: string,
    callback: (error: null, stats: Partial<Stats>) => void
  ) {
    const stats = {
      isSymbolicLink: () => !!opts.isSymbolicLink,
      isDirectory: () => !!opts.isDirectory,
      isFile: () => !!opts.isFile,
    };
    callback(null, stats);
  };
}

describe('lib/fs', () => {
  describe('getFileInfoAsync()', () => {
    it('returns filepath and type for files', async () => {
      (fs.lstat as unknown as jest.Mock).mockImplementation(
        buildLstatMock({ isFile: true })
      );
      const fileData = await getFileInfoAsync('modules', 'module.html');

      expect(fileData.filepath).toBe('modules/module.html');
      expect(fileData.type).toBe(STAT_TYPES.FILE);
    });

    it('returns filepath and type for directories', async () => {
      (fs.lstat as unknown as jest.Mock).mockImplementation(
        buildLstatMock({ isDirectory: true })
      );
      const fileData = await getFileInfoAsync('modules', 'module.html');

      expect(fileData.filepath).toBe('modules/module.html');
      expect(fileData.type).toBe(STAT_TYPES.DIRECTORY);
    });

    it('returns filepath and type for symbolic links', async () => {
      (fs.lstat as unknown as jest.Mock).mockImplementation(
        buildLstatMock({ isSymbolicLink: true })
      );
      const fileData = await getFileInfoAsync('modules', 'module.html');

      expect(fileData.filepath).toBe('modules/module.html');
      expect(fileData.type).toBe(STAT_TYPES.SYMBOLIC_LINK);
    });
  });

  describe('flattenAndRemoveSymlinks()', () => {
    it('flattens file data into an array', () => {
      const filesData = [
        { type: STAT_TYPES.FILE, filepath: 'folder/blog.html' },
        {
          type: STAT_TYPES.DIRECTORY,
          files: ['folder/image1.png', 'folder/image2.png'],
          filepath: 'folder/templates2',
        },
        {
          type: STAT_TYPES.SYMBOLIC_LINK,
          filepath: 'folder/module.html',
        },
        { filepath: 'folder/page.html' },
        { type: '', filepath: 'folder/email.html' },
      ];

      // @ts-expect-error testing invalid input
      const filesList = flattenAndRemoveSymlinks(filesData);
      expect(filesList.length).toBe(3);
      // Filters sym links and fileData without a type
      expect(filesList.includes('folder/module.html')).toBe(false);
      expect(filesList.includes('folder/page.html')).toBe(false);
      expect(filesList.includes('folder/email.html')).toBe(false);
    });
  });
});
