import fs from 'fs';
import path from 'path';
import http from '../http';
import { FormData } from '../types/Http';
import {
  FetchStatResponse,
  FetchResponse,
  UploadResponse,
} from '../types/FileManager';

const FILE_MANAGER_V2_API_PATH = 'filemanager/api/v2';
const FILE_MANAGER_V3_API_PATH = 'filemanager/api/v3';

export async function uploadFile(
  accountId: number,
  src: string,
  dest: string
): Promise<UploadResponse> {
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

  return http.post(accountId, {
    uri: `${FILE_MANAGER_V3_API_PATH}/files/upload`,
    formData,
  });
}

export async function fetchStat(
  accountId: number,
  src: string
): Promise<FetchStatResponse> {
  return http.get(accountId, {
    uri: `${FILE_MANAGER_V2_API_PATH}/files/stat/${src}`,
  });
}

export async function fetchFiles(
  accountId: number,
  folderId: number,
  { offset, archived }
): Promise<FetchResponse> {
  return http.get(accountId, {
    uri: `${FILE_MANAGER_V2_API_PATH}/files/`,
    qs: {
      hidden: 0,
      offset: offset,
      folder_id: folderId,
      ...(!archived && { archived: 0 }),
    },
  });
}

export async function fetchFolders(
  accountId: number,
  folderId: number
): Promise<FetchResponse> {
  return http.get(accountId, {
    uri: `${FILE_MANAGER_V2_API_PATH}/folders/`,
    qs: {
      hidden: 0,
      parent_folder_id: folderId,
    },
  });
}
