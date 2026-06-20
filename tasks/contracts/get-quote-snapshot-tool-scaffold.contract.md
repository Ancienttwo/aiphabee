# Task Contract: get-quote-snapshot-tool-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-get-quote-snapshot-tool-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-get-quote-snapshot-tool
> **Last Updated**: 2026-06-21 01:42 +08
> **Notes File**:
> `tasks/notes/get-quote-snapshot-tool-scaffold.notes.md`

## Goal

Create a no-live `get_quote_snapshot` tool scaffold that returns synthetic
delayed/close quote snapshots with price, volume, delay, market status,
quality, and standard error metadata.

## Scope

- In scope:
  - `@aiphabee/market-data` package;
  - synthetic quote snapshot fixture rows;
  - `instrument_id`, `fields`, `mode`, and `as_of` input handling;
  - delayed and close snapshot modes;
  - quote field subsets;
  - standard errors for unlicensed fields, quality hold, point-in-time
    unavailable, not found, and invalid input;
  - `POST /tools/get-quote-snapshot` Worker route;
  - standard success/error envelope usage;
  - registry entry update for `get_quote_snapshot`;
  - repo-level market-data contract checker;
  - tracker/governance updates.
- Out of scope:
  - live market data DB reads;
  - partner/vendor quote rows;
  - real-time bid/ask access;
  - price history execution;
  - MCP endpoint implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/get-quote-snapshot.contract.json
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/get-market-calendar-tool-scaffold.md
  - docs/governance/get-quote-snapshot-tool-scaffold.md
  - docs/governance/get-security-profile-tool-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/resolve-security-tool-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/market-data/**
  - packages/tool-registry/**
  - plans/plan-get-quote-snapshot-tool-scaffold.md
  - scripts/check-market-data-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/get-market-calendar-tool-scaffold.contract.md
  - tasks/contracts/get-quote-snapshot-tool-scaffold.contract.md
  - tasks/notes/get-quote-snapshot-tool-scaffold.notes.md
  - tasks/notes/shared-tool-registry-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Known instrument_id returns synthetic delayed quote snapshot with price, volume, delay, and quality metadata"
    - "Close mode returns close snapshot with close delay metadata"
    - "Unsupported quote fields return DATA_NOT_LICENSED through the Worker route"
    - "Held quote fixtures return DATA_QUALITY_HOLD through the Worker route"
    - "Unavailable as_of returns POINT_IN_TIME_UNAVAILABLE through the Worker route"
    - "Registry marks get_quote_snapshot as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP endpoint, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/market-data/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:market-data
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/get-quote-snapshot with eq_hk_00700 returns delayed snapshot"
    - "POST /tools/get-quote-snapshot with eq_hk_00700 and mode=close returns close snapshot"
    - "GET /tools/runtime reports handler_ready_tool_count=4"
```

## Acceptance Notes

- This task completes a no-live `get_quote_snapshot` scaffold only.
- It does not replace partner/vendor quote data, live market data rights, or
  real-time bid/ask access.
- Price history remains unimplemented.

## Rollback Point

- Revert the commit that adds `@aiphabee/market-data`, the Worker
  get-quote-snapshot route, registry status update, contract checker, and
  tracker update.
