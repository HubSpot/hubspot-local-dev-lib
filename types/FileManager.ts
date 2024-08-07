export type File = {
  id: number;
  portal_id: number;
  name: string;
  size: number;
  height: number | null;
  width: number | null;
  encoding: string | null;
  type: string;
  extension: string;
  cloud_key: string;
  s3_url: string;
  friendly_url: string;
  meta: {
    allows_anonymous_access: boolean;
    line_count: number;
    indexable: boolean;
  };
  created: number;
  updated: number;
  deleted_at: number;
  folder_id: number | null;
  hidden: boolean;
  archived: boolean;
  created_by: number;
  deleted_by: number | null;
  replaceable: boolean;
  default_hosting_url: string;
  teams?: Array<number>;
  is_indexable: boolean;
  cloud_key_hash: string;
  url: string;
  title: string;
  cdn_purge_embargo_time: number | null;
  file_hash: string;
};

export type Folder = {
  id: number | 'None';
  portal_id: number;
  name: string;
  deleted: boolean;
  teams?: Array<number>;
  parent_folder_id: number | null;
  created: number;
  updated: number;
  deleted_at: number;
  full_path: string;
  category: number;
  hidden: false;
  cdn_purge_embargo_time: number | null;
};

export type UploadResponse = {
  objects: Array<File>;
};

export type FetchStatResponse = {
  file: File | null;
  folder: Folder | null;
};

export type FetchFilesResponse = {
  limit: number;
  offset: number;
  objects: Array<File>;
  total_count: number;
};

export type FetchFolderResponse = {
  limit: number;
  offset: number;
  objects: Array<Folder>;
  total_count: number;
};

export type SimplifiedFolder = Partial<Folder> & Pick<Folder, 'id' | 'name'>;
