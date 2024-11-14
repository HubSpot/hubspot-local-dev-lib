import axios from 'axios';
import { getDefaultUserAgentHeader } from '../http/getAxiosConfig';
import { GithubReleaseData, GithubRepoFile, RepoPath } from '../types/Github';
import { HubSpotPromise } from '../http';

const GITHUB_REPOS_API = 'https://api.github.com/repos';
const GITHUB_RAW_CONTENT_API_PATH = 'https://raw.githubusercontent.com';

declare global {
  // eslint-disable-next-line no-var
  var githubToken: string;
}

interface AdditionalGitHubHeaders {
  authorization?: string;
}

function getAdditionalHeaders(): AdditionalGitHubHeaders {
  const headers: AdditionalGitHubHeaders = {};

  if (global && global.githubToken) {
    headers.authorization = `Bearer ${global.githubToken}`;
  } else if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

// Returns information about the repo's releases. Defaults to "latest" if no tag is provided
// https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#get-a-release-by-tag-name
export function fetchRepoReleaseData(
  repoPath: RepoPath,
  tag = ''
): HubSpotPromise<GithubReleaseData> {
  const URL = `${GITHUB_REPOS_API}/${repoPath}/releases`;

  return axios.get<GithubReleaseData>(
    `${URL}/${tag ? `tags/${tag}` : 'latest'}`,
    {
      headers: {
        ...getDefaultUserAgentHeader(),
        ...getAdditionalHeaders(),
      },
    }
  );
}

// Returns the entire repo content as a zip, using the zipball_url from fetchRepoReleaseData()
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#download-a-repository-archive-zip
export function fetchRepoAsZip(zipUrl: string): HubSpotPromise<Buffer> {
  return axios.get<Buffer>(zipUrl, {
    responseType: 'arraybuffer',
    headers: { ...getDefaultUserAgentHeader(), ...getAdditionalHeaders() },
  });
}

// Returns the raw file contents via the raw.githubusercontent endpoint
export function fetchRepoFile(
  repoPath: RepoPath,
  filePath: string,
  ref: string
): HubSpotPromise<Buffer> {
  return axios.get<Buffer>(
    `${GITHUB_RAW_CONTENT_API_PATH}/${repoPath}/${ref}/${filePath}`,
    {
      headers: {
        ...getDefaultUserAgentHeader(),
        ...getAdditionalHeaders(),
      },
    }
  );
}

// Returns the raw file contents via the raw.githubusercontent endpoint
export function fetchRepoFileByDownloadUrl(
  downloadUrl: string
): HubSpotPromise<Buffer> {
  return axios.get<Buffer>(downloadUrl, {
    headers: { ...getDefaultUserAgentHeader(), ...getAdditionalHeaders() },
    responseType: 'arraybuffer',
  });
}

// Returns the contents of a file or directory in a repository by path
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
export function fetchRepoContents(
  repoPath: RepoPath,
  path: string,
  ref?: string
): HubSpotPromise<Array<GithubRepoFile>> {
  const refQuery = ref ? `?ref=${ref}` : '';

  return axios.get<Array<GithubRepoFile>>(
    `${GITHUB_REPOS_API}/${repoPath}/contents/${path}${refQuery}`,
    {
      headers: {
        ...getDefaultUserAgentHeader(),
        ...getAdditionalHeaders(),
      },
    }
  );
}
