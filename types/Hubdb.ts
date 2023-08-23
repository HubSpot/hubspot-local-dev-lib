export type Schema = {
  label: string;
  name: string;
  columns: [
    {
      name: string;
      label: string;
      id: string;
      type: string;
    }
  ];
  useForPages: boolean;
  allowChildTables: boolean;
  enableChildTablePages: boolean;
  allowPublicApiAccess: boolean;
};

export type Table = {
  id: string;
  name: string;
  portalId: number;
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
  label: string;
  columns: [
    {
      name: string;
      label: string;
      id: string;
      archived: boolean;
      type: string;
    }
  ];
  partitioningSettings: null; //TODO
  published: boolean;
  cosObjectType: string;
  updated: number;
  archived: boolean;
  columnCount: number;
  cdnPurgeEmbargoTime: number | null;
  rowCount: number;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  useForPages: boolean;
  allowChildTables: boolean;
  enableChildTablePages: boolean;
  crmObjectTypeId: number;
  dynamicMetaTags: null; //TODO
  allowPublicApiAccess: boolean;
};

export type Row = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  values: { text_column: string };
  path: string | null;
  name: string | null;
  childTableId: string;
  isSoftEditable: boolean;
};

export type CreateRowsResponse = {
  status: string;
  results: Array<Row>;
  startedAt: string;
  completedAt: string;
};
