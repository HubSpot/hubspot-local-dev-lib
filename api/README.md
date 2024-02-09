# hubspot/local-dev-lib Api utils

These api utils are intended to simplify the process of making requests to some of HubSpot's public apis.

To use these api utils, you have to first:

- Have a HubSpot configuration file, populated with valid account information
- Parse and store the configuration file in memory using the available config file utils

Once those steps are complete, you can make requests using these api utils. The http wrapper that we use will handle all of the authentication requirements like formatting the header and token refreshes.

## Error handling

This library also includes utils that can help with the handling of request errors. Check out the [Error Handling Docs](../errors/README.md) for more information on how they can be used.

## Usage Example

Here is an example of what it might look like to use the `addSecret` api util.

```js
const { loadConfig } = require('@hubspot/local-dev-lib/config');
const { addSecret } = require('@hubspot/local-dev-lib/api/secrets');
const { throwApiError } = require('@hubspot/local-dev-lib/errors/apiErrors');

// Parse and store the config file information
loadConfig();
const accountId = 12345;

try {
  await addSecret(accountId, 'my-secret-name', 'my-secret-value');
} catch (e) {
  throwApiError(e);
}
```
