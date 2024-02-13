import http from '../http';
import { QueryParams } from '../types/Http';
import {
  CreateRowsResponse,
  FetchRowsResponse,
  Row,
  Schema,
  Table,
} from '../types/Hubdb';

const HUBDB_API_PATH = 'cms/v3/hubdb';

export async function fetchTable(
  accountId: number,
  tableId: string
): Promise<Table> {
  return http.get(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}`,
  });
}

export async function createTable(
  accountId: number,
  schema: Schema
): Promise<Table> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables`,
    data: schema,
  });
}

export async function updateTable(
  accountId: number,
  tableId: string,
  schema: Schema
) {
  return http.patch(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/draft`,
    data: schema,
  });
}

export async function publishTable(
  accountId: number,
  tableId: string
): Promise<Table> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/draft/publish`,
  });
}

export async function deleteTable(
  accountId: number,
  tableId: string
): Promise<void> {
  return http.delete(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}`,
  });
}

export async function createRows(
  accountId: number,
  tableId: string,
  rows: Array<Row>
): Promise<CreateRowsResponse> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft/batch/create`,
    data: { inputs: rows },
  });
}

export async function fetchRows(
  accountId: number,
  tableId: string,
  params: QueryParams = {}
): Promise<FetchRowsResponse> {
  return http.get(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft`,
    params,
  });
}

export async function deleteRows(
  accountId: number,
  tableId: string,
  rowIds: Array<string>
): Promise<void> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft/batch/purge`,
    data: { inputs: rowIds },
  });
}
