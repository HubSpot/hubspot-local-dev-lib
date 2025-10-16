import { vi } from 'vitest';

// Clear out the env variable HUBAPI_DOMAIN_OVERRIDE so it doesn't impact tests
// if it is set in the users local environment
delete process.env.HUBAPI_DOMAIN_OVERRIDE;

// Mock prettier for tests to avoid ESM compatibility issues
// This only affects tests, not production code
vi.mock('prettier', () => ({
  format: vi.fn((code: string, options?: any) => {
    // Return formatted JSON for tests
    if (options?.parser === 'json') {
      try {
        return JSON.stringify(JSON.parse(code), null, 2);
      } catch {
        return code;
      }
    }
    return code;
  }),
}));
