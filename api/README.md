# hubspot/local-dev-lib

## API utils

These API utils simplify making requests to some of HubSpot's public API endpoints.

To use these API utils, you need to have a HubSpot configuration file populated with valid account information. The HTTP wrapper will automatically load the config and handle all of the authentication requirements, such as formatting the header and token refreshes, so there is no need to call `getConfig()` before making requests.

## Error handling

This library also includes utils that handle request errors. Check out the [Error Handling Docs](../errors/README.md) for more information on how they can be used.

## Usage Example

Here's how to use the `addSecret` API util:

```typescript
import { addSecret } from '@hubspot/local-dev-lib/api/secrets';

const accountId = 12345;
await addSecret(accountId, 'my-secret-name', 'my-secret-value');
```
