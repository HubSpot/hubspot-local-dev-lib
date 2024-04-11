## Contributing

To contribute, fork this repository and create a new branch. Then create a PR. For more detailed instructions, see this [link](https://www.dataschool.io/how-to-contribute-on-github/).

#### Install the dependencies

```bash
yarn install
```

#### Generate a new build

```bash
yarn run build
```

#### Testing with the HubSpot CLI

When contributing to local-dev-lib, you may also need to test the changes in the HubSpot CLI. To use a local version of local-dev-lib as a dependancy, use [yarn link](https://classic.yarnpkg.com/lang/en/docs/cli/link/).

1. Run `yarn run local-dev` in the local-dev-lib root to set up a symlink.
2. Run `yarn link @hubspot/local-dev-lib` in the hubspot-cli root and in `packages/cli` to use the symlinked local package.

To stop using your local local-dev-lib, you can follow a similar process with [yarn unlink](https://classic.yarnpkg.com/en/docs/cli/unlink).

1. Run `yarn unlink` in the local-dev-lib root.
2. Run `yarn unlink` in the hubspot-cli root and in `packages/cli`.

## Merging

To merge, either create, or have a maintainer create a blank branch, and set your PRs base branch to the blank branch. Merge your PR into the blank branch, and ensure that it passes the build. Then merge the new branch into main.

## Documentation

- [Publishing Releases](./docs/PublishingReleases.md)
