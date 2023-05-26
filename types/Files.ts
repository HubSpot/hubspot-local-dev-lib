import { ValueOf } from '../types/Utils';
import { STAT_TYPES } from '../constants/files';

export type StatType = ValueOf<typeof STAT_TYPES>;

export type FileData = {
  filepath: string;
  files?: Array<string>;
  type: StatType;
};
