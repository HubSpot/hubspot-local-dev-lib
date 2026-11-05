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
      const HIDDEN_PARENT_ROOT = '/Users/me/.workspaces/my-project/src';

      beforeEach(() => {
        vi.spyOn(process, 'cwd').mockReturnValue('/Users/me/.workspaces/cwd');
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('should not ignore relative files when the root is nested under a hidden directory', () => {
        expect(
          shouldIgnoreFile('app/app-logo.png', true, HIDDEN_PARENT_ROOT)
        ).toBe(false);
        expect(shouldIgnoreFile('app', true, HIDDEN_PARENT_ROOT)).toBe(false);
      });

      it('should not ignore absolute files when the root is nested under a hidden directory', () => {
        expect(
          shouldIgnoreFile(
            `${HIDDEN_PARENT_ROOT}/app/app-logo.png`,
            true,
            HIDDEN_PARENT_ROOT
          )
        ).toBe(false);
      });

      it('should not ignore the root directory itself', () => {
        expect(
          shouldIgnoreFile(HIDDEN_PARENT_ROOT, true, HIDDEN_PARENT_ROOT)
        ).toBe(false);
      });

      it('should still ignore hidden files and folders inside the root', () => {
        expect(shouldIgnoreFile('.env', true, HIDDEN_PARENT_ROOT)).toBe(true);
        expect(shouldIgnoreFile('.git', true, HIDDEN_PARENT_ROOT)).toBe(true);
        expect(
          shouldIgnoreFile('app/.hidden/file.js', true, HIDDEN_PARENT_ROOT)
        ).toBe(true);
        expect(
          shouldIgnoreFile(
            `${HIDDEN_PARENT_ROOT}/app/.hidden/file.js`,
            true,
            HIDDEN_PARENT_ROOT
          )
        ).toBe(true);
      });

      it('should still ignore node_modules inside the root', () => {
        expect(
          shouldIgnoreFile(
            'app/node_modules/pkg/index.js',
            true,
            HIDDEN_PARENT_ROOT
          )
        ).toBe(true);
      });
    });
  });
});
