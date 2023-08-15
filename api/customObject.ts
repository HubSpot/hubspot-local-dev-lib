import http from '../http';

const CUSTOM_OBJECTS_API_PATH = 'crm/v3/objects';

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
