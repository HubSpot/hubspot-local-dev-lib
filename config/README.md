# hubspot/local-dev-lib

## Config utils

The hubspot local development tooling uses a configuration file to store information about the HubSpot accounts that it has been granted access to.

The config file is named `huspot.config.yml`.

## Using the config utils

There are a handful of standard config utils that anyone working in this library should be familiar with.

#### getConfig()

Locates and parses the hubspot config file. This function will automatically find the correct config file. Typically, it defaults to the nearest config file by working up the direcotry tree. Custom config locations can be set using the following environment variables

- `USE_ENVIRONTMENT_CONFIG` - load config account from environment variables
- `HUBSPOT_CONFIG_PATH` - specify a path to a specific config file

#### updateConfigAccount()

Safely writes updated values to the `hubspot.config.yml` file.

#### getConfigAccountById() and getConfigAccountByName()

Returns config data for a specific account, given the account's ID or name.

## Example config

Here is an example of a basic hubspot config file with a single account configured.

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
