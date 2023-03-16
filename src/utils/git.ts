import { readFileSync, writeFileSync } from 'fs-extra';
import * as path from 'path';
import ignore from 'ignore';
import findup from 'findup-sync';
import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../constants/config';
import { throwErrorWithMessage } from '../errors/standardErrors';

const GITIGNORE_FILE = '.gitignore';

function makeComparisonDir(filepath: string | null): string | null {
  if (typeof filepath !== 'string') return null;
  // Append sep to make comparisons easier e.g. 'foos'.startsWith('foo')
  return path.dirname(path.resolve(filepath)).toLowerCase() + path.sep;
}

const getGitComparisonDir = () => makeComparisonDir(findup('.git'));

// Get all .gitignore files since they can cascade down directory structures
function getGitignoreFiles(configPath: string): Array<string> {
  const gitDir = getGitComparisonDir();
  const files: Array<string> = [];
  if (!gitDir) {
    // Not in git
    return files;
  }
  // Start findup from config dir
  let cwd: string | null = configPath && path.dirname(configPath);
  while (cwd) {
    const ignorePath = findup(GITIGNORE_FILE, { cwd });
    const ignorePathComparisonDir = makeComparisonDir(ignorePath);
    const gitComparisonDir = makeComparisonDir(gitDir);
    if (
      ignorePath &&
      ignorePathComparisonDir &&
      gitComparisonDir &&
      ignorePathComparisonDir.startsWith(gitComparisonDir)
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

export function isConfigPathInGitRepo(configPath: string): boolean {
  const gitDir = getGitComparisonDir();
  if (!gitDir) return false;
  const configDir = makeComparisonDir(configPath);
  if (!configDir) return false;
  return configDir.startsWith(gitDir);
}

export function configFilenameIsIgnoredByGitignore(
  ignoreFiles: Array<string>,
  configPath: string
): boolean {
  return ignoreFiles.some(gitignore => {
    const gitignoreContents = readFileSync(gitignore).toString();
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

type GitInclusionResult = {
  inGit: boolean;
  configIgnored: boolean;
  gitignoreFiles: Array<string>;
};

function checkGitInclusion(configPath: string): GitInclusionResult {
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
    throw throwErrorWithMessage('utils.git.configIgnore');
  }
}
