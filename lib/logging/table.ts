import chalk from 'chalk';
import { table, TableUserConfig } from 'table';
import { mergeDeep } from '../../utils/objectUtils';

const tableConfigDefaults = {
  singleLine: true,
  border: {
    topBody: '',
    topJoin: '',
    topLeft: '',
    topRight: '',

    bottomBody: '',
    bottomJoin: '',
    bottomLeft: '',
    bottomRight: '',

    bodyLeft: '',
    bodyRight: '',
    bodyJoin: '',

    joinBody: '',
    joinLeft: '',
    joinRight: '',
    joinJoin: '',
  },
  columnDefault: {
    paddingLeft: 0,
    paddingRight: 1,
  },
  drawHorizontalLine: () => {
    return false;
  },
};

export function getTableContents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tableData: Array<Array<any>> = [],
  tableConfig: TableUserConfig = {}
) {
  const mergedConfig = mergeDeep({}, tableConfigDefaults, tableConfig);

  return table(tableData, mergedConfig);
}

export function getTableHeader(headerItems: Array<string>): Array<string> {
  return headerItems.map(headerItem => chalk.bold(headerItem));
}
