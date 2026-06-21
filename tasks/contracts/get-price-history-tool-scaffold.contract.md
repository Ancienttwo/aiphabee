# Task Contract: get-price-history-tool-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-get-price-history-tool-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-get-price-history-tool
> **Last Updated**: 2026-06-21 01:52 +08
> **Notes File**:
> `tasks/notes/get-price-history-tool-scaffold.notes.md`

## Goal

Create a no-live `get_price_history` tool scaffold that returns synthetic
OHLCV/return history rows with adjustment methodology, cursor metadata, quality
state, and standard error metadata.

## Scope

- In scope:
  - `@aiphabee/market-data` package;
  - synthetic price history fixture rows;
  - `instrument_id`, `from`, `to`, `adjustment`, `fields`, `limit`, and `cursor`
    input handling;
  - OHLCV, turnover, return, and drawdown field subsets;
  - raw, split-adjusted, and total-return adjustment methodology metadata;
  - deterministic cursor pagination;
  - standard errors for unlicensed fields, quality hold, out of range, too many
    rows, not found, and invalid input;
  - `POST /tools/get-price-history` Worker route;
  - standard success/error envelope usage;
  - registry entry update for `get_price_history`;
  - repo-level market-data contract checker coverage;
  - tracker/governance updates.
- Out of scope:
  - live market data DB reads;
  - partner/vendor price rows;
  - corporate-action factor engine integration;
  - benchmark comparison execution;
  - MCP endpoint implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/get-price-history.contract.json
  - deploy/tools/get-quote-snapshot.contract.json
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/get-price-history-tool-scaffold.md
  - docs/governance/get-quote-snapshot-tool-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/market-data/**
  - packages/tool-registry/**
  - plans/plan-get-price-history-tool-scaffold.md
  - scripts/check-market-data-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/get-price-history-tool-scaffold.contract.md
  - tasks/notes/get-price-history-tool-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Known instrument_id returns synthetic price history rows with OHLCV, return, drawdown, and adjustment metadata"
    - "Field subsets return only requested price history fields"
    - "Limit/cursor pagination is deterministic"
    - "Unsupported fields or adjustments return DATA_NOT_LICENSED through the Worker route"
    - "Held price history fixtures return DATA_QUALITY_HOLD through the Worker route"
    - "Out-of-range dates return OUT_OF_RANGE through the Worker route"
    - "Over-limit requests return TOO_MANY_ROWS through the Worker route"
    - "Registry marks get_price_history as scaffold while liveDataAccess remains false"
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
    - "POST /tools/get-price-history with eq_hk_00700 returns synthetic rows"
    - "POST /tools/get-price-history with limit=2 returns nextCursor"
    - "GET /tools/runtime reports handler_ready_tool_count=5"
```

## Acceptance Notes

- This task completes a no-live `get_price_history` scaffold only.
- It does not replace partner/vendor history data, live market data rights,
  corporate-action factor generation, or benchmark comparison logic.
- Evidence/Lineage service remains unimplemented.

## Rollback Point

- Revert the commit that adds `getPriceHistory()`, the Worker
  get-price-history route, registry status update, market-data contract checker
  update, and tracker/governance changes.
