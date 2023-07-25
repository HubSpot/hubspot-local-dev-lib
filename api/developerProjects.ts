import http from '../http';

const DEVELOPER_PROJECTS_API_PATH = 'developer/projects/v1';

/**
 * Fetch default project platform version along with list of active platform versions
 *
 * @async
 * @returns {Promise}
 */
export async function fetchPlatformVersions(accountId: number) {
  return http.get(accountId, {
    uri: `${DEVELOPER_PROJECTS_API_PATH}/platformVersion`,
  });
}
