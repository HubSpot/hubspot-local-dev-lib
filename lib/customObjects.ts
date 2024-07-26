import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';
import { getCwd } from '../lib/path';
import { fetchObjectSchemas, fetchObjectSchema } from '../api/customObjects';
import { FetchSchemasResponse, Schema } from '../types/Schemas';
import { throwApiError } from '../errors/apiErrors';

export function getResolvedPath(dest?: string, name?: string): string {
  if (name) return path.resolve(getCwd(), dest || '', `${name}.json`);

  return path.resolve(getCwd(), dest || '');
}

export async function writeSchemaToDisk(
  schema: Schema,
  dest?: string
): Promise<void> {
  const formattedSchema = await prettier.format(JSON.stringify(schema), {
    parser: 'json',
  });
  fs.outputFileSync(getResolvedPath(dest, schema.name), formattedSchema);
}

export async function downloadSchemas(
  accountId: number,
  dest?: string
): Promise<Array<Schema>> {
  let response: FetchSchemasResponse;

  try {
    const axiosResponse = await fetchObjectSchemas(accountId);
    response = axiosResponse.data;
  } catch (err) {
    throwApiError(err);
  }

  if (response.results.length) {
    for (const schema of response.results) {
      await writeSchemaToDisk(schema, dest);
    }
  }

  return response.results;
}

export async function downloadSchema(
  accountId: number,
  schemaObjectType: string,
  dest?: string
): Promise<Schema> {
  let response: Schema;

  try {
    const axiosResponse = await fetchObjectSchema(accountId, schemaObjectType);
    response = axiosResponse.data;
  } catch (err) {
    throwApiError(err);
  }

  await writeSchemaToDisk(response, dest);

  return response;
}
