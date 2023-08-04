import http from '../http';
import fs from 'fs';
import { FormData, QueryParams } from '../types/Http';
import {
  Project,
  FetchProjectResponse,
  UploadProjectResponse,
  ProjectSettings,
} from '../types/Project';
import { Build, FetchProjectBuildsResponse } from '../types/Build';
import {
  ComponentMetadataResponse,
  ComponentStructureResponse,
} from '../types/ComponentStructure';
import { Deploy, ProjectDeployResponse } from '../types/Deploy';

const PROJECTS_API_PATH = 'dfs/v1/projects';
const PROJECTS_DEPLOY_API_PATH = 'dfs/deploy/v1';

export async function fetchProjects(
  accountId: number
): Promise<FetchProjectResponse> {
  return http.get(accountId, {
    uri: PROJECTS_API_PATH,
  });
}

export async function createProject(
  accountId: number,
  name: string
): Promise<Project> {
  return http.post(accountId, {
    uri: PROJECTS_API_PATH,
    body: {
      name,
    },
  });
}

export async function uploadProject(
  accountId: number,
  projectName: string,
  projectFile: string,
  uploadMessage: string,
  platformVersion?: string
): Promise<UploadProjectResponse> {
  const formData: FormData = {
    file: fs.createReadStream(projectFile),
    uploadMessage,
  };
  if (platformVersion) {
    formData.platformVersion = platformVersion;
  }

  return http.post(accountId, {
    uri: `${PROJECTS_API_PATH}/upload/${encodeURIComponent(projectName)}`,
    timeout: 60000,
    formData,
  });
}

export async function fetchProject(
  accountId: number,
  projectName: string
): Promise<Project> {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

//TODO
export async function downloadProject(
  accountId: number,
  projectName: string,
  buildId: number
) {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/archive`,
    encoding: null,
    headers: { accept: 'application/octet-stream' },
  });
}

export async function deleteProject(
  accountId: number,
  projectName: string
): Promise<null> {
  return http.delete(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

export async function fetchProjectBuilds(
  accountId: number,
  projectName: string,
  query: QueryParams
): Promise<FetchProjectBuildsResponse> {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/builds`,
    query,
  });
}

export async function getBuildStatus(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<Build> {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/status`,
  });
}

export async function getBuildStructure(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<ComponentStructureResponse> {
  return http.get(accountId, {
    uri: `dfs/v1/builds/by-project-name/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/structure`,
  });
}

export async function deployProject(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<ProjectDeployResponse> {
  return http.post(accountId, {
    uri: `${PROJECTS_DEPLOY_API_PATH}/deploys/queue/async`,
    body: {
      projectName,
      buildId,
    },
  });
}

export async function getDeployStatus(
  accountId: number,
  projectName: string,
  deployId: number
): Promise<Deploy> {
  return http.get(accountId, {
    uri: `${PROJECTS_DEPLOY_API_PATH}/deploy-status/projects/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}`,
  });
}

export async function getDeployStructure(
  accountId: number,
  projectName: string,
  deployId: number
): Promise<ComponentStructureResponse> {
  return http.get(accountId, {
    uri: `${PROJECTS_DEPLOY_API_PATH}/deploys/by-project-name/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/structure`,
  });
}

export async function fetchProjectSettings(
  accountId: number,
  projectName: string
): Promise<ProjectSettings> {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/settings`,
  });
}

export async function fetchDeployComponentsMetadata(
  accountId: number,
  projectId: number
): Promise<ComponentMetadataResponse> {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/by-id/${projectId}/deploy-components-metadata`,
  });
}

/**
 * Provision new project build
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @returns {Promise}
 */
export async function provisionBuild(accountId, projectName, platformVersion) {
  const requestString = platformVersion
    ? `/builds/staged/provision?platformVersion=${platformVersion}`
    : '/builds/staged/provision';

  return http.post(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}${requestString}`,
    timeout: 50000,
  });
}

/**
 * Queue build
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @returns {Promise}
 */
export async function queueBuild(accountId, projectName, platformVersion) {
  const requestString = platformVersion
    ? `/builds/staged/queue?platformVersion=${platformVersion}`
    : '/builds/staged/queue';

  return http.post(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}${requestString}`,
  });
}

/**
 * Upload file to staged build (watch)
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {string} filePath
 * @param {string} path
 * @returns {Promise}
 */
export async function uploadFileToBuild(
  accountId,
  projectName,
  filePath,
  path
) {
  return http.put(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/files/${encodeURIComponent(path)}`,
    formData: {
      file: fs.createReadStream(filePath),
    },
  });
}

/**
 * Delete file from staged build (watch)
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {string} path
 * @returns {Promise}
 */
export async function deleteFileFromBuild(accountId, projectName, path) {
  return http.delete(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/files/${encodeURIComponent(path)}`,
  });
}

/**
 * Cancel staged build
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @returns {Promise}
 */
export async function cancelStagedBuild(accountId, projectName) {
  return http.post(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/cancel`,
  });
}
