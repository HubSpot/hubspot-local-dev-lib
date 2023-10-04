import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import ignore from 'ignore';
import findup from 'findup-sync';
import { logger } from './logger';

const GITIGNORE_FILE = '.gitignore';

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
    logger.warn('Security Issue Detected');
    logger.warn('The HubSpot config file can be tracked by git.');
    logger.warn(`File: "${configPath}"`);
    logger.warn(`To remediate:
      - Move the config file to your home directory: "${os.homedir()}"
      - Add gitignore pattern "${path.basename(
        configPath
      )}" to a .gitignore file in root of your repository.
      - Ensure that the config file has not already been pushed to a remote repository.
    `);
  } catch (e) {
    // fail silently
    logger.debug(
      'Unable to determine if config file is properly ignored by git.'
    );
  }
}
