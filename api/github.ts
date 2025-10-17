import axios, { ResponseType } from 'axios';
import { getDefaultUserAgentHeader } from '../http/getAxiosConfig.js';
import {
  GithubReleaseData,
  GithubRepoFile,
  RepoPath,
} from '../types/Github.js';
import { HubSpotPromise } from '../types/Http.js';
import { isSpecifiedError } from '../errors/index.js';

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

function githubRequestWithFallback<T>(
  url: string,
  responseType?: ResponseType
): HubSpotPromise<T> {
  const headersWithAuth = {
    ...getDefaultUserAgentHeader(),
    ...getAdditionalHeaders(),
  };

  if (headersWithAuth.authorization) {
    return axios
      .get<T>(url, { headers: headersWithAuth, responseType })
      .catch(error => {
        // 404 with an auth token might mean an SSO issue so retry without the authorization header
        if (isSpecifiedError(error, { statusCode: 404 })) {
          return axios.get<T>(url, {
            headers: { ...getDefaultUserAgentHeader() },
            responseType,
          });
        }
        throw error;
      });
  }

  // No auth token, proceed normally
  return axios.get<T>(url, { headers: headersWithAuth, responseType });
}

// Returns information about the repo's releases. Defaults to "latest" if no tag is provided
// https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#get-a-release-by-tag-name
export function fetchRepoReleaseData(
  repoPath: RepoPath,
  tag = ''
): HubSpotPromise<GithubReleaseData> {
  const URL = `${GITHUB_REPOS_API}/${repoPath}/releases`;

  return githubRequestWithFallback<GithubReleaseData>(
    `${URL}/${tag ? `tags/${tag}` : 'latest'}`
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
export function fetchRepoFile<T = Buffer>(
  repoPath: RepoPath,
  filePath: string,
  ref: string
): HubSpotPromise<T> {
  const url = `${GITHUB_RAW_CONTENT_API_PATH}/${repoPath}/${ref}/${filePath}`;
  return githubRequestWithFallback<T>(url);
}

// Returns the raw file contents via the raw.githubusercontent endpoint
export function fetchRepoFileByDownloadUrl(
  downloadUrl: string
): HubSpotPromise<Buffer> {
  return githubRequestWithFallback<Buffer>(downloadUrl, 'arraybuffer');
}

// Returns the contents of a file or directory in a repository by path
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
export function fetchRepoContents(
  repoPath: RepoPath,
  path: string,
  ref?: string
): HubSpotPromise<Array<GithubRepoFile>> {
  const refQuery = ref ? `?ref=${ref}` : '';

  return githubRequestWithFallback<Array<GithubRepoFile>>(
    `${GITHUB_REPOS_API}/${repoPath}/contents/${path}${refQuery}`
  );
}
