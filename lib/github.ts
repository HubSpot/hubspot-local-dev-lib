import path from 'path';
import fs from 'fs-extra';

import { extractZipArchive } from './archive';
import { logger } from './logger';
import {
  GithubReleaseData,
  GithubRepoFile,
  RepoPath,
  DownloadGithubRepoZipOptions,
  CloneGithubRepoOptions,
} from '../types/Github';
import {
  fetchRepoFile,
  fetchRepoFileByDownloadUrl,
  fetchRepoAsZip,
  fetchRepoReleaseData,
  fetchRepoContents,
} from '../api/github';
import { i18n } from '../utils/lang';
import { isHubSpotHttpError, isSystemError } from '../errors';

const i18nKey = 'lib.github';

export async function fetchFileFromRepository<T = Buffer>(
  repoPath: RepoPath,
  filePath: string,
  ref: string
): Promise<T> {
  try {
    logger.debug(
      i18n(`${i18nKey}.fetchFileFromRepository.fetching`, {
        path: `${repoPath}/${ref}/${filePath}`,
      })
    );

    const { data } = await fetchRepoFile(repoPath, filePath, ref);
    return data as T;
  } catch (err) {
    throw new Error(
      i18n(`${i18nKey}.fetchFileFromRepository.errors.fetchFail`),
      {
        cause: err,
      }
    );
  }
}

// Fetches information about a specific release (Defaults to latest)
export async function fetchReleaseData(
  repoPath: RepoPath,
  tag?: string
): Promise<GithubReleaseData> {
  if (tag) {
    tag = tag.trim().toLowerCase();
    if (tag.length && tag[0] !== 'v') {
      tag = `v${tag}`;
    }
  }

  try {
    const { data } = await fetchRepoReleaseData(repoPath, tag);
    return data;
  } catch (err) {
    throw new Error(
      i18n(`${i18nKey}.fetchReleaseData.errors.fetchFail`, {
        tag: tag || 'latest',
      }),
      { cause: err }
    );
  }
}

async function downloadGithubRepoZip(
  repoPath: RepoPath,
  isRelease = false,
  options: DownloadGithubRepoZipOptions = {}
): Promise<Buffer> {
  const { branch, tag } = options;
  try {
    let zipUrl: string;
    if (isRelease) {
      // If downloading a release, first get the release info using fetchReleaseData().
      // Supports a custom tag, but will default to the latest release
      const releaseData = await fetchReleaseData(repoPath, tag);
      zipUrl = releaseData.zipball_url;
      const { name } = releaseData;
      logger.debug(
        i18n(`${i18nKey}.downloadGithubRepoZip.fetchingName`, { name })
      );
    } else {
      // If downloading a repository, manually construct the zip url. This url supports both branches and tags as refs
      logger.debug(
        i18n(`${i18nKey}.downloadGithubRepoZip.fetching`, { repoPath })
      );
      const ref = branch || tag;
      zipUrl = `https://api.github.com/repos/${repoPath}/zipball${
        ref ? `/${ref}` : ''
      }`;
    }
    const { data } = await fetchRepoAsZip(zipUrl);
    logger.debug(i18n(`${i18nKey}.downloadGithubRepoZip.completed`));
    return data;
  } catch (err) {
    throw new Error(i18n(`${i18nKey}.downloadGithubRepoZip.errors.fetchFail`), {
      cause: err,
    });
  }
}

export async function cloneGithubRepo(
  repoPath: RepoPath,
  dest: string,
  options: CloneGithubRepoOptions = {}
): Promise<boolean> {
  const { tag, isRelease, branch, sourceDir, type } = options;
  const zip = await downloadGithubRepoZip(repoPath, isRelease, {
    tag,
    branch,
  });
  const repoName = repoPath.split('/')[1];
  const success = await extractZipArchive(zip, repoName, dest, { sourceDir });

  if (success) {
    logger.log(
      i18n(`${i18nKey}.cloneGithubRepo.success`, {
        type: type || '',
        dest,
      })
    );
  }
  return success;
}

export async function fetchGitHubRepoContentFromDownloadUrl(
  dest: string,
  downloadUrl: string
): Promise<void> {
  const resp = await fetchRepoFileByDownloadUrl(downloadUrl);
  const contentType = resp.headers['content-type'];
  let fileContents;

  if (contentType.startsWith('text')) {
    fileContents = Buffer.from(resp.data).toString('utf8');
  } else {
    fileContents = resp.data;
  }
  fs.outputFileSync(dest, fileContents);
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

      logger.debug(
        i18n(`${i18nKey}.downloadGithubRepoContents.downloading`, {
          contentPiecePath,
          downloadUrl: download_url,
          downloadPath,
        })
      );

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

    await Promise.all(contentPromises);
  } catch (e) {
    if (isSystemError(e) && e?.error?.message) {
      throw new Error(
        i18n(`${i18nKey}.downloadGithubRepoContents.errors.fetchFail`, {
          errorMessage: e.error.message,
        }),
        { cause: e }
      );
    }
    throw e;
  }
}

// Lists content from a public repository at the specified path
export async function listGithubRepoContents(
  repoPath: RepoPath,
  contentPath: string,
  fileFilter?: 'file' | 'dir'
): Promise<GithubRepoFile[]> {
  try {
    const { data: contentsResp } = await fetchRepoContents(
      repoPath,
      contentPath
    );

    const filteredFiles =
      fileFilter && fileFilter != undefined
        ? contentsResp.filter(item => item.type === fileFilter)
        : contentsResp;

    return filteredFiles;
  } catch (e) {
    if (isHubSpotHttpError(e) && e.data.message) {
      throw new Error(
        i18n(`${i18nKey}.downloadGithubRepoContents.errors.fetchFail`, {
          errorMessage: e.data.message,
        })
      );
    }
    throw e;
  }
}
