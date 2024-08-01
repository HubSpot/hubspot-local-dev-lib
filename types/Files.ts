import { ValueOf } from '../types/Utils';
import {
  STAT_TYPES,
  FILE_TYPES,
  FILE_UPLOAD_RESULT_TYPES,
} from '../constants/files';
import { MODE } from '../constants/files';
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

export type FileMapperOptions = Omit<HttpOptions, 'url'>;

export type FileMapperInputOptions = {
  staging?: boolean;
  assetVersion?: string;
  overwrite?: boolean;
};

export type FileType = ValueOf<typeof FILE_TYPES>;
type ResultType = ValueOf<typeof FILE_UPLOAD_RESULT_TYPES>;

export type UploadFolderResults = {
  resultType: ResultType;
  error: unknown;
  file: string;
};

export type FileTree = {
  source?: string;
  path: string;
  children: Array<FileTree>;
};
