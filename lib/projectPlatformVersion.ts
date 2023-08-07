import { fetchPlatformVersions } from '../api/developerProjects';

export const fetchDefaultVersion = async (accountId: number) => {
  const platformVersions = await fetchPlatformVersions(accountId);
  return platformVersions.defaultPlatformVersion;
};
