import * as fs from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import __extract from 'extract-zip';

import { throwFileSystemError } from '../errors/fileSystemErrors';
import { throwError } from '../errors/standardErrors';
import { log, debug } from '../utils/logs';
import { LogCallbacks } from '../types/LogCallbacks';
import { BaseError } from '../types/Error';

const extract = promisify(__extract);

type ZipData = {
  extractDir: string;
  tmpDir: string;
};

const extractZipCallbackKeys = ['onInit'] as const;
type ExtractZipCallbackKeys = (typeof extractZipCallbackKeys)[number];
type ExtractZipLogCallbacks = LogCallbacks<ExtractZipCallbackKeys>;

async function extractZip(
  name: string,
  zip: Buffer,
  logCallbacks?: ExtractZipLogCallbacks
): Promise<ZipData> {
  const result: ZipData = { extractDir: '', tmpDir: '' };

  const TMP_FOLDER_PREFIX = `hubspot-temp-${name}-`;
  log<ExtractZipCallbackKeys>(
    'onInit',
    logCallbacks,
    'archive.extractZip.init'
  );

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
    debug('archive.extractZip.writeError');
    if (tmpZipPath || result.tmpDir) {
      throwFileSystemError(err as BaseError, {
        filepath: tmpZipPath || result.tmpDir,
        write: true,
      });
    } else {
      throwError(err as BaseError);
    }
    return result;
  }
  // Extract zip
  try {
    const tmpExtractPath = join(result.tmpDir, 'extracted');
    await extract(tmpZipPath, { dir: tmpExtractPath });
    result.extractDir = tmpExtractPath;
  } catch (err) {
    debug('archive.extractZip.extractError');
    throwError(err as BaseError);
  }
  debug('archive.extractZip.success');
  return result;
}

type CopySourceToDestOptions = {
  sourceDir?: string;
  includesRootDir?: boolean;
};

const copySourceToDestCallbackKeys = ['onInit'] as const;
type CopySourceToDestCallbackKeys =
  (typeof copySourceToDestCallbackKeys)[number];
type CopySourceToDestCallbacks = LogCallbacks<ExtractZipCallbackKeys>;

async function copySourceToDest(
  src: string,
  dest: string,
  { sourceDir, includesRootDir = true }: CopySourceToDestOptions = {},
  logCallbacks?: CopySourceToDestCallbacks
): Promise<boolean> {
  try {
    log<CopySourceToDestCallbackKeys>(
      'onInit',
      logCallbacks,
      'archive.copySourceToDest.init'
    );
    const srcDirPath = [src];

    if (includesRootDir) {
      const files = await fs.readdir(src);
      const rootDir = files[0];
      if (!rootDir) {
        debug('archive.copySourceToDest.sourceEmpty');
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
    debug('archive.copySourceToDest.success');
    return true;
  } catch (err) {
    debug('archive.copySourceToDest.error', { dest });
    throwFileSystemError(err as BaseError, {
      filepath: dest,
      write: true,
    });
  }
  return false;
}

/**
 * Try cleaning up resources from os's tempdir
 * @param {String} tmpDir
 */
function cleanupTempDir(tmpDir) {
  if (!tmpDir) return;
  try {
    fs.remove(tmpDir);
  } catch (e) {
    logger.debug('Failed to clean up temp dir: ', tmpDir);
  }
}

async function extractZipArchive(
  zip,
  name,
  dest,
  { sourceDir, includesRootDir } = {}
) {
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

module.exports = {
  extractZipArchive,
};
