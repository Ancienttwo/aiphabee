# Task Contract: serving-result-envelope-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-serving-result-envelope-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-serving-result-envelope
> **Last Updated**: 2026-06-20 18:25 +08
> **Notes File**:
> `tasks/notes/serving-result-envelope-scaffold.notes.md`

## Goal

Create a no-live Serving result envelope scaffold that turns Gateway execution
plans into a stable empty-row result payload with provenance and usage metadata.

## Scope

- In scope:
  - Data Access Gateway `servingResult` decision payload;
  - blocked/deferred result status mapping;
  - standard envelope field declaration;
  - empty row result shape;
  - Worker `/gateway/runtime` result-envelope capability;
  - Gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - SQL execution;
  - Hyperdrive/Supabase reads;
  - partner market data rows;
  - persistent usage writes or billing reconciliation;
  - MCP/API tool route implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/gateway/access.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/serving-execution-adapter-scaffold.md
  - docs/governance/serving-result-envelope-scaffold.md
  - packages/data-access-gateway/**
  - plans/plan-serving-result-envelope-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/serving-result-envelope-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/serving-execution-adapter-scaffold.notes.md
  - tasks/notes/serving-result-envelope-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Gateway decisions include servingResult"
    - "Blocked execution maps to result_blocked"
    - "Deferred execution maps to result_deferred"
    - "Result envelope declares as_of, market_status, provenance, and usage"
    - "Result payload always returns rows=[], rowCount=0, servedRows=0, liveDataAccess=false, liveRead=false, and sqlExecuted=false"
    - "Runtime reports serving_result_envelope_scaffold"
    - "No SQL execution, Hyperdrive reads, market data rows, provider secrets, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns guards including serving_result_envelope_scaffold"
    - "GET /gateway/runtime returns serving_result_envelope.shared_envelope=true"
    - "GET /gateway/runtime returns serving_result_envelope.rows_returned=false"
```

## Acceptance Notes

- This task completes a no-live result envelope scaffold only.
- It does not prove that every future tool has adopted the envelope.
- Real Serving reads, API/MCP tool routes, persistent billing writes, and
  partner rows remain future work.

## Rollback Point

- Revert the commit that adds `servingResult`, runtime capability, contract
  guard, and tracker update.
