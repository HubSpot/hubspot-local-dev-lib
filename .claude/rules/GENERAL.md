# Claude-Specific Rules for @hubspot/local-dev-lib

These rules apply to Claude Code sessions in this repository. They supplement the shared agent instructions in `AGENTS.md`.

## What NOT to Use From Managed Rules

The following tools and patterns from the org-wide managed rules do NOT apply here. This is a Yarn/Node.js library — not a Java backend or frontend app:

- `mcp__devex-mcp-server__build_java` — this is a yarn/node project
- `mcp__devex-mcp-server__get_onepager` — not required before edits in this repo
- `mcp__devex-mcp-server__search_docs` — not required before edits in this repo
- `bend` tools — not applicable
- `TrellisTools` — not applicable
- CHIRP discovery tools — not applicable
- `local_build_log_analyzer` agent — use `yarn test` / `yarn build` output directly
- `build_status_reporter` agent — use `yarn test` / `yarn build` output directly
