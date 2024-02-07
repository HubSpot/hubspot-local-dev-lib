# hubspot/local-dev-lib Error utils

These error utils are mainly used within this library to help standardize the way that we handle errors. Many of them will throw errors, but some of them have been broken up into "getError" and "throwError" utilities. This enables external packages to generate the same errors that are used in this library.

Generally, this library will throw errors rather than log them to the console. It is up the the consuming packages to catch the errors and do what they want with them.

All of the error handling utils in this library will include the original error as the `cause` of the returned error.

## Standard Errors

Generic errors that the library needs to throw. `throwError` should be used when the error already contains a useful message, or if we are unable to include a more useful error message. `throwErrorWithMessage` enables you to include a custom message with the error.

## File System Errors

Errors related to file system interactions. These utils should be used when handling errors thrown by `fs`. These errors support a `context` that enables you to include a filepath as well as read vs. write information.

## Api Errors

The api error utils are built to handle Axios errors. They will attempt to build the most useful error message possible given the original axios error response as well as some optional context.
