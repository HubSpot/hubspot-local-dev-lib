import { readFileSync, writeFileSync } from 'fs-extra';
import path from 'path';

import { checkGitInclusion } from '../utils/git';
import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../constants/config';
import { throwErrorWithMessage } from '../errors/standardErrors';
import { BaseError } from '../types/Error';

const GITIGNORE_FILE = '.gitignore';

export function checkAndAddConfigToGitignore(configPath: string): void {
  try {
    const { configIgnored, gitignoreFiles } = checkGitInclusion(configPath);
    if (configIgnored) return;

    let gitignoreFilePath =
      gitignoreFiles && gitignoreFiles.length ? gitignoreFiles[0] : null;

    if (!gitignoreFilePath) {
      gitignoreFilePath = path.resolve(configPath, GITIGNORE_FILE);
      writeFileSync(gitignoreFilePath, '');
    }

    const gitignoreContents = readFileSync(gitignoreFilePath).toString();
    const updatedContents = `${gitignoreContents.trim()}\n\n# HubSpot config file\n${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME}\n`;
    writeFileSync(gitignoreFilePath, updatedContents);
  } catch (e) {
    throwErrorWithMessage('utils.git.configIgnore', {}, e as BaseError);
  }
}
