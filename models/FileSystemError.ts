import { FileSystemErrorContext } from '../types/Error';
import { i18n } from '../utils/lang';
import { isSystemError } from '../errors';

const i18nKey = 'errors.fileSystemErrors';

export class FileSystemError extends Error {
  constructor(options?: ErrorOptions, context?: FileSystemErrorContext) {
    super('', options);
    this.name = 'FileSystemError';

    if (context) {
      let fileAction = '';
      if (context.operation === 'read') {
        fileAction = i18n(`${i18nKey}.readAction`);
      } else if (context.operation === 'write') {
        fileAction = i18n(`${i18nKey}.writeAction`);
      } else {
        fileAction = i18n(`${i18nKey}.otherAction`);
      }

      const filepath = context.filepath
        ? `"${context.filepath}"`
        : i18n(`${i18nKey}.unknownFilepath`);
      const messages = [
        i18n(`${i18nKey}.baseMessage`, { fileAction, filepath }),
      ];

      // Many `fs` errors will be `SystemError`s
      if (isSystemError(options?.cause)) {
        messages.push(
          i18n(`${i18nKey}.baseMessage`, {
            errorMessage: options?.cause?.message || '',
          })
        );
      }

      this.message = messages.join(' ');
    }
  }
}
