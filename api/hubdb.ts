import { http, HubSpotResponse } from '../http';
import { QueryParams } from '../types/Http';
import {
  CreateRowsResponse,
  FetchRowsResponse,
  Row,
  Schema,
  Table,
  FetchTablesResponse,
} from '../types/Hubdb';

const HUBDB_API_PATH = 'cms/v3/hubdb';

export function fetchTables(
  accountId: number
): HubSpotResponse<FetchTablesResponse> {
  return http.get<FetchTablesResponse>(accountId, {
    url: `${HUBDB_API_PATH}/tables`,
  });
}

export function fetchTable(
  accountId: number,
  tableId: string
): HubSpotResponse<Table> {
  return http.get<Table>(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}`,
  });
}

export function createTable(
  accountId: number,
  schema: Schema
): HubSpotResponse<Table> {
  return http.post<Table>(accountId, {
    url: `${HUBDB_API_PATH}/tables`,
    data: schema,
  });
}

export function updateTable(
  accountId: number,
  tableId: string,
  schema: Schema
): HubSpotResponse<Table> {
  return http.patch<Table>(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/draft`,
    data: schema,
  });
}

export function publishTable(
  accountId: number,
  tableId: string
): HubSpotResponse<Table> {
  return http.post<Table>(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/draft/publish`,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function deleteTable(
  accountId: number,
  tableId: string
): HubSpotResponse<void> {
  return http.delete(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}`,
  });
}

export function createRows(
  accountId: number,
  tableId: string,
  rows: Array<Row>
): HubSpotResponse<CreateRowsResponse> {
  return http.post<CreateRowsResponse>(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft/batch/create`,
    data: { inputs: rows },
  });
}

export function fetchRows(
  accountId: number,
  tableId: string,
  params: QueryParams = {}
): HubSpotResponse<FetchRowsResponse> {
  return http.get<FetchRowsResponse>(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft`,
    params,
  });
}

export function deleteRows(
  accountId: number,
  tableId: string,
  rowIds: Array<string>
): HubSpotResponse<void> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft/batch/purge`,
    data: { inputs: rowIds },
  });
}
