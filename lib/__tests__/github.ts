import { fetchFileFromRepository } from '../github';
import {
  GITHUB_RAW_CONTENT_API_PATH,
  fetchRepoFile as __fetchRepoFile,
} from '../../api/github';

jest.mock('../../api/github');

const fetchRepoFile = __fetchRepoFile as jest.MockedFunction<
  typeof __fetchRepoFile
>;

describe('lib/github', () => {
  describe('fetchFileFromRepository()', () => {
    beforeAll(() => {
      fetchRepoFile.mockResolvedValue({ data: null });
    });

    afterAll(() => {
      fetchRepoFile.mockReset();
    });

    it('downloads a github repo and writes it to a destination folder', async () => {
      await fetchFileFromRepository('owner/repo', 'file', 'ref');
      expect(fetchRepoFile).toHaveBeenCalledWith(
        `${GITHUB_RAW_CONTENT_API_PATH}/owner/repo/ref/file`
      );
    });
  });

  // describe('fetchReleaseData()', () => {
  //   it('downloads a github repo and writes it to a destination folder', async () => {
  //     await cloneGithubRepo('./', 'test', 'github.com/repo', '', {});
  //     expect(true).toBe(true);
  //   });
  // });

  // describe('cloneGithubRepo()', () => {
  //   it('downloads a github repo and writes it to a destination folder', async () => {
  //     await cloneGithubRepo('./', 'test', 'github.com/repo', '', {});
  //     expect(true).toBe(true);
  //   });
  // });
});
