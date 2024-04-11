# hubspot/local-dev-lib Library

Provides library functionality for HubSpot local development tooling, including the [HubSpot CLI](https://github.com/HubSpot/hubspot-cli).

**NOTE:** This library is intended to replace the deprecated [@hubspot/cli-lib](https://github.com/HubSpot/cli-lib) library.

## Overview

This library contains utility functionality that facilitates interactions with HubSpot. It is consumed by the [HubSpot CLI](https://github.com/HubSpot/hubspot-cli) as well as other HubSpot development tooling. Major exports of this library include:

- Config utils for managing HubSpot account configuration and access keys ([docs](./config/README.md))
- API utils to interact with HubSpot assets such as Design Manager and Developer Projects ([docs](./api/README.md))
- Utils to navigate the local filesystem, parse common HubSpot files, interact with common HubSpot objects, and connect with GitHub ([docs](./lib/README.md))

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

1. Run `yarn run local-dev` in the root of the local-dev-lib directory to set up a symlink.
2. Run `yarn link @hubspot/local-dev-lib` in the root of the hubspot-cli directory and in the hubspot-cli/packages/cli directory to use the symlinked local package.

To stop using your local local-dev-lib, you can follow a similar process with [yarn unlink](https://classic.yarnpkg.com/en/docs/cli/unlink).

1. Run `yarn unlink` in the root of the local-dev-lib directory.
2. Run `yarn unlink` in the root of the hubspot-cli directory and in the hubspot-cli/packages/cli directory.

## Help

If you encounter an issue in this library or would like to share feedback with us, please open an issue in this repository or in the [HubSpot CLI repository](https://github.com/HubSpot/hubspot-cli/issues).
