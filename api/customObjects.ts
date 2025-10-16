import { http } from '../http/index.js';
import {
  FetchSchemasResponse,
  Schema,
  SchemaDefinition,
  ObjectDefinition,
  CreateObjectsResponse,
} from '../types/Schemas.js';
import { HubSpotPromise } from '../types/Http.js';

const CUSTOM_OBJECTS_API_PATH = 'crm/v3/objects';
const SCHEMA_API_PATH = 'crm-object-schemas/v3/schemas';

export function batchCreateObjects(
  accountId: number,
  objectTypeId: string,
  objects: ObjectDefinition
): HubSpotPromise<CreateObjectsResponse> {
  return http.post<CreateObjectsResponse>(accountId, {
    url: `${CUSTOM_OBJECTS_API_PATH}/${objectTypeId}/batch/create`,
    data: objects,
  });
}

export function createObjectSchema(
  accountId: number,
  schema: SchemaDefinition
): HubSpotPromise<Schema> {
  return http.post<Schema>(accountId, {
    url: SCHEMA_API_PATH,
    data: schema,
  });
}

export function updateObjectSchema(
  accountId: number,
  schemaObjectType: string,
  schema: SchemaDefinition
): HubSpotPromise<Schema> {
  return http.patch<Schema>(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
    data: schema,
  });
}

export function fetchObjectSchema(
  accountId: number,
  schemaObjectType: string
): HubSpotPromise<Schema> {
  return http.get<Schema>(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}

export function fetchObjectSchemas(
  accountId: number
): HubSpotPromise<FetchSchemasResponse> {
  return http.get<FetchSchemasResponse>(accountId, {
    url: SCHEMA_API_PATH,
  });
}

export function deleteObjectSchema(
  accountId: number,
  schemaObjectType: string
): HubSpotPromise<void> {
  return http.delete(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}
