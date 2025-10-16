import path from 'path';
import fs from 'fs-extra';
import { AxiosResponse } from 'axios';
import {
  createTable,
  updateTable,
  createRows,
  fetchTable,
  fetchRows,
  publishTable,
  deleteRows,
} from '../api/hubdb.js';
import { getCwd } from './path.js';
import { FetchRowsResponse, Row, Table } from '../types/Hubdb.js';
import { i18n } from '../utils/lang.js';

const i18nKey = 'lib.hubdb';

function validateJsonPath(src: string): void {
  if (path.extname(src) !== '.json') {
    throw new Error(i18n(`${i18nKey}.errors.invalidJsonPath`));
  }
}

function validateJsonFile(src: string): void {
  let stats: fs.Stats;

  try {
    stats = fs.statSync(src);
  } catch (err) {
    throw new Error(i18n(`${i18nKey}.errors.invalidJsonFile`, { src }), {
      cause: err,
    });
  }

  if (!stats.isFile()) {
    throw new Error(i18n(`${i18nKey}.errors.invalidJsonFile`, { src }));
  }

  validateJsonPath(src);
}

export async function addRowsToHubDbTable(
  accountId: number,
  tableId: string,
  rows: Array<Row> = []
): Promise<{ tableId: string; rowCount: number }> {
  const rowsToUpdate = rows.map(row => {
    const values = row.values;

    return {
      childTableId: '0',
      isSoftEditable: false,
      ...row,
      values,
    };
  });

  if (rowsToUpdate.length > 0) {
    await createRows(accountId, tableId, rowsToUpdate);
  }

  const {
    data: { rowCount },
  } = await publishTable(accountId, tableId);

  return {
    tableId,
    rowCount,
  };
}

export async function createHubDbTable(
  accountId: number,
  src: string
): Promise<{ tableId: string; rowCount: number }> {
  validateJsonFile(src);

  const table: Table = fs.readJsonSync(src);
  const { rows, ...schema } = table;
  const {
    data: { id },
  } = await createTable(accountId, schema);

  return addRowsToHubDbTable(accountId, id, rows);
}

export async function updateHubDbTable(
  accountId: number,
  tableId: string,
  src: string
) {
  validateJsonFile(src);

  const table: Table = fs.readJsonSync(src);
  const { ...schema } = table;

  return updateTable(accountId, tableId, schema);
}

function convertToJSON(table: Table, rows: Array<Row>) {
  const {
    allowChildTables,
    allowPublicApiAccess,
    columns,
    dynamicMetaTags,
    enableChildTablePages,
    label,
    name,
    useForPages,
  } = table;

  const cleanedColumns = columns
    .filter(column => !column.deleted || !column.archived)
    .map(
      ({
        /* eslint-disable @typescript-eslint/no-unused-vars */
        id,
        deleted,
        archived,
        foreignIdsByName,
        foreignIdsById,
        /* eslint-enable @typescript-eslint/no-unused-vars */
        ...cleanedColumn
      }) => cleanedColumn
    );

  const cleanedRows = rows.map(row => {
    return {
      path: row.path,
      name: row.name,
      values: row.values,
    };
  });

  return {
    name,
    useForPages,
    label,
    allowChildTables,
    allowPublicApiAccess,
    dynamicMetaTags,
    enableChildTablePages,
    columns: cleanedColumns,
    rows: cleanedRows,
  };
}

async function fetchAllRows(
  accountId: number,
  tableId: string
): Promise<Array<Row>> {
  let rows: Array<Row> = [];
  let after: string | null = null;
  do {
    const axiosResponse: AxiosResponse<FetchRowsResponse> = await fetchRows(
      accountId,
      tableId,
      after ? { after } : undefined
    );

    const { paging, results } = axiosResponse.data;

    rows = rows.concat(results);
    after = paging && paging.next ? paging.next.after : null;
  } while (after !== null);

  return rows;
}

export async function downloadHubDbTable(
  accountId: number,
  tableId: string,
  dest: string
): Promise<{ filePath: string }> {
  const { data: table } = await fetchTable(accountId, tableId);

  dest = path.resolve(getCwd(), dest || `${table.name}.hubdb.json`) as string;

  if (fs.pathExistsSync(dest)) {
    validateJsonFile(dest);
  } else {
    validateJsonPath(dest);
  }

  const rows = await fetchAllRows(accountId, tableId);
  const tableToWrite = JSON.stringify(convertToJSON(table, rows));

  // Use dynamic import for prettier to handle ESM compatibility
  const { format } = await import('prettier');
  const tableJson = await format(tableToWrite, {
    parser: 'json',
  });

  await fs.outputFile(dest, tableJson);

  return { filePath: dest };
}

export async function clearHubDbTableRows(
  accountId: number,
  tableId: string
): Promise<{ deletedRowCount: number }> {
  const rows = await fetchAllRows(accountId, tableId);
  await deleteRows(
    accountId,
    tableId,
    rows.map(row => row.id)
  );

  return {
    deletedRowCount: rows.length,
  };
}
