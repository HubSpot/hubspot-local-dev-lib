import chalk from 'chalk';
import { vi } from 'vitest';
import {
  Styles,
  stylize,
  setLogLevel,
  getLogLevel,
  LOG_LEVEL,
  logger,
  shouldLog,
} from '../logger.js';

describe('lib/logger', () => {
  afterEach(() => {
    setLogLevel(LOG_LEVEL.LOG);
  });

  describe('stylize()', () => {
    it('stylizes input', () => {
      const res = stylize('[ERROR]', Styles.error, ['test']);

      expect(res[0]).toEqual(`${chalk.reset.red('[ERROR]')} test`);
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
    let warnSpy: any;
    let logSpy: any;
    let debugSpy: any;
    let infoSpy: any;
    let groupSpy: any;
    let groupEndSpy: any;

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
