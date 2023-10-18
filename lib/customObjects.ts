import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';
import { getCwd } from '../lib/path';
import { fetchObjectSchemas, fetchObjectSchema } from '../api/customObjects';
import { Schema } from '../types/Schemas';

export function getResolvedPath(dest: string, name: string): string {
  if (name) return path.resolve(getCwd(), dest || '', `${name}.json`);

  return path.resolve(getCwd(), dest || '');
}

export async function writeSchemaToDisk(
  schema: Schema,
  dest: string
): Promise<void> {
  const formattedSchema = await prettier.format(JSON.stringify(schema), {
    parser: 'json',
  });
  fs.outputFileSync(getResolvedPath(dest, schema.name), formattedSchema);
}

export async function downloadSchemas(
  accountId: number,
  dest: string
): Promise<void> {
  const response = await fetchObjectSchemas(accountId);

  if (response.results.length) {
    response.results.forEach((r: Schema) => writeSchemaToDisk(r, dest));
  }
}

export async function downloadSchema(
  accountId: number,
  schemaObjectType: string,
  dest: string
): Promise<void> {
  const response = await fetchObjectSchema(accountId, schemaObjectType);
  writeSchemaToDisk(response, dest);
}
