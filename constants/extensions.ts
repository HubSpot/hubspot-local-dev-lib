export const ALLOWED_EXTENSIONS = new Set([
  'css',
  'js',
  'json',
  'html',
  'txt',
  'md',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'map',
  'svg',
  'eot',
  'ttf',
  'woff',
  'woff2',
  'graphql',
]);

export const MODULE_EXTENSION = 'module';
export const FUNCTIONS_EXTENSION = 'functions';

export const MODE = {
  DRAFT: 'draft',
  PUBLISH: 'publish',
} as const;
