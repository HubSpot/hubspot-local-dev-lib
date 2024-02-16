import fs from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';
import extract from 'extract-zip';

import { throwFileSystemError } from '../errors/fileSystemErrors';
import { throwErrorWithMessage } from '../errors/standardErrors';
import { logger } from './logger';
import { BaseError } from '../types/Error';
import { i18n } from '../utils/lang';

const i18nKey = 'lib.archive';

type ZipData = {
  extractDir: string;
  tmpDir: string;
};

async function extractZip(name: string, zip: Buffer): Promise<ZipData> {
  const result: ZipData = { extractDir: '', tmpDir: '' };

  const TMP_FOLDER_PREFIX = `hubspot-temp-${name}-`;
  logger.log(i18n(`${i18nKey}.extractZip.init`));

  // Write zip to disk
  let tmpZipPath = '';
  try {
    result.tmpDir = await fs.mkdtemp(join(tmpdir(), TMP_FOLDER_PREFIX));
    tmpZipPath = join(result.tmpDir, 'hubspot-temp.zip');
    await fs.ensureFile(tmpZipPath);
    await fs.writeFile(tmpZipPath, zip, {
      mode: 0o777,
    });
  } catch (err) {
    if (tmpZipPath || result.tmpDir) {
      throwFileSystemError(err as BaseError, {
        filepath: tmpZipPath || result.tmpDir,
        write: true,
      });
    } else {
      throwErrorWithMessage(
        `${i18nKey}.extractZip.errors.write`,
        {},
        err as BaseError
      );
    }
    return result;
  }
  // Extract zip
  try {
    const tmpExtractPath = join(result.tmpDir, 'extracted');
    await extract(tmpZipPath, { dir: tmpExtractPath });
    result.extractDir = tmpExtractPath;
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.extractZip.errors.extract`,
      {},
      err as BaseError
    );
  }
  logger.debug(i18n(`${i18nKey}.extractZip.success`));
  return result;
}

type CopySourceToDestOptions = {
  sourceDir?: string;
  includesRootDir?: boolean;
};

async function copySourceToDest(
  src: string,
  dest: string,
  { sourceDir, includesRootDir = true }: CopySourceToDestOptions = {}
): Promise<boolean> {
  try {
    logger.log(i18n(`${i18nKey}.copySourceToDest.init`));
    const srcDirPath = [src];

    if (includesRootDir) {
      const files = await fs.readdir(src);
      const rootDir = files[0];
      if (!rootDir) {
        logger.debug(i18n(`${i18nKey}.copySourceToDest.sourceEmpty`));
        // Create the dest path if it doesn't already exist
        fs.ensureDir(dest);
        // No root found so nothing to copy
        return true;
      }
      srcDirPath.push(rootDir);
    }

    if (sourceDir) {
      srcDirPath.push(sourceDir);
    }

    const projectSrcDir = join(...srcDirPath);

    await fs.copy(projectSrcDir, dest);
    logger.debug(i18n(`${i18nKey}.copySourceToDest.success`));
    return true;
  } catch (err) {
    logger.debug(i18n(`${i18nKey}.copySourceToDest.error`, { dest }));
    throwFileSystemError(err as BaseError, {
      filepath: dest,
      write: true,
    });
  }
  return false;
}

function cleanupTempDir(tmpDir: string): void {
  if (!tmpDir) return;
  try {
    fs.remove(tmpDir);
  } catch (e) {
    logger.debug(i18n(`${i18nKey}.cleanupTempDir.error`, { tmpDir }));
  }
}

export async function extractZipArchive(
  zip: Buffer,
  name: string,
  dest: string,
  { sourceDir, includesRootDir }: CopySourceToDestOptions = {}
): Promise<boolean> {
  let success = false;

  if (zip) {
    const { extractDir, tmpDir } = await extractZip(name, zip);

    if (extractDir !== null) {
      success = await copySourceToDest(extractDir, dest, {
        sourceDir,
        includesRootDir,
      });
    }

    cleanupTempDir(tmpDir);
  }
  return success;
}
