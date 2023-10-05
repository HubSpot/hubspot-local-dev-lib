/* eslint-disable @typescript-eslint/no-explicit-any */

import chalk from 'chalk';

export const LOG_LEVEL = {
  NONE: 0,
  DEBUG: 1,
  LOG: 2,
  WARN: 4,
  ERROR: 8,
};

/**
 * Chalk styles for logger strings.
 */
export const Styles = {
  debug: chalk.reset.blue,
  log: chalk.reset,
  success: chalk.reset.green,
  info: chalk.reset.white,
  warn: chalk.reset.yellow,
  error: chalk.reset.red,
}

export function stylize(label: string, style: (...text: unknown[]) => string, args:any[]) {
  const styledLabel = style(label);
  const [firstArg, ...rest] = args;
  if (typeof firstArg === 'string') {
    return [`${styledLabel} ${firstArg}`, ...rest];
  }
  return [styledLabel, ...args];
}

export class Logger {
  error(...args:any[]) {
    console.error(...stylize('[ERROR]', Styles.error, args));
  }
  warn(...args:any[]) {
    console.warn(...stylize('[WARNING]', Styles.warn, args));
  }
  log(...args:any[]) {
    console.log(...args);
  }
  success(...args:any[]) {
    console.log(...stylize('[SUCCESS]', Styles.success, args));
  }
  info(...args:any[]) {
    console.info(...stylize('[INFO]', Styles.info, args));
  }
  debug(...args:any[]) {
    console.debug(...stylize('[DEBUG]', Styles.log, args));
  }
  group(...args:any[]) {
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

export function shouldLog(level: number): number {
  return currentLogLevel & level;
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
  error(...args:any[]) {
    if (shouldLog(LOG_LEVEL.ERROR)) {
      currentLogger.error(...args);
    }
  },
  warn(...args:any[]) {
    if (shouldLog(LOG_LEVEL.WARN)) {
      currentLogger.warn(...args);
    }
  },
  log(...args:any[]) {
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.log(...args);
    }
  },
  success(...args:any[]) {
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.success(...args);
    }
  },
  info(...args:any[]) {
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.info(...args);
    }
  },
  debug(...args:any[]) {
    if (shouldLog(LOG_LEVEL.DEBUG)) {
      currentLogger.debug(...args);
    }
  },
  group(...args:any[]) {
    currentLogger.group(...args);
  },
  groupEnd() {
    currentLogger.groupEnd();
  },
}
