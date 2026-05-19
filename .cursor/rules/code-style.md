---
description: HubSpot Local Dev Lib Code Style Guidelines
globs: "**/*.{js,ts}"
alwaysApply: true
---

# Code Style Guidelines

Follow these guidelines when working with code in this repository:

- Use TypeScript with strict type checking
- Follow functional patterns, avoid classes where possible
- Use descriptive variable names that clearly indicate purpose
- No `any` types unless narrowly justified
- No default exports (enforced by ESLint)
- No `process.exit()` — throw errors and let consumers handle them
- No direct user prompts — return data and let the CLI prompt
- All user-facing strings in `lang/en.json` using `i18n()` with interpolation
- Throw custom errors from `errors/` (`HubSpotHttpError`, `HubSpotConfigError`,
  `FileSystemError`)
- Write tests in co-located `__tests__/` directories using Vitest
- Use single quotes, 2-space indentation, trailing commas
- Keep lines under 80 characters
- Prefer early returns for readability
- Use ESM modules
- Keep type definitions in `/types` directory
- All exports must be declared in `package.json` `exports` field
- Ask before committing or pushing changes
