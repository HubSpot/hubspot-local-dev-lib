import fs from 'fs';
import os from 'os';
import path from 'path';
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
  setLogBufferByteLimit,
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
  describe('buffer', () => {
    beforeEach(() => {
      logger.flushLogBuffer();
      vi.spyOn(console, 'log').mockImplementation(() => null);
      vi.spyOn(console, 'warn').mockImplementation(() => null);
      vi.spyOn(console, 'info').mockImplementation(() => null);
      vi.spyOn(console, 'error').mockImplementation(() => null);
      vi.spyOn(console, 'debug').mockImplementation(() => null);
      vi.spyOn(console, 'group').mockImplementation(() => null);
    });

    it('captures messages from every level into the buffer', () => {
      setLogLevel(LOG_LEVEL.DEBUG);

      logger.log('a-log');
      logger.error('a-error');
      logger.warn('a-warn');
      logger.success('a-success');
      logger.info('a-info');
      logger.debug('a-debug');
      logger.group('a-group');

      const buffered = logger.viewLogBuffer();

      expect(buffered).toContain('[LOG] a-log');
      expect(buffered).toContain('[ERROR] a-error');
      expect(buffered).toContain('[WARN] a-warn');
      expect(buffered).toContain('[SUCCESS] a-success');
      expect(buffered).toContain('[INFO] a-info');
      expect(buffered).toContain('[DEBUG] a-debug');
      expect(buffered).toContain('[GROUP] a-group');
    });

    it('captures messages even when the log level filters them out', () => {
      setLogLevel(LOG_LEVEL.ERROR);

      logger.debug('hidden-from-console');
      logger.info('also-hidden');

      const buffered = logger.viewLogBuffer();

      expect(buffered).toContain('[DEBUG] hidden-from-console');
      expect(buffered).toContain('[INFO] also-hidden');
    });

    it('viewLogBuffer returns the joined buffer without clearing it', () => {
      logger.info('first');
      logger.info('second');

      expect(logger.viewLogBuffer()).toContain('first');
      expect(logger.viewLogBuffer()).toContain('second');
      expect(logger.viewLogBuffer().split('\n')).toHaveLength(2);
    });

    it('flushLogBuffer returns and clears', () => {
      logger.info('first');
      logger.info('second');

      const flushed = logger.flushLogBuffer();
      expect(flushed).toContain('first');
      expect(flushed).toContain('second');

      expect(logger.viewLogBuffer()).toBe('');
      expect(logger.flushLogBuffer()).toBe('');
    });

    it('prefixes entries with an ISO timestamp', () => {
      logger.info('timed');
      const buffered = logger.viewLogBuffer();
      expect(buffered).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] timed$/
      );
    });

    it('joins multiple args into a single message', () => {
      logger.info('hello', 'world', 42);
      const buffered = logger.viewLogBuffer();
      expect(buffered).toContain('[INFO] hello world 42');
    });
  });

  describe('writeBufferedLogsToFile()', () => {
    let tmpDir: string;

    beforeEach(() => {
      logger.flushLogBuffer();
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ldl-logger-test-'));
      vi.spyOn(console, 'log').mockImplementation(() => null);
      vi.spyOn(console, 'info').mockImplementation(() => null);
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns null and does not write a file when the buffer is empty', () => {
      const dir = path.join(tmpDir, 'logs');
      const result = logger.writeBufferedLogsToFile({
        dir,
        commandName: 'test',
      });

      expect(result).toBeNull();
      expect(fs.existsSync(dir)).toBe(false);
    });

    it('creates the directory and writes the buffer to a sanitized filename', () => {
      logger.info('captured');
      const dir = path.join(tmpDir, 'logs');

      const filePath = logger.writeBufferedLogsToFile({
        dir,
        commandName: 'account list',
      });

      expect(filePath).not.toBeNull();
      expect(fs.existsSync(dir)).toBe(true);
      const filename = path.basename(filePath as string);
      expect(filename.startsWith('account-list-')).toBe(true);
      expect(filename.endsWith('.log')).toBe(true);
      expect(fs.readFileSync(filePath as string, 'utf8')).toContain(
        '[INFO] captured'
      );
    });

    it('clears the buffer regardless of whether the write succeeded', () => {
      logger.info('captured');
      logger.writeBufferedLogsToFile({
        dir: path.join(tmpDir, 'logs'),
        commandName: 'cmd',
      });
      expect(logger.viewLogBuffer()).toBe('');
    });

    it('clears the buffer when the write fails', () => {
      logger.info('captured');
      const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('disk full');
      });

      const result = logger.writeBufferedLogsToFile({
        dir: path.join(tmpDir, 'logs'),
        commandName: 'cmd',
      });

      expect(result).toBeNull();
      expect(logger.viewLogBuffer()).toBe('');
      writeSpy.mockRestore();
    });

    it('rotates files so the directory holds at most maxFiles after writing', () => {
      const dir = path.join(tmpDir, 'logs');
      fs.mkdirSync(dir, { recursive: true });

      ['oldest.log', 'middle.log', 'newest.log'].forEach((name, idx) => {
        const full = path.join(dir, name);
        fs.writeFileSync(full, name);
        const t = new Date(2026, 0, idx + 1);
        fs.utimesSync(full, t, t);
      });

      logger.info('fresh');
      logger.writeBufferedLogsToFile({
        dir,
        commandName: 'command',
        maxFiles: 3,
      });

      const remaining = fs.readdirSync(dir);
      expect(remaining).toHaveLength(3);
      expect(remaining).not.toContain('oldest.log');
      expect(remaining).toContain('middle.log');
      expect(remaining).toContain('newest.log');
    });

    it('honors a custom maxFiles', () => {
      const dir = path.join(tmpDir, 'logs');
      fs.mkdirSync(dir, { recursive: true });

      ['a.log', 'b.log'].forEach((name, idx) => {
        const full = path.join(dir, name);
        fs.writeFileSync(full, name);
        const t = new Date(2026, 0, idx + 1);
        fs.utimesSync(full, t, t);
      });

      logger.info('fresh');
      logger.writeBufferedLogsToFile({
        dir,
        commandName: 'command',
        maxFiles: 2,
      });

      const remaining = fs.readdirSync(dir);
      expect(remaining).toHaveLength(2);
      expect(remaining).not.toContain('a.log');
      expect(remaining).toContain('b.log');
    });
  });

  describe('byte-limited buffer', () => {
    beforeEach(() => {
      logger.flushLogBuffer();
      setLogBufferByteLimit(1024);
      vi.spyOn(console, 'log').mockImplementation(() => null);
      vi.spyOn(console, 'info').mockImplementation(() => null);
      vi.spyOn(console, 'debug').mockImplementation(() => null);
    });

    afterEach(() => {
      setLogBufferByteLimit(128 * 1024 * 1024);
    });

    it('drops oldest entries once the buffer exceeds the byte limit', () => {
      setLogBufferByteLimit(300);
      logger.log('A'.repeat(80));
      logger.log('B'.repeat(80));
      logger.log('C'.repeat(80));

      const buffered = logger.viewLogBuffer();

      expect(buffered).not.toContain('A'.repeat(80));
      expect(buffered).toContain('B'.repeat(80));
      expect(buffered).toContain('C'.repeat(80));
    });

    it('drops multiple oldest entries when a single push pushes well past the limit', () => {
      setLogBufferByteLimit(200);
      logger.log('A'.repeat(60));
      logger.log('B'.repeat(60));
      logger.log('C'.repeat(60));
      logger.log('D'.repeat(60));
      logger.log('huge'.repeat(50));

      const buffered = logger.viewLogBuffer();
      expect(buffered).not.toContain('A'.repeat(60));
      expect(buffered).not.toContain('B'.repeat(60));
      expect(buffered).toContain('huge'.repeat(50));
    });

    it('lowering the limit drops entries already in the buffer', () => {
      setLogBufferByteLimit(10000);
      for (let i = 0; i < 5; i++) {
        logger.log('X'.repeat(200));
      }
      const before = logger.viewLogBuffer().split('\n').length;
      expect(before).toBe(5);

      setLogBufferByteLimit(500);

      const after = logger.viewLogBuffer().split('\n').length;
      expect(after).toBeLessThan(before);
    });

    it('flushLogBuffer resets the byte counter so the cap applies fresh after flush', () => {
      setLogBufferByteLimit(400);
      logger.log('X'.repeat(120));
      logger.log('Y'.repeat(120));
      expect(logger.flushLogBuffer()).not.toBe('');

      logger.log('Z'.repeat(120));
      logger.log('W'.repeat(120));

      const buffered = logger.viewLogBuffer();
      expect(buffered).toContain('Z'.repeat(120));
      expect(buffered).toContain('W'.repeat(120));
    });
  });
});
