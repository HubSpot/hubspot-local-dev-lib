import fs from 'fs';
import path from 'path';
import { findUpSync, Match } from 'find-up';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { findup } from '../findup.js';

vi.mock('fs');
vi.mock('find-up');

const mockFindUpSync = vi.mocked(findUpSync);
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

function runMatcherIn(dir: string): void {
  mockFindUpSync.mockImplementation((matcher: (directory: string) => Match) => {
    const match = matcher(dir);
    return typeof match === 'string' ? path.resolve(dir, match) : undefined;
  });
}

describe('utils/findup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds files and directories with find-up', () => {
    mockFindUpSync.mockReturnValue('/project/hubspot.config.yml');

    expect(
      findup(['hubspot.config.yml', 'hubspot.config.yaml'], {
        cwd: '/project/src',
      })
    ).toBe('/project/hubspot.config.yml');
    expect(mockFindUpSync).toHaveBeenCalledWith(
      ['hubspot.config.yml', 'hubspot.config.yaml'],
      { cwd: '/project/src', type: 'both' }
    );
  });

  it('returns null when find-up finds no match', () => {
    mockFindUpSync.mockReturnValue(undefined);

    expect(findup('.hsignore')).toBeNull();
    expect(mockFindUpSync).toHaveBeenCalledWith('.hsignore', {
      cwd: undefined,
      type: 'both',
    });
  });

  it('uses a case-insensitive matcher when nocase is set', () => {
    mockFileSystem(['/project/theme/Theme.JSON']);
    runMatcherIn('/project/theme');

    expect(
      findup('theme.json', { cwd: '/project/theme/templates', nocase: true })
    ).toBe('/project/theme/Theme.JSON');
    expect(mockFindUpSync).toHaveBeenCalledWith(expect.any(Function), {
      cwd: '/project/theme/templates',
      type: 'both',
    });
  });

  it('prefers the exact name when nocase is set', () => {
    mockFileSystem(['/project/theme/theme.json']);
    runMatcherIn('/project/theme');

    expect(findup('theme.json', { nocase: true })).toBe(
      '/project/theme/theme.json'
    );
    expect(mockReaddirSync).not.toHaveBeenCalled();
  });

  it('supports names that include a subdirectory when nocase is set', () => {
    mockFileSystem(['/project/.hs/Settings.json']);
    runMatcherIn('/project');

    expect(findup('.hs/settings.json', { nocase: true })).toBe(
      '/project/.hs/Settings.json'
    );
  });

  it('returns null when the nocase matcher finds no match', () => {
    mockFileSystem(['/project/theme/other.json']);
    runMatcherIn('/project/theme');

    expect(findup('theme.json', { nocase: true })).toBeNull();
  });

  it('returns null when the directory cannot be read', () => {
    mockFileSystem([]);
    runMatcherIn('/project/theme/page.html');

    expect(findup('theme.json', { nocase: true })).toBeNull();
  });
});
