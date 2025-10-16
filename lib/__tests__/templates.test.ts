import fs from 'fs-extra';
import {
  getAnnotationValue,
  isCodedFile,
  createTemplate,
} from '../cms/templates.js';
import { cloneGithubRepo as __cloneGithubRepo } from '../github.js';
import { vi, type MockedFunction } from 'vitest';

vi.mock('fs-extra');
vi.mock('../github');

const cloneGithubRepo = __cloneGithubRepo as MockedFunction<
  typeof __cloneGithubRepo
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeAnnotation = (options: { [key: string]: any } = {}) => {
  let result = '<!--\n';
  Object.keys(options).forEach(key => {
    const value = options[key];
    result += `${key}: ${value}\n`;
  });
  result += '-->\n';
  return result;
};

describe('lib/cms/templates', () => {
  describe('isCodedFile()', () => {
    it('should return false for invalid input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isCodedFile(undefined as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isCodedFile(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isCodedFile(1 as any)).toBe(false);
    });

    it('should return false for modules', () => {
      expect(isCodedFile('folder.module/module.html')).toBe(false);
    });

    it('should return true for templates', () => {
      expect(isCodedFile('folder/template.html')).toBe(true);
    });
  });

  describe('getAnnotationValue()', () => {
    it('returns the annotation value', () => {
      const annotations = makeAnnotation({
        isAvailableForNewContent: 'true',
        templateType: 'page',
      });

      const value = getAnnotationValue(annotations, 'templateType');
      expect(value).toEqual('page');
    });
  });

  describe('createTemplate()', () => {
    it('downloads a template from the HubSpot/cms-sample-assets repo', async () => {
      vi.spyOn(fs, 'mkdirp').mockReturnValue();
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      await createTemplate('my-template', '/', 'page-template');

      expect(cloneGithubRepo).toHaveBeenCalledWith(
        'HubSpot/cms-sample-assets',
        '/my-template.html',
        { sourceDir: 'templates/page-template.html' }
      );
    });
  });
});
