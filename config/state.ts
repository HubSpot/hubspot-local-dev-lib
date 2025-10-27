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

function validateStateShape(obj: unknown): obj is CLIState {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }

  const state = obj as Record<string, unknown>;

  for (const key in DEFAULT_STATE) {
    const typedKey = key as keyof CLIState;
    if (key in state && typeof state[key] !== typeof DEFAULT_STATE[typedKey]) {
      return false;
    }
  }

  return true;
}

function mergeWithDefaults(parsed: Partial<CLIState>): CLIState {
  return {
    ...DEFAULT_STATE,
    ...parsed,
  };
}

function getCurrentState(): CLIState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');

      if (!data || !data.trim()) {
        logger.debug(i18n(`${i18nKey}.getCurrentState.debug.emptyStateFile`));
        return DEFAULT_STATE;
      }

      const parsed = JSON.parse(data);

      if (!validateStateShape(parsed)) {
        throw new Error(
          i18n(`${i18nKey}.getCurrentState.errors.invalidStructure`)
        );
      }

      return mergeWithDefaults(parsed);
    }
  } catch (error) {
    throw new Error(
      i18n(`${i18nKey}.getCurrentState.errors.errorReading`, {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }

  return DEFAULT_STATE;
}

export function getStateValue<K extends keyof CLIState>(key: K): CLIState[K] {
  ensureCLIDirectory();

  try {
    const state = getCurrentState();
    return state[key];
  } catch (error) {
    logger.debug(error);
    return DEFAULT_STATE[key];
  }
}

export function setStateValue<K extends keyof CLIState>(
  key: K,
  value: CLIState[K]
): void {
  ensureCLIDirectory();

  let currentState: CLIState = DEFAULT_STATE;

  try {
    currentState = getCurrentState();
  } catch (error) {
    logger.debug(error);
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
