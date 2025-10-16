import fs from 'fs-extra';
import path from 'path';
import { getCwd } from '../lib/path.js';
import { fetchObjectSchemas, fetchObjectSchema } from '../api/customObjects.js';
import { Schema } from '../types/Schemas.js';

export function getResolvedPath(dest?: string, name?: string): string {
  if (name) return path.resolve(getCwd(), dest || '', `${name}.json`);

  return path.resolve(getCwd(), dest || '');
}

export async function writeSchemaToDisk(
  schema: Schema,
  dest?: string
): Promise<void> {
  // Use dynamic import for prettier to handle ESM compatibility
  const { format } = await import('prettier');
  const formattedSchema = await format(JSON.stringify(schema), {
    parser: 'json',
  });
  fs.outputFileSync(getResolvedPath(dest, schema.name), formattedSchema);
}

export async function downloadSchemas(
  accountId: number,
  dest?: string
): Promise<Array<Schema>> {
  const axiosResponse = await fetchObjectSchemas(accountId);
  const response = axiosResponse.data;

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
  const axiosResponse = await fetchObjectSchema(accountId, schemaObjectType);
  const response = axiosResponse.data;

  await writeSchemaToDisk(response, dest);
  return response;
}
