import fs from 'fs';
import path from 'path';
import os from 'os';
import { getStateValue, setStateValue } from '../state';
import { logger } from '../../lib/logger';
import { STATE_FILE_PATH } from '../../constants/config';

jest.mock('../../lib/logger');
jest.mock('../../utils/lang', () => ({
  i18n: jest.fn((key: string) => key),
}));

const existsSyncSpy = jest.spyOn(fs, 'existsSync');
const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');
const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');

describe('config/state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStateValue()', () => {
    it('returns the value from state file when it exists', () => {
      const mockState = { mcpTotalToolCalls: 42 };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(mockState));

      const result = getStateValue('mcpTotalToolCalls');

      expect(existsSyncSpy).toHaveBeenCalledWith(STATE_FILE_PATH);
      expect(readFileSyncSpy).toHaveBeenCalledWith(STATE_FILE_PATH, 'utf-8');
      expect(result).toBe(42);
    });

    it('returns default value when state file does not exist', () => {
      existsSyncSpy.mockReturnValue(false);

      const result = getStateValue('mcpTotalToolCalls');

      expect(existsSyncSpy).toHaveBeenCalledWith(STATE_FILE_PATH);
      expect(readFileSyncSpy).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('returns default value when reading file throws error', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = getStateValue('mcpTotalToolCalls');

      expect(logger.error).toHaveBeenCalledWith(
        'config.state.getStateValue.errors.errorReading',
        expect.any(Error)
      );
      expect(result).toBe(0);
    });

    it('returns default value when JSON parsing fails', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('invalid json');

      const result = getStateValue('mcpTotalToolCalls');

      expect(logger.error).toHaveBeenCalledWith(
        'config.state.getStateValue.errors.errorReading',
        expect.any(Error)
      );
      expect(result).toBe(0);
    });
  });

  describe('setStateValue()', () => {
    it('writes new value to state file when file exists', () => {
      const existingState = { mcpTotalToolCalls: 10 };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(existingState));
      writeFileSyncSpy.mockImplementation(() => undefined);

      const result = setStateValue('mcpTotalToolCalls', 20);

      expect(readFileSyncSpy).toHaveBeenCalledWith(STATE_FILE_PATH, 'utf-8');
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 20 }, null, 2),
        'utf-8'
      );
      expect(result).toBe(true);
    });

    it('creates new state file with default values when file does not exist', () => {
      existsSyncSpy.mockReturnValue(false);
      writeFileSyncSpy.mockImplementation(() => undefined);

      const result = setStateValue('mcpTotalToolCalls', 5);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 5 }, null, 2),
        'utf-8'
      );
      expect(result).toBe(true);
    });

    it('returns false when write fails', () => {
      existsSyncSpy.mockReturnValue(false);
      writeFileSyncSpy.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = setStateValue('mcpTotalToolCalls', 15);

      expect(logger.error).toHaveBeenCalledWith(
        'config.state.setStateValue.errors.failedToWrite',
        expect.any(Error)
      );
      expect(result).toBe(false);
    });

    it('uses default state when reading existing file fails', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockImplementation(() => {
        throw new Error('Read error');
      });
      writeFileSyncSpy.mockImplementation(() => undefined);

      const result = setStateValue('mcpTotalToolCalls', 25);

      expect(logger.error).toHaveBeenCalledWith(
        'config.state.setStateValue.errors.errorReadingDefaults',
        expect.any(Error)
      );
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 25 }, null, 2),
        'utf-8'
      );
      expect(result).toBe(true);
    });

    it('uses default state when JSON parsing fails', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('invalid json');
      writeFileSyncSpy.mockImplementation(() => undefined);

      const result = setStateValue('mcpTotalToolCalls', 30);

      expect(logger.error).toHaveBeenCalledWith(
        'config.state.setStateValue.errors.errorReadingDefaults',
        expect.any(Error)
      );
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 30 }, null, 2),
        'utf-8'
      );
      expect(result).toBe(true);
    });

    it('preserves other state values when updating one value', () => {
      const existingState = { mcpTotalToolCalls: 100 };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(existingState));
      writeFileSyncSpy.mockImplementation(() => undefined);

      const result = setStateValue('mcpTotalToolCalls', 150);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 150 }, null, 2),
        'utf-8'
      );
      expect(result).toBe(true);
    });
  });

  describe('ensureCLIDirectory()', () => {
    it('creates directory when it does not exist', () => {
      const stateDir = path.dirname(STATE_FILE_PATH);

      existsSyncSpy.mockImplementation((filePath: fs.PathLike) => {
        // Directory doesn't exist, but state file also doesn't exist
        return false;
      });
      mkdirSyncSpy.mockImplementation(() => undefined);

      getStateValue('mcpTotalToolCalls');

      expect(mkdirSyncSpy).toHaveBeenCalledWith(stateDir, { recursive: true });
    });

    it('does not create directory when it already exists', () => {
      const stateDir = path.dirname(STATE_FILE_PATH);

      existsSyncSpy.mockImplementation((filePath: fs.PathLike) => {
        // Directory exists
        if (filePath === stateDir) {
          return true;
        }
        // State file doesn't exist
        return false;
      });
      mkdirSyncSpy.mockClear();

      getStateValue('mcpTotalToolCalls');

      expect(mkdirSyncSpy).not.toHaveBeenCalled();
    });

    it('logs error when directory creation fails', () => {
      existsSyncSpy.mockReturnValue(false);
      mkdirSyncSpy.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      getStateValue('mcpTotalToolCalls');

      expect(logger.error).toHaveBeenCalledWith(
        'config.state.ensureCLIDirectory.errors.cannotCreateDirectory',
        expect.any(Error)
      );
    });
  });
});
