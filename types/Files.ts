import { ValueOf } from '../types/Utils';
import {
  STAT_TYPES,
  FILE_TYPES,
  FILE_UPLOAD_RESULT_TYPES,
} from '../constants/files';
import { MODE } from '../constants/files';
import { HttpOptions } from './Http';
import { AxiosError } from 'axios';

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

export type PathTypeData = {
  isModule: boolean;
  isHubspot: boolean;
  isFile: boolean;
  isRoot: boolean;
  isFolder: boolean;
};

export type RecursiveFileMapperCallback = (
  node: FileMapperNode,
  filepath?: string,
  depth?: number
) => boolean;

export type CommandOptions = {
  convertFields?: boolean;
  fieldOptions?: string;
  saveOutput?: boolean;
  onAttemptCallback?: (file: string | undefined, destPath: string) => void;
  onSuccessCallback?: (file: string | undefined, destPath: string) => void;
  onFirstErrorCallback?: (
    file: string,
    destPath: string,
    error: unknown
  ) => void;
  onRetryCallback?: (file: string, destPath: string) => void;
  onFinalErrorCallback?: (
    accountId: number,
    file: string,
    destPath: string,
    error: unknown
  ) => void;
};

export type FilePathsByType = {
  [key: string]: Array<string>;
};

export type UploadFileOptions = FileMapperInputOptions & {
  src: string;
  commandOptions: {
    convertFields?: boolean;
  };
  fieldOptions?: string;
};

export type WatchOptions = {
  mode?: Mode;
  remove?: boolean;
  disableInitial?: boolean;
  notify?: string;
  commandOptions: {
    convertFields?: boolean;
  };
  filePaths?: Array<string>;
};

export type WatchErrorHandler = (error: AxiosError) => void;
