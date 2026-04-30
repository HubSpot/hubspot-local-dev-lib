# hubspot/local-dev-lib

## Error utils

These error utils standardize the way that we handle errors in this library.

Generally, this library throws errors rather than logging them to the console. It is up to the consuming packages to catch the errors and handle them.

## Error Type Predicates

There are several type predicates exposed in the error module to make life easier. They help to determine the type of error that occurred and to check for common error types such as timeouts, auth errors, and missing scopes.

## Custom Errors

We have a few custom error objects that we use to throw in specific situations. All of these errors will include the original error as the `cause`.

### HubSpotHttpError

Thrown anytime there is an error making an HTTP request. It has all the necessary metadata about the HTTP request, such as status code, method, payload, etc. It uses these fields to generate a user-facing message in the `message` prop as well as more detailed messaging. It exposes a `toString` method that logs all the details of the error.

### HubSpotConfigError

Thrown for configuration-related errors, such as missing config files, invalid config structure, or account resolution failures.

### FileSystemError

Thrown anytime there is an issue with a file system operation. Contains data about whether the operation was a read or write and what file path the error occurred for.
