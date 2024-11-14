import { exec as _exec, spawn } from 'child_process';
import { promisify } from 'util';
import yargs, { ArgumentsCamelCase, Argv } from 'yargs';
import semver from 'semver';
import { confirm } from '@inquirer/prompts';

import { name as packageName, version as localVersion } from '../package.json';
import { logger, setLogLevel, LOG_LEVEL } from '../lib/logger';
import { build } from './lib/build';

const exec = promisify(_exec);

const MAIN_BRANCH = 'main';

const TAG = {
  LATEST: 'latest',
  NEXT: 'next',
  EXPERIMENTAL: 'experimental',
} as const;

const INCREMENT = {
  PATCH: 'patch',
  MINOR: 'minor',
  MAJOR: 'major',
  PRERELEASE: 'prerelease',
} as const;

const VERSION_INCREMENT_OPTIONS = [
  INCREMENT.PATCH,
  INCREMENT.MINOR,
  INCREMENT.MAJOR,
  INCREMENT.PRERELEASE,
] as const;
const TAG_OPTIONS = [TAG.LATEST, TAG.NEXT, TAG.EXPERIMENTAL] as const;

const PRERELEASE_IDENTIFIER = {
  NEXT: 'beta',
  EXPERIMENTAL: 'experimental',
} as const;

const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
};

type ReleaseArguments = {
  versionIncrement: (typeof VERSION_INCREMENT_OPTIONS)[number];
  tag: (typeof TAG_OPTIONS)[number];
  dryRun?: boolean;
};

type DistTags = {
  [TAG.LATEST]: string;
  [TAG.NEXT]: string;
  [TAG.EXPERIMENTAL]: string;
};

type Tag = (typeof TAG_OPTIONS)[number];

async function getGitBranch(): Promise<string> {
  const { stdout } = await exec('git rev-parse --abbrev-ref HEAD');
  return stdout.trim();
}

async function getDistTags(): Promise<DistTags> {
  const { stdout } = await exec(`npm view ${packageName} dist-tags --json`);
  const distTags = stdout.trim();
  return JSON.parse(distTags) as DistTags;
}

async function cleanup(newVersion: string): Promise<void> {
  await exec(`git reset HEAD~`);
  await exec(`git checkout .`);
  await exec(`git tag -d v${newVersion}`);
}

async function publish(tag: Tag, isDryRun: boolean): Promise<void> {
  logger.log();
  logger.log(`Publishing to ${tag}...`);
  logger.log('-'.repeat(50));
  logger.log();

  const commandArgs = ['publish', '--tag', tag];

  if (isDryRun) {
    commandArgs.push('--dry-run');
  }

  return new Promise((resolve, reject) => {
    const childProcess = spawn('npm', commandArgs, {
      stdio: 'inherit',
      cwd: './dist',
    });

    childProcess.on('close', code => {
      if (code !== EXIT_CODES.SUCCESS) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

async function updateNextTag(
  newVersion: string,
  isDryRun: boolean
): Promise<void> {
  logger.log();
  logger.log(`Updating ${TAG.NEXT} tag...`);

  const commandArgs = [
    'dist-tag',
    'add',
    `${packageName}@${newVersion}`,
    TAG.NEXT,
  ];

  return new Promise((resolve, reject) => {
    if (isDryRun) {
      const distTagCommand = ['npm', ...commandArgs].join(' ');
      logger.log(`Dry run: skipping run of \`${distTagCommand}\``);
      resolve();
    } else {
      const childProcess = spawn('npm', commandArgs, { stdio: 'inherit' });

      childProcess.on('close', code => {
        if (code !== EXIT_CODES.SUCCESS) {
          reject();
        } else {
          logger.success(`${TAG.NEXT} tag updated successfully`);
          resolve();
        }
      });
    }
  });
}

async function handler({
  versionIncrement,
  tag,
  dryRun,
}: ArgumentsCamelCase<ReleaseArguments>): Promise<void> {
  setLogLevel(LOG_LEVEL.LOG);

  const branch = await getGitBranch();

  const isExperimental = tag === TAG.EXPERIMENTAL;
  const isDryRun = Boolean(dryRun);

  if (isExperimental && branch === MAIN_BRANCH) {
    logger.error(
      'Releases to experimental tag cannot be published from the main branch'
    );
    process.exit(EXIT_CODES.ERROR);
  } else if (!isExperimental && branch !== MAIN_BRANCH) {
    logger.error(
      'Releases to latest and next tags can only be published from the main branch'
    );
    process.exit(EXIT_CODES.ERROR);
  }

  if (tag === TAG.LATEST && versionIncrement === INCREMENT.PRERELEASE) {
    logger.error(
      'Invalid release: cannot increment prerelease number on latest tag.'
    );
    process.exit(EXIT_CODES.ERROR);
  }

  const { next: currentNextTag, experimental: currentExperimentalTag } =
    await getDistTags();

  if (!isExperimental && currentNextTag !== localVersion) {
    logger.error(
      `Local package.json version ${localVersion} is out of sync with published version ${currentNextTag}`
    );
    process.exit(EXIT_CODES.ERROR);
  }

  const currentVersion = isExperimental ? currentExperimentalTag : localVersion;
  const prereleaseIdentifier = isExperimental
    ? PRERELEASE_IDENTIFIER.EXPERIMENTAL
    : PRERELEASE_IDENTIFIER.NEXT;
  const incrementType =
    tag === TAG.LATEST || versionIncrement === INCREMENT.PRERELEASE
      ? versionIncrement
      : (`pre${versionIncrement}` as const);

  const newVersion = semver.inc(
    currentVersion,
    incrementType,
    prereleaseIdentifier
  );

  if (!newVersion) {
    logger.error('Error incrementing version.');
    process.exit(EXIT_CODES.ERROR);
  }

  logger.log();
  if (dryRun) {
    logger.log('DRY RUN');
  }
  logger.log(`Current version: ${currentVersion}`);
  logger.log(`New version to release: ${newVersion}`);

  const shouldRelease = await confirm({
    message: `Release version ${newVersion} on tag ${tag}?`,
  });

  if (!shouldRelease) {
    process.exit(EXIT_CODES.SUCCESS);
  }

  logger.log();
  logger.log(`Updating version to ${newVersion}...`);
  await exec(`yarn version --new-version ${newVersion}`);
  logger.success('Version updated successfully');

  logger.log();
  await build();

  try {
    await publish(tag, isDryRun);

    if (tag === TAG.LATEST) {
      await updateNextTag(newVersion, isDryRun);
    }
  } catch (e) {
    logger.error(
      'An error occurred while releasing the package. Correct the error and re-run `yarn build`.'
    );
    await cleanup(newVersion);
    process.exit(EXIT_CODES.ERROR);
  }

  if (isDryRun) {
    await cleanup(newVersion);
    logger.log();
    logger.success('Dry run release finished successfully');
    process.exit(EXIT_CODES.SUCCESS);
  }

  logger.log();
  logger.log(`Pushing changes to Github...`);
  await exec(`git push --atomic origin ${branch} v${newVersion}`);
  logger.log(`Changes pushed successfully`);

  logger.log();
  logger.success(
    `@hubspot/local-dev-lib version ${newVersion} published successfully`
  );
  logger.log(
    'View on npm: https://www.npmjs.com/package/@hubspot/local-dev-lib?activeTab=versions'
  );
}

async function builder(yargs: Argv): Promise<Argv> {
  return yargs.options({
    versionIncrement: {
      alias: 'v',
      demandOption: true,
      describe: 'SemVer increment type for the next release',
      choices: VERSION_INCREMENT_OPTIONS,
    },
    tag: {
      alias: 't',
      demandOption: true,
      describe: 'Tag for the next release',
      choices: TAG_OPTIONS,
    },
    dryRun: {
      alias: 'd',
      describe: 'Run through the publish process without actually publishing',
      type: 'boolean',
    },
  });
}

yargs(process.argv.slice(2))
  .scriptName('yarn')
  .usage('Release script')
  .command(
    'release',
    'Create a new npm release of local-dev-lib with the specified version and tag',
    builder,
    handler
  )
  .version(false)
  .help().argv;