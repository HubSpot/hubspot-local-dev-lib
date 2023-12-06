import { fetchFileFromRepository } from '../github';
import { fetchRepoFile as __fetchRepoFile } from '../../api/github';

jest.mock('../../api/github');

const fetchRepoFile = __fetchRepoFile as jest.MockedFunction<
  typeof __fetchRepoFile
>;

describe('lib/github', () => {
  describe('fetchFileFromRepository()', () => {
    beforeAll(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchRepoFile.mockResolvedValue({ data: null } as any);
    });

    afterAll(() => {
      fetchRepoFile.mockReset();
    });

    it('downloads a github repo and writes it to a destination folder', async () => {
      await fetchFileFromRepository('owner/repo', 'file', 'ref');
      expect(fetchRepoFile).toHaveBeenCalledWith('owner/repo', 'file', 'ref');
    });
  });
});
