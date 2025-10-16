import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../../constants/config.js';

jest.mock('../../utils/git');
jest.mock('path');
jest.mock('fs-extra');
jest.mock('path');

import {
  configFilenameIsIgnoredByGitignore,
  getGitignoreFiles,
  isConfigPathInGitRepo,
} from '../../utils/git.js';
import { checkAndAddConfigToGitignore, checkGitInclusion } from '../gitignore.js';
import { readFileSync, writeFileSync } from 'fs-extra';
import path from 'path';

const isConfigPathInGitRepoMock = isConfigPathInGitRepo as jest.MockedFunction<
  typeof isConfigPathInGitRepo
>;
const getGitignoreFilesMock = getGitignoreFiles as jest.MockedFunction<
  typeof getGitignoreFiles
>;
const configFilenameIsIgnoredByGitignoreMock =
  configFilenameIsIgnoredByGitignore as jest.MockedFunction<
    typeof configFilenameIsIgnoredByGitignore
  >;

const pathResolveMock = path.resolve as jest.MockedFunction<
  typeof path.resolve
>;
const pathDirnameMock = path.dirname as jest.MockedFunction<
  typeof path.dirname
>;
const pathJoinMock = path.join as jest.MockedFunction<typeof path.join>;
const readFileSyncMock = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;

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
    pathResolveMock.mockReturnValue(pathResolveReturnValue);
    pathDirnameMock.mockReturnValue(configDirectoryPath);
    pathJoinMock.mockReturnValue(pathResolveReturnValue);
    readFileSyncMock.mockReturnValue(fileContents);
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
      readFileSyncMock.mockImplementationOnce(() => {
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
