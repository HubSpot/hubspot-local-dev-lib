import http from '../http';
import fs from 'fs';
import { FormData } from '../types/Http';

const PROJECTS_API_PATH = 'dfs/v1/projects';
const PROJECTS_DEPLOY_API_PATH = 'dfs/deploy/v1';

/**
 * Fetch projects
 *
 * @async
 * @param {number} accountId
 * @returns {Promise}
 */
export async function fetchProjects(accountId) {
  return http.get(accountId, {
    uri: PROJECTS_API_PATH,
  });
}

/**
 * Create project
 *
 * @async
 * @param {number} accountId
 * @param {string} name
 * @returns {Promise}
 */
export async function createProject(accountId, name) {
  return http.post(accountId, {
    uri: PROJECTS_API_PATH,
    body: {
      name,
    },
  });
}

/**
 * Upload project
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {string} projectFile
 * @returns {Promise}
 */

export async function uploadProject(
  accountId,
  projectName,
  projectFile,
  uploadMessage,
  platformVersion
) {
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

/**
 * Fetch project
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @returns {Promise}
 */
export async function fetchProject(accountId, projectName) {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

/**
 * Download project
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @returns {Promise}
 */
export async function downloadProject(accountId, projectName, buildId) {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/archive`,
    encoding: null,
    headers: { accept: 'application/octet-stream' },
  });
}

/**
 * Delete project
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @returns {Promise}
 */
export async function deleteProject(accountId, projectName) {
  return http.delete(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

/**
 * Fetch list of project builds
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {object} query
 * @returns {Promise}
 */
export async function fetchProjectBuilds(accountId, projectName, query) {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/builds`,
    query,
  });
}

/**
 * Get project build status
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {number} buildId
 * @returns {Promise}
 */
export async function getBuildStatus(accountId, projectName, buildId) {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/status`,
  });
}

/**
 * Get project build component structure
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {number} buildId
 * @returns {Promise}
 */
export async function getBuildStructure(accountId, projectName, buildId) {
  return http.get(accountId, {
    uri: `dfs/v1/builds/by-project-name/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/structure`,
  });
}

/**
 * Deploy project
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {number} buildId
 * @returns {Promise}
 */
export async function deployProject(accountId, projectName, buildId) {
  return http.post(accountId, {
    uri: `${PROJECTS_DEPLOY_API_PATH}/deploys/queue/async`,
    body: {
      projectName,
      buildId,
    },
  });
}

/**
 * Get project deploy status
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {number} deployId
 * @returns {Promise}
 */
export async function getDeployStatus(accountId, projectName, deployId) {
  return http.get(accountId, {
    uri: `${PROJECTS_DEPLOY_API_PATH}/deploy-status/projects/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}`,
  });
}

/**
 * Get project deploy component structure
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @param {number} buildId
 * @returns {Promise}
 */
export async function getDeployStructure(accountId, projectName, deployId) {
  return http.get(accountId, {
    uri: `${PROJECTS_DEPLOY_API_PATH}/deploys/by-project-name/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/structure`,
  });
}

/**
 * Get project settings
 *
 * @async
 * @param {number} accountId
 * @param {string} projectName
 * @returns {Promise}
 */
export async function fetchProjectSettings(accountId, projectName) {
  return http.get(accountId, {
    uri: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/settings`,
  });
}

/**
 * Fetch top-level deploy components metadata
 *
 * @async
 * @param {number} accountId
 * @param {number} projectId
 * @returns {Promise}
 */
export async function fetchDeployComponentsMetadata(accountId, projectId) {
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
