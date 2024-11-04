export type Schema = {
  label: string;
  name: string;
  columns: Array<Column>;
  useForPages: boolean;
  allowChildTables: boolean;
  enableChildTablePages: boolean;
  allowPublicApiAccess: boolean;
};

export type Table = {
  id: string;
  name: string;
  portalId?: number;
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
  label: string;
  columns: Array<Column>;
  rows?: Array<Row>;
  partitioningSettings?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teamIds: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userIds: Array<any>;
  };
  published?: boolean;
  cosObjectType?: string;
  updated?: number;
  archived: boolean;
  columnCount?: number;
  cdnPurgeEmbargoTime?: number | null;
  rowCount: number;
  createdBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  useForPages: boolean;
  allowChildTables: boolean;
  enableChildTablePages: boolean;
  crmObjectTypeId?: number;
  dynamicMetaTags?: { [key: string]: number };
  allowPublicApiAccess: boolean;
};

export type Column = {
  name: string;
  label: string;
  id?: string;
  archived?: boolean;
  type: string;
  deleted?: boolean;
  foreignIdsByName?: {
    [key: string]: { id: string; name: string; type: string };
  };
  foreignIdsById?: {
    [key: string]: { id: string; name: string; type: string };
  };
};

export type Row = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  values: {
    text_column?: string;
    number_column?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    multiselect?: Array<any>;
  };
  path: string | null;
  name: string | null;
  childTableId?: string;
  isSoftEditable?: boolean;
};

export type CreateRowsResponse = {
  status: string;
  results: Array<Row>;
  startedAt?: string;
  completedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  links?: { [key: string]: any };
};

export type FetchRowsResponse = {
  total: number;
  results: Array<Row>;
  paging?: { next: { after: string | null } } | null;
};

export type FetchTablesResponse = {
  total: number;
  results: Array<Table>;
  paging?: { next: { after: string | null } } | null;
};
