import fs from 'fs-extra';
import {
  fetchReleaseData,
  cloneGithubRepo,
  listGithubRepoContents,
  fetchFileFromRepository,
  fetchGitHubRepoContentFromDownloadUrl,
} from '../github';
import {
  fetchRepoFile as __fetchRepoFile,
  fetchRepoReleaseData as __fetchRepoReleaseData,
  fetchRepoAsZip as __fetchRepoAsZip,
  fetchRepoContents as __fetchRepoContents,
  fetchRepoFileByDownloadUrl as __fetchRepoFileByDownloadUrl,
} from '../../api/github';
import { extractZipArchive as __extractZipArchive } from '../archive';

jest.mock('fs-extra');
jest.mock('../../api/github');
jest.mock('../archive');

const fetchRepoFile = __fetchRepoFile as jest.MockedFunction<
  typeof __fetchRepoFile
>;
const fetchRepoReleaseData = __fetchRepoReleaseData as jest.MockedFunction<
  typeof __fetchRepoReleaseData
>;
const fetchRepoAsZip = __fetchRepoAsZip as jest.MockedFunction<
  typeof __fetchRepoAsZip
>;
const fetchRepoContents = __fetchRepoContents as jest.MockedFunction<
  typeof __fetchRepoContents
>;
const extractZipArchive = __extractZipArchive as jest.MockedFunction<
  typeof __extractZipArchive
>;
const fetchRepoFileByDownloadUrl =
  __fetchRepoFileByDownloadUrl as jest.MockedFunction<
    typeof __fetchRepoFileByDownloadUrl
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

  describe('fetchGitHubRepoContentFromDownloadUrl()', () => {
    const dest = '/path/to/destination';
    const downloadUrl = 'https://github.com/repo/file';

    it('should write text to the destination file', async () => {
      const resp = {
        headers: {
          'content-type': 'text/plain',
        },
        data: Buffer.from('Sample text', 'utf-8'),
        status: 200,
        statusText: 'OK',
        config: {},
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fetchRepoFileByDownloadUrl.mockResolvedValue(resp);

      await fetchGitHubRepoContentFromDownloadUrl(dest, downloadUrl);

      expect(fs.outputFileSync).toHaveBeenCalledWith(dest, 'Sample text');
    });

    it('should write binary to the destination file', async () => {
      const resp = {
        headers: {
          'content-type': 'application/octet-stream',
        },
        data: Buffer.from([0x01, 0x02, 0x03]),
        status: 200,
        statusText: 'OK',
        config: {},
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fetchRepoFileByDownloadUrl.mockResolvedValue(resp);

      await fetchGitHubRepoContentFromDownloadUrl(dest, downloadUrl);

      expect(fs.outputFileSync).toHaveBeenCalledWith(dest, resp.data);
    });
  });

  describe('fetchReleaseData()', () => {
    beforeAll(() => {
      fetchRepoReleaseData.mockResolvedValue({
        data: { zipball_url: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    afterAll(() => {
      fetchRepoReleaseData.mockReset();
    });

    it('Fetches the release data for a repository', async () => {
      await fetchReleaseData('owner/repo');
      expect(fetchRepoReleaseData).toHaveBeenCalledWith(
        'owner/repo',
        undefined
      );
    });

    it('Fetches the release data for a specific tag for a repository', async () => {
      await fetchReleaseData('owner/repo', 'v1.0.0');
      expect(fetchRepoReleaseData).toHaveBeenCalledWith('owner/repo', 'v1.0.0');
    });

    it('Inserts v for the tag when not included', async () => {
      await fetchReleaseData('owner/repo', '1.0.0');
      expect(fetchRepoReleaseData).toHaveBeenCalledWith('owner/repo', 'v1.0.0');
    });
  });

  describe('cloneGithubRepo()', () => {
    beforeAll(() => {
      fetchRepoReleaseData.mockResolvedValue({
        data: { zipball_url: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchRepoAsZip.mockResolvedValue({ data: 'zip' } as any);
      extractZipArchive.mockResolvedValue(true);
    });

    afterAll(() => {
      fetchRepoReleaseData.mockReset();
      fetchRepoAsZip.mockReset();
      extractZipArchive.mockReset();
    });

    it('Clones the default branch from a github repo', async () => {
      await cloneGithubRepo('owner/repo', './dest/path');
      expect(fetchRepoReleaseData).not.toHaveBeenCalled();
      expect(fetchRepoAsZip).toHaveBeenCalled();
      expect(extractZipArchive).toHaveBeenCalledWith(
        'zip',
        'repo',
        './dest/path',
        { sourceDir: undefined }
      );
    });

    it('Clones a specified branch from a github repo', async () => {
      await cloneGithubRepo('owner/repo', './dest/path', {
        branch: 'my-branch',
      });
      expect(fetchRepoReleaseData).not.toHaveBeenCalled();
      expect(fetchRepoAsZip).toHaveBeenCalled();
      // Make sure the branch ref is added to the end of the zip download url
      const lastCall = fetchRepoAsZip.mock.lastCall;
      if (lastCall) {
        expect(lastCall[0].includes('my-branch')).toBeTruthy();
      }
      expect(extractZipArchive).toHaveBeenCalledWith(
        'zip',
        'repo',
        './dest/path',
        { sourceDir: undefined }
      );
    });

    it('Clones the latest release from a github repo', async () => {
      await cloneGithubRepo('owner/repo', './dest/path', { isRelease: true });
      expect(fetchRepoReleaseData).toHaveBeenCalledWith(
        'owner/repo',
        undefined
      );
      expect(fetchRepoAsZip).toHaveBeenCalled();
      expect(extractZipArchive).toHaveBeenCalledWith(
        'zip',
        'repo',
        './dest/path',
        { sourceDir: undefined }
      );
    });

    it('Clones the a specified release from a github repo', async () => {
      await cloneGithubRepo('owner/repo', './dest/path', {
        isRelease: true,
        tag: 'v1.0.0',
      });
      expect(fetchRepoReleaseData).toHaveBeenCalledWith('owner/repo', 'v1.0.0');
      expect(fetchRepoAsZip).toHaveBeenCalled();
      expect(extractZipArchive).toHaveBeenCalledWith(
        'zip',
        'repo',
        './dest/path',
        { sourceDir: undefined }
      );
    });
  });

  describe('listRepoContents()', () => {
    beforeAll(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchRepoContents.mockResolvedValue({ data: null } as any);
    });

    afterAll(() => {
      fetchRepoContents.mockReset();
    });

    it('Lists the content from a specified github repo path', async () => {
      await listGithubRepoContents('owner/repo', 'path/');

      expect(fetchRepoContents).toHaveBeenCalledWith('owner/repo', 'path/');
    });
  });
});
