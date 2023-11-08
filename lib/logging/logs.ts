import moment from 'moment';
import chalk from 'chalk';
import { logger, Styles } from './logger';
import { i18n } from '../../utils/lang';

const i18nKey = 'lib.logging.logs';

const SEPARATOR = ' - ';
const LOG_STATUS_COLORS = {
  SUCCESS: Styles.success,
  ERROR: Styles.error,
  UNHANDLED_ERROR: Styles.error,
  HANDLED_ERROR: Styles.error,
};

type Log = {
  log: string;
  status: 'SUCCESS' | 'ERROR' | 'UNHANDLED_ERROR' | 'HANDLED_ERROR';
  createdAt: string;
  executionTime: string;
  error: {
    type: string;
    message: string;
    stackTrace: Array<Array<string>>;
  };
};

type Options = {
  compact: boolean;
  insertions: {
    header: string;
  };
};

type LogsResponse = {
  results: Array<Log>;
};

function errorHandler(log: Log, options: Options): string {
  return `${formatLogHeader(log, options)}${formatError(log, options)}`;
}

const logHandler = {
  ERROR: errorHandler,
  UNHANDLED_ERROR: errorHandler,
  HANDLED_ERROR: errorHandler,
  SUCCESS: (log: Log, options: Options): string => {
    return `${formatLogHeader(log, options)}${formatSuccess(log, options)}`;
  },
};

function formatSuccess(log: Log, options: Options): string {
  if (!log.log || options.compact) {
    return '';
  }

  return `\n${log.log}`;
}

function formatError(log: Log, options: Options): string {
  if (!log.error || options.compact) {
    return '';
  }

  return `${log.error.type}: ${log.error.message}\n${formatStackTrace(log)}`;
}

function formatLogHeader(log: Log, options: Options): string {
  const color = LOG_STATUS_COLORS[log.status];
  const headerInsertion =
    options && options.insertions && options.insertions.header;

  return `${formatTimestamp(log)}${SEPARATOR}${color(log.status)}${
    headerInsertion ? `${SEPARATOR}${headerInsertion}` : ''
  }${SEPARATOR}${formatExecutionTime(log)}`;
}

function formatStackTrace(log: Log): string {
  const stackTrace = (log.error.stackTrace && log.error.stackTrace[0]) || [];
  return stackTrace
    .map(trace => {
      return `  at ${trace}\n`;
    })
    .join('');
}

function formatTimestamp(log: Log): string {
  return `${chalk.whiteBright(moment(log.createdAt).toISOString())}`;
}

function formatExecutionTime(log: Log): string {
  return `${chalk.whiteBright('Execution Time:')} ${log.executionTime}ms`;
}

function processLog(log: Log, options: Options): string | void {
  try {
    return logHandler[log.status](log, options);
  } catch (e) {
    logger.error(
      i18n(`${i18nKey}.unableToProcessLog`, {
        log: JSON.stringify(log),
      })
    );
  }
}

function processLogs(
  logsResp: LogsResponse,
  options: Options
): string | undefined {
  if (!logsResp || (logsResp.results && !logsResp.results.length)) {
    return 'No logs found.';
  } else if (logsResp.results && logsResp.results.length) {
    return logsResp.results
      .map(log => {
        return processLog(log, options);
      })
      .join('\n');
  }
}

export function outputLogs(logsResp: LogsResponse, options: Options): void {
  logger.log(processLogs(logsResp, options));
}
