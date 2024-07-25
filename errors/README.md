# hubspot/local-dev-lib

[//]: # '// TODO[JOE] Update this readme'

## Error utils

These error utils standardize the way that we handle errors in this library. Many of them will simply throw errors, but some of them have been broken up into "getError" and "throwError" utilities. This enables external packages to generate the same errors that are used in this library.

Generally, this library throws errors rather than logging them to the console. It is up the the consuming packages to catch the errors and do what they want with them.

All of the error utils will include the original error as the `cause` of the returned error.

## Standard Errors

Generic errors that the library needs to throw. `throwError` should be used when the error already contains a useful message, or if we are unable to include a more useful error message. `throwErrorWithMessage` enables you to include a custom message with the error.

## File System Errors

Errors related to file system interactions. These utils should be used when handling errors thrown by `fs`. These errors support a `context` that enables you to include a filepath as well as read vs. write information.

## API Errors

The API error utils handle `axios` errors. They build the most useful error message possible given the original `axios` error response as well as some optional context.
