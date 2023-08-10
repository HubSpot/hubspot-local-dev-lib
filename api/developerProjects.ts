import http from '../http';

const DEVELOPER_PROJECTS_API_PATH = 'developer/projects/v1';

type FetchPlatformVersionResponse = {
  defaultPlatformVersion: string;
  activePlatformVersions: Array<string>;
};

export async function fetchPlatformVersions(
  accountId: number
): Promise<FetchPlatformVersionResponse> {
  return http.get(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/platformVersion`,
  });
}
