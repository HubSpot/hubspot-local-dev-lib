import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../lib/logger';
import { i18n } from '../utils/lang';
import { STATE_FILE_PATH } from '../constants/config';

const i18nKey = 'config.state';

interface CLIState {
  mcpTotalToolCalls: number;
}

const DEFAULT_STATE: CLIState = {
  mcpTotalToolCalls: 0,
};

function ensureCLIDirectory(): void {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    logger.error(
      i18n(`${i18nKey}.ensureCLIDirectory.errors.cannotCreateDirectory`),
      error
    );
  }
}

export function getStateValue<K extends keyof CLIState>(key: K): CLIState[K] {
  ensureCLIDirectory();

  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const state = JSON.parse(data) as CLIState;
      return state[key];
    }
  } catch (error) {
    logger.error(i18n(`${i18nKey}.getStateValue.errors.errorReading`), error);
  }

  return DEFAULT_STATE[key];
}

export function setStateValue<K extends keyof CLIState>(
  key: K,
  value: CLIState[K]
): boolean {
  ensureCLIDirectory();

  let currentState: CLIState = DEFAULT_STATE;

  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      currentState = JSON.parse(data) as CLIState;
    }
  } catch (error) {
    logger.error(
      i18n(`${i18nKey}.setStateValue.errors.errorReadingDefaults`),
      error
    );
  }

  const newState = { ...currentState, [key]: value };
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify(newState, null, 2),
      'utf-8'
    );
    return true;
  } catch (error) {
    logger.error(i18n(`${i18nKey}.setStateValue.errors.failedToWrite`), error);
    return false;
  }
}
