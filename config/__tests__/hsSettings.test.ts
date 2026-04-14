import {
  vi,
  describe,
  it,
  expect,
  afterEach,
  beforeEach,
  MockedFunction,
} from 'vitest';
import findupSync from 'findup-sync';
import fs from 'fs';
import {
  getHsSettingsFilePath,
  getHsSettingsFileIfExists,
  writeHsSettingsFile,
} from '../hsSettings.js';
import { getCwd } from '../../lib/path.js';
import { HsSettingsFile } from '../../types/HsSettings.js';

vi.mock('findup-sync');
vi.mock('fs');
vi.mock('../../lib/path');

const mockFindupSync = findupSync as MockedFunction<typeof findupSync>;
const mockFs = vi.mocked(fs);
const mockGetCwd = getCwd as MockedFunction<typeof getCwd>;

const SETTINGS: HsSettingsFile = {
  localDefaultAccount: 123,
  accounts: [123, 456],
};

describe('hsSettings', () => {
  beforeEach(() => {
    mockGetCwd.mockReturnValue('/mock/project');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getHsSettingsFilePath()', () => {
    it('returns the path when .hs/settings.json exists', () => {
      mockFindupSync.mockReturnValueOnce('/project/.hs/settings.json');
      expect(getHsSettingsFilePath()).toBe('/project/.hs/settings.json');
    });

    it('returns null when no .hs/settings.json exists', () => {
      mockFindupSync.mockReturnValueOnce(null);
      expect(getHsSettingsFilePath()).toBeNull();
    });
  });

  describe('getHsSettingsFileIfExists()', () => {
    it('returns null when no settings file path found', () => {
      mockFindupSync.mockReturnValueOnce(null);
      expect(getHsSettingsFileIfExists()).toBeNull();
    });

    it('returns parsed settings file when it exists', () => {
      mockFindupSync.mockReturnValueOnce('/project/.hs/settings.json');
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(SETTINGS));
      expect(getHsSettingsFileIfExists()).toEqual(SETTINGS);
    });

    it('throws FileSystemError when file cannot be parsed', () => {
      mockFindupSync.mockReturnValueOnce('/project/.hs/settings.json');
      mockFs.readFileSync.mockReturnValueOnce('invalid json');
      expect(() => getHsSettingsFileIfExists()).toThrow();
    });
  });

  describe('writeHsSettingsFile()', () => {
    it('creates .hs folder, settings file, and README when no settings file exists', () => {
      mockFindupSync.mockReturnValueOnce(null);
      mockFs.existsSync.mockReturnValueOnce(false);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/project/.hs', {
        recursive: true,
      });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/mock/project/.hs/settings.json',
        JSON.stringify(SETTINGS, null, 2),
        'utf8'
      );
      const readmeCall = mockFs.writeFileSync.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('README.txt')
      );
      expect(readmeCall).toBeDefined();
    });

    it('writes to existing settings file path when one exists', () => {
      mockFindupSync.mockReturnValueOnce('/parent/.hs/settings.json');
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/parent/.hs', {
        recursive: true,
      });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/parent/.hs/settings.json',
        JSON.stringify(SETTINGS, null, 2),
        'utf8'
      );
    });

    it('does not write README when updating existing settings file', () => {
      mockFindupSync.mockReturnValueOnce('/parent/.hs/settings.json');
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      const readmeCall = mockFs.writeFileSync.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('README.txt')
      );
      expect(readmeCall).toBeUndefined();
    });

    it('targets parent .hs folder and does not create .hs in cwd when settings exist in parent directory', () => {
      mockFindupSync.mockReturnValueOnce('/parent/.hs/settings.json');
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      expect(mockFs.mkdirSync).not.toHaveBeenCalledWith(
        '/mock/project/.hs',
        expect.anything()
      );
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/parent/.hs', {
        recursive: true,
      });
    });

    it('writes to cwd .hs when settings file is in the same directory', () => {
      mockFindupSync.mockReturnValueOnce('/mock/project/.hs/settings.json');
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/project/.hs', {
        recursive: true,
      });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/mock/project/.hs/settings.json',
        JSON.stringify(SETTINGS, null, 2),
        'utf8'
      );
    });

    it('throws FileSystemError when write fails', () => {
      mockFindupSync.mockReturnValueOnce(null);
      mockFs.existsSync.mockReturnValueOnce(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('EACCES');
      });

      expect(() => writeHsSettingsFile(SETTINGS)).toThrow();
    });
  });
});
