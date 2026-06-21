# Notes: get-event-timeline-tool-scaffold

> **Last Updated**: 2026-06-21 18:06 +08
> **Runtime Evidence**:
> `docs/governance/get-event-timeline-tool-scaffold.md`

## Decisions

- Added `get_event_timeline` as a no-live synthetic scaffold in
  `@aiphabee/event-timeline`.
- Kept it separate from `@aiphabee/corporate-actions` because the tool combines
  announcement, market-calendar, financial-disclosure, and corporate-action
  event sources.
- Kept live event feeds, partner/vendor rows, MCP live execution, full P0 tool
  catalog closure, and frontend out of scope.

## Verification

- `npm run test -- packages/event-timeline/src/index.test.ts`
- `npm run check:event-timeline`
- `npm run check:tool-registry`
- `npm run check:tool-schemas`
- `npm run check:mcp-tool-schema-validation`
- `npm run check:mcp-tool-versioning`
- `npm run check:mcp-pagination-limits`
- `npm run check:mcp-usage-envelope`
- `npm run test:golden`
- `npm run typecheck`
- `npm run test`
- `git diff --check`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Full 16-tool P0 catalog closure remains incomplete.
- `run_event_study` remains unimplemented.
- Live event timeline reads and partner/vendor event rows are absent.
- Multilingual/newbie-professional mode surfaces remain incomplete.
- Frontend timeline rendering remains delegated outside this Codex slice.
