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
  getHsSettingsFile,
  writeHsSettingsFile,
} from '../hsSettings';
import { getCwd } from '../../lib/path';
import { HsSettingsFile } from '../../types/HsSettings';

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

  describe('getHsSettingsFile()', () => {
    it('returns null when no settings file path found', () => {
      mockFindupSync.mockReturnValueOnce(null);
      expect(getHsSettingsFile()).toBeNull();
    });

    it('returns parsed settings file when it exists', () => {
      mockFindupSync.mockReturnValueOnce('/project/.hs/settings.json');
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(SETTINGS));
      expect(getHsSettingsFile()).toEqual(SETTINGS);
    });

    it('throws FileSystemError when file cannot be parsed', () => {
      mockFindupSync.mockReturnValueOnce('/project/.hs/settings.json');
      mockFs.readFileSync.mockReturnValueOnce('invalid json');
      expect(() => getHsSettingsFile()).toThrow();
    });
  });

  describe('writeHsSettingsFile()', () => {
    it('creates .hs folder and writes settings file', () => {
      mockFs.existsSync.mockReturnValueOnce(false);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        '/mock/project/.hs',
        { recursive: true }
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/mock/project/.hs/settings.json',
        JSON.stringify(SETTINGS, null, 2),
        'utf8'
      );
    });

    it('writes README.txt on first scaffold', () => {
      mockFs.existsSync.mockReturnValueOnce(false);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      const writeFileCalls = mockFs.writeFileSync.mock.calls;
      const readmeCall = writeFileCalls.find(
        call => typeof call[0] === 'string' && call[0].includes('README.txt')
      );
      expect(readmeCall).toBeDefined();
    });

    it('does not write README.txt when .hs folder already exists', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.mkdirSync.mockReturnValueOnce(undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      writeHsSettingsFile(SETTINGS);

      const writeFileCalls = mockFs.writeFileSync.mock.calls;
      const readmeCall = writeFileCalls.find(
        call => typeof call[0] === 'string' && call[0].includes('README.txt')
      );
      expect(readmeCall).toBeUndefined();
    });

    it('throws FileSystemError when write fails', () => {
      mockFs.existsSync.mockReturnValueOnce(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('EACCES');
      });

      expect(() => writeHsSettingsFile(SETTINGS)).toThrow();
    });
  });
});
