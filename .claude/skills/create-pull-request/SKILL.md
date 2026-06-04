---
name: ldl:create-pull-request
description: Commit changes and create a draft pull request. Trigger on "create a pull request", "create a PR", "open a PR", "make a PR".
disable-model-invocation: true
allowed-tools: Bash(git:*, gh:*), Read, Write, Edit, Skill, AskUserQuestion
argument-hint: '[pr-title]'
---

# Create Pull Request Workflow

Orchestration skill that commits changes and creates a draft pull request following team standards.

## Context

- Current branch: !`git branch --show-current`
- Latest commit: !`git log -1 --oneline`
- Diff summary: !`git diff --stat origin/main...HEAD 2>/dev/null || git diff --stat main...HEAD 2>/dev/null || echo "No diff available"`

## Task

When this skill is invoked:

### 1. Commit and push changes

Invoke the `ldl:push-changes` skill with any arguments passed to this skill.

Wait for completion. Look for the completion message:

- If output contains "Branch pushed to remote": **IMMEDIATELY continue to Step 2 without sending any message**
- If output contains error or failure: **STOP** and show the user the full output

Do NOT send any acknowledgment message if push-changes succeeds - just continue to Step 2.

### 2. Create pull request

**CRITICAL**: You MUST complete PR creation in a SINGLE message. PRs are ALWAYS created in draft mode.

In ONE message:

1. Analyze the context gathered above (diff summary, commit messages) to generate PR content
2. Determine PR title:
   - If an argument was provided to this skill: use that as the title (it should already follow Conventional Commits)
   - Otherwise: generate a title following Conventional Commits format based on the changes
   - Format: `<type>: <short description>` (e.g., `feat: add config resolution util`, `fix: handle missing exports field`)
   - Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`, `ci`, `build`
3. Generate PR body using this template:

```
## Description and Context
[Brief description of what changed and WHY — 2-3 sentences. The diff shows the "what", so focus on the motivation and context behind the change.]

## Pre-review checklist
- [ ] The `/ldl:code-check` skill has been run and the feedback has been addressed
- [ ] Tests have been added for new behaviors
- [ ] Manually tested the changes

## Screenshots
[Add screenshots here if applicable, otherwise remove this section]

## TODO
[Any remaining work or follow-ups, otherwise remove this section]

## Who to Notify
@brandenrodgers @camden11 @joe-yeager @chiragchadha1
```

4. Create the PR: `gh pr create --draft --title "..." --body "..."`
5. Display completion message with PR URL

You have the capability to call multiple tools in a single response. Complete the analysis and PR creation in ONE message. Do not send intermediate messages like "Analyzing changes..." or "Creating PR...". Do not send any text before the tool calls.

After PR creation completes, display:

```
✓ Pull request created in draft mode: [URL]

Your PR is ready for you to review. Mark it as ready when you're done!
```

## Important Constraints

- **Always draft mode**: PRs are ALWAYS created with `--draft`. Never create a non-draft PR.
- **Conventional Commits**: PR titles MUST follow Conventional Commits format (`<type>: <description>`).
- **Descriptive PR content**: Generate meaningful descriptions based on actual changes. Focus on the WHY, not the WHAT.
- **Single-message execution**: Step 2 MUST be completed in a single message
- **No intermediate messages**: Do NOT send progress updates during PR creation
- **Fail gracefully**: If any step fails (push-changes, PR creation), report the error clearly and stop
- **Orchestration only**: This skill orchestrates the workflow — push-changes handles commit/push, this skill focuses on PR creation

## Error Handling

- **Push-changes failures**: If the push-changes skill fails (check failures, main branch, unusual files, push errors), stop and inform the user. They must resolve issues before re-running
- **PR creation failure**: Display the error (e.g., PR already exists, invalid title)

## Examples

### Example 1: Simple usage with title

```
/create-pull-request "feat: add config resolution util"
```

→ Calls push-changes (runs checks, commits, pushes) → creates draft PR

### Example 2: Usage without arguments

```
/create-pull-request
```

→ Calls push-changes (runs checks, generates commit message, pushes) → creates draft PR with Conventional Commits title

### Example 3: Failed check scenario

```
/create-pull-request
```

→ Calls push-changes → code-check fails with issues → **STOPS**

User then fixes issues or asks Claude to fix them, then re-runs:

```
/create-pull-request
```

→ Calls push-changes → all checks pass → proceeds with commit, push, and draft PR creation
