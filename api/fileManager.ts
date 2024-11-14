import fs from 'fs';
import path from 'path';
import { http, HubSpotResponse } from '../http';
import { FormData } from '../types/Http';
import {
  FetchStatResponse,
  FetchFilesResponse,
  FetchFolderResponse,
  UploadResponse,
} from '../types/FileManager';

const FILE_MANAGER_V2_API_PATH = 'filemanager/api/v2';
const FILE_MANAGER_V3_API_PATH = 'filemanager/api/v3';

export function uploadFile(
  accountId: number,
  src: string,
  dest: string
): HubSpotResponse<UploadResponse> {
  const directory = path.dirname(dest);
  const filename = path.basename(dest);
  const formData: FormData = {
    file: fs.createReadStream(src),
    fileName: filename,
    options: JSON.stringify({
      access: 'PUBLIC_INDEXABLE',
      overwrite: true,
    }),
  };

  if (directory && directory !== '.') {
    formData.folderPath = directory;
  } else {
    formData.folderPath = '/';
  }

  return http.post<UploadResponse>(accountId, {
    url: `${FILE_MANAGER_V3_API_PATH}/files/upload`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function fetchStat(
  accountId: number,
  src: string
): HubSpotResponse<FetchStatResponse> {
  return http.get<FetchStatResponse>(accountId, {
    url: `${FILE_MANAGER_V2_API_PATH}/files/stat/${src}`,
  });
}

export function fetchFiles(
  accountId: number,
  folderId: number | 'None',
  offset: number,
  archived?: boolean
): HubSpotResponse<FetchFilesResponse> {
  return http.get<FetchFilesResponse>(accountId, {
    url: `${FILE_MANAGER_V2_API_PATH}/files/`,
    params: {
      hidden: 0,
      offset: offset,
      folder_id: folderId,
      ...(!archived && { archived: 0 }),
    },
  });
}

export function fetchFolders(
  accountId: number,
  folderId: number | 'None'
): HubSpotResponse<FetchFolderResponse> {
  return http.get<FetchFolderResponse>(accountId, {
    url: `${FILE_MANAGER_V2_API_PATH}/folders/`,
    params: {
      hidden: 0,
      parent_folder_id: folderId,
    },
  });
}
