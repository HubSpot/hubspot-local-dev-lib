import fs from 'fs';
import path from 'path';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { findup } from '../findup.js';

vi.mock('fs');

const mockExistsSync = vi.mocked(fs.existsSync);
const mockReaddirSync = vi.mocked(
  fs.readdirSync as (dir: fs.PathLike) => Array<string>
);

function mockFileSystem(filePaths: Array<string>): void {
  mockExistsSync.mockImplementation(filePath =>
    filePaths.includes(String(filePath))
  );
  mockReaddirSync.mockImplementation(dir => {
    const entries = filePaths
      .filter(filePath => path.dirname(filePath) === String(dir))
      .map(filePath => path.basename(filePath));
    if (!entries.length) {
      throw new Error(`ENOENT: ${dir}`);
    }
    return entries;
  });
}

describe('utils/findup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the file in cwd when it exists', () => {
    mockFileSystem(['/project/src/theme.json']);

    expect(findup('theme.json', { cwd: '/project/src' })).toBe(
      '/project/src/theme.json'
    );
  });

  it('walks up to parent directories', () => {
    mockFileSystem(['/project/hubspot.config.yml']);

    expect(findup('hubspot.config.yml', { cwd: '/project/src/a/b' })).toBe(
      '/project/hubspot.config.yml'
    );
  });

  it('returns null when no parent directory contains the file', () => {
    mockFileSystem(['/other/hubspot.config.yml']);

    expect(findup('hubspot.config.yml', { cwd: '/project/src' })).toBeNull();
  });

  it('checks every name in a directory before moving to the parent', () => {
    mockFileSystem([
      '/project/hubspot.config.yml',
      '/project/src/hubspot.config.yaml',
    ]);

    expect(
      findup(['hubspot.config.yml', 'hubspot.config.yaml'], {
        cwd: '/project/src',
      })
    ).toBe('/project/src/hubspot.config.yaml');
  });

  it('returns the first matching name when several exist in one directory', () => {
    mockFileSystem([
      '/project/hubspot.config.yml',
      '/project/hubspot.config.yaml',
    ]);

    expect(
      findup(['hubspot.config.yaml', 'hubspot.config.yml'], {
        cwd: '/project',
      })
    ).toBe('/project/hubspot.config.yaml');
  });

  it('supports names that include a subdirectory', () => {
    mockFileSystem(['/project/.hs/settings.json']);

    expect(findup('.hs/settings.json', { cwd: '/project/src' })).toBe(
      '/project/.hs/settings.json'
    );
  });

  it('matches names case-insensitively when nocase is set', () => {
    mockFileSystem(['/project/theme/Theme.JSON']);

    expect(
      findup('theme.json', { cwd: '/project/theme/templates', nocase: true })
    ).toBe('/project/theme/Theme.JSON');
  });

  it('does not match names case-insensitively by default', () => {
    mockFileSystem(['/project/theme/Theme.JSON']);

    expect(findup('theme.json', { cwd: '/project/theme' })).toBeNull();
    expect(mockReaddirSync).not.toHaveBeenCalled();
  });

  it('defaults cwd to process.cwd()', () => {
    mockFileSystem(['/project/.hsignore']);
    vi.spyOn(process, 'cwd').mockReturnValue('/project/src');

    expect(findup('.hsignore')).toBe('/project/.hsignore');
  });
});
