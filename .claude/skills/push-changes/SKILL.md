---
name: ldl:push-changes
description: Run pre-commit checks, commit changes, and push to remote branch
disable-model-invocation: false
allowed-tools: Bash(git:*), Read, AskUserQuestion, Skill
argument-hint: '[commit-message]'
---

# Push Changes Workflow

Runs pre-commit validation checks, commits staged/unstaged changes, and pushes them to the remote branch. Useful for adding commits to existing PRs or preparing a branch for PR creation.

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --porcelain`
- Has uncommitted changes: !`git status --porcelain | wc -l | xargs`

## Task

When this skill is invoked:

### 1. Run pre-commit checks

Invoke the `ldl:code-check` skill and wait for its completion.

Look for the STATUS line in its output:

- If output contains "STATUS: PASSED": **IMMEDIATELY continue to Step 2 without sending any message to the user**
- If output contains "STATUS: FAILED": **STOP** and show the user the full code-check output

Do NOT proceed to Step 2 if STATUS is not PASSED. Do NOT send any acknowledgment or summary message if checks pass - just continue to Step 2.

### 2. Atomic commit and push

**CRITICAL**: After checks pass in Step 1, you MUST complete ALL of the following in a SINGLE message with multiple tool calls.

Before executing any tool calls, analyze the context gathered above:

1. Verify current branch is not main/master
   - If branch is "main" or "master": STOP and tell user: "You're currently on the main branch. Please create a feature branch first using `git checkout -b <branch-name>`"
2. Check if there are uncommitted changes (from context above)
   - If no uncommitted changes: Skip commit, proceed to push only
3. Analyze changed files for safety issues:
   - **Generated files**: `.d.ts`, `*.map`, `dist/*`, `build/*`, `target/*`, `__generated__/*`
   - **Config files**: `.env`, `*.local`, `.DS_Store`, `node_modules/*`
   - **Build artifacts**: `*.log`, `*.tmp`, `*.cache`
   - **Large number of files**: More than 20 changed files
   - If unusual files detected: Use AskUserQuestion to confirm before proceeding
   - If user declines: STOP and tell them to manually stage files

After analysis, execute in ONE message:

1. Stage changes: `git add .` (if there are uncommitted changes)
2. Create commit (if there are uncommitted changes):
   - If an argument was provided to this skill: use that as the commit message (it should already follow Conventional Commits)
   - Otherwise: generate a commit message following Conventional Commits format based on the changes
   - Format: `<type>: <short description>` (e.g., `feat: add config resolution util`, `fix: handle missing exports field`)
   - Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`, `ci`, `build`
   - Commit messages MUST follow Conventional Commits format
3. Push to remote:
   - Check if upstream exists: `git rev-parse --abbrev-ref @{u} 2>&1`
   - If no upstream: `git push -u origin <branch-name>`
   - If upstream exists: `git push`
4. Verify: `git status`

You have the capability to call multiple tools in a single response. Execute ALL of the above git operations in ONE message using parallel tool calls where possible. Do not send any intermediate messages. Do not send any text before the tool calls. Do not report progress during execution.

After ALL tool calls complete, then display the completion message:

```
✓ All pre-commit checks passed
✓ Changes committed
✓ Branch pushed to remote

Your changes are now on the remote branch.
```

If there were no uncommitted changes but the branch was pushed:

```
✓ All pre-commit checks passed
✓ No new changes to commit
✓ Branch pushed to remote

Your changes are now on the remote branch.
```

## Important Constraints

- **All checks must pass**: Pre-commit checks must complete successfully before proceeding
- **Never commit to main/master**: Always verify branch name first
- **No force pushes**: Use regular `git push` unless it's a new branch
- **Atomic commits**: Include all changes in a single commit
- **Single-message execution**: Step 2 MUST be completed in a single message with all git operations
- **No intermediate messages**: Do NOT split Step 2 into multiple messages or send progress updates
- **Fail gracefully**: If any step fails (checks, commit, push), report the error clearly and stop

## Error Handling

- **Pre-commit check failures**: Stop immediately and inform user. They must resolve issues before re-running
- **On main/master branch**: Stop and instruct user to create a feature branch
- **Unusual files detected**: Show file list, warn about potential issues, ask for confirmation. If user declines, stop and tell them to manually stage files using `git add <file>`
- **Git push failure**: Display the error and suggest solutions (e.g., pull first if behind remote)
- **No changes and branch not ahead**: Display message that there's nothing to push

## Examples

### Example 1: Push changes with custom message

```
/push-changes "Fix linting errors"
```

→ Commits with that message and pushes to remote

### Example 2: Push changes without arguments

```
/push-changes
```

→ Generates commit message from changes and pushes to remote

### Example 3: No changes to commit

```
/push-changes
```

→ Displays "No uncommitted changes" but still pushes if branch is ahead of remote
