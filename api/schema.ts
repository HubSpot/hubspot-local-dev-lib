import fs from 'fs-extra';
import http from '../http';
import { FetchSchemasResponse, Schema } from '../types/Schemas';

const SCHEMA_API_PATH = 'crm-object-schemas/v3/schemas';

export function createSchema(accountId: number, object: JSON): Promise<Schema> {
  return http.post(accountId, {
    url: SCHEMA_API_PATH,
    body: object,
  });
}

export async function updateSchema(
  accountId: number,
  schemaObjectType: string,
  filePath: string
): Promise<Schema> {
  return http.patch(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
    body: JSON.parse(fs.readFileSync(filePath, 'utf-8')),
  });
}

export async function fetchSchema(
  accountId: number,
  schemaObjectType: string
): Promise<Schema> {
  return http.get(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}

export async function fetchSchemas(
  accountId: number
): Promise<FetchSchemasResponse> {
  return http.get(accountId, {
    url: SCHEMA_API_PATH,
  });
}

export async function deleteSchema(
  accountId: number,
  schemaObjectType: string
): Promise<void> {
  return http.delete(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}
