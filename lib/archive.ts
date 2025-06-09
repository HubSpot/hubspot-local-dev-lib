import fs from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';
import extract from 'extract-zip';

import { logger } from './logger';
import { i18n } from '../utils/lang';
import { ZipData, CopySourceToDestOptions } from '../types/Archive';
import { FileSystemError } from '../models/FileSystemError';

const i18nKey = 'lib.archive';

async function extractZip(
  name: string,
  zip: Buffer,
  hideLogs = false
): Promise<ZipData> {
  const result: ZipData = { extractDir: '', tmpDir: '' };

  const TMP_FOLDER_PREFIX = `hubspot-temp-${name}-`;
  if (!hideLogs) {
    logger.log(i18n(`${i18nKey}.extractZip.init`));
  }

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
      throw new FileSystemError(
        { cause: err },
        {
          filepath: tmpZipPath || result.tmpDir,
          operation: 'write',
        }
      );
    } else {
      throw new Error(i18n(`${i18nKey}.extractZip.errors.write`), {
        cause: err,
      });
    }
  }
  // Extract zip
  try {
    const tmpExtractPath = join(result.tmpDir, 'extracted');
    await extract(tmpZipPath, { dir: tmpExtractPath });
    result.extractDir = tmpExtractPath;
  } catch (err) {
    throw new Error(i18n(`${i18nKey}.extractZip.errors.extract`), {
      cause: err,
    });
  }
  logger.debug(i18n(`${i18nKey}.extractZip.success`));
  return result;
}

async function copySourceToDest(
  src: string,
  dest: string,
  {
    sourceDir,
    includesRootDir = true,
    hideLogs = false,
  }: CopySourceToDestOptions = {}
): Promise<boolean> {
  try {
    if (!hideLogs) {
      logger.log(i18n(`${i18nKey}.copySourceToDest.init`));
    }
    const srcDirPath = [src];

    if (includesRootDir) {
      const files = await fs.readdir(src);
      const rootDir = files[0];
      if (!rootDir) {
        logger.debug(i18n(`${i18nKey}.copySourceToDest.sourceEmpty`));
        // Create the dest path if it doesn't already exist
        await fs.ensureDir(dest);
        // No root found so nothing to copy
        return true;
      }
      srcDirPath.push(rootDir);
    }

    const sourceDirs = [];

    if (sourceDir) {
      sourceDirs.push(...(Array.isArray(sourceDir) ? sourceDir : [sourceDir]));
    }

    if (sourceDirs.length === 0) {
      const projectSrcDir = join(...srcDirPath);
      await fs.copy(projectSrcDir, dest);
    } else {
      for (let i = 0; i < sourceDirs.length; i++) {
        const projectSrcDir = join(...srcDirPath, sourceDirs[i]);
        await fs.copy(projectSrcDir, dest);
      }
    }

    logger.debug(i18n(`${i18nKey}.copySourceToDest.success`));
    return true;
  } catch (err) {
    logger.debug(i18n(`${i18nKey}.copySourceToDest.error`, { dest }));
    throw new FileSystemError(
      { cause: err },
      {
        filepath: dest,
        operation: 'write',
      }
    );
  }
}

async function cleanupTempDir(tmpDir: string): Promise<void> {
  if (!tmpDir) return;
  try {
    await fs.remove(tmpDir);
  } catch (e) {
    logger.debug(i18n(`${i18nKey}.cleanupTempDir.error`, { tmpDir }));
  }
}

export async function extractZipArchive(
  zip: Buffer,
  name: string,
  dest: string,
  { sourceDir, includesRootDir, hideLogs }: CopySourceToDestOptions = {}
): Promise<boolean> {
  let success = false;

  if (zip) {
    const { extractDir, tmpDir } = await extractZip(name, zip, hideLogs);

    if (extractDir !== null) {
      success = await copySourceToDest(extractDir, dest, {
        sourceDir,
        includesRootDir,
        hideLogs,
      });
    }

    await cleanupTempDir(tmpDir);
  }
  return success;
}
