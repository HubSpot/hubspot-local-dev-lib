import { fetchFireAlarms } from '../api/fireAlarm';
import { FireAlarmResponse } from '../types/FireAlarm';

export async function getFireAlarmForCommand(
  accountId: number,
  command: string
): Promise<FireAlarmResponse | undefined> {
  console.log('Getting fire alarm for command', command);
  const fireAlarms = await fetchFireAlarms(accountId);

  let globalFireAlarm: FireAlarmResponse | undefined;

  if (fireAlarms.data.length) {
    for (const fireAlarm of fireAlarms.data) {
      if (fireAlarm.querySelector === command) {
        return fireAlarm;
      } else if (!fireAlarm.querySelector) {
        globalFireAlarm = fireAlarm;
      }
    }
  }

  return globalFireAlarm;
}
