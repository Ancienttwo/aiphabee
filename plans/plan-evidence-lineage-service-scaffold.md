# Plan: Evidence Lineage Service Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 02:54 +08
> **Slug**: evidence-lineage-service-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/evidence-lineage-service-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/evidence-lineage-service-scaffold.notes.md`

## Agentic Routing

- Selected route: no-write Evidence/Lineage service planner for Sprint 1.2.
- Routing reason: all 9 registered tools, schema contracts, and synthetic golden
  fixtures now exist; the remaining Sprint 1.2 gap is a service-level contract
  that can link a tool call to source records, data version, methodology, and a
  user-visible citation without enabling live writes.
- Due diligence:
  - P1 map: `@aiphabee/evidence-lineage`, Worker `/evidence/runtime`, Worker
    `/evidence/records/plan`, `deploy/evidence/service.contract.json`,
    `aiphabee_core.evidence_record`, `aiphabee_core.evidence_source_ref`, and
    `aiphabee_governance.evidence_lineage_service_contract`.
  - P2 trace: tool execution metadata and source records -> no-write evidence
    planner -> stable evidence record ID -> source ref plans -> user-visible
    citation -> standard response envelope.
  - P3 decision rationale: add durable schema and a no-write planner before
    enabling DB writes, partner source rows, MCP protocol integration, or
    frontend citation cards.

## Workflow Inventory

- Active plan: `plans/plan-evidence-lineage-service-scaffold.md`
- Task contract:
  `tasks/contracts/evidence-lineage-service-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/evidence-lineage-service-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/evidence-lineage-service-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extend `@aiphabee/evidence-lineage` with `createEvidenceRecordPlan()` and
  `getEvidenceServiceCapabilities()`.
- Add Worker routes:
  - `GET /evidence/runtime`
  - `POST /evidence/records/plan`
- Add empty Supabase schema scaffolds:
  - `aiphabee_core.evidence_record`
  - `aiphabee_core.evidence_source_ref`
  - `aiphabee_governance.evidence_lineage_service_contract`
- Add `deploy/evidence/service.contract.json` and
  `npm run check:evidence-service`.
- Keep `live_db_writes=false`, `sql_emitted=false`, and
  `partner_source_records_loaded=false`.

## Task Breakdown

- [x] Add no-write evidence record planner and tests.
- [x] Add evidence service runtime and plan routes with standard envelopes.
- [x] Add empty Evidence/Lineage service migration and database contract entry.
- [x] Add evidence service contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
