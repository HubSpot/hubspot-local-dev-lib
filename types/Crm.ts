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

export interface ImportResponse {
  id: string;
  state: 'STARTED' | 'PROCESSING' | 'DONE' | 'FAILED' | 'CANCELED' | 'DEFERRED';
}
