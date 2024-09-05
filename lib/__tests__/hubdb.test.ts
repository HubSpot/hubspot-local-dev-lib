import fs from 'fs-extra';
import {
  downloadHubDbTable,
  createHubDbTable,
  clearHubDbTableRows,
} from '../hubdb';
import {
  createRows as __createRows,
  createTable as __createTable,
  fetchRows as __fetchRows,
  fetchTable as __fetchTable,
  publishTable as __publishTable,
} from '../../api/hubdb';
import { getCwd as __getCwd } from '../path';
import hubdbFetchRowResponse from './fixtures/hubdb/fetchRowsResponse.json';
import hubdbFetchRowsResponseWithPaging from './fixtures/hubdb/fetchRowsResponseWithPaging.json';
import hubdbTableResponse from './fixtures/hubdb/tableResponse.json';
import hubdbCreateRowsResponse from './fixtures/hubdb/createRowsResponse.json';
import { Table } from '../../types/Hubdb';

jest.mock('fs-extra');
jest.mock('../path');
jest.mock('../../api/hubdb');

const mockedFS = fs as jest.Mocked<typeof fs>;
const getCwd = __getCwd as jest.MockedFunction<typeof __getCwd>;
const createRows = __createRows as jest.MockedFunction<typeof __createRows>;
const createTable = __createTable as jest.MockedFunction<typeof __createTable>;
const fetchRows = __fetchRows as jest.MockedFunction<typeof __fetchRows>;
const fetchTable = __fetchTable as jest.MockedFunction<typeof __fetchTable>;
const publishTable = __publishTable as jest.MockedFunction<
  typeof __publishTable
>;

describe('lib/hubdb', () => {
  describe('downloadHubDbTable()', () => {
    const accountId = 123;
    const tableId = '456';
    const destPath = 'tmp.json';
    const projectCwd = '/home/tom/projects';

    beforeEach(() => {
      getCwd.mockReturnValue(projectCwd);
      fetchRows.mockResolvedValue(hubdbFetchRowResponse);
      fetchTable.mockResolvedValue(hubdbTableResponse);
    });

    it('fetches all results', async () => {
      const { filePath } = await downloadHubDbTable(
        accountId,
        tableId,
        destPath
      );
      const outputFile = JSON.parse(
        mockedFS.outputFile.mock.calls[0][1] as string
      ) as unknown as Table;

      if (!outputFile.rows) {
        throw new Error('No rows found on the table object');
      }

      expect(outputFile.rows.length).toBe(3);
      expect(outputFile.rows[1].name).toBe('My Better Event');
      expect(outputFile.rows[0].values['text_column']).toBe('a');
      expect(outputFile.name).toBe('cool-table-name');
      expect(filePath).toEqual(`${projectCwd}/${destPath}`);
    });

    it('fetches all results with paging', async () => {
      fetchRows.mockResolvedValueOnce(hubdbFetchRowsResponseWithPaging);
      await downloadHubDbTable(accountId, tableId, destPath);
      const outputFile = JSON.parse(
        mockedFS.outputFile.mock.calls[0][1] as string
      ) as unknown as Table;

      if (!outputFile.rows) {
        throw new Error('No rows found on the table object');
      }

      expect(outputFile.rows.length).toEqual(6);
      expect(outputFile.rows[0].name).toMatchInlineSnapshot(`"Paging 1"`);
      expect(outputFile.rows[5].name).toMatchInlineSnapshot(`"My Best Event"`);
    });
  });

  describe('createHubDbTable()', () => {
    it('creates a table', async () => {
      const accountId = 123;
      const srcPath = 'tmp.json';
      const projectCwd = '/home/tom/projects';

      mockedFS.statSync.mockReturnValue({ isFile: () => true } as fs.Stats);
      mockedFS.readJsonSync.mockReturnValue(hubdbTableResponse);

      createTable.mockResolvedValue(hubdbTableResponse);
      createRows.mockResolvedValue(hubdbCreateRowsResponse);
      publishTable.mockResolvedValue(hubdbTableResponse);

      const table = await createHubDbTable(
        accountId,
        `${projectCwd}/${srcPath}`
      );

      expect(table.rowCount).toEqual(3);
      expect(table.tableId).toEqual('cool-table-id');
      expect(publishTable).toBeCalled();
    });
  });

  describe('clearHubDbTableRows()', () => {
    it('clears all of the hubdb table rows', async () => {
      fetchRows.mockResolvedValue(hubdbFetchRowResponse);
      const result = await clearHubDbTableRows(123, '456');

      expect(result.deletedRowCount).toBe(3);
    });
  });
});
