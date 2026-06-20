# Task Contract: get-market-calendar-tool-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-get-market-calendar-tool-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-get-market-calendar-tool
> **Last Updated**: 2026-06-21 01:10 +08
> **Notes File**:
> `tasks/notes/get-market-calendar-tool-scaffold.notes.md`

## Goal

Create a no-live `get_market_calendar` tool scaffold that returns synthetic
trading day, half-day, weather closure, holiday closure, and weekend closure
sessions for stable market/date-range inputs.

## Scope

- In scope:
  - `@aiphabee/market-calendar` package;
  - HK synthetic market calendar fixture rows;
  - `market`, `from`, and `to` input validation;
  - trading day, half-day, weather closure, holiday, and weekend sessions;
  - `POST /tools/get-market-calendar` Worker route;
  - standard success/error envelope usage;
  - registry entry update for `get_market_calendar`;
  - repo-level market-calendar contract checker;
  - tracker/governance updates.
- Out of scope:
  - live exchange calendar DB reads;
  - partner market data rows;
  - MCP endpoint implementation;
  - quote/history tool execution;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/get-market-calendar.contract.json
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/get-market-calendar-tool-scaffold.md
  - docs/governance/get-security-profile-tool-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/resolve-security-tool-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/market-calendar/**
  - packages/tool-registry/**
  - plans/plan-get-market-calendar-tool-scaffold.md
  - scripts/check-market-calendar-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/get-market-calendar-tool-scaffold.contract.md
  - tasks/contracts/get-security-profile-tool-scaffold.contract.md
  - tasks/notes/get-market-calendar-tool-scaffold.notes.md
  - tasks/notes/shared-tool-registry-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "HK date range returns synthetic trading day and half-day sessions"
    - "Weather closure, holiday closure, and weekend closure sessions are covered by fixtures"
    - "Unsupported market returns NOT_FOUND through the Worker route"
    - "Out-of-coverage date range returns OUT_OF_RANGE through the Worker route"
    - "Invalid date range returns SCOPE_DENIED through the Worker route"
    - "Registry marks get_market_calendar as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP endpoint, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/market-calendar/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:market-calendar
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/get-market-calendar with HK 2026-01-05..2026-01-07 returns trading_day/trading_day/half_day"
    - "POST /tools/get-market-calendar with HK 2026-01-08..2026-01-10 returns weather/holiday/weekend closures"
    - "GET /tools/runtime reports get_market_calendar handlerReady=true"
```

## Acceptance Notes

- This task completes a no-live `get_market_calendar` scaffold only.
- It does not replace exchange-approved market calendars or live database
  reads.
- Quote/history tools remain unimplemented.

## Rollback Point

- Revert the commit that adds `@aiphabee/market-calendar`, the Worker
  get-market-calendar route, registry status update, contract checker, and
  tracker update.
