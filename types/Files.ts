import { ValueOf } from '../types/Utils';
import { STAT_TYPES } from '../constants/files';
import { MODE } from '../constants/extensions';
import { HttpOptions } from './Http';

export type StatType = ValueOf<typeof STAT_TYPES>;

export type FileData = {
  filepath: string;
  files?: Array<string>;
  type: StatType;
};

export type FileMapperNode = {
  name: string;
  createdAt: number;
  updatedAt: number;
  source: string | null;
  path: string;
  folder: boolean;
  children: Array<FileMapperNode>;
};

export type Mode = ValueOf<typeof MODE>;

export type FileMapperOptions = Omit<HttpOptions, 'uri'>;
