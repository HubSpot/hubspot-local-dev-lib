# General Rules for @hubspot/local-dev-lib

These rules apply to ALL work in this repository. They override the managed org-wide general rules, which target HubSpot's Java/frontend stack and do not apply here.

## Stack

This is a **shared Node.js library** consumed by the HubSpot CLI and VS Code extension:

- **Language**: TypeScript (strict mode, ESM)
- **Testing**: Vitest (NOT Jest, NOT jasmine, NOT bend)
- **Package manager**: yarn (NOT npm, NOT Maven)
- **Build**: `yarn build` (NOT `mcp__devex-mcp-server__build_java`, NOT `bend`)
- **Linting**: `yarn lint` (eslint + prettier, zero warnings)
- **Formatting**: `yarn prettier:write`

Do NOT use Java, Maven, CHIRP, bend, Trellis, or other HubSpot backend/frontend platform tools in this repo.

## This is a Library, Not a CLI

This repo is consumed via `@hubspot/local-dev-lib` by the CLI and other tools. Key implications:

- No `process.exit()` — throw errors instead and let consumers handle them
- No direct user prompts — return data and let the CLI prompt
- No default exports — named exports only (enforced by ESLint `import/no-default-export`)
- All exports must be declared in `package.json` `exports` field to be consumable

## Look First, Then Build

Before creating or modifying anything, study how the codebase already does it.

### Before adding a new function

1. Check if it already exists in `lib/`, `config/`, `api/`, or `utils/`
2. Read comparable functions to understand the pattern
3. Follow the same structure exactly

### Before adding a new type

1. Check `types/` for existing type definitions
2. Follow the discriminated union pattern used for account types
3. Ensure the type is exported from the repo via `package.json` `exports`

### Before adding user-facing strings

1. All strings go in `lang/en.json` using nested keys
2. Use the `i18n()` function with `{{ variable }}` interpolation
3. Check existing keys for similar patterns

### When you find discrepancies

Stop and alert the user. Do NOT silently pick one pattern over another.

## Code Organization

- `api/` — HTTP calls to HubSpot services. Return `HubSpotPromise<T>`.
- `config/` — Config file read/write (YAML). Core account resolution logic.
- `constants/` — Shared constants
- `errors/` — Custom error classes (`HubSpotHttpError`, `HubSpotConfigError`, `FileSystemError`)
- `http/` — Axios wrapper with HubSpot auth
- `lang/` — i18n strings (`en.json`)
- `lib/` — Exported functions and modules (path, fileManager, logger, oauth, etc.). Anything exported from the repo should live here (excluding special cases like `config/`).
- `utils/` — Internal helper functions that are NOT exported from the repo
- `models/` — Business logic classes
- `types/` — TypeScript type definitions

## Error Handling

- Throw custom error classes from `errors/`, never return error objects
- Use `HubSpotHttpError` for API failures, `HubSpotConfigError` for config issues, `FileSystemError` for FS operations
- Never call `process.exit()` — that's the consumer's responsibility

## Build and Test Commands

- Build: `yarn build`
- All tests: `yarn test`
- Specific test: `yarn test <path>`
- Lint: `yarn lint`
- Format: `yarn prettier:write`
- Circular deps: `yarn circular-deps`
- Local dev (symlink): `yarn local-dev`

## After Making Code Changes

Always run these steps after modifying code:

1. `yarn prettier:write` — format all changed files
2. `yarn build` — verify TypeScript compiles
3. `yarn test <paths>` — run tests for changed files

## Code Style

- No `any` types
- No default exports
- No comments unless explicitly asked
- No classes where functions work
- Early returns for readability
- Single quotes, 2-space indent, trailing commas, 80-char lines
- NEVER use the word "comprehensive"

## What NOT to Use From Managed Rules

The following tools and patterns from the org-wide managed rules do NOT apply here:

- `mcp__devex-mcp-server__build_java` — this is a yarn/node project
- `mcp__devex-mcp-server__get_onepager` — not required before edits in this repo
- `mcp__devex-mcp-server__search_docs` — not required before edits in this repo
- `bend` tools — not applicable
- `TrellisTools` — not applicable
- CHIRP discovery tools — not applicable
- `local_build_log_analyzer` agent — use `yarn test` / `yarn build` output directly
- `build_status_reporter` agent — use `yarn test` / `yarn build` output directly
