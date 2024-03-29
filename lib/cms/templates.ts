import fs from 'fs-extra';
import path from 'path';
import { downloadGithubRepoContents } from '../github';
import { throwErrorWithMessage } from '../../errors/standardErrors';
import { logger } from '../logger';
import { i18n } from '../../utils/lang';

const i18nKey = 'lib.cms.templates';

// Matches the .html file extension, excluding module.html
const TEMPLATE_EXTENSION_REGEX = new RegExp(/(?<!module)\.html$/);

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

export function getAnnotationValue(
  annotations: string,
  key: string
): string | null {
  const valueRegex = new RegExp(`${key}${ANNOTATION_VALUE_REGEX}`);
  const match = annotations.match(valueRegex);
  return match ? match[1].trim() : null;
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
} as const;

export async function createTemplate(
  name: string,
  dest: string,
  type: keyof typeof ASSET_PATHS = 'page-template',
  options: { allowExisting: boolean } = { allowExisting: false }
): Promise<void> {
  const assetPath = ASSET_PATHS[type];
  const filename = name.endsWith('.html') ? name : `${name}.html`;
  const filePath = path.join(dest, filename);
  if (!options.allowExisting && fs.existsSync(filePath)) {
    throwErrorWithMessage(`${i18nKey}.createTemplate.errors.pathExists`, {
      path: filePath,
    });
  }
  logger.debug(i18n(`${i18nKey}.createTemplate.creatingPath`, { path: dest }));
  fs.mkdirp(dest);

  logger.log(
    i18n(`${i18nKey}.createTemplate.creatingFile`, {
      path: filePath,
    })
  );

  await downloadGithubRepoContents(
    'HubSpot/cms-sample-assets',
    assetPath,
    filePath
  );
}
