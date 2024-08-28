# hubspot/local-dev-lib

## Error utils

These error utils standardize the way that we handle errors in this library.

Generally, this library throws errors rather than logging them to the console. It is up the consuming packages to catch the errors and handle them.

## Error Type Predicates

There are several type predicates exposed in the error module to make life easier. They help to determine the type of error that occurred and to check for common error types such as timeouts, auth errors, and missing scopes.

## Custom Errors

We have a few custom error objects that we use to throw in specific situations. All the these errors will include the original error as the `cause`

### HubSpotHttpError

This will be thrown anytime there is an error making a HTTP request. It has all the necessary metadata about the HTTP request, such as status code, method, payload, etc. It also uses these fields to generate a user facing message in the `message` prop as well as more detailed messaging. It exposes a `toString` method that logs all the details of the error.

### FileSystemError

This will be thrown anytime there is an issue with a file system operation. It can contain data about if the operation was a read/write and what file path the error occured for.
