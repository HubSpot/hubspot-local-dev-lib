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

const i18nKey = 'lib.github';

declare global {
  // eslint-disable-next-line no-var
  var githubToken: string;
}

type RepoPath = `${string}/${string}`;

const GITHUB_AUTH_HEADERS = {
  authorization:
    global && global.githubToken ? `Bearer ${global.githubToken}` : null,
};

export async function fetchJsonFromRepository(
  repoPath: RepoPath,
  filePath: string,
  ref: string
): Promise<JSON> {
  try {
    const URL = `https://raw.githubusercontent.com/${repoPath}/${ref}/${filePath}`;
    debug(`${i18nKey}.fetchJsonFromRepository`, { url: URL });

    const { data } = await axios.get<JSON>(URL, {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    });
    return data;
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.fetchJsonFromRepository.errors.fetchFail`,
      {},
      err as BaseError
    );
  }
}

export async function fetchReleaseData(
  repoPath: RepoPath,
  tag = ''
): Promise<GithubReleaseData> {
  tag = tag.trim().toLowerCase();
  if (tag.length && tag[0] !== 'v') {
    tag = `v${tag}`;
  }
  const URI = tag
    ? `https://api.github.com/repos/${repoPath}/releases/tags/${tag}`
    : `https://api.github.com/repos/${repoPath}/releases/latest`;
  try {
    const { data } = await axios.get<GithubReleaseData>(URI, {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    });
    return data;
  } catch (err) {
    const error = err as BaseError;
    throwErrorWithMessage(
      `${i18nKey}.fetchReleaseData.errors.fetchFail`,
      { tag: tag || 'latest' },
      error
    );
  }
}

async function downloadGithubRepoZip(
  repoPath: RepoPath,
  tag = '',
  releaseType: ValueOf<
    typeof GITHUB_RELEASE_TYPES
  > = GITHUB_RELEASE_TYPES.RELEASE,
  ref?: string
): Promise<Buffer> {
  try {
    let zipUrl: string;
    if (releaseType === GITHUB_RELEASE_TYPES.REPOSITORY) {
      debug(`${i18nKey}.downloadGithubRepoZip.fetching`, {
        releaseType,
        repoPath,
      });
      zipUrl = `https://api.github.com/repos/${repoPath}/zipball${
        ref ? `/${ref}` : ''
      }`;
    } else {
      const releaseData = await fetchReleaseData(repoPath, tag);
      zipUrl = releaseData.zipball_url;
      const { name } = releaseData;
      debug(`${i18nKey}.downloadGithubRepoZip.fetchingName`, { name });
    }
    const { data } = await axios.get<Buffer>(zipUrl, {
      headers: { ...DEFAULT_USER_AGENT_HEADERS, ...GITHUB_AUTH_HEADERS },
    });
    debug(`${i18nKey}.downloadGithubRepoZip.completed`);
    return data;
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.downloadGithubRepoZip.errors.fetchFail`,
      {},
      err as BaseError
    );
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
  repoPath: RepoPath,
  sourceDir: string,
  options: CloneGithubRepoOptions = {},
  logCallbacks?: LogCallbacksArg<typeof cloneGithubRepoCallbackKeys>
): Promise<boolean> {
  const logger = makeTypedLogger<typeof cloneGithubRepoCallbackKeys>(
    logCallbacks,
    `${i18nKey}.cloneGithubRepo`
  );
  const { themeVersion, projectVersion, releaseType, ref } = options;
  const tag = projectVersion || themeVersion;
  const zip = await downloadGithubRepoZip(repoPath, tag, releaseType, ref);
  const repoName = repoPath.split('/')[1];
  const success = await extractZipArchive(zip, repoName, dest, { sourceDir });

  if (success) {
    logger('success', { type, dest });
  }
  return success;
}

async function getGitHubRepoContentsAtPath(
  repoPath: RepoPath,
  path: string,
  ref?: string
): Promise<Array<GithubRepoFile>> {
  const refQuery = ref ? `?ref=${ref}` : '';
  const contentsRequestUrl = `https://api.github.com/repos/${repoPath}/contents/${path}${refQuery}`;

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

// Writes files from a public repository to the destination folder
export async function downloadGithubRepoContents(
  repoPath: RepoPath,
  contentPath: string,
  dest: string,
  ref?: string,
  filter?: (contentPiecePath: string, downloadPath: string) => boolean
): Promise<void> {
  fs.ensureDirSync(path.dirname(dest));

  try {
    const contentsResp = await getGitHubRepoContentsAtPath(
      repoPath,
      contentPath,
      ref
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

      debug(`${i18nKey}.downloadGithubRepoContents.downloading`, {
        contentPiecePath,
        downloadUrl: download_url,
        downloadPath,
      });

      return fetchGitHubRepoContentFromDownloadUrl(downloadPath, download_url);
    };

    let contentPromises;

    if (Array.isArray(contentsResp)) {
      contentPromises = contentsResp.map(downloadContent);
    } else {
      contentPromises = [downloadContent(contentsResp)];
    }

    Promise.all(contentPromises);
  } catch (e) {
    const error = e as BaseError;
    if (error?.error?.message) {
      throwErrorWithMessage(
        `${i18nKey}.downloadGithubRepoContents.errors.fetchFail`,
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
