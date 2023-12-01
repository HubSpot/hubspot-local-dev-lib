import axios, { AxiosResponse } from 'axios';
import { DEFAULT_USER_AGENT_HEADERS } from '../http/getAxiosConfig';
import { GithubReleaseData, GithubRepoFile } from '../types/Github';

const GITHUB_REPOS_API = 'https://api.github.com/repos';
export const GITHUB_RAW_CONTENT_API_PATH = 'https://raw.githubusercontent.com';

declare global {
  // eslint-disable-next-line no-var
  var githubToken: string;
}

type RepoPath = `${string}/${string}`;

const GITHUB_AUTH_HEADERS = {
  authorization:
    global && global.githubToken ? `Bearer ${global.githubToken}` : null,
};

// Returns information about the repo's releases. Defaults to "latest" if no tag is provided
// https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#get-a-release-by-tag-name
export async function fetchRepoReleaseData(
  repoPath: RepoPath,
  tag = ''
): Promise<AxiosResponse<GithubReleaseData>> {
  const URL = `${GITHUB_REPOS_API}/${repoPath}/releases`;

  return axios.get<GithubReleaseData>(
    `${URL}/${tag ? `tags/${tag}` : 'latest'}`,
    {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    }
  );
}

// Returns the entire repo content as a zip, using the zipball_url from fetchRepoReleaseData()
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#download-a-repository-archive-zip
export async function fetchRepoAsZip(
  zipUrl: string
): Promise<AxiosResponse<Buffer>> {
  return axios.get<Buffer>(zipUrl, {
    headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
  });
}

// Returns the raw file contents via the raw.githubusercontent endpoint
export async function fetchRepoFile(
  downloadUrl: string
): Promise<AxiosResponse<Buffer>> {
  return axios.get<Buffer>(downloadUrl, {
    headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
  });
}

// Returns the contents of a file or directory in a repository by path
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
export async function fetchRepoContents(
  repoPath: RepoPath,
  path: string,
  ref?: string
): Promise<AxiosResponse<Array<GithubRepoFile>>> {
  const refQuery = ref ? `?ref=${ref}` : '';

  return axios.get<Array<GithubRepoFile>>(
    `${GITHUB_REPOS_API}/${repoPath}/contents/${path}${refQuery}`,
    {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    }
  );
}
