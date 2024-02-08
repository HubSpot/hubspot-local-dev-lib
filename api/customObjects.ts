import http from '../http';
import { FetchSchemasResponse, Schema } from '../types/Schemas';

const CUSTOM_OBJECTS_API_PATH = 'crm/v3/objects';
const SCHEMA_API_PATH = 'crm-object-schemas/v3/schemas';

type CreateObjectsResponse = {
  status: string;
  startedAt: string;
  completedAt: string;
  results: Array<{
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: Array<any>;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
  }>;
};

export async function batchCreateObjects(
  accountId: number,
  objectTypeId: string,
  objects: JSON
): Promise<CreateObjectsResponse> {
  return http.post<CreateObjectsResponse>(accountId, {
    url: `${CUSTOM_OBJECTS_API_PATH}/${objectTypeId}/batch/create`,
    data: objects,
  });
}

export async function createObjectSchema(
  accountId: number,
  schema: JSON
): Promise<Schema> {
  return http.post(accountId, {
    url: SCHEMA_API_PATH,
    data: schema,
  });
}

export async function updateObjectSchema(
  accountId: number,
  schemaObjectType: string,
  schema: Schema
): Promise<Schema> {
  return http.patch(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
    data: schema,
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
