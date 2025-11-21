# hubspot/local-dev-lib

## Config utils

The hubspot local development tooling uses a configuration file to store information about the HubSpot accounts that it has been granted access to.

The config file is named `huspot.config.yml`.

## Using the config utils

There are a handful of standard config utils that anyone working in this library should be familiar with.

#### getConfig()

Locates and parses the hubspot config file. This function will automatically find the correct config file using the following criteria:
1. Checks to see if a config was specified via environment variables (see below)
2. If no environment variables are present, looks for a global config file (located at `~/.hscli/config.yml`)
3. If no global config file is found, looks up the file tree for a local config file.
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

#### getAccountIfExist

Returns config data for a specific account, given either a name or an ID. Returns null without erroring if an account is not found

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
