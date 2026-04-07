import * as fs from 'fs';
import * as path from 'path';
import { i18n } from '../utils/lang.js';
import { STATE_FILE_PATH } from '../constants/config.js';
import { logger } from '../lib/logger.js';
import { HubSpotState } from '../types/Config.js';
import { STATE_FLAGS } from '../constants/config.js';

const i18nKey = 'config.state';

const DEFAULT_STATE: HubSpotState = {
  [STATE_FLAGS.MCP_TOTAL_TOOL_CALLS]: 0,
  [STATE_FLAGS.USAGE_TRACKING_MESSAGE_LAST_SHOW_VERSION]: undefined,
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

function parseState(parsed: unknown): HubSpotState {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return structuredClone(DEFAULT_STATE);
  }

  return { ...DEFAULT_STATE, ...(parsed as HubSpotState) };
}

function getCurrentState(): HubSpotState {
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
    return parseState(parsed);
  } catch (error) {
    logger.debug(
      i18n(`${i18nKey}.getCurrentState.errors.errorReading`, {
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return structuredClone(DEFAULT_STATE);
  }
}

export function getStateValue<K extends keyof HubSpotState>(
  key: K
): HubSpotState[K] {
  ensureCLIDirectory();

  const state = getCurrentState();
  return state[key];
}

export function setStateValue<K extends keyof HubSpotState>(
  key: K,
  value: HubSpotState[K]
): void {
  ensureCLIDirectory();

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
