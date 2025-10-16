import {
  configFilenameIsIgnoredByGitignore,
  getGitignoreFiles,
} from '../../utils/git.js';
import fs from 'fs-extra';
vi.mock('findup-sync');

import findup from 'findup-sync';
import path from 'path';
import { vi, type MockedFunction } from 'vitest';

const findupMock = findup as MockedFunction<typeof findup>;

describe('utils/cms/git', () => {
  const projectBaseDir = '/Users/fakeuser/someproject';
  const configPath = `${projectBaseDir}/hubspot.config.yml`;
  const customConfigPath = `${projectBaseDir}/config/my.custom.name.yml`;

  beforeEach(() => {
    findupMock.mockImplementation(() => configPath);
  });

  describe('configFilenameIsIgnoredByGitignore()', () => {
    it('returns false if the config file is not ignored', () => {
      const gitignoreContent = '';

      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        return Buffer.from(gitignoreContent);
      });

      expect(
        configFilenameIsIgnoredByGitignore(
          [`${projectBaseDir}/.gitignore`],
          configPath
        )
      ).toBe(false);
    });

    it('identifies if a config file is ignored with a specific ignore statement', () => {
      const gitignoreContent = 'hubspot.config.yml';
      const readFileSyncSpy = vi
        .spyOn(fs, 'readFileSync')
        .mockImplementation(() => {
          return Buffer.from(gitignoreContent);
        });

      expect(
        configFilenameIsIgnoredByGitignore(
          [`${projectBaseDir}/.gitignore`],
          configPath
        )
      ).toBe(true);
      readFileSyncSpy.mockReset();
    });

    it('identifies if a config file is ignored with a wildcard statement', () => {
      const gitignoreContent = 'hubspot.config.*';
      const readFileSyncSpy = vi
        .spyOn(fs, 'readFileSync')
        .mockImplementation(() => {
          return Buffer.from(gitignoreContent);
        });

      expect(
        configFilenameIsIgnoredByGitignore(
          [`${projectBaseDir}/.gitignore`],
          configPath
        )
      ).toBe(true);
      readFileSyncSpy.mockReset();
    });

    it('identifies if a non-standard named config file is not ignored', () => {
      const gitignoreContent = 'hubspot.config.yml';
      findupMock.mockImplementation(() => customConfigPath);

      const readFileSyncSpy = vi
        .spyOn(fs, 'readFileSync')
        .mockImplementation(() => {
          return Buffer.from(gitignoreContent);
        });

      expect(
        configFilenameIsIgnoredByGitignore(
          [`${projectBaseDir}/.gitignore`],
          customConfigPath
        )
      ).toBe(false);
      readFileSyncSpy.mockReset();
    });

    it('identifies if a non-standard named config file is ignored', () => {
      const gitignoreContent = 'my.custom.name.yml';
      findupMock.mockImplementation(() => customConfigPath);

      const readFileSyncSpy = vi
        .spyOn(fs, 'readFileSync')
        .mockImplementation(() => {
          return Buffer.from(gitignoreContent);
        });

      expect(
        configFilenameIsIgnoredByGitignore(
          [`${projectBaseDir}/.gitignore`],
          customConfigPath
        )
      ).toBe(true);
      readFileSyncSpy.mockReset();
    });
  });

  describe('getGitignoreFiles', () => {
    it('should return an empty array if the git comparison array is nullable', () => {
      findupMock.mockImplementation(() => null);
      const result = getGitignoreFiles(configPath);
      expect(result).toStrictEqual([]);
    });

    it('should return an array of the gitignore files', () => {
      const gitignoreFile = `${projectBaseDir}/.gitignore`;
      vi.spyOn(path, 'resolve').mockImplementation(() => {
        return gitignoreFile;
      });
      vi.spyOn(path, 'dirname').mockImplementation(() => {
        return projectBaseDir;
      });

      let haltWhileLoop = false;
      // @ts-expect-error we only call it with strings, we don't need to worry about string[]
      findupMock.mockImplementation((pattern: string, options) => {
        if (haltWhileLoop) {
          return null;
        }
        if (pattern === '.git') {
          return projectBaseDir;
        }
        if (pattern === '.gitignore' && options && options.cwd) {
          haltWhileLoop = true;
          return gitignoreFile;
        }
      });

      const result = getGitignoreFiles(configPath);
      expect(result).toStrictEqual([gitignoreFile]);
    });
  });
});
