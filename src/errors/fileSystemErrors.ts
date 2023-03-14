import { isSystemError, debugErrorAndContext } from './standardErrors';
import { BaseError, FileSystemErrorContext } from '../types/Error';

export function throwFileSystemError(
  error: BaseError,
  context: FileSystemErrorContext
) {
  debugErrorAndContext(error, context);

  let fileAction = '';
  if (context.read) {
    fileAction = 'reading from';
  } else if (context.write) {
    fileAction = 'writing to';
  } else {
    fileAction = 'accessing';
  }

  const filepath = context.filepath
    ? `"${context.filepath}"`
    : 'a file or folder';
  const message = [`An error occurred while ${fileAction} ${filepath}.`];

  // Many `fs` errors will be `SystemError`s
  if (isSystemError(error)) {
    message.push(`This is the result of a system error: ${error.message}`);
  }

  throw new Error(message.join(' '));
}
