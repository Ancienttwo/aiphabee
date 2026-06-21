# Task Contract: get-corporate-actions-tool-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-get-corporate-actions-tool-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-get-corporate-actions-tool
> **Last Updated**: 2026-06-21 02:03 +08
> **Notes File**:
> `tasks/notes/get-corporate-actions-tool-scaffold.notes.md`

## Goal

Create a no-live `get_corporate_actions` tool scaffold that returns synthetic
corporate-action timeline rows with action dates, capital terms, adjustment
impact metadata, cursor metadata, quality state, and standard error metadata.

## Scope

- In scope:
  - `@aiphabee/corporate-actions` package;
  - synthetic corporate-action fixture rows;
  - `instrument_id`, `from`, `to`, `types`, `limit`, and `cursor` input
    handling;
  - dividends, splits, consolidations, rights issues, placements, and buybacks;
  - adjustment-impact metadata for split-adjusted and total-return-adjusted
    price series;
  - deterministic cursor pagination;
  - standard errors for unlicensed action types, quality hold, out of range,
    too many rows, not found, and invalid input;
  - `POST /tools/get-corporate-actions` Worker route;
  - standard success/error envelope usage;
  - registry entry update for `get_corporate_actions`;
  - repo-level corporate-actions contract checker coverage;
  - tracker/governance updates.
- Out of scope:
  - live market data DB reads;
  - partner/vendor action rows;
  - public benchmark parity;
  - new adjustment factor generation;
  - MCP endpoint implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/get-corporate-actions.contract.json
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/get-corporate-actions-tool-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/corporate-actions/**
  - packages/tool-registry/**
  - plans/plan-get-corporate-actions-tool-scaffold.md
  - scripts/check-corporate-actions-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/get-corporate-actions-tool-scaffold.contract.md
  - tasks/notes/get-corporate-actions-tool-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Known instrument_id returns synthetic corporate action rows with date, terms, adjustment impact, and quality metadata"
    - "Type subsets return only requested action types"
    - "Limit/cursor pagination is deterministic"
    - "Unsupported action types return DATA_NOT_LICENSED through the Worker route"
    - "Held corporate action fixtures return DATA_QUALITY_HOLD through the Worker route"
    - "Out-of-range dates return OUT_OF_RANGE through the Worker route"
    - "Over-limit requests return TOO_MANY_ROWS through the Worker route"
    - "Registry marks get_corporate_actions as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP endpoint, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/corporate-actions/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:corporate-actions
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/get-corporate-actions with eq_hk_00700 returns synthetic action rows"
    - "POST /tools/get-corporate-actions with limit=2 returns nextCursor"
    - "GET /tools/runtime reports handler_ready_tool_count=6"
```

## Acceptance Notes

- This task completes a no-live `get_corporate_actions` scaffold only.
- It does not replace partner/vendor corporate-action data, live market data
  rights, public benchmark parity, or production adjustment factor generation.
- Evidence/Lineage service remains unimplemented.

## Rollback Point

- Revert the commit that adds `getCorporateActions()`, the Worker
  get-corporate-actions route, registry status update, corporate-actions
  contract checker, and tracker/governance changes.
