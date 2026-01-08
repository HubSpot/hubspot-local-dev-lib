import { FileSystemErrorContext } from '../types/Error.js';
import { i18n } from '../utils/lang.js';
import { isSystemError } from '../errors/isSystemError.js';

const i18nKey = 'errors.fileSystemErrors';

export const FilerSystemErrorName = 'FilerSystemError';

export class FileSystemError extends Error {
  private context: FileSystemErrorContext | undefined;

  constructor(options?: ErrorOptions, context?: FileSystemErrorContext) {
    super('', options);
    this.name = FilerSystemErrorName;
    this.context = context;

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

  public toString() {
    let baseString = `${this.name}: ${this.message}`;
    if (this.context) {
      baseString = `${baseString} context: ${this.context}`;
    }
    return baseString;
  }
}
