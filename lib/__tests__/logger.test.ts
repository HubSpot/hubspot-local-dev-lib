import chalk from 'chalk';
import { vi, MockInstance } from 'vitest';
import {
  Styles,
  stylize,
  setLogLevel,
  getLogLevel,
  LOG_LEVEL,
  logger,
  shouldLog,
  getLabels,
  getSymbols,
} from '../logger.js';
import { isUnicodeSupported } from '../isUnicodeSupported.js';

describe('lib/logger', () => {
  afterEach(() => {
    setLogLevel(LOG_LEVEL.LOG);
  });

  describe('isUnicodeSupported()', () => {
    const originalEnv = process.env;
    const originalPlatform = process.platform;

    afterEach(() => {
      process.env = originalEnv;
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('returns true on non-win32 when TERM is not linux', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      process.env = { ...originalEnv, TERM: 'xterm-256color' };
      expect(isUnicodeSupported()).toBe(true);
    });

    it('returns false on non-win32 when TERM is linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      process.env = { ...originalEnv, TERM: 'linux' };
      expect(isUnicodeSupported()).toBe(false);
    });

    it('returns true on win32 when WT_SESSION is set', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env = { ...originalEnv, WT_SESSION: '1' };
      expect(isUnicodeSupported()).toBe(true);
    });

    it('returns false on win32 with no unicode-capable env vars', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env = {};
      expect(isUnicodeSupported()).toBe(false);
    });
  });

  describe('getLabels()', () => {
    const originalEnv = process.env;
    const originalPlatform = process.platform;

    afterEach(() => {
      process.env = originalEnv;
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('returns unicode labels when unicode is supported', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      process.env = { ...originalEnv, TERM: 'xterm-256color' };
      const labels = getLabels();
      expect(labels.success).toBe('✔ SUCCESS');
      expect(labels.warning).toBe('⚠ WARNING');
      expect(labels.error).toBe('✖ ERROR');
      expect(labels.info).toBe('ℹ INFO');
      expect(labels.debug).toBe('⚙ DEBUG');
    });

    it('returns ASCII labels when unicode is not supported', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      process.env = { ...originalEnv, TERM: 'linux' };
      const labels = getLabels();
      expect(labels.success).toBe('[SUCCESS]');
      expect(labels.warning).toBe('[WARNING]');
      expect(labels.error).toBe('[ERROR]');
      expect(labels.info).toBe('[INFO]');
      expect(labels.debug).toBe('[DEBUG]');
    });
  });

  describe('getSymbols()', () => {
    const originalEnv = process.env;
    const originalPlatform = process.platform;

    afterEach(() => {
      process.env = originalEnv;
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('returns symbol-only labels when unicode is supported', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      process.env = { ...originalEnv, TERM: 'xterm-256color' };
      const symbols = getSymbols();
      expect(symbols.success).toBe('✔');
      expect(symbols.warning).toBe('⚠');
      expect(symbols.error).toBe('✖');
      expect(symbols.info).toBe('ℹ');
      expect(symbols.debug).toBe('⚙');
    });

    it('returns ASCII labels when unicode is not supported', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      process.env = { ...originalEnv, TERM: 'linux' };
      const symbols = getSymbols();
      expect(symbols.success).toBe('[SUCCESS]');
      expect(symbols.warning).toBe('[WARNING]');
      expect(symbols.error).toBe('[ERROR]');
      expect(symbols.info).toBe('[INFO]');
      expect(symbols.debug).toBe('[DEBUG]');
    });
  });

  describe('stylize()', () => {
    it('stylizes input', () => {
      const res = stylize('[ERROR]', Styles.error, ['test']);

      expect(res[0]).toEqual(`${chalk.red('[ERROR]')} test`);
    });
  });

  describe('setLogLevel()', () => {
    it('sets the log level for the logger', () => {
      setLogLevel(LOG_LEVEL.DEBUG);
      expect(getLogLevel()).toBe(LOG_LEVEL.DEBUG);

      setLogLevel(LOG_LEVEL.WARN);
      expect(getLogLevel()).toBe(LOG_LEVEL.WARN);

      setLogLevel(LOG_LEVEL.NONE);
      expect(getLogLevel()).toBe(LOG_LEVEL.NONE);
    });
  });

  describe('shouldLog()', () => {
    it('returns false for all logs when the currentLogLevel is NONE', () => {
      setLogLevel(LOG_LEVEL.NONE);
      expect(shouldLog(LOG_LEVEL.DEBUG)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.LOG)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.WARN)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.ERROR)).toBeFalsy();
    });

    it('returns true for all logs when the currentLogLevel is DEBUG', () => {
      setLogLevel(LOG_LEVEL.DEBUG);
      expect(shouldLog(LOG_LEVEL.DEBUG)).toBeTruthy();
      expect(shouldLog(LOG_LEVEL.LOG)).toBeTruthy();
      expect(shouldLog(LOG_LEVEL.WARN)).toBeTruthy();
      expect(shouldLog(LOG_LEVEL.ERROR)).toBeTruthy();
    });

    it('returns false for debugs when the currentLogLevel is LOG', () => {
      setLogLevel(LOG_LEVEL.LOG);
      expect(shouldLog(LOG_LEVEL.DEBUG)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.LOG)).toBeTruthy();
      expect(shouldLog(LOG_LEVEL.WARN)).toBeTruthy();
      expect(shouldLog(LOG_LEVEL.ERROR)).toBeTruthy();
    });

    it('returns false for debugs and logs when the currentLogLevel is WARN', () => {
      setLogLevel(LOG_LEVEL.WARN);
      expect(shouldLog(LOG_LEVEL.DEBUG)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.LOG)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.WARN)).toBeTruthy();
      expect(shouldLog(LOG_LEVEL.ERROR)).toBeTruthy();
    });

    it('returns false for debugs, logs, and warns when the currentLogLevel is ERROR', () => {
      setLogLevel(LOG_LEVEL.ERROR);
      expect(shouldLog(LOG_LEVEL.DEBUG)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.LOG)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.WARN)).toBeFalsy();
      expect(shouldLog(LOG_LEVEL.ERROR)).toBeTruthy();
    });
  });

  describe('logger()', () => {
    let warnSpy: MockInstance;
    let logSpy: MockInstance;
    let debugSpy: MockInstance;
    let infoSpy: MockInstance;
    let groupSpy: MockInstance;
    let groupEndSpy: MockInstance;

    beforeEach(() => {
      setLogLevel(LOG_LEVEL.LOG);
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => null);
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => null);
      debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => null);
      infoSpy = vi.spyOn(console, 'info').mockImplementation(() => null);
      groupSpy = vi.spyOn(console, 'group').mockImplementation(() => null);
      groupEndSpy = vi
        .spyOn(console, 'groupEnd')
        .mockImplementation(() => null);
    });

    afterAll(() => {
      warnSpy.mockReset();
      logSpy.mockReset();
      debugSpy.mockReset();
      infoSpy.mockReset();
      groupSpy.mockReset();
      groupEndSpy.mockReset();
    });

    it('handles warnings', () => {
      logger.log('test log');
      expect(warnSpy).not.toHaveBeenCalled();

      logger.warn('test log');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('handles logs', () => {
      logger.debug('test log');
      expect(debugSpy).not.toHaveBeenCalled();

      logger.log('test log');
      expect(logSpy).toHaveBeenCalled();

      setLogLevel(LOG_LEVEL.DEBUG);
      logger.debug('test log');
      expect(debugSpy).toHaveBeenCalled();
    });

    it('handles info', () => {
      logger.info('test log');
      expect(infoSpy).toHaveBeenCalled();
    });

    it('handles success', () => {
      logger.success('test log');
      expect(logSpy).toHaveBeenCalled();
    });

    it('handles group and groupEnd', () => {
      logger.group('test log');
      logger.groupEnd();
      expect(groupSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();
    });
  });
});
