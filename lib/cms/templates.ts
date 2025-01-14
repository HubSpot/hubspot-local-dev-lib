import fs from 'fs-extra';
import path from 'path';
import { cloneGithubRepo } from '../github';
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
    throw new Error(
      i18n(`${i18nKey}.createTemplate.errors.pathExists`, {
        path: filePath,
      })
    );
  }
  logger.debug(i18n(`${i18nKey}.createTemplate.creatingPath`, { path: dest }));
  fs.mkdirp(dest);

  logger.log(
    i18n(`${i18nKey}.createTemplate.creatingFile`, {
      path: filePath,
    })
  );

  await cloneGithubRepo('HubSpot/cms-sample-assets', filePath, {
    sourceDir: assetPath,
  });
}

export const TEMPLATE_TYPES = {
  unmapped: 0,
  email_base_template: 1,
  email: 2,
  landing_page_base_template: 3,
  landing_page: 4,
  blog_base: 5,
  blog: 6,
  blog_listing: 42,
  site_page: 8,
  blog_listing_context: 9,
  blog_post_context: 10,
  error_page: 11,
  subscription_preferences: 12,
  unsubscribe_confirmation: 13,
  unsubscribe_simple: 14,
  optin_email: 15,
  optin_followup_email: 16,
  optin_confirmation_page: 17,
  global_group: 18,
  password_prompt_page: 19,
  resubscribe_email: 20,
  unsubscribe_confirmation_email: 21,
  resubscribe_confirmation_email: 22,
  custom_module: 23,
  css: 24,
  js: 25,
  search_results: 27,
  membership_login: 29,
  membership_register: 30,
  membership_reset: 31,
  membership_reset_request: 32,
  drag_drop_email: 34,
  knowledge_article: 35,
  membership_email: 36,
  section: 37,
  global_content_partial: 38,
  simple_landing_page_template: 39,
  proposal: 40,
  blog_post: 41,
  quote: 43,
};
