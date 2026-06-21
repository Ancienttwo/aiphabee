# Task Contract: get-financial-facts-tool-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-get-financial-facts-tool-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-get-financial-facts-tool
> **Last Updated**: 2026-06-21 02:15 +08
> **Notes File**:
> `tasks/notes/get-financial-facts-tool-scaffold.notes.md`

## Goal

Create a no-live `get_financial_facts` tool scaffold that returns synthetic
standardized financial fact rows with period, currency, unit, statement type,
restatement version, point-in-time selection, and standard error metadata.

## Scope

- In scope:
  - `@aiphabee/financial-facts` package;
  - synthetic standardized financial fact fixture rows;
  - `instrument_id`, `from`, `to`, `statement_types`, `metrics`, `as_of`,
    `limit`, and `cursor` input handling;
  - income statement, balance sheet, and cash flow facts;
  - metric and statement-type subsets;
  - point-in-time visibility and restatement version metadata;
  - deterministic cursor pagination;
  - standard errors for unlicensed metrics/types, quality hold,
    point-in-time unavailable, out of range, too many rows, not found, and
    invalid input;
  - `POST /tools/get-financial-facts` Worker route;
  - standard success/error envelope usage;
  - registry entry update for `get_financial_facts`;
  - repo-level financial-facts contract checker coverage;
  - tracker/governance updates.
- Out of scope:
  - live financial fact DB reads;
  - partner/vendor fact rows;
  - full ratio/derived metric calculations;
  - document extraction or filing ingestion;
  - MCP endpoint implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/get-financial-facts.contract.json
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/get-financial-facts-tool-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/financial-facts/**
  - packages/tool-registry/**
  - plans/plan-get-financial-facts-tool-scaffold.md
  - scripts/check-financial-facts-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/get-financial-facts-tool-scaffold.contract.md
  - tasks/notes/get-financial-facts-tool-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Known instrument_id returns synthetic financial fact rows with period, currency, unit, accounting standard, scale, and restatement version metadata"
    - "Metric and statement-type subsets return only requested fact rows"
    - "Limit/cursor pagination is deterministic"
    - "Unsupported metrics or statement types return DATA_NOT_LICENSED through the Worker route"
    - "Held financial fact fixtures return DATA_QUALITY_HOLD through the Worker route"
    - "Unavailable as_of returns POINT_IN_TIME_UNAVAILABLE through the Worker route"
    - "Out-of-range dates return OUT_OF_RANGE through the Worker route"
    - "Over-limit requests return TOO_MANY_ROWS through the Worker route"
    - "Registry marks get_financial_facts as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP endpoint, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/financial-facts/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:financial-facts
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/get-financial-facts with eq_hk_00700 returns synthetic fact rows"
    - "POST /tools/get-financial-facts with a stale as_of returns POINT_IN_TIME_UNAVAILABLE"
    - "GET /tools/runtime reports handler_ready_tool_count=7"
```

## Acceptance Notes

- This task completes a no-live `get_financial_facts` scaffold only.
- It does not replace partner/vendor financial facts, live DB reads, filing
  ingestion, or derived ratio tooling.
- Evidence/Lineage service remains unimplemented.
- Verification completed through package/registry/Worker tests, repo checks,
  Worker smoke, and strict workflow check.

## Rollback Point

- Revert the commit that adds `getFinancialFacts()`, the Worker
  get-financial-facts route, registry status update, financial-facts contract
  checker, and tracker/governance changes.
