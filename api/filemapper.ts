import fs from 'fs';
import path from 'path';
import contentDisposition from 'content-disposition';
import { FullResponse } from 'request-promise-native';
import http from '../http';
import { getRequestOptions } from '../http/requestOptions';
import { getCwd } from '../lib/path';
import CLIConfiguration from '../config/CLIConfiguration';
import { FileMapperNode } from '../types/Files';
import { FileMapperOptions } from '../types/Files';
import { debug } from '../utils/logger';

const FILE_MAPPER_API_PATH = 'content/filemapper/v1';

// https://github.com/request/request-promise#the-transform-function}
export function createFileMapperNodeFromStreamResponse(
  filePath: string,
  response: FullResponse
): FileMapperNode {
  if (filePath[0] !== '/') {
    filePath = `/${filePath}`;
  }
  if (filePath[filePath.length - 1] === '/') {
    filePath = filePath.slice(0, filePath.length - 1);
  }
  const node = {
    source: null,
    path: filePath,
    name: path.basename(filePath),
    folder: false,
    children: [],
    createdAt: 0,
    updatedAt: 0,
  };
  if (!(response.headers && response.headers['content-disposition'])) {
    return node;
  }
  const { parameters } = contentDisposition.parse(
    response.headers['content-disposition']
  );
  return {
    ...node,
    name: parameters.filename,
    createdAt: parseInt(parameters['creation-date'], 10) || 0,
    updatedAt: parseInt(parameters['modification-date'], 10) || 0,
  };
}

export async function upload(
  accountId: number,
  src: string,
  dest: string,
  options: FileMapperOptions = {}
) {
  return http.post(accountId, {
    uri: `${FILE_MAPPER_API_PATH}/upload/${encodeURIComponent(dest)}`,
    formData: {
      file: fs.createReadStream(path.resolve(getCwd(), src)),
    },
    ...options,
  });
}

// Fetch a module by moduleId
export async function fetchModule(
  accountId: number,
  moduleId: number,
  options: FileMapperOptions = {}
) {
  return http.get(accountId, {
    uri: `${FILE_MAPPER_API_PATH}/modules/${moduleId}`,
    ...options,
  });
}

//Fetch a file by file path.
export async function fetchFileStream(
  accountId: number,
  filePath: string,
  destination: string,
  options: FileMapperOptions = {}
): Promise<FileMapperNode> {
  const response = await http.getOctetStream(
    accountId,
    {
      uri: `${FILE_MAPPER_API_PATH}/stream/${encodeURIComponent(filePath)}`,
      ...options,
    },
    destination
  );
  return createFileMapperNodeFromStreamResponse(filePath, response);
}

// Fetch a folder or file node by path.
export async function download(
  accountId: number,
  filepath: string,
  options: FileMapperOptions = {}
): Promise<FileMapperNode> {
  return http.get<FileMapperNode>(accountId, {
    uri: `${FILE_MAPPER_API_PATH}/download/${encodeURIComponent(filepath)}`,
    ...options,
  });
}

// Fetch a folder or file node by path.
export async function downloadDefault(
  accountId: number,
  filepath: string,
  options: FileMapperOptions = {}
): Promise<FileMapperNode> {
  return http.get<FileMapperNode>(accountId, {
    uri: `${FILE_MAPPER_API_PATH}/download-default/${filepath}`,
    ...options,
  });
}

// Delete a file or folder by path
export async function deleteFile(
  accountId: number,
  filePath: string,
  options: FileMapperOptions = {}
): Promise<FullResponse> {
  return http.delete(accountId, {
    uri: `${FILE_MAPPER_API_PATH}/delete/${encodeURIComponent(filePath)}`,
    ...options,
  });
}

// Track CMS CLI usage
export async function trackUsage(
  eventName: string,
  eventClass: string,
  meta = {},
  accountId: number
) {
  const i18nKey = 'api.filemapper.trackUsage';
  const usageEvent = {
    accountId,
    eventName,
    eventClass,
    meta,
  };
  const EVENT_TYPES = {
    VSCODE_EXTENSION_INTERACTION: 'vscode-extension-interaction',
    CLI_INTERACTION: 'cli-interaction',
  };

  let analyticsEndpoint;

  switch (eventName) {
    case EVENT_TYPES.CLI_INTERACTION:
      analyticsEndpoint = 'cms-cli-usage';
      break;
    case EVENT_TYPES.VSCODE_EXTENSION_INTERACTION:
      analyticsEndpoint = 'vscode-extension-usage';
      break;
    default:
      debug(`${i18nKey}.invalidEvent`, { eventName });
  }

  const path = `${FILE_MAPPER_API_PATH}/${analyticsEndpoint}`;

  const accountConfig = accountId && CLIConfiguration.getAccount(accountId);

  if (accountConfig && accountConfig.authType === 'personalaccesskey') {
    debug(`${i18nKey}.sendingEventAuthenticated`);
    return http.post(accountId, {
      uri: `${path}/authenticated`,
      body: usageEvent,
      resolveWithFullResponse: true,
    });
  }

  const env = CLIConfiguration.getEnv(accountId);
  const requestOptions = getRequestOptions({
    env,
    uri: path,
    body: usageEvent,
    resolveWithFullResponse: true,
  });
  debug(`${i18nKey}.sendingEventUnauthenticated`);
  return http.post(accountId, requestOptions);
}

// Moves file from srcPath to destPath
export async function moveFile(
  accountId: number,
  srcPath: string,
  destPath: string
): Promise<FullResponse> {
  return http.put(accountId, {
    uri: `${FILE_MAPPER_API_PATH}/rename/${srcPath}?path=${destPath}`,
  });
}

// Get directory contents
export async function getDirectoryContentsByPath(
  accountId: number,
  path: string
): Promise<FullResponse> {
  return http.get(accountId, {
    uri: `${FILE_MAPPER_API_PATH}/meta/${path}`,
  });
}
