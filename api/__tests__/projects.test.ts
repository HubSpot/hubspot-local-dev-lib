jest.mock('../../http');
jest.mock('fs');
import { createReadStream } from 'fs';
import http from '../../http';
import {
  createProject,
  downloadProject,
  fetchProject,
  fetchProjectComponentsMetadata,
  fetchProjects,
  uploadProject,
} from '../projects';

describe('api/projects', () => {
  const accountId = 999999;
  const projectId = 888888;

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
      const projectName = 'super-cool-project';
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
    const projectName = 'super-cool-project';
    const platformVersion = '2024.1';
    const projectFile = 'test.js';
    const uploadMessage = 'We did it';
    const formData = 'this is the form data that we are sending';

    beforeEach(() => {
      // @ts-expect-error It's a mock, I promise
      createReadStream.mockImplementationOnce(() => {
        return formData;
      });
    });
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
      const projectName = 'super-cool-project///';
      await uploadProject(accountId, projectName, projectFile, uploadMessage);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(accountId, {
        url: `dfs/v1/projects/upload/${encodeURIComponent(projectName)}`,
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
      const projectName = 'super-cool-project///////////';
      await fetchProject(accountId, projectName);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(accountId, {
        url: `developer/projects/v1/by-name/${encodeURIComponent(projectName)}`,
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
      const projectName = 'super-cool-project';
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
  });
});
