import findup from 'findup-sync';
import { getHubSpotWebsiteOrigin } from '../urls';
import { ENVIRONMENTS } from '../../constants/environments';
import config from '../../config/CLIConfiguration';

export function getThemeJSONPath(path: string): string | null {
  return findup('theme.json', {
    cwd: path,
    nocase: true,
  });
}

function getThemeNameFromPath(filePath: string): string | undefined {
  const themeJSONPath = getThemeJSONPath(filePath);
  if (!themeJSONPath) return;
  const pathParts = themeJSONPath.split('/');
  if (pathParts.length < 2) return;
  return pathParts[pathParts.length - 2];
}

export function getThemePreviewUrl(
  filePath: string,
  accountId: number
): string | undefined {
  const themeName = getThemeNameFromPath(filePath);
  if (!themeName) return;

  const baseUrl = getHubSpotWebsiteOrigin(
    config.getEnv() === 'qa' ? ENVIRONMENTS.QA : ENVIRONMENTS.PROD
  );

  return `${baseUrl}/theme-previewer/${accountId}/edit/${encodeURIComponent(
    themeName
  )}`;
}
