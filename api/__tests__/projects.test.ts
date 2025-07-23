jest.mock('../../http');
jest.mock('fs');
import { createReadStream } from 'fs';
import { http } from '../../http';
import {
  cancelStagedBuild,
  checkCloneStatus,
  checkMigrationStatus,
  cloneApp,
  createProject,
  deleteFileFromBuild,
  deleteProject,
  deployProject,
  downloadClonedProject,
  downloadProject,
  fetchBuildWarnLogs,
  fetchDeployWarnLogs,
  fetchPlatformVersions,
  fetchProject,
  fetchProjectBuilds,
  fetchProjectComponentsMetadata,
  fetchProjects,
  fetchProjectSettings,
  getBuildStatus,
  getBuildStructure,
  getDeployStatus,
  getDeployStructure,
  migrateApp,
  provisionBuild,
  queueBuild,
  uploadFileToBuild,
  uploadProject,
} from '../projects';

const createReadStreamMock = createReadStream as jest.MockedFunction<
  typeof createReadStream
>;

const httpPostMock = http.post as jest.MockedFunction<typeof http.post>;

describe('api/projects', () => {
  const accountId = 999999;
  const projectId = 888888;
  const projectName = 'super-cool-project';
  const projectNameIllegalChars = 'super-cool-project///////';

  const formData = 'this is the form data that we are sending';

  beforeEach(() => {
    // @ts-expect-error Method signature mismatch
    createReadStreamMock.mockImplementationOnce(() => {
      return formData;
    });
  });

  describe('fetchProjects', () => {
    it('should call http correctly', async () => {
      await fetchProjects(accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1`,
      });
    });
  });

  describe('createProject', () => {
    it('should call http correctly', async () => {
      await createProject(accountId, projectName);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1`,
        data: {
          name: projectName,
        },
      });
    });
  });

  describe('uploadProject', () => {
    const platformVersion = '2024.1';
    const projectFile = 'test.js';
    const uploadMessage = 'We did it';

    it('should call http correctly', async () => {
      await uploadProject(accountId, projectName, projectFile, uploadMessage);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/upload/${projectName}`,
        timeout: 60_000,
        data: {
          file: formData,
          uploadMessage,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should encode the project name', async () => {
      await uploadProject(
        accountId,
        projectNameIllegalChars,
        projectFile,
        uploadMessage
      );
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/upload/${encodeURIComponent(projectNameIllegalChars)}`,
        timeout: 60_000,
        data: {
          file: formData,
          uploadMessage,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should include the platform version if included', async () => {
      await uploadProject(
        accountId,
        projectName,
        projectFile,
        uploadMessage,
        platformVersion
      );
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/upload/${projectName}`,
        timeout: 60_000,
        data: {
          file: formData,
          uploadMessage,
          platformVersion,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should call the v3 api when optional intermediateRepresentation is provided', async () => {
      // @ts-expect-error Wants full axios response
      httpPostMock.mockResolvedValue({
        data: {
          createdBuildId: 123,
        },
      });

      const intermediateRepresentation = {
        intermediateNodesIndexedByUid: {
          'calling-1': {
            componentType: 'APP',
            uid: 'calling-1',
            config: {},
            componentDeps: {},
            files: {},
          },
        },
      };

      await uploadProject(
        accountId,
        projectName,
        projectFile,
        uploadMessage,
        platformVersion,
        intermediateRepresentation
      );
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `project-components-external/v3/upload/new-api`,
        timeout: 60_000,
        data: {
          projectFilesZip: formData,
          platformVersion,
          uploadRequest: JSON.stringify({
            ...intermediateRepresentation,
            projectName,
            buildMessage: uploadMessage,
          }),
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
  });

  describe('fetchProject', () => {
    it('should call http correctly', async () => {
      const projectName = 'super-cool-project';
      await fetchProject(accountId, projectName);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/by-name/${projectName}`,
      });
    });

    it('should encode the project name', async () => {
      await fetchProject(accountId, projectNameIllegalChars);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/by-name/${encodeURIComponent(projectNameIllegalChars)}`,
      });
    });
  });

  describe('fetchProjectComponentsMetadata', () => {
    it('should call http correctly', async () => {
      await fetchProjectComponentsMetadata(accountId, projectId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects-deployed-build/${projectId}`,
      });
    });
  });

  describe('downloadProject', () => {
    it('should call http correctly', async () => {
      const buildId = 1;
      await downloadProject(accountId, projectName, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds/${buildId}/archive-full`,
        responseType: 'arraybuffer',
        headers: {
          accept: 'application/zip',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should encode the project name', async () => {
      const buildId = 1;
      await downloadProject(accountId, projectNameIllegalChars, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/${buildId}/archive-full`,
        responseType: 'arraybuffer',
        headers: {
          accept: 'application/zip',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('deleteProject', () => {
    it('should call http correctly', async () => {
      await deleteProject(accountId, projectName);
      expect(http.delete).toHaveBeenCalledTimes(1);
      expect(http.delete).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/${projectName}`,
      });
    });

    it('should encode the project name', async () => {
      await deleteProject(accountId, projectNameIllegalChars);
      expect(http.delete).toHaveBeenCalledTimes(1);
      expect(http.delete).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/${encodeURIComponent(projectNameIllegalChars)}`,
      });
    });
  });

  describe('fetchPlatformVersions', () => {
    it('should call http correctly', async () => {
      await fetchPlatformVersions(accountId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/platformVersion`,
      });
    });
  });

  describe('fetchProjectBuilds', () => {
    it('should call http correctly', async () => {
      const params = {
        foo: 'bar',
      };
      await fetchProjectBuilds(accountId, projectName, params);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds`,
        params,
      });
    });

    it('should encode the project name', async () => {
      await fetchProjectBuilds(accountId, projectNameIllegalChars);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds`,
        params: {},
      });
    });
  });

  describe('getBuildStatus', () => {
    const buildId = 1;
    it('should call http correctly', async () => {
      await getBuildStatus(accountId, projectName, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds/${buildId}/status`,
      });
    });

    it('should encode the project name', async () => {
      await getBuildStatus(accountId, projectNameIllegalChars, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/${buildId}/status`,
      });
    });
  });

  describe('getBuildStructure', () => {
    const buildId = 1;
    it('should call http correctly', async () => {
      await getBuildStructure(accountId, projectName, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/builds/by-project-name/${projectName}/builds/${buildId}/structure`,
      });
    });

    it('should encode the project name', async () => {
      await getBuildStructure(accountId, projectNameIllegalChars, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/builds/by-project-name/${encodeURIComponent(projectNameIllegalChars)}/builds/${buildId}/structure`,
      });
    });
  });

  describe('deployProject', () => {
    const buildId = 1;
    it('should call the v1 api when useNewDeployApi is false or omitted', async () => {
      await deployProject(accountId, projectName, buildId);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/deploy/v1/deploys/queue/async`,
        data: {
          projectName,
          buildId,
          skipRemovalWarning: false,
        },
      });
    });

    it('should call the v3 api when useNewDeployApi is true', async () => {
      await deployProject(accountId, projectName, buildId, true);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/deploy/v3/deploys/queue/async`,
        data: {
          projectName,
          targetBuildId: buildId,
          ignoreWarnings: false,
        },
      });
    });
  });

  describe('getDeployStatus', () => {
    const deployId = 1;
    it('should call http correctly', async () => {
      await getDeployStatus(accountId, projectName, deployId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/deploy/v1/deploy-status/projects/${projectName}/deploys/${deployId}`,
      });
    });

    it('should encode the project name', async () => {
      await getDeployStatus(accountId, projectNameIllegalChars, deployId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/deploy/v1/deploy-status/projects/${encodeURIComponent(projectNameIllegalChars)}/deploys/${deployId}`,
      });
    });
  });

  describe('getDeployStructure', () => {
    const deployId = 1;
    it('should call http correctly', async () => {
      await getDeployStructure(accountId, projectName, deployId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/deploy/v1/deploys/by-project-name/${projectName}/deploys/${deployId}/structure`,
      });
    });

    it('should encode the project name', async () => {
      await getDeployStructure(accountId, projectNameIllegalChars, deployId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/deploy/v1/deploys/by-project-name/${encodeURIComponent(projectNameIllegalChars)}/deploys/${deployId}/structure`,
      });
    });
  });

  describe('fetchProjectSettings', () => {
    it('should call http correctly', async () => {
      await fetchProjectSettings(accountId, projectName);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/${projectName}/settings`,
      });
    });

    it('should encode the project name', async () => {
      await fetchProjectSettings(accountId, projectNameIllegalChars);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/${encodeURIComponent(projectNameIllegalChars)}/settings`,
      });
    });
  });

  describe('provisionBuild', () => {
    it('should call http correctly', async () => {
      const platformVersion = '2023.1';
      await provisionBuild(accountId, projectName, platformVersion);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds/staged/provision`,
        params: { platformVersion },
        headers: { 'Content-Type': 'application/json' },
        timeout: 50_000,
      });
    });

    it('should encode the project name', async () => {
      await provisionBuild(accountId, projectNameIllegalChars);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/staged/provision`,
        params: {},
        headers: { 'Content-Type': 'application/json' },
        timeout: 50_000,
      });
    });
  });

  describe('queueBuild', () => {
    it('should call http correctly', async () => {
      const platformVersion = '2023.1';
      await queueBuild(accountId, projectName, platformVersion);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds/staged/queue`,
        params: { platformVersion },
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should encode the project name', async () => {
      await queueBuild(accountId, projectNameIllegalChars);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/staged/queue`,
        params: {},
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('uploadFileToBuild', () => {
    it('should call http correctly', async () => {
      const filePath = 'file/to/upload';
      const path = 'path/to/file';
      await uploadFileToBuild(accountId, projectName, filePath, path);
      expect(http.put).toHaveBeenCalledTimes(1);
      expect(http.put).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds/staged/files/${encodeURIComponent(path)}`,
        data: { file: formData },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should encode the project name', async () => {
      const filePath = 'file/to/upload';
      const path = 'path/to/file';
      await uploadFileToBuild(
        accountId,
        projectNameIllegalChars,
        filePath,
        path
      );
      expect(http.put).toHaveBeenCalledTimes(1);
      expect(http.put).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/staged/files/${encodeURIComponent(path)}`,
        data: { file: formData },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
  });

  describe('deleteFileFromBuild', () => {
    it('should call http correctly', async () => {
      const path = 'path/to/file';
      await deleteFileFromBuild(accountId, projectName, path);
      expect(http.delete).toHaveBeenCalledTimes(1);
      expect(http.delete).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds/staged/files/${encodeURIComponent(path)}`,
      });
    });

    it('should encode the project name', async () => {
      const filePath = 'file/to/upload';
      await deleteFileFromBuild(accountId, projectNameIllegalChars, filePath);
      expect(http.delete).toHaveBeenCalledTimes(1);
      expect(http.delete).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/staged/files/${encodeURIComponent(filePath)}`,
      });
    });
  });

  describe('cancelStagedBuild', () => {
    it('should call http correctly', async () => {
      await cancelStagedBuild(accountId, projectName);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${projectName}/builds/staged/cancel`,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should encode the project name', async () => {
      await cancelStagedBuild(accountId, projectNameIllegalChars);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/staged/cancel`,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('fetchBuildWarnLogs', () => {
    const buildId = 1;
    it('should call http correctly', async () => {
      await fetchBuildWarnLogs(accountId, projectName, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/logging/v1/logs/projects/${projectName}/builds/${buildId}/combined/warn`,
      });
    });

    it('should encode the project name', async () => {
      await fetchBuildWarnLogs(accountId, projectNameIllegalChars, buildId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/logging/v1/logs/projects/${encodeURIComponent(projectNameIllegalChars)}/builds/${buildId}/combined/warn`,
      });
    });
  });

  describe('fetchDeployWarnLogs', () => {
    const deployId = 1;
    it('should call http correctly', async () => {
      await fetchDeployWarnLogs(accountId, projectName, deployId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/logging/v1/logs/projects/${projectName}/deploys/${deployId}/combined/warn`,
      });
    });

    it('should encode the project name', async () => {
      await fetchDeployWarnLogs(accountId, projectNameIllegalChars, deployId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/logging/v1/logs/projects/${encodeURIComponent(projectNameIllegalChars)}/deploys/${deployId}/combined/warn`,
      });
    });
  });

  describe('migrateApp', () => {
    const appId = 123456;
    it('should call http correctly', async () => {
      await migrateApp(accountId, appId, projectName);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/migrations/v1/migrations`,
        data: {
          componentId: appId,
          componentType: 'PUBLIC_APP_ID',
          projectName,
        },
      });
    });
  });

  describe('checkMigrationStatus', () => {
    it('should call http correctly', async () => {
      const migrationId = 123456;
      await checkMigrationStatus(accountId, migrationId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/migrations/v1/migrations/${migrationId}`,
      });
    });
  });

  describe('cloneApp', () => {
    it('should call http correctly', async () => {
      const appId = 123456;
      await cloneApp(accountId, appId);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/migrations/v1/exports`,
        data: {
          componentId: appId,
          componentType: 'PUBLIC_APP_ID',
        },
      });
    });
  });

  describe('checkCloneStatus', () => {
    it('should call http correctly', async () => {
      const exportId = 123456;
      await checkCloneStatus(accountId, exportId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/migrations/v1/exports/${exportId}/status`,
      });
    });
  });

  describe('downloadClonedProject', () => {
    it('should call http correctly', async () => {
      const exportId = 123456;
      await downloadClonedProject(accountId, exportId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/migrations/v1/exports/${exportId}/download-as-clone`,
        responseType: 'arraybuffer',
      });
    });
  });

  describe('checkMigrationStatus', () => {
    it('should call v1 api for stable platform version', async () => {
      const migrationId = 123456;
      await checkMigrationStatus(accountId, migrationId);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `dfs/migrations/v1/migrations/${migrationId}`,
      });
    });
  });
});
