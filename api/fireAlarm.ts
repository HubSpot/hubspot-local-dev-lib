import { http } from '../http/index.js';
import { FIREALARM_API_AUTH_PATH } from '../constants/endpoints.js';
import { FireAlarm } from '../types/FireAlarm.js';
import { HubSpotPromise } from '../types/Http.js';

export function fetchFireAlarms(
  accountId: number
): HubSpotPromise<Array<FireAlarm>> {
  return http.get<Array<FireAlarm>>(accountId, {
    url: `${FIREALARM_API_AUTH_PATH}/hubspot-cli/${accountId}`,
  });
}
