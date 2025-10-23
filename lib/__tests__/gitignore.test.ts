import { vi } from 'vitest';
import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../../constants/config.js';

vi.mock('../../utils/git');
vi.mock('path');

vi.mock('fs-extra', () => {
  const mockReadFileSync = vi.fn();
  const mockWriteFileSync = vi.fn();
  return {
    default: {
      readFileSync: mockReadFileSync,
      writeFileSync: mockWriteFileSync,
    },
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  };
});

import {
  configFilenameIsIgnoredByGitignore,
  getGitignoreFiles,
  isConfigPathInGitRepo,
} from '../../utils/git.js';
import {
  checkAndAddConfigToGitignore,
  checkGitInclusion,
} from '../gitignore.js';
import { readFileSync, writeFileSync } from 'fs-extra';
import path from 'path';

const isConfigPathInGitRepoMock = vi.mocked(isConfigPathInGitRepo);
const getGitignoreFilesMock = vi.mocked(getGitignoreFiles);
const configFilenameIsIgnoredByGitignoreMock = vi.mocked(
  configFilenameIsIgnoredByGitignore
);

describe('lib/gitignore', () => {
  const gitIgnoreFiles = ['/some/cool/file', 'some/other/file'];
  const configDirectoryPath = '/path/to/the/config/file';
  const configPath = `${configDirectoryPath}/hubspot.config.yml`;
  const pathResolveReturnValue = `${configDirectoryPath}/.gitignore`;
  const fileContents = 'the contents of the files';

  beforeEach(() => {
    isConfigPathInGitRepoMock.mockReturnValue(true);
    getGitignoreFilesMock.mockReturnValue(gitIgnoreFiles);
    configFilenameIsIgnoredByGitignoreMock.mockReturnValue(false);

    vi.mocked(path.resolve).mockReturnValue(pathResolveReturnValue);
    vi.mocked(path.dirname).mockReturnValue(configDirectoryPath);
    vi.mocked(path.join).mockReturnValue(pathResolveReturnValue);

    vi.mocked(readFileSync).mockReturnValue(fileContents);
  });

  describe('checkAndAddConfigToGitIgnore', () => {
    it('should return early when the configPath is ignored', () => {
      configFilenameIsIgnoredByGitignoreMock.mockReturnValue(true);
      checkAndAddConfigToGitignore(configPath);
      expect(readFileSync).not.toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('should create the file path if it does not exist', () => {
      getGitignoreFilesMock.mockReturnValue([]);
      isConfigPathInGitRepoMock.mockReturnValue(true);
      configFilenameIsIgnoredByGitignoreMock.mockReturnValue(false);
      checkAndAddConfigToGitignore(configPath);
      expect(writeFileSync).toHaveBeenCalledWith(pathResolveReturnValue, '');
    });

    it('should create and write the file with the correct contents', () => {
      isConfigPathInGitRepoMock.mockReturnValue(true);
      configFilenameIsIgnoredByGitignoreMock.mockReturnValue(false);

      const [firstGitIgnoreFile] = gitIgnoreFiles;
      checkAndAddConfigToGitignore(configPath);
      expect(writeFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(firstGitIgnoreFile);
      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(writeFileSync).toHaveBeenCalledWith(
        firstGitIgnoreFile,
        `${fileContents}\n\n# HubSpot config file\n${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME}\n`
      );
    });

    it('should throw a user friendly error when an error occurs', () => {
      isConfigPathInGitRepoMock.mockReturnValue(true);
      configFilenameIsIgnoredByGitignoreMock.mockReturnValue(false);
      const error = new Error('OH NO');
      vi.mocked(readFileSync).mockImplementationOnce(() => {
        throw error;
      });

      expect(() => checkAndAddConfigToGitignore(configPath)).toThrow(
        'Unable to determine if config file is properly ignored by git.'
      );
    });
  });

  describe('checkGitInclusion', () => {
    it('should return the correct data when the configPath is not in the git repo', () => {
      isConfigPathInGitRepoMock.mockReturnValue(false);
      const expected = {
        inGit: false,
        configIgnored: false,
        gitignoreFiles: [],
      };

      expect(checkGitInclusion(configPath)).toStrictEqual(expected);
      expect(isConfigPathInGitRepoMock).toHaveBeenCalledWith(configPath);
      expect(getGitignoreFiles).not.toHaveBeenCalled();
      expect(configFilenameIsIgnoredByGitignore).not.toHaveBeenCalled();
    });

    it('should return the correct data when the configPath is in the git repo and the file is not ignored', () => {
      isConfigPathInGitRepoMock.mockReturnValue(true);
      configFilenameIsIgnoredByGitignoreMock.mockReturnValue(false);
      const expected = {
        inGit: true,
        configIgnored: false,
        gitignoreFiles: gitIgnoreFiles,
      };
      expect(checkGitInclusion(configPath)).toStrictEqual(expected);
      expect(isConfigPathInGitRepoMock).toHaveBeenCalledWith(configPath);
      expect(getGitignoreFiles).toHaveBeenCalledWith(configPath);
      expect(configFilenameIsIgnoredByGitignore).toHaveBeenCalledWith(
        gitIgnoreFiles,
        configPath
      );
    });

    it('should return the correct data when the configPath is in the git repo and the file is not ignored', () => {
      isConfigPathInGitRepoMock.mockReturnValue(true);
      configFilenameIsIgnoredByGitignoreMock.mockReturnValue(true);
      const expected = {
        inGit: true,
        configIgnored: true,
        gitignoreFiles: gitIgnoreFiles,
      };
      expect(checkGitInclusion(configPath)).toStrictEqual(expected);
      expect(isConfigPathInGitRepoMock).toHaveBeenCalledWith(configPath);
      expect(getGitignoreFiles).toHaveBeenCalledWith(configPath);
      expect(configFilenameIsIgnoredByGitignore).toHaveBeenCalledWith(
        gitIgnoreFiles,
        configPath
      );
    });
  });
});
