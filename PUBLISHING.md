# Publishing Releases

Releases are published to npm from GitHub Actions. Running a release command doesn't need an npm login, only the [GitHub CLI](https://cli.github.com) (`gh`), logged in to an account with write access to this repository.

## Release Commands

| Command | npm tag | What it does |
| --- | --- | --- |
| `yarn release -v <increment>` | `latest` | From `main`: bumps the version on a `v<version>-publish` branch and opens a PR. Merging the PR publishes the release. |
| `yarn beta-release -v <increment>` | `next` | Same as above, with an `X.Y.Z-beta.N` version |
| `yarn experimental-release` | `experimental` | From a pushed feature branch: publishes that branch from the `Experimental Release` workflow. Nothing is committed. |

### Parameters

- `-v, --versionIncrement`: `patch`, `minor`, or `major`. `beta-release` also accepts `prerelease`. You're prompted when it's omitted. `experimental-release` doesn't take one.
- `-d, --dryRun`: Preview the release without changing anything
- `-y, --yes`: Skip prompts

### Examples

```bash
# Minor release to latest
yarn release -v minor

# Beta of the next minor version
yarn beta-release -v minor

# Another beta of the version already on next
yarn beta-release -v prerelease

# Experimental release of the current branch
yarn experimental-release

# Dry run
yarn release -v patch -d
```

## Latest and Beta Releases

1. Run the command from an up-to-date `main`. It opens a release PR.
2. The `Release` workflow builds the PR, runs the tests, and runs `npm publish --dry-run`.
3. Merge the PR. The `Release` workflow publishes the version and tags the merge commit. For `latest`, it also creates a GitHub release and moves the `next` tag to the new version.

## Experimental Releases

Use experimental releases to test changes before merging, or to share in-progress work with the CLI team for CI validation.

1. Push your feature branch.
2. Run `yarn experimental-release`. It publishes a version like `5.15.0-experimental.0` tagged as `experimental` on npm, and prints the version when the workflow finishes.
3. It won't be installed by default. Consumers must explicitly reference the version.

To use in the CLI:

```json
"@hubspot/local-dev-lib": "5.15.0-experimental.0"
```

Then run `yarn install --force` in the CLI repo.

## Local Testing (without publishing)

For active development, use local linking instead of publishing. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
