import { http, HubSpotResponse } from '../http';
import {
  FetchSchemasResponse,
  Schema,
  CreateObjectsResponse,
} from '../types/Schemas';

const CUSTOM_OBJECTS_API_PATH = 'crm/v3/objects';
const SCHEMA_API_PATH = 'crm-object-schemas/v3/schemas';

export function batchCreateObjects(
  accountId: number,
  objectTypeId: string,
  objects: JSON
): HubSpotResponse<CreateObjectsResponse> {
  return http.post<CreateObjectsResponse>(accountId, {
    url: `${CUSTOM_OBJECTS_API_PATH}/${objectTypeId}/batch/create`,
    data: objects,
  });
}

export function createObjectSchema(
  accountId: number,
  schema: JSON
): HubSpotResponse<Schema> {
  return http.post<Schema>(accountId, {
    url: SCHEMA_API_PATH,
    data: schema,
  });
}

export function updateObjectSchema(
  accountId: number,
  schemaObjectType: string,
  schema: Schema
): HubSpotResponse<Schema> {
  return http.patch<Schema>(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
    data: schema,
  });
}

export function fetchObjectSchema(
  accountId: number,
  schemaObjectType: string
): HubSpotResponse<Schema> {
  return http.get<Schema>(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}

export function fetchObjectSchemas(
  accountId: number
): HubSpotResponse<FetchSchemasResponse> {
  return http.get<FetchSchemasResponse>(accountId, {
    url: SCHEMA_API_PATH,
  });
}

export function deleteObjectSchema(
  accountId: number,
  schemaObjectType: string
): HubSpotResponse<void> {
  return http.delete(accountId, {
    url: `${SCHEMA_API_PATH}/${schemaObjectType}`,
  });
}
