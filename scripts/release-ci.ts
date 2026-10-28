import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { getDistTags } from '@hubspot/npm-scripts/src/utils/npm.js';
import { ReleaseError } from '@hubspot/npm-scripts/src/utils/release/errors.js';
import {
  validateBranchForTag,
  validateTagIncrementCombination,
  validateVersionSync,
  validateNextReleaseIsNotOverIncrement,
} from '@hubspot/npm-scripts/src/utils/release/validate.js';
import { computeNewVersion } from '@hubspot/npm-scripts/src/utils/release/version.js';
import {
  TAG,
  TAG_OPTIONS,
  VERSION_INCREMENT_OPTIONS,
} from '@hubspot/npm-scripts/src/constants/release.js';

const MAIN_BRANCH = 'main';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')
);

const { tag, versionIncrement, branch } = yargs(process.argv.slice(2))
  .options({
    tag: { choices: TAG_OPTIONS, demandOption: true },
    versionIncrement: {
      choices: VERSION_INCREMENT_OPTIONS,
      demandOption: true,
    },
    branch: { type: 'string', demandOption: true },
  })
  .strict()
  .parseSync();

async function computeRelease(): Promise<void> {
  const isExperimental = tag === TAG.EXPERIMENTAL;

  if (tag === TAG.PREVIOUS) {
    throw new ReleaseError(
      'Releases to the previous tag are not supported by this workflow'
    );
  }

  validateBranchForTag({
    isExperimental,
    isPrevious: false,
    branch,
    mainBranch: MAIN_BRANCH,
  });
  validateTagIncrementCombination(tag, versionIncrement);

  const distTags = await getDistTags(packageJson.name);

  validateVersionSync({
    isExperimental,
    isPrevious: false,
    localVersion: packageJson.version,
    distTags,
  });
  validateNextReleaseIsNotOverIncrement({
    tag,
    versionIncrement,
    localVersion: packageJson.version,
    distTags,
  });

  const newVersion = computeNewVersion({
    tag,
    versionIncrement,
    isExperimental,
    distTags,
    localVersion: packageJson.version,
  });

  const outputs = {
    'new-version': newVersion,
    'current-latest': distTags.latest,
  };

  console.log(`Current version: ${packageJson.version}`);
  console.log(`New version to release: ${newVersion} on tag ${tag}`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      Object.entries(outputs)
        .map(([key, value]) => `${key}=${value}\n`)
        .join('')
    );
  }
}

computeRelease().catch(e => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
