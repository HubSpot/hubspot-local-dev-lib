export const HTTP_METHOD_VERBS = {
  DEFAULT: 'request',
  DELETE: 'delete',
  GET: 'request',
  PATCH: 'update',
  POST: 'post',
  PUT: 'update',
} as const;

export const HTTP_METHOD_PREPOSITIONS = {
  DEFAULT: 'for',
  DELETE: 'of',
  GET: 'for',
  PATCH: 'to',
  POST: 'to',
  PUT: 'to',
} as const;

export const SANDBOX_TIMEOUT = 60000;
