import path from 'path';
import fs from 'fs-extra';

import { debug, makeTypedLogger } from '../utils/logger';
import { throwError, throwErrorWithMessage } from '../errors/standardErrors';
import { extractZipArchive } from './archive';

import { GITHUB_RELEASE_TYPES } from '../constants/github';
import { BaseError } from '../types/Error';
import { GithubReleaseData, GithubRepoFile } from '../types/Github';
import { ValueOf } from '../types/Utils';
import { LogCallbacksArg } from '../types/LogCallbacks';
import {
  GITHUB_RAW_CONTENT_API_PATH,
  fetchRepoFile,
  fetchRepoAsZip,
  fetchRepoReleaseData,
  fetchRepoContents,
} from '../api/github';

const i18nKey = 'lib.github';

type RepoPath = `${string}/${string}`;

export async function fetchFileFromRepository(
  repoPath: RepoPath,
  filePath: string,
  ref: string
): Promise<Buffer> {
  try {
    const contentPath = `${GITHUB_RAW_CONTENT_API_PATH}/${repoPath}/${ref}/${filePath}`;
    debug(`${i18nKey}.fetchFileFromRepository.fetching`, { url: contentPath });

    const { data } = await fetchRepoFile(contentPath);
    return data;
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.fetchFileFromRepository.errors.fetchFail`,
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
  try {
    const { data } = await fetchRepoReleaseData(repoPath, tag);
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
    const { data } = await fetchRepoAsZip(zipUrl);
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
  const logger =
    makeTypedLogger<typeof cloneGithubRepoCallbackKeys>(logCallbacks);
  const { themeVersion, projectVersion, releaseType, ref } = options;
  const tag = projectVersion || themeVersion;
  const zip = await downloadGithubRepoZip(repoPath, tag, releaseType, ref);
  const repoName = repoPath.split('/')[1];
  const success = await extractZipArchive(zip, repoName, dest, { sourceDir });

  if (success) {
    logger('success', `${i18nKey}.cloneGithubRepo.success`, { type, dest });
  }
  return success;
}

async function fetchGitHubRepoContentFromDownloadUrl(
  dest: string,
  downloadUrl: string
): Promise<void> {
  const resp = await fetchRepoFile(downloadUrl);
  fs.writeFileSync(dest, resp.data, 'utf8');
}

// Writes files from a public repository to the destination folder
export async function downloadGithubRepoContents(
  repoPath: RepoPath,
  contentPath: string,
  dest: string,
  ref?: string,
  filter?: (contentPiecePath: string, downloadPath: string) => boolean
): Promise<void[]> {
  fs.ensureDirSync(path.dirname(dest));

  try {
    const { data: contentsResp } = await fetchRepoContents(
      repoPath,
      contentPath,
      ref
    );

    const downloadContent = async (
      contentPiece: GithubRepoFile
    ): Promise<void> => {
      const {
        path: contentPiecePath,
        download_url,
        type: contentPieceType,
      } = contentPiece;
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

      if (contentPieceType === 'dir') {
        const { data: innerDirContent } = await fetchRepoContents(
          repoPath,
          contentPiecePath,
          ref
        );
        await Promise.all(innerDirContent.map(downloadContent));
        return Promise.resolve();
      }

      return fetchGitHubRepoContentFromDownloadUrl(downloadPath, download_url);
    };

    let contentPromises;

    if (Array.isArray(contentsResp)) {
      contentPromises = contentsResp.map(downloadContent);
    } else {
      contentPromises = [downloadContent(contentsResp)];
    }

    return Promise.all(contentPromises);
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
