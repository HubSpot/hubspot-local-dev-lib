---
paths:
  - '**/__tests__/**/*.ts'
  - '!node_modules/**'
  - '!dist/**'
---

# Test Guidelines

**Framework**: Vitest with globals enabled (all tests in `__tests__/` directories, co-located with source)

## Rules

- No try/catch blocks — use `expect().toThrow()` for error testing
- All cleanup in `afterEach()` using `vi.restoreAllMocks()`
- Never skip tests — fix or remove them
- Follow the naming convention of `[file-being-tested].test.ts`

## Mocking

- Use `vi.mock()` at module level for dependency mocking
- Use `vi.mocked()` for type-safe access to mocked functions
- When mock return values depend on input, use `mockImplementation()` over static `mockReturnValue()`
- Shared test helpers live in `__tests__/__utils__/` (e.g., `mockAxiosResponse()`)

## Structure

```typescript
import { vi, describe, it, expect } from 'vitest';

vi.mock('../dependency.js');

describe('moduleName', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should do the thing', () => {
    // arrange, act, assert
  });
});
```
