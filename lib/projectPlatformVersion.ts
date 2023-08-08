import { fetchPlatformVersions } from '../api/developerProjects';

export async function fetchDefaultVersion(accountId: number): Promise<string> {
  const platformVersions = await fetchPlatformVersions(accountId);
  return platformVersions.defaultPlatformVersion;
}
