# Plan: Serving Result Envelope Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 18:25 +08
> **Slug**: serving-result-envelope-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/serving-result-envelope-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/serving-result-envelope-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live Serving result envelope scaffold for Sprint 1.1.
- Routing reason: Gateway decisions had read/query/SQL/execution plans, but no
  stable result payload that binds empty rows, provenance, usage, and no-live
  status for future API/MCP tool responses.
- Due diligence:
  - P1 map: `@aiphabee/data-contracts` owns shared envelopes,
    `@aiphabee/data-access-gateway` owns Gateway decisions, Worker
    `/gateway/runtime` reports runtime capabilities.
  - P2 trace: `evaluateDataAccessRequest()` -> `servingExecution` ->
    `servingResult` -> Worker `/gateway/runtime` capability.
  - P3 decision rationale: add an explicit result envelope payload while
    keeping SQL execution, live rows, partner data, and frontend out of scope.

## Workflow Inventory

- Active plan: `plans/plan-serving-result-envelope-scaffold.md`
- Task contract:
  `tasks/contracts/serving-result-envelope-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/serving-result-envelope-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/serving-result-envelope-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `DataAccessServingResult` to Gateway decisions.
- Derive result status from the execution adapter:
  `execution_blocked -> result_blocked`,
  `execution_deferred -> result_deferred`.
- Preserve shared envelope fields:
  `as_of`, `market_status`, `provenance`, and `usage`.
- Always return `rows=[]`, `rowCount=0`, `servedRows=0`, `liveDataAccess=false`,
  `liveRead=false`, and `sqlExecuted=false`.
- Expose Worker `/gateway/runtime` result-envelope capability and contract
  guard.
- Keep real Serving reads, SQL execution, billing writes, MCP/API routes, and
  frontend out of scope.

## Task Breakdown

- [x] Add Gateway `servingResult` payload and deterministic status mapping.
- [x] Cover blocked, quality-held, and deferred synthetic paths.
- [x] Expose Worker runtime capability and guard.
- [x] Update Gateway access contract.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
