import * as fs from 'fs';
import * as path from 'path';
import { i18n } from '../utils/lang';
import { STATE_FILE_PATH } from '../constants/config';
import { logger } from '../lib/logger';
import { CLIState } from '../types/Config';

const i18nKey = 'config.state';

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
    throw new Error(
      i18n(`${i18nKey}.ensureCLIDirectory.errors.cannotCreateDirectory`, {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

function stateFileExists(): boolean {
  return fs.existsSync(STATE_FILE_PATH);
}

export function getStateValue<K extends keyof CLIState>(key: K): CLIState[K] {
  ensureCLIDirectory();

  try {
    if (stateFileExists()) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const state = JSON.parse(data) as CLIState;
      return state[key];
    }
  } catch (error) {
    throw new Error(
      i18n(`${i18nKey}.getStateValue.errors.errorReading`, {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }

  return DEFAULT_STATE[key];
}

export function setStateValue<K extends keyof CLIState>(
  key: K,
  value: CLIState[K]
): void {
  ensureCLIDirectory();

  let currentState: CLIState = DEFAULT_STATE;

  try {
    if (stateFileExists()) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      currentState = JSON.parse(data) as CLIState;
    }
  } catch (error) {
    logger.debug(
      i18n(`${i18nKey}.setStateValue.errors.errorReadingDefaults`, {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }

  const newState = { ...currentState, [key]: value };
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify(newState, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new Error(
      i18n(`${i18nKey}.setStateValue.errors.failedToWrite`, {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
