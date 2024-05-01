import http from '../http';
import { FetchAppsResponse } from '../types/App';

const APPS_API_PATH = 'apps-dev/public/v3';

export async function fetchPublicApps(
  accountId: number
): Promise<FetchAppsResponse> {
  return http.get(accountId, {
    url: `${APPS_API_PATH}/portal`,
  });
}

// TEST DATA
// export async function fetchPublicApps(accountId: number) {
//   return Promise.resolve([
//     {
//       id: 1000000,
//       name: 'Getting Started App',
//       description:
//         'An example project of how to build a Public App with Developer Projects',
//       portalId: 123456789,
//       updatedAt: 1713382701719,
//       createdAt: 1713380475769,
//       clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
//       iconUrl: null,
//       archived: false,
//       ownerId: 7654321,
//       isUserLevel: false,
//       isBusinessUnitEnabled: false,
//       isFeatured: false,
//       isInternal: false,
//       documentationUrl: 'https://example.com/docs',
//       supportUrl: 'https://example.com/support',
//       supportEmail: 'support@example.com',
//       supportPhone: '+18005555555',
//       extensionIconUrl: null,
//       isAdvancedScopesSettingEnabled: true,
//     },
//   ]);
// }
