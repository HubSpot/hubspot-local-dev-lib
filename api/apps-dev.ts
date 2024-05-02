import http from '../http';

const APPS_DEV_API_PATH = 'apps-dev/external/public/v3';

export function fetchPublicAppsForPortal(portalId: number) {
  return http.get(portalId, {
    url: `${APPS_DEV_API_PATH}/full/portal`,
  });
}
