import os from 'os';
import {
  convertToUnixPath,
  convertToLocalFileSystemPath,
  splitLocalPath,
  splitHubSpotPath,
  getCwd,
  getExt,
  getAllowedExtensions,
  isAllowedExtension,
  sanitizeFileName,
  isValidPath,
  untildify,
} from '../path.js';
import { ALLOWED_EXTENSIONS } from '../../constants/extensions.js';
import { vi } from 'vitest';

vi.mock('os', () => ({
  default: {
    homedir: vi.fn(),
  },
}));

// Create a controllable mock for path.sep
const mockPath = vi.hoisted(() => {
  let mockSep = '/';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actualPath = require('path');

  return {
    ...actualPath,
    get sep() {
      return mockSep;
    },
    setSep: (newSep: string) => {
      mockSep = newSep;
    },
    posix: { sep: '/' },
    win32: { sep: '\\' },
    normalize: (p: string) => {
      if (mockSep === '\\') {
        return p.replace(/\//g, '\\');
      }
      return actualPath.normalize(p);
    },
  };
});

vi.mock('path', () => ({
  default: mockPath,
  ...mockPath,
}));

describe('path utility functions', () => {
  describe('convertToUnixPath()', () => {
    it('converts Windows path to Unix path', () => {
      expect(convertToUnixPath('C:\\Users\\test\\file.txt')).toBe(
        '/Users/test/file.txt'
      );
    });

    it('normalizes Unix path', () => {
      expect(convertToUnixPath('/home//user/./file.txt')).toBe(
        '/home/user/file.txt'
      );
    });
  });

  describe('convertToLocalFileSystemPath()', () => {
    afterEach(() => {
      // Reset to Unix separator
      mockPath.setSep('/');
    });

    it('converts to Unix path when on Unix-like system', () => {
      mockPath.setSep('/');
      expect(convertToLocalFileSystemPath('/home/user/file.txt')).toBe(
        '/home/user/file.txt'
      );
    });

    it('converts to Windows path when on Windows system', () => {
      mockPath.setSep('\\');
      expect(convertToLocalFileSystemPath('C:/Users/test/file.txt')).toBe(
        'C:\\Users\\test\\file.txt'
      );
    });
  });

  describe('splitLocalPath()', () => {
    it('splits Unix path correctly', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        splitLocalPath('/home/user/file.txt', {
          sep: '/',
          normalize: (p: string) => p,
        })
      ).toEqual(['/', 'home', 'user', 'file.txt']);
    });

    it('splits Windows path correctly', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        splitLocalPath('C:\\Users\\test\\file.txt', {
          sep: '\\',
          normalize: (p: string) => p,
        })
      ).toEqual(['C:', 'Users', 'test', 'file.txt']);
    });

    it('handles empty path', () => {
      expect(splitLocalPath('')).toEqual([]);
    });
  });

  describe('splitHubSpotPath()', () => {
    it('splits HubSpot path correctly', () => {
      expect(splitHubSpotPath('/project/My Module.module/js/main.js')).toEqual([
        '/',
        'project',
        'My Module.module',
        'js',
        'main.js',
      ]);
    });

    it('handles root path', () => {
      expect(splitHubSpotPath('/')).toEqual(['/']);
    });

    it('handles empty path', () => {
      expect(splitHubSpotPath('')).toEqual([]);
    });
  });

  describe('getCwd()', () => {
    const originalEnv = process.env;
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.cwd = vi.fn().mockReturnValue('/mocked/cwd');
    });

    afterEach(() => {
      process.env = originalEnv;
      process.cwd = originalCwd;
    });

    it('returns INIT_CWD if set', () => {
      process.env.INIT_CWD = '/custom/init/cwd';
      expect(getCwd()).toBe('/custom/init/cwd');
    });

    it('returns process.cwd() if INIT_CWD not set', () => {
      delete process.env.INIT_CWD;
      expect(getCwd()).toBe('/mocked/cwd');
    });
  });

  describe('getExt()', () => {
    it('returns lowercase extension without dot', () => {
      expect(getExt('file.TXT')).toBe('txt');
    });

    it('returns empty string for no extension', () => {
      expect(getExt('file')).toBe('');
    });

    it('handles non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(getExt(null as '')).toBe('');
    });
  });

  describe('getAllowedExtensions()', () => {
    it('returns default allowed extensions', () => {
      const result = getAllowedExtensions();
      expect(result).toBeInstanceOf(Set);
      expect(result).toEqual(new Set(ALLOWED_EXTENSIONS));
    });

    it('includes additional extensions', () => {
      const result = getAllowedExtensions(['custom']);
      expect(result.has('custom')).toBe(true);
    });
  });

  describe('isAllowedExtension()', () => {
    it('returns true for allowed extension', () => {
      expect(isAllowedExtension('file.txt')).toBe(true);
    });

    it('returns false for disallowed extension', () => {
      expect(isAllowedExtension('file.exe')).toBe(false);
    });

    it('allows custom extensions', () => {
      expect(isAllowedExtension('file.custom', ['custom'])).toBe(true);
    });
  });

  describe('sanitizeFileName()', () => {
    it('replaces invalid characters', () => {
      expect(sanitizeFileName('file:name?.txt')).toBe('file-name-.txt');
    });

    it('handles reserved names', () => {
      expect(sanitizeFileName('CON')).toBe('-CON');
    });

    it('removes trailing periods and spaces', () => {
      expect(sanitizeFileName('file.txt. ')).toBe('file.txt');
    });
  });

  describe('isValidPath()', () => {
    it('returns true for valid path', () => {
      expect(isValidPath('/valid/path/file.txt')).toBe(true);
    });

    it('returns false for path with invalid characters', () => {
      expect(isValidPath('/invalid/path/file?.txt')).toBe(false);
    });

    it('returns false for reserved names', () => {
      expect(isValidPath('/some/path/CON')).toBe(false);
    });
  });

  describe('untildify()', () => {
    const originalHomedir = os.homedir;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (os.homedir as any) = vi.fn().mockReturnValue('/home/user');
    });

    afterEach(() => {
      os.homedir = originalHomedir;
    });

    it('replaces tilde with home directory', () => {
      expect(untildify('~/documents/file.txt')).toBe(
        '/home/user/documents/file.txt'
      );
    });

    it('does not modify paths without tilde', () => {
      expect(untildify('/absolute/path/file.txt')).toBe(
        '/absolute/path/file.txt'
      );
    });

    it('throws TypeError for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(() => untildify(null as '')).toThrow(TypeError);
    });
  });
});
