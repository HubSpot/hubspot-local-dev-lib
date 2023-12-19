# hubspot/local-dev-lib Library
Provides library functionality for HubSpot local development tooling, including the [HubSpot CLI](https://github.com/HubSpot/hubspot-cli).

**NOTE:** This library is intended to replace the former [@hubspot/cli-lib](https://github.com/HubSpot/cli-lib) library.

## Overview
This library contains utility functionality that facilitates interactions with HubSpot. It is consumed by the [HubSpot CLI](https://github.com/HubSpot/hubspot-cli) as well as other HubSpot development tooling. Major exports of this library include...
- Utilities for managing HubSpot account configuration and access keys
- Utilities to interact with HubSpot assets such as Design Manager assets and Developer Projects
- Utilities to help with navigating the local filesystem and parsing HubSpot files

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
1. Run `yarn link` in local-dev-lib to set up a symlink.
2. Run `yarn link @hubspot/local-dev-lib` in hubspot-cli to use the symlinked local package.

To stop using your local local-dev-lib, you can follow a similar process with [yarn unlink](https://classic.yarnpkg.com/en/docs/cli/unlink).

## Help
If you encounter an issue in this library or would like to share feedback with us, please open an issue in this repository or in the [HubSpot CLI repository](https://github.com/HubSpot/hubspot-cli/issues).
