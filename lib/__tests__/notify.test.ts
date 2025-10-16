vi.mock('fs');
import { triggerNotify } from '../notify.js';
import fs from 'fs';
import { vi, type MockedFunction } from 'vitest';
const fsAppendSyncMock = fs.appendFileSync as MockedFunction<
  typeof fs.appendFileSync
>;

describe('lib/notify', () => {
  let now: number;
  beforeEach(() => {
    now = Date.now();
    // Use fake timers so we can test the debounce functionality
    vi.useFakeTimers({ now });
  });
  describe('triggerNotify', () => {
    const filePathToNotify = '/my/super/cool/file/to/notify';
    const actionType = 'Added';
    const filePath = '/my/super/cool/file';

    it('should append to the expected file correctly', async () => {
      triggerNotify(
        filePathToNotify,
        actionType,
        filePath,
        new Promise(resolve => {
          resolve();
        })
      );

      // Advance all of the timers to trigger the debounce
      await vi.runAllTimersAsync();

      expect(fsAppendSyncMock).toHaveBeenCalledTimes(1);
      expect(fsAppendSyncMock).toHaveBeenCalledWith(
        filePathToNotify,
        `${new Date(now).toISOString()} ${actionType}: ${filePath}\n`
      );
    });

    it('should debounce file system writes', async () => {
      let output = '';
      // Call the method 10 times
      for (let i = 0; i < 10; i++) {
        triggerNotify(
          filePathToNotify,
          actionType,
          filePath,
          new Promise(resolve => {
            resolve();
          })
        );
        output = `${output}${new Date(
          now
        ).toISOString()} ${actionType}: ${filePath}\n`;
      }

      // Advance all of the timers to trigger the debounce
      await vi.runAllTimersAsync();

      // Make sure the 10 calls still only lead to 1 write
      expect(fsAppendSyncMock).toHaveBeenCalledTimes(1);
      expect(fsAppendSyncMock).toHaveBeenCalledWith(filePathToNotify, output);
    });
  });
});
