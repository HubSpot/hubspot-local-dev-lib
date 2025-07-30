import path from 'path';
import fs from 'fs-extra';

import { http } from '../http';
import { getCwd } from '../lib/path';
import { HubSpotPromise, FormData } from '../types/Http';
const HUBSPOT_CRM_IMPORT_PATH = '/crm/v3/imports';

export function createImport(
  accountId: number,
  filepath: string
): HubSpotPromise[] {
  validateJsonPath(filepath);

  const importRequest: ImportRequest = fs.readJsonSync(
    path.resolve(getCwd(), filepath)
  );

  const jsonImportRequest = JSON.stringify(importRequest);

  const importFiles = importRequest.files;

  return importFiles.map(file => {
    const formData: FormData = {
      importRequest: jsonImportRequest,
      files: fs.createReadStream(path.resolve(getCwd(), file.fileName)),
    };

    return http.post(accountId, {
      url: `${HUBSPOT_CRM_IMPORT_PATH}`,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });
}

// created from https://developers.hubspot.com/docs/guides/api/crm/imports#format-the-importrequest-data
interface ImportRequest {
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

function validateJsonPath(src: string): void {
  if (path.extname(src) !== '.json') {
    throw new Error('You must provide a JSON file');
  }
}
