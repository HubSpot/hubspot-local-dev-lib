## Contributing

To contribute, fork this repository and create a new branch. Then create a PR. For more detailed instructions, see this [link](https://www.dataschool.io/how-to-contribute-on-github/).

#### Install the dependencies

```bash
yarn install
```

#### Generate a new build

```bash
yarn build
```

#### Testing with the HubSpot CLI

When contributing to local-dev-lib, you may also need to test the changes in the HubSpot CLI.

##### Option 1: Local linking (for active development)

Use [yarn link](https://classic.yarnpkg.com/lang/en/docs/cli/link/) to symlink your local copy:

1. Run `yarn local-dev` in the local-dev-lib root to build and set up a symlink.
2. Run `yarn local-link` in the hubspot-cli-private root to use the symlinked local package.

To stop using your local local-dev-lib:

1. Run `yarn unlink` in the local-dev-lib root.
2. Run `yarn install --force` in the hubspot-cli root to restore the published version.

##### Option 2: Experimental NPM release (for testing in CI or sharing with others)

Publish an experimental version to NPM from your branch:

1. Run `yarn release -v=prerelease --t=experimental`
2. In the CLI repo, update `package.json` to point to the experimental version (e.g., `"@hubspot/local-dev-lib": "0.7.4-experimental.0"`).
3. Run `yarn install --force` in the CLI repo to pull the experimental release.

## Merging

To merge, either create, or have a maintainer create a blank branch, and set your PRs base branch to the blank branch. Merge your PR into the blank branch, and ensure that it passes the build. Then merge the new branch into main.

## Documentation

- [Publishing Releases](./PUBLISHING.md)
