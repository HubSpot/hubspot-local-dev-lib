import { fetchPlatformVersions } from '../api/developerProjects';

export const fetchDefaultVersion = async (accountId: number) => {
  const platformVersions = await fetchPlatformVersions(accountId);
  // @ts-expect-error Property 'defaultPlatformVersion' does not exist on type 'Response'.
  return platformVersions.defaultPlatformVersion;
};
