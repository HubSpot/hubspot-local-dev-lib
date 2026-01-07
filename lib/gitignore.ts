import fs from 'fs-extra';
import path from 'path';

import {
  isConfigPathInGitRepo,
  getGitignoreFiles,
  configFilenameIsIgnoredByGitignore,
} from '../utils/git.js';
import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../constants/config.js';
import { i18n } from '../utils/lang.js';
import { GitInclusionResult } from '../types/Config.js';

const i18nKey = 'lib.gitignore';

const GITIGNORE_FILE = '.gitignore';

export function checkAndAddConfigToGitignore(configPath: string): void {
  try {
    const { configIgnored, gitignoreFiles } = checkGitInclusion(configPath);
    if (configIgnored) return;

    let gitignoreFilePath =
      gitignoreFiles && gitignoreFiles.length ? gitignoreFiles[0] : null;

    if (!gitignoreFilePath) {
      gitignoreFilePath = path.join(path.dirname(configPath), GITIGNORE_FILE);
      fs.writeFileSync(gitignoreFilePath, '');
    }

    const gitignoreContents = fs.readFileSync(gitignoreFilePath).toString();
    const updatedContents = `${gitignoreContents.trim()}\n\n# HubSpot config file\n${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME}\n`;
    fs.writeFileSync(gitignoreFilePath, updatedContents);
  } catch (e) {
    throw new Error(i18n(`${i18nKey}.errors.configIgnore`), { cause: e });
  }
}

export function checkGitInclusion(configPath: string): GitInclusionResult {
  const result: GitInclusionResult = {
    inGit: false,
    configIgnored: false,
    gitignoreFiles: [],
  };

  if (isConfigPathInGitRepo(configPath)) {
    result.inGit = true;
    result.gitignoreFiles = getGitignoreFiles(configPath);

    if (configFilenameIsIgnoredByGitignore(result.gitignoreFiles, configPath)) {
      // Found ignore statement in .gitignore that matches config filename
      result.configIgnored = true;
    }
  }
  return result;
}
