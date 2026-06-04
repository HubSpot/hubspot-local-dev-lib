---
description: Testing Guidelines
globs: '**/__tests__/**/*.ts'
alwaysApply: false
---

# Testing Guidelines

When working with test files:

- Tests live in co-located `__tests__/` directories
- Use Vitest for testing (not Jest, not jasmine)
- Follow the naming convention of `<source-file>.test.ts`
- Run tests with `yarn test` or `yarn test <specific-file-path>`
- No try/catch blocks — use `expect().toThrow()` for error testing
- All cleanup in `afterEach()` using `vi.restoreAllMocks()`
- Never skip tests — fix or remove them
- Use `vi.mock()` at module level for dependency mocking
- Use `vi.mocked()` for type-safe access to mocked functions
