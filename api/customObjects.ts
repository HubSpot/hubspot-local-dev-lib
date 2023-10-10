import http from '../http';
import { FetchSchemasResponse, Schema } from '../types/Schemas';

const CUSTOM_OBJECTS_API_PATH = 'crm/v3/objects';
const SCHEMA_API_PATH = 'crm-object-schemas/v3/schemas';

export async function batchCreateObjects(
  accountId: number,
  objectTypeId: string,
  objects: JSON
): Promise<void> {
  http.post<void>(accountId, {
    url: `${CUSTOM_OBJECTS_API_PATH}/${objectTypeId}/batch/create`,
    body: objects,
  });
}

export async function createObjectSchema(
  accountId: number,
  schema: JSON
): Promise<Schema> {
  return http.post(accountId, {
    url: SCHEMA_API_PATH,
    body: schema,
  });
}

export async function updateObjectSchema(
  accountId: number,
  schemaObjectType: string,
  schema: Schema
): Promise<Schema> {
  return http.patch(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
    body: schema,
  });
}

export async function fetchObjectSchema(
  accountId: number,
  schemaObjectType: string
): Promise<Schema> {
  return http.get(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}

export async function fetchObjectSchemas(
  accountId: number
): Promise<FetchSchemasResponse> {
  return http.get(accountId, {
    url: SCHEMA_API_PATH,
  });
}

export async function deleteObjectSchema(
  accountId: number,
  schemaObjectType: string
): Promise<void> {
  return http.delete(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}
