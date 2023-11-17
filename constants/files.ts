export const STAT_TYPES = {
  FILE: 'file',
  SYMBOLIC_LINK: 'symlink',
  DIRECTORY: 'dir',
} as const;

export const MODE = {
  draft: 'draft',
  publish: 'publish',
} as const;

export const DEFAULT_MODE = MODE.publish;

export const FILE_UPLOAD_RESULT_TYPES = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const;

export const FILE_TYPES = {
  other: 'otherFiles',
  module: 'moduleFiles',
  cssAndJs: 'cssAndJsFiles',
  template: 'templateFiles',
  json: 'jsonFiles',
  fieldsJs: 'fieldJsFiles',
} as const;
