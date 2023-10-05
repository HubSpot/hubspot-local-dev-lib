import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import ignore from 'ignore';
import findup from 'findup-sync';
import { logger } from './logger';
import { i18n } from '../../utils/lang';
import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../../constants/config';

const GITIGNORE_FILE = '.gitignore';

const i18nKey = 'debug.git';

function makeComparisonDir(filepath: string | null): string | null {
  if (typeof filepath !== 'string') return null;
  // Append sep to make comparisons easier e.g. 'foos'.startsWith('foo')
  return path.dirname(path.resolve(filepath)).toLowerCase() + path.sep;
}

function getGitComparisonDir(): string | null { return makeComparisonDir(findup('.git')) }

// Get all .gitignore files since they can cascade down directory structures
function getGitignoreFiles(configPath: string): Array<string> {
  const gitDir = getGitComparisonDir();
  const files = [] as Array<string>;
  if (!gitDir) {
    // Not in git
    return files;
  }
  // Start findup from config dir
  let cwd: string | null = configPath && path.dirname(configPath);
  while (cwd) {
    const ignorePath = findup(GITIGNORE_FILE, { cwd });
    const cmpIgnorePath = makeComparisonDir(ignorePath);
    const cmpGitDir =  makeComparisonDir(gitDir);
    if (
      ignorePath &&
      cmpIgnorePath && cmpGitDir &&
      // Stop findup after .git dir is reached
      cmpIgnorePath.startsWith(cmpGitDir)
    ) {
      const file = path.resolve(ignorePath);
      files.push(file);
      cwd = path.resolve(path.dirname(file) + '..');
    } else {
      cwd = null;
    }
  }
  return files;
}

function isConfigPathInGitRepo(configPath: string): boolean {
  const gitDir = getGitComparisonDir();
  if (!gitDir) return false;
  const configDir = makeComparisonDir(configPath);
  if (!configDir) return false;
  return configDir.startsWith(gitDir);
}

function configFilenameIsIgnoredByGitignore(ignoreFiles: Array<string>, configPath: string): boolean {
  return ignoreFiles.some(gitignore => {
    const gitignoreContents = fs.readFileSync(gitignore).toString();
    const gitignoreConfig = ignore().add(gitignoreContents);
    if (
      gitignoreConfig.ignores(
        path.relative(path.dirname(gitignore), configPath)
      )
    ) {
      return true;
    }
    return false;
  });
}

type Result = {
  inGit: boolean;
  configIgnored: boolean;
  gitignoreFiles: Array<string>
}

function checkGitInclusion(configPath: string): Result {
  const result = { inGit: false, configIgnored: false, gitignoreFiles: [] as string[] };

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
