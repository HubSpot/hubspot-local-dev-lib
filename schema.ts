import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';
import { getCwd } from './lib/path';
import { fetchSchemas, fetchSchema } from './api/schema';
import { Schema } from './types/Schemas';

export function getResolvedPath(dest: string, name: string): string {
  if (name) return path.resolve(getCwd(), dest || '', `${name}.json`);

  return path.resolve(getCwd(), dest || '');
}

export function writeSchemaToDisk(schema: Schema, dest: string): void {
  fs.outputFileSync(
    getResolvedPath(dest, schema.name),
    prettier.format(JSON.stringify(schema), {
      parser: 'json',
    })
  );
}

export async function downloadSchemas(
  accountId: number,
  dest: string
): Promise<void> {
  const response = await fetchSchemas(accountId);

  if (response.results.length) {
    response.results.forEach(r => writeSchemaToDisk(r, dest));
  }
}

export async function downloadSchema(
  accountId: number,
  schemaObjectType: string,
  dest: string
): Promise<void> {
  const response = await fetchSchema(accountId, schemaObjectType);
  writeSchemaToDisk(response, dest);
}
