# Task Contract: get-event-timeline-tool-scaffold

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint31-get-event-timeline-tool
> **Last Updated**: 2026-06-21 18:06 +08
> **Notes File**:
> `tasks/notes/get-event-timeline-tool-scaffold.notes.md`

## Goal

Create a no-live `get_event_timeline` tool scaffold that returns synthetic
company and market timeline events with source records and related data links.

## Scope

- In scope:
  - `@aiphabee/event-timeline` package;
  - synthetic announcement, market-event, financial-disclosure, and
    corporate-action event rows;
  - `instrument_id`, `from`, `to`, `types`, `limit`, and `cursor` input
    handling;
  - source record and related data link requirements;
  - deterministic cursor pagination;
  - standard errors for unlicensed types, quality hold, out of range, too many
    rows, not found, and invalid input;
  - `POST /tools/get-event-timeline` Worker route;
  - registry, schema, MCP validation/versioning/pagination/usage, golden
    fixture, tracker, and governance updates.
- Out of scope:
  - full 16-tool P0 catalog closure;
  - live event feed or partner/vendor rows;
  - `run_event_study`;
  - frontend.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Known instrument_id returns company and market timeline rows"
    - "Every event exposes sourceRecordId and relatedData source links"
    - "Type subset and cursor pagination are deterministic"
    - "Unsupported event types return DATA_NOT_LICENSED through the Worker route"
    - "Held fixtures return DATA_QUALITY_HOLD through the Worker route"
    - "Out-of-range dates return OUT_OF_RANGE through the Worker route"
    - "Over-limit requests return TOO_MANY_ROWS through the Worker route"
    - "Registry marks get_event_timeline as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP live execution, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/event-timeline/src/index.test.ts
    - npm run check:event-timeline
    - npm run check:tool-registry
    - npm run check:tool-schemas
    - npm run check:mcp-tool-schema-validation
    - npm run check:mcp-tool-versioning
    - npm run check:mcp-pagination-limits
    - npm run check:mcp-usage-envelope
    - npm run test:golden
    - npm run typecheck
    - npm run test
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/get-event-timeline with eq_hk_00700 returns synthetic event rows"
    - "GET /tools/runtime reports handler_ready_tool_count=10"
```

## Acceptance Notes

- This task completes the `get_event_timeline` no-live scaffold only.
- It does not complete the full P0 tool catalog, event study, multilingual
  surfaces, live partner data, or frontend timeline UI.

## Rollback Point

- Revert the commit that adds `getEventTimeline()`, the Worker
  get-event-timeline route, registry/schema/MCP/golden updates, and
  tracker/governance changes.
