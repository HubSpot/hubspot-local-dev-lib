import axios from 'axios';
import path from 'path';
import fs from 'fs-extra';

import { debug, makeTypedLogger } from '../utils/logger';
import { throwError, throwErrorWithMessage } from '../errors/standardErrors';
import { extractZipArchive } from './archive';

import { GITHUB_RELEASE_TYPES } from '../constants/github';
import { DEFAULT_USER_AGENT_HEADERS } from '../http/getAxiosConfig';
import { BaseError } from '../types/Error';
import { GithubReleaseData, GithubRepoFile } from '../types/Github';
import { ValueOf } from '../types/Utils';
import { LogCallbacksArg } from '../types/LogCallbacks';

declare global {
  // eslint-disable-next-line no-var
  var githubToken: string;
}

const GITHUB_AUTH_HEADERS = {
  authorization:
    global && global.githubToken ? `Bearer ${global.githubToken}` : null,
};

export async function fetchJsonFromRepository(
  repoName: string,
  filePath: string
): Promise<JSON> {
  try {
    const URI = `https://raw.githubusercontent.com/HubSpot/${repoName}/${filePath}`;
    debug('github.fetchJsonFromRepository', { uri: URI });

    const { data } = await axios.get<JSON>(URI, {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    });
    return data;
  } catch (err) {
    throwErrorWithMessage(
      'github.fetchJsonFromRepository',
      {},
      err as BaseError
    );
  }
}

async function fetchReleaseData(
  repoName: string,
  tag = ''
): Promise<GithubReleaseData> {
  tag = tag.trim().toLowerCase();
  if (tag.length && tag[0] !== 'v') {
    tag = `v${tag}`;
  }
  const URI = tag
    ? `https://api.github.com/repos/HubSpot/${repoName}/releases/tags/${tag}`
    : `https://api.github.com/repos/HubSpot/${repoName}/releases/latest`;
  try {
    const { data } = await axios.get<GithubReleaseData>(URI, {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    });
    return data;
  } catch (err) {
    const error = err as BaseError;
    throwErrorWithMessage(
      'github.fetchReleaseData',
      { tag: tag || 'latest' },
      error
    );
  }
}

async function downloadGithubRepoZip(
  repoName: string,
  tag = '',
  releaseType: ValueOf<
    typeof GITHUB_RELEASE_TYPES
  > = GITHUB_RELEASE_TYPES.RELEASE,
  ref?: string
): Promise<Buffer> {
  try {
    let zipUrl;
    if (releaseType === GITHUB_RELEASE_TYPES.REPOSITORY) {
      debug('github.downloadGithubRepoZip.fetching', { releaseType, repoName });
      zipUrl = `https://api.github.com/repos/HubSpot/${repoName}/zipball${
        ref ? `/${ref}` : ''
      }`;
    } else {
      const releaseData = await fetchReleaseData(repoName, tag);
      zipUrl = releaseData.zipball_url;
      const { name } = releaseData;
      debug('github.downloadGithubRepoZip.fetchingName', { name });
    }
    const { data } = await axios.get<Buffer>(zipUrl, {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    });
    debug('github.downloadGithubRepoZip.completed');
    return data;
  } catch (err) {
    throwErrorWithMessage('github.downloadGithubRepoZip', {}, err as BaseError);
  }
}

type CloneGithubRepoOptions = {
  themeVersion?: string;
  projectVersion?: string;
  releaseType?: ValueOf<typeof GITHUB_RELEASE_TYPES>;
  ref?: string;
};

const cloneGithubRepoCallbackKeys = ['success'];

export async function cloneGithubRepo(
  dest: string,
  type: string,
  repoName: string,
  sourceDir: string,
  options: CloneGithubRepoOptions = {},
  logCallbacks?: LogCallbacksArg<typeof cloneGithubRepoCallbackKeys>
): Promise<boolean> {
  const logger = makeTypedLogger<typeof cloneGithubRepoCallbackKeys>(
    logCallbacks,
    'github.cloneGithubRepo'
  );
  const { themeVersion, projectVersion, releaseType, ref } = options;
  const tag = projectVersion || themeVersion;
  const zip = await downloadGithubRepoZip(repoName, tag, releaseType, ref);
  const success = await extractZipArchive(zip, repoName, dest, { sourceDir });

  if (success) {
    logger('success', { type, dest });
  }
  return success;
}

async function getGitHubRepoContentsAtPath(
  repoName: string,
  path: string
): Promise<Array<GithubRepoFile>> {
  const contentsRequestUrl = `https://api.github.com/repos/HubSpot/${repoName}/contents/${path}`;

  const response = await axios.get<Array<GithubRepoFile>>(contentsRequestUrl, {
    headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
  });

  return response.data;
}

async function fetchGitHubRepoContentFromDownloadUrl(
  dest: string,
  downloadUrl: string
): Promise<void> {
  const resp = await axios.get<Buffer>(downloadUrl, {
    headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
  });

  fs.writeFileSync(dest, resp.data, 'utf8');
}

// Writes files from a HubSpot public repository to the destination folder
export async function downloadGithubRepoContents(
  repoName: string,
  contentPath: string,
  dest: string,
  filter?: (contentPiecePath: string, downloadPath: string) => boolean
): Promise<void> {
  fs.ensureDirSync(path.dirname(dest));

  try {
    const contentsResp = await getGitHubRepoContentsAtPath(
      repoName,
      contentPath
    );

    const downloadContent = async (
      contentPiece: GithubRepoFile
    ): Promise<void> => {
      const { path: contentPiecePath, download_url } = contentPiece;
      const downloadPath = path.join(
        dest,
        contentPiecePath.replace(contentPath, '')
      );

      if (filter && !filter(contentPiecePath, downloadPath)) {
        return Promise.resolve();
      }

      debug('github.downloadGithubRepoContents.downloading', {
        contentPiecePath,
        downloadUrl: download_url,
        downloadPath,
      });

      return fetchGitHubRepoContentFromDownloadUrl(downloadPath, download_url);
    };

    const contentPromises = contentsResp.map(downloadContent);

    Promise.all(contentPromises);
  } catch (e) {
    const error = e as BaseError;
    if (error?.error?.message) {
      throwErrorWithMessage(
        'github.downloadGithubRepoContents',
        {
          errorMessage: error.error.message,
        },
        error
      );
    } else {
      throwError(error);
    }
  }
}
