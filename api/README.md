# hubspot/local-dev-lib

## API utils

These API utils simplify making requests to some of HubSpot's public API endpoints.

To use these API utils, you need to:

- Have a HubSpot configuration file, populated with valid account information
- Parse and store the configuration file in memory using the available config file utils

Once those steps are complete, you can make requests with these utils. The HTTP wrapper will handle all of the authentication requirements, such as formatting the header and token refreshes.

## Error handling

This library also includes utils that handle request errors. Check out the [Error Handling Docs](../errors/README.md) for more information on how they can be used.

## Usage Example

Here's how to use the `addSecret` API util:

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
