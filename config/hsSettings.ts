import findupSync from 'findup-sync';
import fs from 'fs';
import path from 'path';
import {
  HS_FOLDER,
  HS_SETTINGS_FILENAME,
  HS_SETTINGS_PATH,
} from '../constants/config.js';
import { getCwd } from '../lib/path.js';
import { HsSettingsFile } from '../types/HsSettings.js';
import { FileSystemError } from '../models/FileSystemError.js';

export function getHsSettingsFilePath(): string | null {
  return findupSync([`${HS_FOLDER}/${HS_SETTINGS_FILENAME}`], {
    cwd: getCwd(),
  });
}

export function getHsSettingsFile(): HsSettingsFile | null {
  const hsSettingsFilePath = getHsSettingsFilePath();

  if (!hsSettingsFilePath) {
    return null;
  }

  let hsSettingsFile: HsSettingsFile;

  try {
    hsSettingsFile = JSON.parse(fs.readFileSync(hsSettingsFilePath, 'utf-8'));
  } catch (e) {
    throw new FileSystemError(
      { cause: e },
      {
        filepath: hsSettingsFilePath,
        operation: 'read',
      }
    );
  }

  return hsSettingsFile;
}

export function writeHsSettingsFile(settingsFile: HsSettingsFile): void {
  const dir = getCwd();
  try {
    fs.mkdirSync(path.join(dir, HS_FOLDER), { recursive: true });
    fs.writeFileSync(
      HS_SETTINGS_PATH,
      JSON.stringify(settingsFile, null, 2),
      'utf8'
    );
  } catch (err) {
    throw new FileSystemError(
      { cause: err },
      {
        filepath: dir,
        operation: 'write',
      }
    );
  }
}
