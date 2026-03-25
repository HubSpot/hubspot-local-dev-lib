# hubspot/local-dev-lib

## Config utils

The HubSpot local development tooling uses configuration files to store information about authenticated HubSpot accounts.

### Global vs Local Config

There are two types of config files:

- **Global config** (`~/.hscli/config.yml`) — stores all authenticated accounts in one place. This is the recommended approach and is used by `hs account auth`.
- **Local config** (`hubspot.config.yml`) — a legacy per-project config file found via findup. Deprecated in favor of global config.

### Per-directory linking (`.hs/settings.json`)

In addition to the config files above, directories can have a `.hs/settings.json` file that scopes which accounts are active for that directory. This is created by `hs account link` and contains:

- `accounts` — array of account IDs linked to this directory
- `localDefaultAccount` — which linked account is the default for this directory

This lets developers work across multiple HubSpot accounts in different project directories without changing the global default.

## Using the config utils

There are a handful of standard config utils that anyone working in this library should be familiar with.

#### getConfig()

Locates and parses the HubSpot config file. This function will automatically find the correct config file using the following criteria:

1. Checks to see if a config was specified via environment variables (see below)
2. If no environment variables are present, looks for a global config file (located at `~/.hscli/config.yml`)
3. If no global config file is found, looks up the file tree for a local config file
4. If no local config file is found, throws an error

##### Custom config location environment variables

- `HUBSPOT_CONFIG_PATH` - specify a file path to a specific config file
- `USE_ENVIRONMENT_HUBSPOT_CONFIG` - load config account from environment variables. The following environment variables are supported:
  - `HUBSPOT_PERSONAL_ACCESS_KEY`
  - `HUBSPOT_ACCOUNT_ID`
  - `HTTP_TIMEOUT`
  - `DEFAULT_CMS_PUBLISH_MODE`

#### updateConfigAccount()

Safely writes updated values to the HubSpot config file.

#### getConfigAccountById() and getConfigAccountByName()

Returns config data for a specific account, given the account's ID or name. Errors if an account is not found.

#### getConfigAccountIfExists()

Returns config data for a specific account, given either a name or an ID. Returns null without erroring if an account is not found.

#### getLinkedOrAllConfigAccounts()

Returns only accounts listed in `.hs/settings.json` when present, or all accounts when no settings file exists.

## Example config

Here is an example of a basic HubSpot config file with a single account configured.

```yml
defaultPortal: my-hubspot-account
portals:
  - name: my-hubspot-account
    portalId: 12345
    authType: personalaccesskey
    auth:
      tokenInfo:
        accessToken: my-access-token
        expiresAt: '2024-02-07T17:10:32.747Z'
    accountType: STANDARD
    personalAccessKey: 'my-personal-access-key'
```
