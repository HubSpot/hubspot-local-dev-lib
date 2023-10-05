import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { checkGitInclusion } from '../../utils/git';
import { logger } from './logger';
import { i18n } from '../../utils/lang';
import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../../constants/config';

const GITIGNORE_FILE = '.gitignore';

const i18nKey = 'debug.git';

export function checkAndWarnGitInclusion(configPath: string): void {
  try {
    const { inGit, configIgnored } = checkGitInclusion(configPath);

    if (!inGit || configIgnored) return;
    logger.warn(i18n(`${i18nKey}.securityIssue`));
    logger.warn(i18n(`${i18nKey}.configFileTracked`));
    logger.warn(i18n(`${i18nKey}.fileName`, { configPath }));
    logger.warn(i18n(`${i18nKey}.remediate`, { homeDir: os.homedir(), configPath }));
  } catch (e) {
    // fail silently
    logger.debug(i18n(`${i18nKey}.checkFailed`));
  }
}

export function checkAndUpdateGitignore(configPath: string): void {
  try {
    const { configIgnored, gitignoreFiles } = checkGitInclusion(configPath);
    if (configIgnored) return;

    let gitignoreFilePath =
      gitignoreFiles && gitignoreFiles.length ? gitignoreFiles[0] : null;

    if (!gitignoreFilePath) {
      gitignoreFilePath = path.resolve(configPath, GITIGNORE_FILE);

      // TODO: Figure out if this ever worked
      // fs.writeFileSync(gitignoreFilePath);
    }

    const gitignoreContents = fs.readFileSync(gitignoreFilePath).toString();
    const updatedContents = `${gitignoreContents.trim()}\n\n# HubSpot config file\n${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME}\n`;
    fs.writeFileSync(gitignoreFilePath, updatedContents);
  } catch (e) {
    // fail silently
    logger.debug(i18n(`${i18nKey}.checkFailed`));
  }
}
