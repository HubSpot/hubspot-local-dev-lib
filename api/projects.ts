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
const DEVELOPER_PROJECTS_API_PATH = 'developer/projects/v1';

export async function fetchProjects(
  accountId: number
): Promise<FetchProjectResponse> {
  return http.get(accountId, {
    url: PROJECTS_API_PATH,
  });
}

export async function createProject(
  accountId: number,
  name: string
): Promise<Project> {
  return http.post(
    accountId,
    {
      url: PROJECTS_API_PATH,
      data: {
        name,
      },
    },
    { projectName: name }
  );
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

  return http.post(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/upload/${encodeURIComponent(projectName)}`,
      timeout: 60000,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    },
    { projectName }
  );
}

export async function fetchProject(
  accountId: number,
  projectName: string
): Promise<Project> {
  return http.get(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
    },
    { projectName }
  );
}

export async function downloadProject(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<Buffer> {
  return http.get(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/${encodeURIComponent(
        projectName
      )}/builds/${buildId}/archive-full`,
      encoding: null,
      headers: {
        accept: 'application/zip',
        'Content-Type': 'application/json',
      },
    },
    { projectName }
  );
}

export async function deleteProject(
  accountId: number,
  projectName: string
): Promise<void> {
  return http.delete(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
    },
    { projectName }
  );
}

type FetchPlatformVersionResponse = {
  defaultPlatformVersion: string;
  activePlatformVersions: Array<string>;
};

export async function fetchPlatformVersions(
  accountId: number
): Promise<FetchPlatformVersionResponse> {
  return http.get(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/platformVersion`,
  });
}

export async function fetchProjectBuilds(
  accountId: number,
  projectName: string,
  query: QueryParams
): Promise<FetchProjectBuildsResponse> {
  return http.get(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/builds`,
      query,
    },
    { projectName }
  );
}

export async function getBuildStatus(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<Build> {
  return http.get(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/${encodeURIComponent(
        projectName
      )}/builds/${buildId}/status`,
    },
    { projectName }
  );
}

export async function getBuildStructure(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<ComponentStructureResponse> {
  return http.get(
    accountId,
    {
      url: `dfs/v1/builds/by-project-name/${encodeURIComponent(
        projectName
      )}/builds/${buildId}/structure`,
    },
    { projectName }
  );
}

export async function deployProject(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<ProjectDeployResponse> {
  return http.post(
    accountId,
    {
      url: `${PROJECTS_DEPLOY_API_PATH}/deploys/queue/async`,
      data: {
        projectName,
        buildId,
      },
    },
    { projectName }
  );
}

export async function getDeployStatus(
  accountId: number,
  projectName: string,
  deployId: number
): Promise<Deploy> {
  return http.get(
    accountId,
    {
      url: `${PROJECTS_DEPLOY_API_PATH}/deploy-status/projects/${encodeURIComponent(
        projectName
      )}/deploys/${deployId}`,
    },
    { projectName }
  );
}

export async function getDeployStructure(
  accountId: number,
  projectName: string,
  deployId: number
): Promise<ComponentStructureResponse> {
  return http.get(
    accountId,
    {
      url: `${PROJECTS_DEPLOY_API_PATH}/deploys/by-project-name/${encodeURIComponent(
        projectName
      )}/deploys/${deployId}/structure`,
    },
    { projectName }
  );
}

export async function fetchProjectSettings(
  accountId: number,
  projectName: string
): Promise<ProjectSettings> {
  return http.get(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/settings`,
    },
    { projectName }
  );
}

export async function fetchDeployComponentsMetadata(
  accountId: number,
  projectId: number
): Promise<ComponentMetadataResponse> {
  return http.get(accountId, {
    url: `${PROJECTS_API_PATH}/by-id/${projectId}/deploy-components-metadata`,
  });
}

export async function cancelStagedBuild(
  accountId: number,
  projectName: string
): Promise<void> {
  return http.post(
    accountId,
    {
      url: `${PROJECTS_API_PATH}/${encodeURIComponent(
        projectName
      )}/builds/staged/cancel`,
    },
    { projectName }
  );
}
