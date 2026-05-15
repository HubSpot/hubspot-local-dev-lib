# Project Overview

This is `@hubspot/local-dev-lib` — a shared TypeScript library that provides core functionality for HubSpot local development tooling. It replaces the deprecated `@hubspot/cli-lib`.

**IMPORTANT** - Always make a plan and confirm the plan with the user before implementation.

# What This Library Does

- **Config utils** (`config/`) — manage HubSpot account configuration files. `getConfig()` resolves config using: env vars → global config (`~/.hscli/config.yml`) → local config (findup). Key functions: `getConfig()`, `updateConfigAccount()`, `getConfigAccountById()`, `getConfigAccountByName()`, `getLinkedOrAllConfigAccounts()`.
- **Per-directory linking** (`config/hsSettings.ts`) — `.hs/settings.json` scopes which accounts are active for a directory. Created by `hs account link`. Contains `accounts` (array of linked account IDs) and `localDefaultAccount`.
- **API utils** (`api/`) — HTTP calls to HubSpot public API endpoints. Requires a parsed config in memory. The HTTP wrapper handles auth headers and token refreshes automatically.
- **Lib utils** (`lib/`) — exported functions and modules: filesystem navigation, HubSpot account connections (sandboxes), file parsing, and GitHub integration. Anything exported from the repo should live here (excluding special cases like `config/`).
- **Internal utils** (`utils/`) — internal helper functions that are NOT exported from the repo.
- **Error utils** (`errors/`) — standardized error handling. This library throws errors rather than logging them — consumers catch and handle. Custom errors: `HubSpotHttpError` (HTTP failures with status/method/payload metadata), `HubSpotConfigError` (config issues), `FileSystemError` (FS operations with read/write context). Type predicates help identify timeouts, auth errors, and missing scopes.

# Key Consumers

- **HubSpot CLI** (`hubspot-cli`) — the primary consumer
- **VS Code extension** — uses config and API functions

Changes here affect all consumers. Be careful with breaking changes to exported function signatures.

# Testing Changes Against the CLI

## Option 1: Local linking (for active development)

1. In LDL: `yarn local-dev` — builds, runs `yarn link`, and watches for changes
2. In CLI: `yarn local-link` — interactive prompt to symlink local packages
3. Changes in LDL are reflected in the CLI after `yarn build`

To stop: run `yarn unlink` in LDL, then `yarn install --force` in CLI.

## Option 2: Experimental NPM release (for CI testing or sharing)

1. In LDL: `yarn release -v=prerelease -t=experimental`
2. In CLI: update `package.json` to the experimental version (e.g., `"@hubspot/local-dev-lib": "0.7.5-experimental.0"`) and run `yarn install --force`

Experimental releases are tagged on NPM so they won't be installed by default. See [PUBLISHING.md](../../PUBLISHING.md) for full details.
