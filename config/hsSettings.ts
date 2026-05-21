import findupSync from 'findup-sync';
import fs from 'fs';
import path from 'path';
import {
  HS_FOLDER,
  HS_README_FILENAME,
  HS_SETTINGS_FILENAME,
} from '../constants/config.js';
import { getCwd } from '../lib/path.js';
import { HsSettingsFile } from '../types/HsSettings.js';
import { FileSystemError } from '../models/FileSystemError.js';

const HS_README_CONTENTS = `Why do I have a folder named ".hs" in my project?
The ".hs" folder is created when you link a directory to a HubSpot account using "hs account link". The CLI walks up parent directories to find the nearest ".hs/settings.json", so subdirectories inherit the same configuration.

What does the "settings.json" file contain?
The "settings.json" file contains:
- The ID(s) of the HubSpot account(s) linked to this directory ("accounts")
- The ID of the default account for this directory ("localDefaultAccount")

These accounts are a subset of those authenticated in your global CLI config (~/.hscli/config.yml).

Should I commit the ".hs" folder?
We recommend not committing this folder. These settings are per-developer configuration, and different team members typically use different accounts or defaults. If your directory is in a Git repository, ".hs" is automatically added to .gitignore when you link.

If your team shares the same accounts, you can remove the .gitignore entry and commit the folder.

How do I manage linked accounts?
Run "hs account link" to add accounts, "hs account unlink" to remove them, or "hs account list" to see what's linked.

Can I delete this file?
Yes. This README is for your reference only and can be safely deleted.
`;

export function getHsSettingsFilePath(): string | null {
  return findupSync([`${HS_FOLDER}/${HS_SETTINGS_FILENAME}`], {
    cwd: getCwd(),
  });
}

export function getHsSettingsFileIfExists(): HsSettingsFile | null {
  const hsSettingsFilePath = getHsSettingsFilePath();

  if (!hsSettingsFilePath) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(hsSettingsFilePath, 'utf-8'));
  } catch (e) {
    throw new FileSystemError(
      { cause: e },
      {
        filepath: hsSettingsFilePath,
        operation: 'read',
      }
    );
  }
}

export function writeHsSettingsFile(settingsFile: HsSettingsFile): void {
  const existingFilePath = getHsSettingsFilePath();
  const dir = getCwd();
  const hsFolderPath = existingFilePath
    ? path.dirname(existingFilePath)
    : path.join(dir, HS_FOLDER);
  const isFirstScaffold = !fs.existsSync(hsFolderPath);

  try {
    fs.mkdirSync(hsFolderPath, { recursive: true });
    fs.writeFileSync(
      path.join(hsFolderPath, HS_SETTINGS_FILENAME),
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
