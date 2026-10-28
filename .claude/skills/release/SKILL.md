---
name: ldl:release
description: Release @hubspot/local-dev-lib to npm. Use when asked to "release", "cut a release", "publish a beta/next/latest/experimental version", or "release a minor to next".
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(yarn release:*), Bash(npm view:*), Bash(gh pr view:*), Read, AskUserQuestion
argument-hint: '[increment] [tag]'
---

# Release Workflow

Releases go through `yarn release`. Always pass `-y` so the script does not prompt.

## Context

- Current branch: !`git branch --show-current`
- Uncommitted changes: !`git status --porcelain | wc -l | xargs`
- Local version: !`node -p "require('./package.json').version"`
- Published dist-tags: !`npm view @hubspot/local-dev-lib dist-tags --json 2>/dev/null`

## How releases work

| Tag | What `yarn release` does | Who publishes |
| --- | --- | --- |
| `next` | Bumps to `X.Y.Z-beta.N`, commits, pushes a `vX-publish` branch, opens a PR | CI, when the PR merges |
| `latest` | Bumps to `X.Y.Z`, commits, pushes a `vX-publish` branch, opens a PR | CI, when the PR merges |
| `experimental` | Bumps to `X.Y.Z-experimental.N`, builds, and publishes from the local machine | The local machine, immediately |

`latest` and `next` must be run from an up-to-date `main`. `experimental` must be run from a feature branch.

## Mapping a request to a command

Build `yarn release -v <increment> -t <tag> -y`.

- **Tag:** "beta" or "next" → `next`. "stable", "latest", or "prod" → `latest`. "experimental" or "test build of my branch" → `experimental`.
- **Increment:** `patch`, `minor`, or `major` as stated.
  - Another beta of a version already on `next` (local version is already `-beta.N`) → `prerelease`.
  - `experimental` always uses `prerelease`.
  - Promoting the current beta to `latest` → use the same increment the beta was cut with. For example, `5.15.0-beta.2` was a `minor` beta, so `-v minor -t latest` releases `5.15.0`.
- If the tag or increment is ambiguous, ask the user. Don't guess.

Examples:

- "release a minor release to next" → `yarn release -v minor -t next -y`
- "another beta" → `yarn release -v prerelease -t next -y`
- "ship the beta to latest" (local is `5.15.0-beta.1`) → `yarn release -v minor -t latest -y`
- "experimental build of this branch" → `yarn release -v prerelease -t experimental -y`

## Steps

1. Check the context above:
   - For `latest` or `next`, the branch must be `main`. Run `git pull` first.
   - For `experimental`, the branch must not be `main`.
   - The working tree must be clean. Stop and tell the user if it isn't, because the script runs `git checkout .` during cleanup.
2. Run the command with `-d` (dry run) first and show the user the version it computes.
3. Ask the user to confirm the version and tag. This step pushes a branch and opens a PR (`latest`/`next`) or publishes to npm (`experimental`), so it needs explicit approval.
4. Run the same command without `-d`.
5. Report the result:
   - `latest`/`next`: the PR URL. Explain that merging it publishes from the `Release` GitHub Action.
   - `experimental`: the published version, plus the install line `yarn add @hubspot/local-dev-lib@<version>`.

## If it fails

The script prints an actionable error and returns you to your original branch. Relay the error to the user rather than retrying with `--skipBranchValidation` or `--skipVersionCheck`. Those flags exist for humans recovering from a broken release.
