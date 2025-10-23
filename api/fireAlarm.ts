import { http } from '../http/index.js';
import { FireAlarm } from '../types/FireAlarm.js';
import { HubSpotPromise } from '../types/Http.js';

const FIREALARM_API_AUTH_PATH = 'firealarm/v4/alarm';

export function fetchFireAlarms(
  accountId: number
): HubSpotPromise<Array<FireAlarm>> {
  return http.get<Array<FireAlarm>>(accountId, {
    url: `${FIREALARM_API_AUTH_PATH}/hubspot-cli/${accountId}`,
  });
}
