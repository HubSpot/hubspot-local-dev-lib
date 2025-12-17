import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import path from 'path';
import { STATE_FILE_PATH } from '../../constants/config';

vi.mock('../../utils/lang', () => ({
  i18n: vi.fn((key: string) => key),
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

import * as fs from 'fs';
import { getStateValue, setStateValue } from '../state';

const existsSyncSpy = fs.existsSync as unknown as Mock;
const readFileSyncSpy = fs.readFileSync as unknown as Mock;
const writeFileSyncSpy = fs.writeFileSync as unknown as Mock;
const mkdirSyncSpy = fs.mkdirSync as unknown as Mock;

describe('config/state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('returns default state when file is empty', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('');

      const result = getStateValue('mcpTotalToolCalls');

      expect(readFileSyncSpy).toHaveBeenCalledWith(STATE_FILE_PATH, 'utf-8');
      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('returns default state when file is whitespace-only', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('   \n  \t  ');

      const result = getStateValue('mcpTotalToolCalls');

      expect(readFileSyncSpy).toHaveBeenCalledWith(STATE_FILE_PATH, 'utf-8');
      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('returns default value when reading file fails', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('returns default value when JSON parsing fails', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('invalid json');

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('returns default value when JSON has trailing comma', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('{"mcpTotalToolCalls": 1,}');

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('merges with defaults when state file is empty object', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify({}));

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('merges with defaults when state file has only unrecognized keys', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(
        JSON.stringify({ wrongKey: 42, other: 'value' })
      );

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('returns default value when state file has invalid structure (wrong type)', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(
        JSON.stringify({ mcpTotalToolCalls: 'not-a-number' })
      );

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('ignores extra keys in state file', () => {
      const mockState = {
        mcpTotalToolCalls: 42,
        extraKey: 'should-be-ignored',
        anotherKey: 123,
      };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(mockState));

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(42);
    });

    it('merges with defaults when state file is missing potential future keys', () => {
      const oldState = { mcpTotalToolCalls: 100 };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(oldState));

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(100);
    });

    it('merges partial state with extra keys', () => {
      const partialState = { extraKey: 'ignored' };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(partialState));

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('returns default state when JSON parses to an array', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify([1, 2, 3]));

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('returns default state when JSON parses to null', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('null');

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });

    it('returns default value when reading throws non-Error', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockImplementation(() => {
        throw 'string error';
      });

      const result = getStateValue('mcpTotalToolCalls');

      expect(result).toBe(0);
    });
  });

  describe('setStateValue()', () => {
    it('writes new value to state file when file exists', () => {
      const existingState = { mcpTotalToolCalls: 10 };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(existingState));
      writeFileSyncSpy.mockImplementation(() => undefined);

      setStateValue('mcpTotalToolCalls', 20);

      expect(readFileSyncSpy).toHaveBeenCalledWith(STATE_FILE_PATH, 'utf-8');
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 20 }, null, 2),
        'utf-8'
      );
    });

    it('creates new state file with default values when file does not exist', () => {
      existsSyncSpy.mockReturnValue(false);
      writeFileSyncSpy.mockImplementation(() => undefined);

      setStateValue('mcpTotalToolCalls', 5);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 5 }, null, 2),
        'utf-8'
      );
    });

    it('throws error when write fails', () => {
      existsSyncSpy.mockReturnValue(false);
      writeFileSyncSpy.mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => setStateValue('mcpTotalToolCalls', 15)).toThrow(
        'config.state.setStateValue.errors.failedToWrite'
      );
    });

    it('uses default state when reading existing file fails', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockImplementation(() => {
        throw new Error('Read error');
      });
      writeFileSyncSpy.mockImplementation(() => undefined);

      setStateValue('mcpTotalToolCalls', 25);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 25 }, null, 2),
        'utf-8'
      );
    });

    it('uses default state when JSON parsing fails', () => {
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue('invalid json');
      writeFileSyncSpy.mockImplementation(() => undefined);

      setStateValue('mcpTotalToolCalls', 30);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 30 }, null, 2),
        'utf-8'
      );
    });

    it('preserves other state values when updating one value', () => {
      const existingState = { mcpTotalToolCalls: 100 };
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(JSON.stringify(existingState));
      writeFileSyncSpy.mockImplementation(() => undefined);

      setStateValue('mcpTotalToolCalls', 150);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        STATE_FILE_PATH,
        JSON.stringify({ mcpTotalToolCalls: 150 }, null, 2),
        'utf-8'
      );
    });

    it('throws error when write fails with non-Error', () => {
      existsSyncSpy.mockReturnValue(false);
      writeFileSyncSpy.mockImplementation(() => {
        throw 'string error';
      });

      expect(() => setStateValue('mcpTotalToolCalls', 15)).toThrow(
        'config.state.setStateValue.errors.failedToWrite'
      );
    });
  });

  describe('ensureCLIDirectory()', () => {
    it('creates directory when it does not exist', () => {
      const stateDir = path.dirname(STATE_FILE_PATH);

      existsSyncSpy.mockImplementation(() => {
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

    it('throws error when directory creation fails', () => {
      existsSyncSpy.mockReturnValue(false);
      mkdirSyncSpy.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => getStateValue('mcpTotalToolCalls')).toThrow(
        'config.state.ensureCLIDirectory.errors.cannotCreateDirectory'
      );
    });

    it('throws error when directory creation fails with non-Error', () => {
      existsSyncSpy.mockReturnValue(false);
      mkdirSyncSpy.mockImplementation(() => {
        throw 'Permission denied string';
      });

      expect(() => getStateValue('mcpTotalToolCalls')).toThrow(
        'config.state.ensureCLIDirectory.errors.cannotCreateDirectory'
      );
    });
  });
});
