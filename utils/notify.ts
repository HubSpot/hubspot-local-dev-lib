import fs from 'fs';
import moment from 'moment';
import debounce from 'debounce';

import { throwErrorWithMessage } from '../errors/standardErrors';
import { BaseError } from '../types/Error';

const notifyQueue: Array<string> = [];
const notifyPromises: Array<Promise<void>> = [];
const debouncedWaitForActionsToCompleteAndWriteQueueToFile = debounce(
  waitForActionsToCompleteAndWriteQueueToFile,
  500
);

// Collects actions that have been taken on files and the corresponding Promise
// for the remote action that is in-process
export function triggerNotify(
  filePathToNotify: string,
  actionType: string,
  filePath: string,
  actionPromise: Promise<void>
): void {
  if (filePathToNotify) {
    notifyQueue.push(`${moment().toISOString()} ${actionType}: ${filePath}\n`);
    notifyPromises.push(actionPromise);
    debouncedWaitForActionsToCompleteAndWriteQueueToFile(filePathToNotify);
  }
}

// Clears both the notifyQueue and notifyPromises array, generates the output
// string that will be eventually logged, and waits for all promises currently
// in the notifyPromises array to resolve before logging the output
function waitForActionsToCompleteAndWriteQueueToFile(
  filePathToNotify: string
): void {
  const actionOutput = notifyQueue.splice(0, notifyQueue.length).join('');
  const allNotifyPromisesResolution = Promise.all(
    notifyPromises.splice(0, notifyPromises.length)
  );

  allNotifyPromisesResolution.then(() =>
    notifyFilePath(filePathToNotify, actionOutput)
  );
}

// Logs output to the "notify" file
function notifyFilePath(filePathToNotify: string, outputToWrite: string): void {
  if (filePathToNotify) {
    try {
      fs.appendFileSync(filePathToNotify, outputToWrite);
    } catch (e) {
      throwErrorWithMessage(
        'utils.notify.filePath',
        { filePath: filePathToNotify },
        e as BaseError
      );
    }
  }
}
