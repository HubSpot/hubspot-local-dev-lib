import fs from 'fs';
import path from 'path';
import contentDisposition from 'content-disposition';
import { AxiosResponse } from 'axios';
import http from '../http';
import { getCwd } from '../lib/path';
import { FileMapperNode, FileMapperOptions, FileTree } from '../types/Files';

export const FILE_MAPPER_API_PATH = 'content/filemapper/v1';

export function createFileMapperNodeFromStreamResponse(
  filePath: string,
  response: Partial<AxiosResponse>
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
): Promise<void> {
  return http.post<void>(accountId, {
    url: `${FILE_MAPPER_API_PATH}/upload/${encodeURIComponent(dest)}`,
    data: {
      file: fs.createReadStream(path.resolve(getCwd(), src)),
    },
    headers: { 'Content-Type': 'multipart/form-data' },
    ...options,
  });
}

// Fetch a module by moduleId
export async function fetchModule(
  accountId: number,
  moduleId: number,
  options: FileMapperOptions = {}
): Promise<FileTree> {
  return http.get<FileTree>(accountId, {
    url: `${FILE_MAPPER_API_PATH}/modules/${moduleId}`,
    ...options,
  });
}

// Fetch a file by file path.
export async function fetchFileStream(
  accountId: number,
  filePath: string,
  destination: string,
  options: FileMapperOptions = {}
): Promise<FileMapperNode> {
  const response = await http.getOctetStream(
    accountId,
    {
      url: `${FILE_MAPPER_API_PATH}/stream/${encodeURIComponent(filePath)}`,
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
    url: `${FILE_MAPPER_API_PATH}/download/${encodeURIComponent(filepath)}`,
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
    url: `${FILE_MAPPER_API_PATH}/download-default/${filepath}`,
    ...options,
  });
}

// Delete a file or folder by path
export async function deleteFile(
  accountId: number,
  filePath: string
): Promise<void> {
  return http.delete(accountId, {
    url: `${FILE_MAPPER_API_PATH}/delete/${encodeURIComponent(filePath)}`,
  });
}

// Moves file from srcPath to destPath
export async function moveFile(
  accountId: number,
  srcPath: string,
  destPath: string
): Promise<void> {
  return http.put(accountId, {
    url: `${FILE_MAPPER_API_PATH}/rename/${srcPath}?path=${destPath}`,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get directory contents
export async function getDirectoryContentsByPath(
  accountId: number,
  path: string
): Promise<FileMapperNode> {
  return http.get(accountId, {
    url: `${FILE_MAPPER_API_PATH}/meta/${path}`,
  });
}
