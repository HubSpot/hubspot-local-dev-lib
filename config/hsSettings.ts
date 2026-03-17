import findupSync from 'findup-sync';
import fs from 'fs';
import path from 'path';
import {
  HS_FOLDER,
  HS_README_FILENAME,
  HS_SETTINGS_FILENAME,
  HS_SETTINGS_PATH,
} from '../constants/config.js';
import { getCwd } from '../lib/path.js';
import { HsSettingsFile } from '../types/HsSettings.js';
import { FileSystemError } from '../models/FileSystemError.js';

const HS_README_CONTENTS = `Why do I have a folder named ".hs" in my project?
The ".hs" folder is created when you link a directory to a HubSpot project.

What does the "settings.json" file contain?
The "settings.json" file contains:
- The ID(s) of the HubSpot account(s) that you linked ("accounts")
- The ID of the HubSpot account that you set as the default for this directory ("linkedDefaultAccount")

Should I commit the ".hs" folder?
No, the ".hs" folder should not be committed to version control. It is automatically added to your .gitignore file when the directory is linked.
`;

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
  const hsFolderPath = path.join(dir, HS_FOLDER);
  const isFirstScaffold = !fs.existsSync(hsFolderPath);

  try {
    fs.mkdirSync(hsFolderPath, { recursive: true });
    fs.writeFileSync(
      HS_SETTINGS_PATH,
      JSON.stringify(settingsFile, null, 2),
      'utf8'
    );

    if (isFirstScaffold) {
      fs.writeFileSync(
        path.join(hsFolderPath, HS_README_FILENAME),
        HS_README_CONTENTS,
        'utf8'
      );
    }
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
