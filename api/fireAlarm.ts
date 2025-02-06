import { http } from '../http';
import { FireAlarmResponse } from '../types/FireAlarm';
import { HubSpotPromise } from '../types/Http';

const FIREALARM_API_AUTH_PATH = 'firealarm/v4/alarm';

export function fetchFireAlarms(
  accountId: number
): HubSpotPromise<Array<FireAlarmResponse>> {
  return http.get<Array<FireAlarmResponse>>(accountId, {
    url: `${FIREALARM_API_AUTH_PATH}/hubspot-cli/${accountId}`,
  });
}
