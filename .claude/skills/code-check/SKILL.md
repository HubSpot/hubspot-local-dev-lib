---
name: ldl:code-check
description: Review code changes in current branch for adherence to team guidelines and conventions
disable-model-invocation: false
allowed-tools: Bash(git:*), Read, Grep, Glob
argument-hint: '[base-branch]'
---

# Code Style & Guidelines Checker

Review all code changes in the current branch to ensure they follow the team's coding standards, conventions, and organizational guidelines.

**Scope:** This skill focuses on architectural patterns, code organization, and conventions that require human judgment. Basic formatting (quotes, indentation, line length, trailing commas) should be checked with `yarn lint` and `yarn prettier:write`.

## Task

When this skill is invoked:

### 1. Run automated checks first

- Run `yarn lint` to catch formatting and linting issues
- Include these results in the review report to avoid duplicate concerns
- If linter fails, include the errors in the "Critical Issues" section

### 2. Identify changes to review

- Get the base branch to compare against (default: `main`)
- If an argument is provided (e.g., `/code-check develop`), use that branch as the base
- Use `git diff --name-only <base-branch>...HEAD` to get list of changed files
- Use `git diff <base-branch>...HEAD` to see the actual changes
- **Only analyze the specific lines that changed** — don't review entire files
- Ignore files in `node_modules/`, `dist/`, and other non-source directories

### 3. Review code against style guidelines

Check each modified file for compliance with these guidelines:

**Note:** This skill focuses on architectural patterns and conventions that require human judgment. Run `yarn lint` and `yarn prettier:write` for automated style checks (quotes, indentation, line length, etc.).

#### Code Quality & Patterns

- [ ] Descriptive variable names that clearly indicate purpose
- [ ] Functional patterns preferred over classes
- [ ] Early returns for readability (avoid deep nesting)
- [ ] No usage of `any` type (should be rare and well-justified)
- [ ] No `process.exit()` calls (consumers handle exit, not this library)
- [ ] No direct user prompts (return data, let consumers prompt)

#### TypeScript Organization

- [ ] Reusable/exported type definitions in `/types` directory
- [ ] Proper type imports from type files
- [ ] No usage of `@ts-ignore` (use proper types or `@ts-expect-error` with explanation)
- [ ] All exports declared in `package.json` `exports` field

#### Project Organization

- [ ] API calls in `api/` returning `HubSpotPromise<T>`
- [ ] Config read/write in `config/`
- [ ] Exported functions in `lib/`
- [ ] Internal helpers in `utils/` (not exported)
- [ ] Custom errors in `errors/` using `HubSpotHttpError`, `HubSpotConfigError`, or `FileSystemError`
- [ ] User-facing strings in `lang/en.json` using `i18n()` with `{{ variable }}` interpolation
- [ ] Types in `types/` directory
- [ ] Tests in co-located `__tests__/` directories
- [ ] Test files named `<source-file>.test.ts`
- [ ] File names use camelCase

#### Error Handling

- [ ] Throws custom error classes from `errors/`, never returns error objects
- [ ] Uses `HubSpotHttpError` for API failures
- [ ] Uses `HubSpotConfigError` for config issues
- [ ] Uses `FileSystemError` for FS operations

#### Testing

- [ ] Tests in co-located `__tests__/` directories
- [ ] Uses Vitest (not Jest, not jasmine)
- [ ] No try/catch blocks in tests (use `expect().toThrow()`)
- [ ] Cleanup in `afterEach()` using `vi.restoreAllMocks()`
- [ ] No skipped tests
- [ ] Uses `vi.mock()` at module level for dependency mocking

#### Dependencies and Breaking Changes

- [ ] Flag newly-added dependencies and challenge whether they're necessary
- [ ] Identify potential breaking changes (API changes, removed features, changed behavior)
- [ ] New exports added to `package.json` `exports` field

#### Pull Request Size

- [ ] Prefer multiple smaller PRs over large ones for easier review
- [ ] If PR is large (>500 lines), suggest ways to break into smaller chunks
- [ ] Each PR should have a single, well-defined purpose

#### Git Practices

- [ ] No commits directly to `main` branch
- [ ] Changes are on a feature/fix branch

### 4. Generate the review report

Provide a structured report with these sections:

```markdown
# Code Style Review for Branch: <branch-name>

**Base:** <base-branch> **Files Changed:** <count>

## Summary

_Brief overview of changes and overall code quality assessment (2-3 sentences)_

## Linter Results

**Status:** Pass / Fail

_If failed, include the relevant linter errors in the Critical Issues section below_

## Issues Found

### Critical Issues

_Issues that MUST be fixed before merging:_

- Linter/build failures
- Using `process.exit()`
- Using `any` without justification
- No default exports
- Missing exports in `package.json`
- Test file that doesn't build

- [ ] **<file-path>:<line>** - <description>

### Pattern Violations

_Issues that violate codebase conventions and should be fixed before merging:_

- Type definitions in wrong place (not in `/types`)
- Internal utils exported (should stay in `utils/`)
- Strings not in `lang/en.json`
- Wrong error class used
- Missing tests for new functionality
- Try/catch in tests

- [ ] **<file-path>:<line>** - <description>

### Suggestions

_Optional improvements that would enhance code quality:_

- Variable naming could be more descriptive
- Early return opportunities
- Refactoring for readability

- **<file-path>:<line>** - <description>

## Guideline Adherence

- [x] Custom errors from `errors/`
- [x] Types in `/types`
- [x] Exports in `package.json`
- [x] No `process.exit()`
- [x] Tests use Vitest
- ...

## Files Reviewed

- `<file-path>` - <brief assessment>

## Next Steps

**Before merging:**

1. Fix all Critical Issues (blocking)
2. Fix all Pattern Violations (maintain codebase standards)
3. Consider addressing Suggestions for code quality

_Additional specific recommendations based on the issues found_
```

### 5. Important constraints

- **Linter results are included** — since `yarn lint` runs first, include those results to avoid duplicate concerns
- Focus on architectural patterns and conventions that require human judgment
- Only analyze the specific lines that changed (from git diff), not entire files
- Be specific with file paths and line numbers for all issues
- Provide examples of correct patterns when flagging issues
- If no issues found, say so clearly
- Both Critical Issues and Pattern Violations should be fixed before merging
- Suggestions are optional improvements

### 6. Completion Format

**CRITICAL**: You MUST end your response with one of these exact status lines:

```
STATUS: PASSED - No issues found
```

or

```
STATUS: FAILED - [brief summary of critical issues]
```

This status line is used by automated workflows. Do not modify this format.

**Determining Status:**

- **PASSED**: No Critical Issues AND no Pattern Violations found (Suggestions only are still PASSED)
- **FAILED**: Any Critical Issues OR Pattern Violations found

### 7. Offer to fix issues

After presenting the review report and status line, if any issues were found, ask the user:

"Would you like me to fix any of these issues? If so, please tell me which specific items you'd like me to address."

Wait for the user to specify which issues to fix before making any changes.
