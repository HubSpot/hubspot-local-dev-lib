import http from '../http';
import { HubSpotAccounInfo } from '../types/HubSpotAccount';

const HUB_INFO_PATH = 'hubs2/v1/info/hub';

export async function getAccountInfo(
  accountId: number
): Promise<HubSpotAccounInfo> {
  return http.get<HubSpotAccounInfo>(accountId, {
    url: `${HUB_INFO_PATH}/${accountId}`,
  });
}
