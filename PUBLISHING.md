# Publishing Releases

Only contributors who are members of the HubSpot NPM organization can publish releases.

## Release Command

```bash
yarn release -v=<increment> -t=<tag>
```

### Parameters

- `-v, --versionIncrement` (required): `patch`, `minor`, `major`, or `prerelease`
- `-t, --tag` (required): `latest`, `next`, or `experimental`
- `-d, --dryRun`: Run through the process without actually publishing

### Examples

```bash
# Patch release to latest
yarn release -v=patch -t=latest

# Minor release to latest
yarn release -v=minor -t=latest

# Major release with breaking changes
yarn release -v=major -t=latest

# Experimental release from a feature branch
yarn release -v=prerelease -t=experimental

# Dry run (test without publishing)
yarn release -v=patch -t=latest -d
```

The script handles version bumping, git tagging, and publishing to NPM. It also validates the branch, checks the version against published versions, and opens the GitHub PR/release pages.

## Experimental Releases

Use experimental releases to test changes before merging, or to share in-progress work with the CLI team for CI validation.

1. From your feature branch: `yarn release -v=prerelease -t=experimental`
2. This publishes a version like `0.7.5-experimental.0` tagged as `experimental` on NPM
3. It won't be installed by default — consumers must explicitly reference the version

To use in the CLI:

```json
"@hubspot/local-dev-lib": "0.7.5-experimental.0"
```

Then run `yarn install --force` in the CLI repo.

## Local Testing (without publishing)

For active development, use local linking instead of publishing. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
