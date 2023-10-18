import fs from 'fs-extra';
import path from 'path';
import ignore from 'ignore';
import findup from 'findup-sync';

const GITIGNORE_FILE = '.gitignore';

function makeComparisonDir(filepath: string | null): string | null {
  if (typeof filepath !== 'string') return null;
  // Append sep to make comparisons easier e.g. 'foos'.startsWith('foo')
  return path.dirname(path.resolve(filepath)).toLowerCase() + path.sep;
}

function getGitComparisonDir(): string | null {
  return makeComparisonDir(findup('.git'));
}

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
    const cmpGitDir = makeComparisonDir(gitDir);
    if (
      ignorePath &&
      cmpIgnorePath &&
      cmpGitDir &&
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

type GitInclusionResult = {
  inGit: boolean;
  configIgnored: boolean;
  gitignoreFiles: Array<string>;
};

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
