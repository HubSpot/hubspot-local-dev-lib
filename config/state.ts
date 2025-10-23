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

function getCurrentState(throwOnError = true): CLIState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      return JSON.parse(data) as CLIState;
    }
  } catch (error) {
    const errorMessage = i18n(
      `${i18nKey}.getCurrentState.errors.errorReading`,
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );

    if (throwOnError) {
      throw new Error(errorMessage);
    } else {
      logger.debug(errorMessage);
    }
  }

  return DEFAULT_STATE;
}

export function getStateValue<K extends keyof CLIState>(key: K): CLIState[K] {
  ensureCLIDirectory();

  const state = getCurrentState();
  return state[key];
}

export function setStateValue<K extends keyof CLIState>(
  key: K,
  value: CLIState[K]
): void {
  ensureCLIDirectory();

  const currentState = getCurrentState(false);

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
