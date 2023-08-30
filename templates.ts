import fs from 'fs-extra';
import path from 'path';
import { downloadGithubRepoContents } from './lib/github';
import { throwErrorWithMessage } from './errors/standardErrors';
import { debug, makeTypedLogger } from './utils/logger';
import { LogCallbacksArg } from './types/LogCallbacks';

// Matches the .html file extension, excluding module.html
const TEMPLATE_EXTENSION_REGEX = new RegExp(/(?<!module)\.html$/);

// Matches the comment brackets that wrap annotations
const ANNOTATIONS_REGEX = /<!--([\s\S]*?)-->/;
// Matches an annotation value, ending at space, newline, or end of string
const ANNOTATION_VALUE_REGEX = ':\\s?([\\S|\\s]*?)(\n|$)';

export const ANNOTATION_KEYS = {
  isAvailableForNewContent: 'isAvailableForNewContent',
  templateType: 'templateType',
  label: 'label',
  screenshotPath: 'screenshotPath',
  // 'description' is specific to Sections
  description: 'description',
};

export function getAnnotationValue(annotations, key) {
  const valueRegex = new RegExp(`${key}${ANNOTATION_VALUE_REGEX}`);
  const match = annotations.match(valueRegex);
  return match ? match[1].trim() : null;
}

export function buildAnnotationValueGetter(file) {
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch (e) {
    throwErrorWithMessage('errors.templates.fileAnnotations', { file }, e);
  }
  return getAnnotationsFromSource(source);
}

export function getAnnotationsFromSource(source) {
  const match = source.match(ANNOTATIONS_REGEX);
  const annotation = match && match[1] ? match[1] : '';
  return annotationKey => getAnnotationValue(annotation, annotationKey);
}

/*
 * Returns true if:
 * .html extension (ignoring module.html)
 */
export function isCodedFile(filePath: string): boolean {
  return TEMPLATE_EXTENSION_REGEX.test(filePath);
}

const ASSET_PATHS = {
  'page-template': 'templates/page-template.html',
  partial: 'templates/partial.html',
  'global-partial': 'templates/global-partial.html',
  'email-template': 'templates/email-template.html',
  'blog-listing-template': 'templates/blog-listing-template.html',
  'blog-post-template': 'templates/blog-post-template.html',
  'search-template': 'templates/search-template.html',
  section: 'templates/section.html',
};

const templatesCallbackKeys = ['creatingFile'];

export async function createTemplate(
  name,
  dest,
  type = 'page-template',
  options = { allowExisting: false },
  logCallbacks?: LogCallbacksArg<typeof templatesCallbackKeys>
) {
  const assetPath = ASSET_PATHS[type];
  const filename = name.endsWith('.html') ? name : `${name}.html`;
  const filePath = path.join(dest, filename);
  if (!options.allowExisting && fs.existsSync(filePath)) {
    throwErrorWithMessage('errors.templates.pathExists', { path: filePath });
  }
  debug('topLevelExports.templates.debug.creatingPath', { path: dest });
  fs.mkdirp(dest);

  const logger = makeTypedLogger<typeof templatesCallbackKeys>(
    logCallbacks,
    'topLevelExports.templates.logging'
  );
  logger('creatingFile', { path: filePath });

  await downloadGithubRepoContents(
    'HubSpot/cms-sample-assets',
    assetPath,
    filePath
  );
}
