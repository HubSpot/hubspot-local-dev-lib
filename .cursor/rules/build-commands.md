---
description: HubSpot Local Dev Lib Build/Lint/Test Commands
alwaysApply: true
---

# Build Commands

Use these commands when working with this codebase:

- Build: `yarn build`
- Lint: `yarn lint` (eslint + prettier check)
- Format code: `yarn prettier:write`
- Run all tests: `yarn test`
- Run specific test: `yarn test lib/__tests__/specific-file.test.ts`
- Check circular dependencies: `yarn circular-deps`
- Local dev (symlink to CLI): `yarn local-dev`

Follow `AGENTS.md` for the validation scope. Ask before committing or pushing changes.
