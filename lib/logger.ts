/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import path from 'path';
import chalk, { type ChalkInstance } from 'chalk';
import { isUnicodeSupported } from './isUnicodeSupported.js';

const DEFAULT_MAX_LOG_FILES = 3;

export const LOG_LEVEL = {
  NONE: 0,
  DEBUG: 1,
  LOG: 2,
  WARN: 4,
  ERROR: 8,
};

interface LogLabels {
  success: string;
  warning: string;
  error: string;
  info: string;
  debug: string;
}

const UNICODE_LABELS: LogLabels = {
  success: '✔ SUCCESS',
  warning: '⚠ WARNING',
  error: '✖ ERROR',
  info: 'ℹ INFO',
  debug: '⚙ DEBUG',
};

const UNICODE_SYMBOLS: LogLabels = {
  success: '✔',
  warning: '⚠',
  error: '✖',
  info: 'ℹ',
  debug: '⚙',
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

export function getSymbols(): LogLabels {
  return isUnicodeSupported() ? UNICODE_SYMBOLS : ASCII_LABELS;
}

/**
 * Chalk styles for logger strings.
 */
export const Styles = {
  debug: chalk.reset.grey,
  log: chalk.reset.white,
  success: chalk.reset.green,
  info: chalk.reset.blue,
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
    console.debug(...stylize(labels.debug, Styles.debug, args));
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

const logBuffer: string[] = [];

function recordToBuffer(level: string, args: any[]): void {
  const message = args.map(arg => String(arg)).join(' ');
  logBuffer.push(`[${new Date().toISOString()}] [${level}] ${message}`);
}

function sanitizeFilenamePart(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function timestampForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function rotateLogFiles(dir: string, maxFiles: number): void {
  const entries = fs
    .readdirSync(dir)
    .map(name => {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      return { full, mtimeMs: stat.mtimeMs, isFile: stat.isFile() };
    })
    .filter(entry => entry.isFile)
    .sort((a, b) => a.mtimeMs - b.mtimeMs);

  while (entries.length >= maxFiles) {
    const oldest = entries.shift();
    if (oldest) {
      fs.unlinkSync(oldest.full);
    }
  }
}

export type WriteBufferedLogsOptions = {
  dir: string;
  commandName: string;
  maxFiles?: number;
};

export const logger = {
  error(...args: any[]) {
    recordToBuffer('ERROR', args);
    if (shouldLog(LOG_LEVEL.ERROR)) {
      currentLogger.error(...args);
    }
  },
  warn(...args: any[]) {
    recordToBuffer('WARN', args);
    if (shouldLog(LOG_LEVEL.WARN)) {
      currentLogger.warn(...args);
    }
  },
  log(...args: any[]) {
    recordToBuffer('LOG', args);
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.log(...args);
    }
  },
  success(...args: any[]) {
    recordToBuffer('SUCCESS', args);
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.success(...args);
    }
  },
  info(...args: any[]) {
    recordToBuffer('INFO', args);
    if (shouldLog(LOG_LEVEL.LOG)) {
      currentLogger.info(...args);
    }
  },
  debug(...args: any[]) {
    recordToBuffer('DEBUG', args);
    if (shouldLog(LOG_LEVEL.DEBUG)) {
      currentLogger.debug(...args);
    }
  },
  group(...args: any[]) {
    recordToBuffer('GROUP', args);
    currentLogger.group(...args);
  },
  groupEnd() {
    currentLogger.groupEnd();
  },
  viewBuffer(): string {
    return logBuffer.join('\n');
  },
  flushBuffer(): string {
    const out = logBuffer.join('\n');
    logBuffer.length = 0;
    return out;
  },
  writeBufferedLogsToFile(options: WriteBufferedLogsOptions): string | null {
    const { dir, commandName, maxFiles = DEFAULT_MAX_LOG_FILES } = options;
    const contents = this.flushBuffer();
    if (!contents) {
      return null;
    }
    try {
      fs.mkdirSync(dir, { recursive: true });
      rotateLogFiles(dir, maxFiles);
      const filename = `${sanitizeFilenamePart(commandName)}-${timestampForFilename()}.log`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, contents, 'utf8');
      return filePath;
    } catch (_e) {
      return null;
    }
  },
};
