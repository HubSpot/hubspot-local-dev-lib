import path from 'path';
import fs from 'fs-extra';
import FormData from 'form-data';

import { http } from '../http/index.js';
import { getCwd } from '../lib/path.js';
import { HubSpotPromise } from '../types/Http.js';
import { ImportRequest, ImportResponse } from '../types/Crm.js';

const HUBSPOT_CRM_IMPORT_PATH = '/crm/v3/imports';

export function createImport(
  accountId: number,
  importRequest: ImportRequest,
  dataFileNames: string[]
): HubSpotPromise<ImportResponse> {
  const jsonImportRequest = JSON.stringify(importRequest);

  const formData = new FormData();
  formData.append('importRequest', jsonImportRequest);

  dataFileNames.forEach(file => {
    const stream = fs.createReadStream(path.resolve(getCwd(), file));
    formData.append('files', stream, file);
  });

  return http.post(accountId, {
    url: `${HUBSPOT_CRM_IMPORT_PATH}`,
    data: formData,
    headers: {
      ...formData.getHeaders(),
    },
  });
}
