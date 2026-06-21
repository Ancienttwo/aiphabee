# Notes: p0-tool-catalog-consistency

> **Last Updated**: 2026-06-21 18:45 +08
> **Runtime Evidence**:
> `docs/governance/p0-tool-catalog-consistency.md`

## Decisions

- Treated PRD §9.2 as the authoritative 16-tool catalog order.
- Closed the missing surface at registry/schema/MCP/agent/evidence/golden
  contract level instead of adding duplicate live execution behavior.
- Kept frontend and live tool execution out of scope per current sprint
  boundary.

## Verification

- `npm run check:p0-tool-catalog`
- `npm run check:tool-registry`
- `npm run check:tool-schemas`
- `npm run check:mcp-tool-schema-validation`
- `npm run check:mcp-tool-versioning`
- `npm run check:mcp-pagination-limits`
- `npm run check:mcp-usage-envelope`
- `npm run check:tool-enforcement`
- `npm run test:golden`
- `npm run typecheck`
- `npm run test`
- `git diff --check`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Live MCP tool execution remains disabled.
- Partner/vendor live data and production data-owner sign-off are absent.
- `run_event_study` and multilingual/newbie-professional response surfaces
  remain separate Sprint 3.1 work.
