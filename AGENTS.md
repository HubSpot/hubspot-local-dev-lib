# HubSpot Local Dev Lib Agent Instructions

This repository is `@hubspot/local-dev-lib` — a shared TypeScript library that
provides core functionality for HubSpot local development tooling. It is
consumed by the HubSpot CLI and VS Code extension.

## Stack

- Language: TypeScript in strict mode, ESM modules
- Testing: Vitest (not Jest, not jasmine)
- Package manager: Yarn
- Build: `yarn build`
- Lint: `yarn lint`
- Format: `yarn prettier:write`

Do not use Java, Maven, CHIRP, Bend, Trellis, or HubSpot backend/frontend
platform workflows for normal work in this repo.

## This is a Library, Not a CLI

This repo is consumed via `@hubspot/local-dev-lib` by the CLI and other tools.
Key implications:

- No `process.exit()` — throw errors and let consumers handle them.
- No direct user prompts — return data and let the CLI prompt.
- No default exports — named exports only (enforced by ESLint).
- All exports must be declared in `package.json` `exports` field.

Key consumers:

- `hubspot-cli` — the primary consumer
- VS Code extension — uses config and API functions

Changes here affect all consumers. Be careful with breaking changes to exported
function signatures.

## Start Here

Before creating or modifying code, study how the repo already does the same
kind of work.

- Search for similar files and read at least two comparable examples before
  adding a new file.
- Check `lib/`, `config/`, `api/`, or `utils/` before adding a new function.
- Check `types/` before adding a new shared type.
- Follow the discriminated union pattern used for account types.
- Check `lang/en.json` before adding user-facing strings. Use the `i18n()`
  function with `{{ variable }}` interpolation.
- If existing implementations disagree in a meaningful way, stop and surface
  the discrepancy instead of silently choosing one pattern.

## Code Organization

- `api/` — HTTP calls to HubSpot services. Return `HubSpotPromise<T>`.
- `config/` — Config file read/write (YAML). Core account resolution logic.
- `constants/` — Shared constants.
- `errors/` — Custom error classes (`HubSpotHttpError`, `HubSpotConfigError`,
  `FileSystemError`).
- `http/` — Axios wrapper with HubSpot auth.
- `lang/` — i18n strings (`en.json`).
- `lib/` — Exported functions and modules. Anything exported from the repo
  should live here (excluding special cases like `config/`).
- `utils/` — Internal helper functions that are NOT exported.
- `models/` — Business logic classes.
- `types/` — TypeScript type definitions.

## Error Handling

- Throw custom error classes from `errors/`, never return error objects.
- Use `HubSpotHttpError` for API failures, `HubSpotConfigError` for config
  issues, `FileSystemError` for FS operations.
- Never call `process.exit()` — that is the consumer's responsibility.

## Code Style

- Prefer functions over classes.
- Use early returns to keep control flow readable.
- Use descriptive variable names.
- Do not introduce `any` unless there is a narrow, well-justified reason.
- Do not add comments unless the code would otherwise be hard to follow.
- Follow the repo formatter for single quotes, 2-space indentation, trailing
  commas, and 80-character line length.
- Do not use the word `comprehensive` in repo copy or generated docs.

## Tests

- Tests live in co-located `__tests__/` directories.
- Test files are named `<source-file>.test.ts`.
- Use Vitest globals and existing mocks.
- No try/catch blocks in tests — use `expect().toThrow()`.
- All cleanup in `afterEach()` using `vi.restoreAllMocks()`.
- Never skip tests — fix or remove them.

## Validation

After code changes, run the smallest useful validation set:

1. `yarn prettier:write`
2. `yarn build`
3. `yarn test <path>` for changed or closely related tests

Run broader checks when the change touches shared behavior or foundational
modules.

Additional checks:

- Circular deps: `yarn circular-deps`

## Testing Changes Against the CLI

### Option 1: Local linking (for active development)

1. In this repo: `yarn local-dev` — builds, runs `yarn link`, and watches for
   changes.
2. In CLI: `yarn local-link` — interactive prompt to symlink local packages.
3. Changes here are reflected in the CLI after `yarn build`.

To stop: run `yarn unlink` here, then `yarn install --force` in CLI.

### Option 2: Experimental NPM release (for CI testing or sharing)

1. In this repo: `yarn release -v=prerelease -t=experimental`
2. In CLI: update `package.json` to the experimental version and run
   `yarn install --force`.

## Git And PR Workflow

- Use Conventional Commits for all commit messages and PR titles. Format:
  `<type>: <short description>`. Types: `feat`, `fix`, `chore`, `refactor`,
  `test`, `docs`, `perf`, `ci`, `build`.
- Do not amend commits on an existing PR unless the user explicitly asks for an
  amend, rebase, squash, or history rewrite.
- When addressing review feedback on a PR, create a new follow-up commit by
  default.
- For stacked PRs, prefer merging parent branch updates into the child branch
  over rebasing, because PRs are squash-merged into `main`.
- Ask before committing, pushing, force-pushing, creating PRs, posting comments,
  merging, closing, or otherwise mutating GitHub state.

## Shared Skills

Portable project skills are exposed under `.agents/skills/`. When a task
matches one of these workflows, read that skill before proceeding:

- `code-check`: review branch changes against repo conventions.
- `push-changes`: run pre-commit checks, commit, and push to remote.
- `create-pull-request`: commit, push, and create a draft PR.

Claude-specific skills and orchestration workflows may still live only under
`.claude/skills/`.

## Agent-Specific Config

`AGENTS.md` is the canonical behavioral entry point. Agent-specific permission
or runtime configuration should stay in that agent's own local config, such as
`.claude/settings.local.json` for Claude or `.codex/rules/*.rules` for Codex
command execution policy. Do not duplicate behavioral rules into permission
files.
