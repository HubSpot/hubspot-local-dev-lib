# hubspot/local-dev-lib

[![npm version](https://img.shields.io/npm/v/@hubspot/local-dev-lib.svg)](https://www.npmjs.com/package/@hubspot/local-dev-lib)
[![npm downloads](https://img.shields.io/npm/dm/@hubspot/local-dev-lib)](https://www.npmjs.com/package/@hubspot/local-dev-lib)
[![npm license](https://img.shields.io/npm/l/@hubspot/local-dev-lib)](https://www.npmjs.com/package/@hubspot/local-dev-lib)
[![node version](https://img.shields.io/node/v/@hubspot/local-dev-lib)](https://www.npmjs.com/package/@hubspot/local-dev-lib)

Provides library functionality for HubSpot local development tooling, including the [HubSpot CLI](https://github.com/HubSpot/hubspot-cli).

**NOTE:** This library is intended to replace the deprecated [@hubspot/cli-lib](https://github.com/HubSpot/cli-lib) library.

## Overview

This library contains utils that facilitate interactions with HubSpot. It is consumed by the [HubSpot CLI](https://github.com/HubSpot/hubspot-cli) as well as other HubSpot development tooling. Major exports include:

- Config utils for managing HubSpot account configuration and access keys ([docs](./config/README.md))
- API utils to interact with HubSpot assets such as Design Manager and Developer Projects ([docs](./api/README.md))
- Utils to navigate the local filesystem, parse common HubSpot files, interact with common HubSpot objects, and connect with GitHub ([docs](./lib/README.md))

## Contributing

For more information on developing, see the [Contributing Guide](CONTRIBUTING.md).
