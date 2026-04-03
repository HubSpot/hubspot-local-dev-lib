/* eslint-disable @typescript-eslint/no-explicit-any */

import chalk, { type ChalkInstance } from 'chalk';

export const LOG_LEVEL = {
  NONE: 0,
  DEBUG: 1,
  LOG: 2,
  WARN: 4,
  ERROR: 8,
};

// Adapted from https://github.com/sindresorhus/is-unicode-supported (MIT)
export function isUnicodeSupported(): boolean {
  if (process.platform !== 'win32') {
    return process.env.TERM !== 'linux';
  }

  return (
    Boolean(process.env.WT_SESSION) ||
    Boolean(process.env.TERMINUS_SUBLIME) ||
    process.env.ConEmuTask === '{cmd::Cmder}' ||
    process.env.TERM_PROGRAM === 'Terminus-Sublime' ||
    process.env.TERM_PROGRAM === 'vscode' ||
    process.env.TERM === 'xterm-256color' ||
    process.env.TERM === 'alacritty' ||
    process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
  );
}

interface LogLabels {
  success: string;
  warning: string;
  error: string;
  info: string;
  debug: string;
}

const UNICODE_LABELS: LogLabels = {
  success: '✔',
  warning: '⚠',
  error: '✖',
  info: 'ℹ',
  debug: '[DEBUG]',
};

const ASCII_LABELS: LogLabels = {
  success: '[SUCCESS]',
  warning: '[WARNING]',
  error: '[ERROR]',
  info: '[INFO]',
  debug: '[DEBUG]',
};

export function getLabels(): LogLabels {
  return isUnicodeSupported() ? UNICODE_LABELS : ASCII_LABELS;
}

/**
 * Chalk styles for logger strings.
 */
export const Styles = {
  debug: chalk.reset.blue,
  log: chalk.reset.white,
  success: chalk.reset.green,
  info: chalk.reset.white,
  warn: chalk.reset.yellow,
  error: chalk.reset.red,
};

export function stylize(label: string, style: ChalkInstance, args: any[]) {
  const styledLabel = style(label);
  const [firstArg, ...rest] = args;
  if (typeof firstArg === 'string') {
    return [`${styledLabel} ${firstArg}`, ...rest];
  }
  return [styledLabel, ...args];
}

export class Logger {
  error(...args: any[]) {
    const labels = getLabels();
    console.error(...stylize(labels.error, Styles.error, args));
  }
  warn(...args: any[]) {
    const labels = getLabels();
    console.warn(...stylize(labels.warning, Styles.warn, args));
  }
  log(...args: any[]) {
    console.log(...args);
  }
  success(...args: any[]) {
    const labels = getLabels();
    console.log(...stylize(labels.success, Styles.success, args));
  }
  info(...args: any[]) {
    const labels = getLabels();
    console.info(...stylize(labels.info, Styles.info, args));
  }
  debug(...args: any[]) {
    const labels = getLabels();
    console.debug(...stylize(labels.debug, Styles.log, args));
  }
  group(...args: any[]) {
    console.group(...args);
  }
  groupEnd() {
    console.groupEnd();
  }
}

let currentLogger = new Logger();
let currentLogLevel = LOG_LEVEL.ERROR;

export function setLogger(logger: Logger): void {
  currentLogger = logger;
}

export function setLogLevel(level: number): void {
  switch (level) {
    case LOG_LEVEL.DEBUG:
      currentLogLevel =
        LOG_LEVEL.DEBUG | LOG_LEVEL.LOG | LOG_LEVEL.WARN | LOG_LEVEL.ERROR;
      break;
    case LOG_LEVEL.LOG:
      currentLogLevel = LOG_LEVEL.LOG | LOG_LEVEL.WARN | LOG_LEVEL.ERROR;
      break;
    case LOG_LEVEL.WARN:
      currentLogLevel = LOG_LEVEL.WARN | LOG_LEVEL.ERROR;
      break;
    case LOG_LEVEL.ERROR:
      currentLogLevel = LOG_LEVEL.ERROR;
      break;
    case LOG_LEVEL.NONE:
    default:
      currentLogLevel = LOG_LEVEL.NONE;
  }
}

export function shouldLog(level: number): boolean {
  return !!(currentLogLevel & level);
}

export function getLogLevel(): number {
  switch (currentLogLevel) {
    case LOG_LEVEL.DEBUG | LOG_LEVEL.LOG | LOG_LEVEL.WARN | LOG_LEVEL.ERROR:
      return LOG_LEVEL.DEBUG;
    case LOG_LEVEL.LOG | LOG_LEVEL.WARN | LOG_LEVEL.ERROR:
      return LOG_LEVEL.LOG;
    case LOG_LEVEL.WARN | LOG_LEVEL.ERROR:
      return LOG_LEVEL.WARN;
    case LOG_LEVEL.ERROR:
      return LOG_LEVEL.ERROR;
    default:
      return LOG_LEVEL.NONE;
  }
}

export const logger = {
  error(...args: any[]) {
    if (shouldLog(LOG_LEVEL.ERROR)) {
      currentLogger.error(...args);
    }
  },
  warn(...args: any[]) {
    if (shouldLog(LOG_LEVEL.WARN)) {
      currentLogger.warn(...args);
    }
  },
  log(...args: any[]) {
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.log(...args);
    }
  },
  success(...args: any[]) {
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.success(...args);
    }
  },
  info(...args: any[]) {
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.info(...args);
    }
  },
  debug(...args: any[]) {
    if (shouldLog(LOG_LEVEL.DEBUG)) {
      currentLogger.debug(...args);
    }
  },
  group(...args: any[]) {
    currentLogger.group(...args);
  },
  groupEnd() {
    currentLogger.groupEnd();
  },
};
