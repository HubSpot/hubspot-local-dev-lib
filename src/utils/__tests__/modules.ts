import path from 'path';

import { isModuleFolder, isModuleFolderChild } from '../modules';

import { PathInput } from '../../types/Modules';

const isLocal = true;
const isHubSpot = true;

// TODO: Replace two missing tests

describe('cli-lib/modules', () => {
  describe('isModuleFolder()', () => {
    it('should throw on invalid input', () => {
      // @ts-expect-error testing invalid input
      expect(() => isModuleFolder('foo')).toThrow();
      expect(() => isModuleFolder({ path: 'foo' })).toThrow();
      // @ts-expect-error testing invalid input
      expect(() => isModuleFolder({ isLocal })).toThrow();
      // @ts-expect-error testing invalid input
      expect(() => isModuleFolder({ isHubSpot })).toThrow();
      expect(() => isModuleFolder({ isHubSpot, path: 'foo' })).not.toThrow();
      expect(() => isModuleFolder({ isLocal, path: 'foo' })).not.toThrow();
    });
    it('should return true for module folder paths', () => {
      let input: PathInput;
      // Local
      input = { isLocal, path: 'Card Section.module' };
      expect(isModuleFolder(input)).toBe(true);
      input = { isLocal, path: path.join('dir', 'Card Section.module') };
      expect(isModuleFolder(input)).toBe(true);
      // HubSpot
      input = { isHubSpot, path: 'Card Section.module' };
      expect(isModuleFolder(input)).toBe(true);
      input = { isHubSpot, path: 'dir/Card Section.module' };
      expect(isModuleFolder(input)).toBe(true);
    });
    it('should disregard trailing slashes', () => {
      let input: PathInput;
      // Local
      input = { isLocal, path: path.join('Card Section.module', path.sep) };
      expect(isModuleFolder(input)).toBe(true);
      input = {
        isLocal,
        path: path.join('dir', 'Card Section.module', path.sep),
      };
      expect(isModuleFolder(input)).toBe(true);
      // HubSpot
      input = { isHubSpot, path: 'Card Section.module/', isLocal: false };
      expect(isModuleFolder(input)).toBe(true);
      input = { isHubSpot, path: 'dir/Card Section.module/' };
      expect(isModuleFolder(input)).toBe(true);
    });
    it('should return false for non-module folder paths', () => {
      let input: PathInput;
      // Local
      input = { isLocal, path: '' };
      expect(isModuleFolder(input)).toBe(false);
      input = { isLocal, path: path.sep };
      expect(isModuleFolder(input)).toBe(false);
      input = { isLocal, path: 'dir' };
      expect(isModuleFolder(input)).toBe(false);
      input = { isLocal, path: path.join('Card Section.module', 'dir') };
      expect(isModuleFolder(input)).toBe(false);
      // HubSpot
      input = { isHubSpot, path: '' };
      expect(isModuleFolder(input)).toBe(false);
      input = { isHubSpot, path: '/' };
      expect(isModuleFolder(input)).toBe(false);
      input = { isHubSpot, path: 'dir' };
      expect(isModuleFolder(input)).toBe(false);
      input = { isHubSpot, path: 'Card Section.module/dir' };
      expect(isModuleFolder(input)).toBe(false);
    });
    it('should return false for file paths', () => {
      let input: PathInput;
      // Local
      input = { isLocal, path: 'fields.json' };
      expect(isModuleFolder(input)).toBe(false);
      input = {
        isLocal,
        path: path.join('Card Section.module', 'fields.json'),
      };
      expect(isModuleFolder(input)).toBe(false);
      // HubSpot
      input = { isHubSpot, path: 'fields.json' };
      expect(isModuleFolder(input)).toBe(false);
      input = { isHubSpot, path: 'Card Section.module/fields.json' };
      expect(isModuleFolder(input)).toBe(false);
    });
  });
  describe('isModuleFolderChild()', () => {
    it('should return true for child files/folders of module folders', () => {
      let input: PathInput;
      // Local
      input = { isLocal, path: path.join('Card Section.module', 'dir') };
      expect(isModuleFolderChild(input)).toBe(true);
      input = {
        isLocal,
        path: path.join('Card Section.module', 'fields.json'),
      };
      expect(isModuleFolderChild(input)).toBe(true);
      input = {
        isLocal,
        path: path.join('dir', 'Card Section.module', 'dir', 'fields.json'),
      };
      expect(isModuleFolderChild(input)).toBe(true);
      // HubSpot
      input = { isHubSpot, path: 'Card Section.module/dir' };
      expect(isModuleFolderChild(input)).toBe(true);
      input = { isHubSpot, path: 'Card Section.module/fields.json' };
      expect(isModuleFolderChild(input)).toBe(true);
      input = { isHubSpot, path: 'dir/Card Section.module/dir/fields.json' };
      expect(isModuleFolderChild(input)).toBe(true);
    });
    it('should return false for module folders', () => {
      let input: PathInput;
      // Local
      input = { isLocal, path: path.join('dir', 'Card Section.module') };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isLocal, path: 'Card Section.module' };
      expect(isModuleFolderChild(input)).toBe(false);
      // HubSpot
      input = { isHubSpot, path: 'dir/Card Section.module' };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isHubSpot, path: 'Card Section.module' };
      expect(isModuleFolderChild(input)).toBe(false);
    });
    it('should return false for folder/file paths not within a module folder', () => {
      let input: PathInput;
      // Local
      input = { isLocal, path: path.join('dir', 'dir') };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isLocal, path: path.join('dir', 'fields.json') };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isLocal, path: 'dir' };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isLocal, path: 'fields.json' };
      expect(isModuleFolderChild(input)).toBe(false);
      // HubSpot
      input = { isHubSpot, path: 'dir/dir' };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isHubSpot, path: 'dir/fields.json' };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isHubSpot, path: 'dir' };
      expect(isModuleFolderChild(input)).toBe(false);
      input = { isHubSpot, path: 'fields.json' };
      expect(isModuleFolderChild(input)).toBe(false);
    });
  });
});
