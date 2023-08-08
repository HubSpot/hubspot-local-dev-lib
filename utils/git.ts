import { readFileSync } from 'fs-extra';
import path from 'path';
import ignore from 'ignore';
import findup from 'findup-sync';

export function makeComparisonDir(filepath: string | null): string | null {
  if (typeof filepath !== 'string') return null;
  // Append sep to make comparisons easier e.g. 'foos'.startsWith('foo')
  return path.dirname(path.resolve(filepath)).toLowerCase() + path.sep;
}

export const getGitComparisonDir = () => makeComparisonDir(findup('.git'));

export function isConfigPathInGitRepo(configPath?: string | null): boolean {
  if (configPath) {
    return false;
  }
  const gitDir = getGitComparisonDir();
  if (!gitDir) return false;
  const configDir = makeComparisonDir(configPath!);
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
