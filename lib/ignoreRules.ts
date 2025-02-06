import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import findup from 'findup-sync';

const ignoreList = [
  'fields.output.json',
  'hubspot.config.yml',
  'hubspot.config.yaml',
  'node_modules', // dependencies
  'dist', // Build assets
  '.*', // hidden files/folders
  '*.log', // Error log for npm
  '*.swp', // Swap file for vim state
  '.env', // Dotenv file
  // # macOS
  'Icon\\r', // Custom Finder icon: http://superuser.com/questions/298785/icon-file-on-os-x-desktop
  '__MACOSX', // Resource fork

  // # Linux
  '~', // Backup file

  // # Emacs
  '*~', // Backup file

  // # Windows
  'Thumbs.db', // Image file cache
  'ehthumbs.db', // Folder config file
  'Desktop.ini', // Stores custom folder attributes
  '@eaDir', // Synology Diskstation "hidden" folder where the server stores thumbnails
] as const;

const ignoreRules = ignore().add(ignoreList);

let searchDomain: string | null = null;
let loaded = false;
function loadIgnoreConfig(isInProject = false): void {
  if (loaded) {
    return;
  }

  // Temporary solution to improve serverless beta: https://git.hubteam.com/HubSpot/cms-devex-super-repo/issues/2
  // Do not do this when in a developer project b/c we want the package-lock.json file uploaded.
  if (!isInProject) {
    ignoreRules.add('package-lock.json');
  }

  const file = findup('.hsignore');
  if (file) {
    if (fs.existsSync(file)) {
      ignoreRules.add(fs.readFileSync(file).toString());
      searchDomain = path.dirname(file);
    }
  }
  loaded = true;
}

export function shouldIgnoreFile(file: string, isInProject = false): boolean {
  loadIgnoreConfig(isInProject);
  const relativeTo = searchDomain || '/';
  const relativePath = path.relative(relativeTo, file);

  return !!relativePath && ignoreRules.ignores(relativePath);
}

export function createIgnoreFilter(
  isInProject: boolean
): (file: string) => boolean {
  loadIgnoreConfig(isInProject);
  return (file: string) => !shouldIgnoreFile(file);
}

export function ignoreFile(filePath: string): void {
  ignoreRules.add(filePath);
}
