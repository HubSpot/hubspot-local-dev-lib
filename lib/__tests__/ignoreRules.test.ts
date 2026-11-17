import fs from 'fs';
import os from 'os';
import path from 'path';
import { shouldIgnoreFile } from '../ignoreRules.js';

const CWD = '/Path/To/My/Repo';
const REPO_FOLDER = `${CWD}/repo-name-here`;
const NODE_MODULES_FOLDER = `${REPO_FOLDER}/node_modules`;
const NODE_MODULES_FILE = `${NODE_MODULES_FOLDER}/a-really-fake-package-name/README.md`;

describe('lib/ignoreRules', () => {
  describe('shouldIgnoreFile()', () => {
    it('ignores node_modules folder', () => {
      expect(shouldIgnoreFile(NODE_MODULES_FOLDER)).toBe(true);
    });

    it('ignores files nested within node_modules folder', () => {
      expect(shouldIgnoreFile(NODE_MODULES_FILE)).toBe(true);
    });

    it('ignores CLI config files', () => {
      expect(shouldIgnoreFile(`${CWD}/hubspot.config.yml`)).toBe(true);
      expect(shouldIgnoreFile(`${CWD}/hubspot.config.yaml`)).toBe(true);
      expect(shouldIgnoreFile(`${CWD}/some/dir/hubspot.config.yml`)).toBe(true);
      expect(shouldIgnoreFile(`${CWD}/some/dir/hubspot.config.yaml`)).toBe(
        true
      );
    });

    it('ignores hidden folders', () => {
      expect(shouldIgnoreFile(`${REPO_FOLDER}/.hiddenFolder`)).toBe(true);
    });

    it('ignores hidden files', () => {
      expect(shouldIgnoreFile(`${REPO_FOLDER}/.hiddenFile.js`)).toBe(true);
      expect(shouldIgnoreFile(`${REPO_FOLDER}/.*`)).toBe(true);
    });

    it('does not ignore allowed folders', () => {
      expect(shouldIgnoreFile(`${REPO_FOLDER}/hiddenFile/`)).toBe(false);
    });

    it('does not ignore allowed files', () => {
      expect(shouldIgnoreFile(`${REPO_FOLDER}/hiddenFile.js`)).toBe(false);
    });

    it('does not ignore the current folder', () => {
      expect(shouldIgnoreFile('.')).toBe(false);
    });

    it('should use the default behavior when passed by reference to Array.filter', () => {
      const ignoreFile: (file: string) => boolean = shouldIgnoreFile;
      const files = [`${REPO_FOLDER}/index.js`, `${REPO_FOLDER}/.env`];

      expect(files.filter(ignoreFile)).toEqual([`${REPO_FOLDER}/.env`]);
    });

    describe('with rootDir', () => {
      const ROOT_UNDER_HIDDEN_DIR = '/Users/me/.workspaces/my-project/src';

      beforeEach(() => {
        vi.spyOn(process, 'cwd').mockReturnValue('/Users/me/.workspaces/cwd');
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('should not ignore relative files when the root is nested under a hidden directory', () => {
        expect(
          shouldIgnoreFile('app/app-logo.png', true, ROOT_UNDER_HIDDEN_DIR)
        ).toBe(false);
        expect(shouldIgnoreFile('app', true, ROOT_UNDER_HIDDEN_DIR)).toBe(
          false
        );
      });

      it('should not ignore absolute files when the root is nested under a hidden directory', () => {
        expect(
          shouldIgnoreFile(
            `${ROOT_UNDER_HIDDEN_DIR}/app/app-logo.png`,
            true,
            ROOT_UNDER_HIDDEN_DIR
          )
        ).toBe(false);
      });

      it('should not ignore the root directory itself', () => {
        expect(
          shouldIgnoreFile(ROOT_UNDER_HIDDEN_DIR, true, ROOT_UNDER_HIDDEN_DIR)
        ).toBe(false);
      });

      it('should still ignore hidden files and folders inside the root', () => {
        expect(shouldIgnoreFile('.env', true, ROOT_UNDER_HIDDEN_DIR)).toBe(
          true
        );
        expect(shouldIgnoreFile('.git', true, ROOT_UNDER_HIDDEN_DIR)).toBe(
          true
        );
        expect(
          shouldIgnoreFile('app/.hidden/file.js', true, ROOT_UNDER_HIDDEN_DIR)
        ).toBe(true);
        expect(
          shouldIgnoreFile(
            `${ROOT_UNDER_HIDDEN_DIR}/app/.hidden/file.js`,
            true,
            ROOT_UNDER_HIDDEN_DIR
          )
        ).toBe(true);
      });

      it('should still ignore node_modules inside the root', () => {
        expect(
          shouldIgnoreFile(
            'app/node_modules/pkg/index.js',
            true,
            ROOT_UNDER_HIDDEN_DIR
          )
        ).toBe(true);
      });

      it('should use the default behavior when rootDir is an empty string', () => {
        expect(
          shouldIgnoreFile(
            `${ROOT_UNDER_HIDDEN_DIR}/app/app-logo.png`,
            true,
            ''
          )
        ).toBe(true);
      });

      it('should throw when the file is outside the root', () => {
        expect(() =>
          shouldIgnoreFile(
            '/Users/me/other/file.js',
            true,
            ROOT_UNDER_HIDDEN_DIR
          )
        ).toThrow();
      });
    });

    describe('with rootDir and an .hsignore', () => {
      let hsignoreDir: string;

      beforeEach(() => {
        hsignoreDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ignore-rules-'));
        fs.writeFileSync(path.join(hsignoreDir, '.hsignore'), '/generated\n');
        vi.spyOn(process, 'cwd').mockReturnValue(hsignoreDir);
        vi.resetModules();
      });

      afterEach(() => {
        fs.rmSync(hsignoreDir, { recursive: true, force: true });
        vi.restoreAllMocks();
      });

      it('should anchor .hsignore patterns at the root instead of the .hsignore directory', async () => {
        const { shouldIgnoreFile: shouldIgnoreFileWithHsignore } =
          await import('../ignoreRules.js');
        const rootDir = path.join(hsignoreDir, 'project', 'src');

        expect(
          shouldIgnoreFileWithHsignore('generated/output.js', true, rootDir)
        ).toBe(true);
        expect(
          shouldIgnoreFileWithHsignore('app/generated/output.js', true, rootDir)
        ).toBe(false);
      });
    });
  });
});
