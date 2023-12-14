export const HTTP_METHOD_VERBS = {
  delete: 'delete',
  get: 'request',
  patch: 'update',
  post: 'post',
  put: 'update',
} as const;

export const HTTP_METHOD_PREPOSITIONS = {
  delete: 'of',
  get: 'for',
  patch: 'to',
  post: 'to',
  put: 'to',
} as const;

export const SANDBOX_TIMEOUT = 60000;
