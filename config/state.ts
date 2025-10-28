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

function sanitizeAndMerge(parsed: unknown): CLIState {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return structuredClone(DEFAULT_STATE);
  }

  const state = parsed as Record<string, unknown>;
  const result: CLIState = structuredClone(DEFAULT_STATE);

  for (const key in DEFAULT_STATE) {
    const typedKey = key as keyof CLIState;
    if (key in state && typeof state[key] === typeof DEFAULT_STATE[typedKey]) {
      (result as any)[typedKey] = state[key];
    }
    // keys not in parsed file remain as DEFAULT values
  }

  return result;
}

function getCurrentState(): CLIState {
  try {
    if (!fs.existsSync(STATE_FILE_PATH)) {
      return structuredClone(DEFAULT_STATE);
    }

    const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');

    if (!data?.trim()) {
      logger.debug(i18n(`${i18nKey}.getCurrentState.debug.emptyStateFile`));
      return structuredClone(DEFAULT_STATE);
    }

    const parsed = JSON.parse(data);
    return sanitizeAndMerge(parsed);
  } catch (error) {
    logger.debug(
      i18n(`${i18nKey}.getCurrentState.errors.errorReading`, {
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return structuredClone(DEFAULT_STATE);
  }
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

  // getCurrentState never throws - it returns DEFAULT_STATE on any error
  const currentState = getCurrentState();
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
