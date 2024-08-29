import os from 'os';
import {
  convertToUnixPath,
  splitLocalPath,
  splitHubSpotPath,
  getCwd,
  getExt,
  getAllowedExtensions,
  isAllowedExtension,
  sanitizeFileName,
  isValidPath,
  untildify,
} from '../path';
import { ALLOWED_EXTENSIONS } from '../../constants/extensions';

jest.mock('os', () => ({
  homedir: jest.fn(),
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  sep: '/',
  posix: {
    sep: '/',
  },
  win32: {
    sep: '\\',
  },
}));

describe('path utility functions', () => {
  describe('convertToUnixPath()', () => {
    test('converts Windows path to Unix path', () => {
      expect(convertToUnixPath('C:\\Users\\test\\file.txt')).toBe(
        '/Users/test/file.txt'
      );
    });

    test('normalizes Unix path', () => {
      expect(convertToUnixPath('/home//user/./file.txt')).toBe(
        '/home/user/file.txt'
      );
    });
  });

  describe('convertToLocalFileSystemPath()', () => {
    afterEach(() => {
      jest.resetModules();
    });

    test('converts to Unix path when on Unix-like system', async () => {
      jest.doMock('path', () => ({ ...jest.requireActual('path'), sep: '/' }));
      const { convertToLocalFileSystemPath } = await import('../path');
      expect(convertToLocalFileSystemPath('/home/user/file.txt')).toBe(
        '/home/user/file.txt'
      );
    });

    test('converts to Windows path when on Windows system', async () => {
      jest.doMock('path', () => ({ ...jest.requireActual('path'), sep: '\\' }));
      const { convertToLocalFileSystemPath } = await import('../path');
      expect(convertToLocalFileSystemPath('C:/Users/test/file.txt')).toBe(
        'C:\\Users\\test\\file.txt'
      );
    });
  });

  describe('splitLocalPath()', () => {
    test('splits Unix path correctly', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        splitLocalPath('/home/user/file.txt', {
          sep: '/',
          normalize: (p: string) => p,
        })
      ).toEqual(['/', 'home', 'user', 'file.txt']);
    });

    test('splits Windows path correctly', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        splitLocalPath('C:\\Users\\test\\file.txt', {
          sep: '\\',
          normalize: (p: string) => p,
        })
      ).toEqual(['C:', 'Users', 'test', 'file.txt']);
    });

    test('handles empty path', () => {
      expect(splitLocalPath('')).toEqual([]);
    });
  });

  describe('splitHubSpotPath()', () => {
    test('splits HubSpot path correctly', () => {
      expect(splitHubSpotPath('/project/My Module.module/js/main.js')).toEqual([
        '/',
        'project',
        'My Module.module',
        'js',
        'main.js',
      ]);
    });

    test('handles root path', () => {
      expect(splitHubSpotPath('/')).toEqual(['/']);
    });

    test('handles empty path', () => {
      expect(splitHubSpotPath('')).toEqual([]);
    });
  });

  describe('getCwd()', () => {
    const originalEnv = process.env;
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.cwd = jest.fn().mockReturnValue('/mocked/cwd');
    });

    afterEach(() => {
      process.env = originalEnv;
      process.cwd = originalCwd;
    });

    test('returns INIT_CWD if set', () => {
      process.env.INIT_CWD = '/custom/init/cwd';
      expect(getCwd()).toBe('/custom/init/cwd');
    });

    test('returns process.cwd() if INIT_CWD not set', () => {
      delete process.env.INIT_CWD;
      expect(getCwd()).toBe('/mocked/cwd');
    });
  });

  describe('getExt()', () => {
    test('returns lowercase extension without dot', () => {
      expect(getExt('file.TXT')).toBe('txt');
    });

    test('returns empty string for no extension', () => {
      expect(getExt('file')).toBe('');
    });

    test('handles non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(getExt(null as '')).toBe('');
    });
  });

  describe('getAllowedExtensions()', () => {
    test('returns default allowed extensions', () => {
      const result = getAllowedExtensions();
      expect(result).toBeInstanceOf(Set);
      expect(result).toEqual(new Set(ALLOWED_EXTENSIONS));
    });

    test('includes additional extensions', () => {
      const result = getAllowedExtensions(['custom']);
      expect(result.has('custom')).toBe(true);
    });
  });

  describe('isAllowedExtension()', () => {
    test('returns true for allowed extension', () => {
      expect(isAllowedExtension('file.txt')).toBe(true);
    });

    test('returns false for disallowed extension', () => {
      expect(isAllowedExtension('file.exe')).toBe(false);
    });

    test('allows custom extensions', () => {
      expect(isAllowedExtension('file.custom', ['custom'])).toBe(true);
    });
  });

  describe('sanitizeFileName()', () => {
    test('replaces invalid characters', () => {
      expect(sanitizeFileName('file:name?.txt')).toBe('file-name-.txt');
    });

    test('handles reserved names', () => {
      expect(sanitizeFileName('CON')).toBe('-CON');
    });

    test('removes trailing periods and spaces', () => {
      expect(sanitizeFileName('file.txt. ')).toBe('file.txt');
    });
  });

  describe('isValidPath()', () => {
    test('returns true for valid path', () => {
      expect(isValidPath('/valid/path/file.txt')).toBe(true);
    });

    test('returns false for path with invalid characters', () => {
      expect(isValidPath('/invalid/path/file?.txt')).toBe(false);
    });

    test('returns false for reserved names', () => {
      expect(isValidPath('/some/path/CON')).toBe(false);
    });
  });

  describe('untildify()', () => {
    const originalHomedir = os.homedir;

    beforeEach(() => {
      (os.homedir as jest.Mock) = jest.fn().mockReturnValue('/home/user');
    });

    afterEach(() => {
      os.homedir = originalHomedir;
    });

    test('replaces tilde with home directory', () => {
      expect(untildify('~/documents/file.txt')).toBe(
        '/home/user/documents/file.txt'
      );
    });

    test('does not modify paths without tilde', () => {
      expect(untildify('/absolute/path/file.txt')).toBe(
        '/absolute/path/file.txt'
      );
    });

    test('throws TypeError for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(() => untildify(null as '')).toThrow(TypeError);
    });
  });
});
