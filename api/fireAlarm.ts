import { http } from '../http';
import { FireAlarm } from '../types/FireAlarm';
import { HubSpotPromise } from '../types/Http';

export const FIREALARM_API_AUTH_PATH = 'firealarm/v4/alarm';

export function fetchFireAlarms(
  accountId: number
): HubSpotPromise<Array<FireAlarm>> {
  return http.get<Array<FireAlarm>>(accountId, {
    url: `${FIREALARM_API_AUTH_PATH}/hubspot-cli/${accountId}`,
  });
}
