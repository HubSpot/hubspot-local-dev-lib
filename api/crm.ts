import path from 'path';
import fs from 'fs-extra';
import FormData from 'form-data';

import { http } from '../http';
import { getCwd } from '../lib/path';
import { HubSpotPromise } from '../types/Http';

const HUBSPOT_CRM_IMPORT_PATH = '/crm/v3/imports';

export function createImport(
  accountId: number,
  importRequest: ImportRequest,
  dataFileNames: string[]
): HubSpotPromise {
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

// created from https://developers.hubspot.com/docs/guides/api/crm/imports#format-the-importrequest-data
export interface ImportRequest {
  name: string;
  importOperations: {
    [objectTypeId: string]: 'CREATE' | 'UPDATE' | 'UPSERT';
  };
  dateFormat?: string;
  marketableContactImport?: boolean;
  createContactListFromImport?: boolean;
  files: Array<{
    fileName: string;
    fileFormat: 'CSV' | 'XLSX' | 'XLS';
    fileImportPage: {
      hasHeader: boolean;
      columnMappings: Array<{
        columnObjectTypeId: string;
        columnName: string;
        propertyName: string;
        columnType?: string;
      }>;
    };
  }>;
}
