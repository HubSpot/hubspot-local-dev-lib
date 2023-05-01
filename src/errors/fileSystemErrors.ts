import { i18n } from '../utils/lang';
import { isSystemError } from './standardErrors';
import { BaseError } from '../types/Error';

const i18nKey = 'errors.errorTypes.fileSystem';

type FileSystemErrorContext = {
  filepath: string;
  write?: boolean;
  read?: boolean;
};

export function throwFileSystemError(
  error: BaseError,
  context: FileSystemErrorContext
) {
  let fileAction = '';
  if (context.read) {
    fileAction = i18n(`${i18nKey}.readAction`);
  } else if (context.write) {
    fileAction = i18n(`${i18nKey}.writeAction`);
  } else {
    fileAction = i18n(`${i18nKey}.otherAction`);
  }

  const filepath = context.filepath
    ? `"${context.filepath}"`
    : i18n(`${i18nKey}.unknownFilepath`);
  const message = [i18n(`${i18nKey}.baseMessage`, { fileAction, filepath })];

  // Many `fs` errors will be `SystemError`s
  if (isSystemError(error)) {
    message.push(
      i18n(`${i18nKey}.baseMessage`, { errorMessage: error.message })
    );
  }

  throw new Error(message.join(' '), { cause: Error });
}
