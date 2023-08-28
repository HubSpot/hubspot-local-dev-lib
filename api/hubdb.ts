import http from '../http';
import { QueryParams } from '../types/Http';
import { CreateRowsResponse, Row, Schema, Table } from '../types/Hubdb';

const HUBDB_API_PATH = 'cms/v3/hubdb';

export async function fetchTable(
  accountId: number,
  tableId: number
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
    body: schema,
  });
}

export async function publishTable(
  accountId: number,
  tableId: number
): Promise<Table> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/draft/publish`,
  });
}

export async function deleteTable(
  accountId: number,
  tableId: number
): Promise<void> {
  return http.delete(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}`,
  });
}

export async function createRows(
  accountId: number,
  tableId: number,
  rows: Array<Row>
): Promise<CreateRowsResponse> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft/batch/create`,
    body: { inputs: rows },
  });
}

export async function fetchRows(
  accountId: number,
  tableId: number,
  query: QueryParams = {}
): Promise<Array<Row>> {
  return http.get(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft`,
    query,
  });
}

export async function deleteRows(
  accountId: number,
  tableId: number,
  rowIds
): Promise<void> {
  return http.post(accountId, {
    url: `${HUBDB_API_PATH}/tables/${tableId}/rows/draft/batch/purge`,
    body: { inputs: rowIds },
  });
}
