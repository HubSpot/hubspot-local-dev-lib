---
name: ldl:release
description: Release @hubspot/local-dev-lib to npm. Use when asked to "release", "cut a release", "publish a beta/next/latest/experimental version", or "release a minor to next".
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(yarn release:*), Bash(yarn beta-release:*), Bash(yarn experimental-release:*), Bash(npm view:*), Bash(gh pr view:*), Bash(gh run view:*), Read, AskUserQuestion
argument-hint: '[latest|beta|experimental] [increment]'
---

# Release Workflow

Always pass `-y` so the script doesn't prompt.

## Context

- Current branch: !`git branch --show-current`
- Uncommitted changes: !`git status --porcelain | wc -l | xargs`
- Local version: !`node -p "require('./package.json').version"`
- Published dist-tags: !`npm view @hubspot/local-dev-lib dist-tags --json 2>/dev/null`

## How releases work

| Command | npm tag | What it does | Who publishes |
| --- | --- | --- | --- |
| `yarn release -v <increment>` | `latest` | Bumps to `X.Y.Z`, commits, pushes a `vX-publish` branch, opens a PR | CI, when the PR merges |
| `yarn beta-release -v <increment>` | `next` | Bumps to `X.Y.Z-beta.N`, commits, pushes a `vX-publish` branch, opens a PR | CI, when the PR merges |
| `yarn experimental-release` | `experimental` | Starts the `Experimental Release` workflow for the current pushed branch and waits for it. Nothing is committed. | CI, immediately |

- `release` and `beta-release` must be run from an up-to-date `main`.
- `experimental-release` must be run from a feature branch that is pushed, with local HEAD matching the remote. It takes no increment. The version is `<current latest>-experimental.N`, where N is one more than the highest already published for that `latest`.
- None of these need an npm login. You only need the `gh` CLI logged in.

## Mapping a request to a command

- "stable", "latest", "prod", or plain "release" → `yarn release -v <increment> -y`
- "beta" or "next" → `yarn beta-release -v <increment> -y`
- "experimental" or "test build of my branch" → `yarn experimental-release -y`

Increment, for `release` and `beta-release` only:

- Use `patch`, `minor`, or `major` as stated.
- Another beta of a version already on `next` (local version is already `-beta.N`) → `beta-release -v prerelease`.
- Promoting the current beta to `latest` → use the same increment the beta was cut with. For example, `5.15.0-beta.2` was a `minor` beta, so `yarn release -v minor` releases `5.15.0`.
- If the increment is ambiguous, ask the user. Don't guess. Without `-v`, `-y` makes the script fail rather than prompt.

Examples:

- "release a minor release to next" → `yarn beta-release -v minor -y`
- "another beta" → `yarn beta-release -v prerelease -y`
- "ship the beta to latest" (local is `5.15.0-beta.1`) → `yarn release -v minor -y`
- "experimental build of this branch" → `yarn experimental-release -y`

## Steps

1. Check the context above:
   - For `release` or `beta-release`, the branch must be `main`. Run `git pull` first.
   - For `experimental-release`, the branch must not be `main`, and it must be pushed (`git push`).
   - The working tree must be clean. Stop and tell the user if it isn't.
2. Run the command with `-d` (dry run) first and show the user the version it computes.
3. Ask the user to confirm the version. The real run pushes a branch and opens a PR (`release`/`beta-release`) or publishes to npm (`experimental-release`), so it needs explicit approval.
4. Run the same command without `-d`.
5. Report the result:
   - `release`/`beta-release`: the PR URL. Explain that merging it publishes from the `Release` GitHub Action.
   - `experimental-release`: the published version and the install line `yarn add @hubspot/local-dev-lib@<version>`. If the workflow fails, give the user the run URL the script prints.

## If it fails

The script prints an actionable error and returns you to your original branch. Relay the error to the user rather than retrying with `--skipBranchValidation` or `--skipVersionCheck`. Those flags exist for humans recovering from a broken release.
