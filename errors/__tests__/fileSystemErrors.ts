import { throwFileSystemError } from '../fileSystemErrors';
import { BaseError } from '../../types/Error';

export const newError = (overrides = {}): BaseError => {
  return {
    name: 'Error',
    message: 'An error ocurred',
    errno: 1,
    code: 'error_code',
    syscall: 'error_syscall',
    errors: [],
    ...overrides,
  };
};

const fileSystemErrorContext = {
  filepath: 'some/path',
};

describe('errors/fileSystemErrors', () => {
  describe('throwFileSystemError()', () => {
    it('throws a fileSystemError', () => {
      expect(() => {
        throwFileSystemError(newError(), fileSystemErrorContext);
      }).toThrow();
    });
  });
});
