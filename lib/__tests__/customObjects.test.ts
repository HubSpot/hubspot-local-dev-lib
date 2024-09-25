import fs from 'fs-extra';
import {
  downloadSchema,
  downloadSchemas,
  writeSchemaToDisk,
} from '../customObjects';
import {
  fetchObjectSchema as __fetchObjectSchema,
  fetchObjectSchemas as __fetchObjectSchemas,
} from '../../api/customObjects';
import basicSchema from './fixtures/customObjects/basicSchema.json';
import fullSchema from './fixtures/customObjects/fullSchema.json';
import multipleSchemas from './fixtures/customObjects/multipleSchemas.json';

jest.mock('fs-extra');
jest.mock('../../api/customObjects');

const outputFileSyncSpy = jest.spyOn(fs, 'outputFileSync');
jest.spyOn(fs, 'existsSync').mockReturnValue(true);
const fetchObjectSchema = __fetchObjectSchema as jest.MockedFunction<
  typeof __fetchObjectSchema
>;
const fetchObjectSchemas = __fetchObjectSchemas as jest.MockedFunction<
  typeof __fetchObjectSchemas
>;

describe('lib/customObjects', () => {
  describe('writeSchemaToDisk()', () => {
    it('writes schema to disk', async () => {
      await writeSchemaToDisk(basicSchema);
      const outputFileArgs = outputFileSyncSpy.mock.lastCall;

      expect(
        outputFileArgs ? JSON.parse(outputFileArgs[1] as string) : null
      ).toEqual(expect.objectContaining(basicSchema));
    });
  });

  describe('downloadSchema()', () => {
    it('downloads a schema and writes it to disk', async () => {
      fetchObjectSchema.mockResolvedValue(fullSchema);

      const result = await downloadSchema(123, '');
      const outputFileArgs = outputFileSyncSpy.mock.lastCall;

      expect(result).toEqual(expect.objectContaining(fullSchema));
      expect(
        outputFileArgs ? JSON.parse(outputFileArgs[1] as string) : null
      ).toEqual(expect.objectContaining(fullSchema));
    });

    it('handles schema fetch errors', async () => {
      fetchObjectSchema.mockImplementation(() => {
        return Promise.reject('Some error');
      });

      let errorNotThrown = true;
      try {
        await downloadSchema(123, '');
      } catch (err) {
        errorNotThrown = false;
        expect(err).toBeDefined();
      }

      if (errorNotThrown) {
        throw new Error('Expected downloadSchema to throw an error');
      }
    });
  });

  describe('downloadSchemas()', () => {
    it('downloads schemas and writes them to disk', async () => {
      fetchObjectSchemas.mockResolvedValue({ results: multipleSchemas });

      const result = await downloadSchemas(123);
      expect(result).toEqual(expect.objectContaining(multipleSchemas));

      outputFileSyncSpy.mock.calls.forEach((call, i) => {
        const schemaArg = JSON.parse(call[1] as string);
        expect(schemaArg).toEqual(expect.objectContaining(multipleSchemas[i]));
      });
    });

    it('handles schemas fetch errors', async () => {
      fetchObjectSchemas.mockImplementation(() => {
        return Promise.reject('Some error');
      });

      let errorNotThrown = true;
      try {
        await downloadSchemas(123, '');
      } catch (err) {
        errorNotThrown = false;
        expect(err).toBeDefined();
      }

      if (errorNotThrown) {
        throw new Error('Expected downloadSchemas to throw an error');
      }
    });
  });
});
