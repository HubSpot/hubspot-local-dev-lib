import fs from 'fs';
import path from 'path';
import { getCwd } from '../lib/path';
import { http } from '../http';
import { HubSpotPromise } from '../types/Http';
const HUBFILES_API_PATH = '/file-transport/v1/hubfiles';

export function createSchemaFromHubFile(
  accountId: number,
  filepath: string
): HubSpotPromise {
  const file = fs.createReadStream(path.resolve(getCwd(), filepath));
  return http.post(accountId, {
    url: `${HUBFILES_API_PATH}/object-schemas`,
    data: {
      file,
    },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function updateSchemaFromHubFile(
  accountId: number,
  filepath: string
): HubSpotPromise {
  const file = fs.createReadStream(path.resolve(getCwd(), filepath));
  return http.put(accountId, {
    url: `${HUBFILES_API_PATH}/object-schemas`,
    data: {
      file,
    },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function fetchHubFileSchema(
  accountId: number,
  objectName: string,
  path: string
): HubSpotPromise {
  return http.getOctetStream(
    accountId,
    {
      url: `${HUBFILES_API_PATH}/object-schemas/${objectName}`,
    },
    path
  );
}
