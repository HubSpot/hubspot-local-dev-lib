// Clear out the env variable HUBAPI_DOMAIN_OVERRIDE so it doesn't impact tests
// if it is set in the users local environment
delete process.env.HUBAPI_DOMAIN_OVERRIDE;
