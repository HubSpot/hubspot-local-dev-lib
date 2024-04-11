# hubspot/local-dev-lib

## Config utils

The hubspot local development tooling uses a configuration file to store information about the HubSpot accounts that it has been granted access to.

The config file is named `huspot.config.yml`.

## Using the config utils

There are a handful of standard config utils that anyone working in this library should be familiar with.

#### getAndLoadConfigIfNeeded()

Locates, parses, and stores the `hubspot.config.yml` file in memory. This should be the first thing that you do if you plan to access any of the config file values. If the config has already been loaded, this function will simply return the already-parsed config values.

#### updateAccountConfig()

Safely writes updated values to the `hubspot.config.yml` file. This will also refresh the in-memory values that have been stored for the targeted account.

#### getAccountConfig()

Returns config data for a specific account, given the account's ID.

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

## config_DEPRECATED.ts explained

You may notice that we have a few configuration files in our `config/` folder. This is because we are in the middle of exploring a new method for storing account information. Despite its naming, config_DEPRECATED.ts is still the configuration file that handles all of our config logic. We have a proxy file named `config/index.ts` that will always choose to use the soon-to-be deprecated configuration file. This proxy file will enable us to slowly port config functionality over to the new pattern (i.e. `config/CLIConfiguration.ts`). For now, it is recommended to use config_DEPRECATED.ts and the utils it provides. We ask that any updates made to config_DEPRECATED.ts are also made to the newer CLIConfiguration.ts file whenever applicable.
