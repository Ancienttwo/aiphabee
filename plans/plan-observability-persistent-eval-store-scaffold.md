# Plan: Observability Persistent Eval Store Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:00 +08
> **Slug**: observability-persistent-eval-store-scaffold
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/observability-eval-scaffold.md`
> **Task Contract**: `tasks/contracts/observability-persistent-eval-store-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/observability-persistent-eval-store-scaffold.notes.md`

## Agentic Routing

- Selected route: no-secret persistent eval store and OTLP destination scaffold.
- Routing reason: Sprint 0.4 needed an OTLP/eval store path beyond console
  events, but live endpoint credentials and Cloudflare storage resources are not
  provisioned.
- Due diligence:
  - P1 map: observability package, Worker runtime routes, event contract, env
    schema, Cloudflare binding contract, checker scripts.
  - P2 trace: `GET /observability/runtime` reports configured/planned sinks;
    `run.eval` events project to eval-store records through package code.
  - P3 decision rationale: wire schema, contracts, and runtime guard now; keep
    live OTLP export and persistent write/read smoke blocked until resources
    exist.

## Workflow Inventory

- Active plan: `plans/plan-observability-persistent-eval-store-scaffold.md`
- Task contract:
  `tasks/contracts/observability-persistent-eval-store-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/observability-persistent-eval-store-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/observability-persistent-eval-store-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add eval-store record projection for `run.eval` telemetry events.
- Add an eval-store sink interface and in-memory test implementation.
- Extend observability contract with D1 binding name and OTLP env names.
- Extend contract checks to verify env schema and Cloudflare binding coverage.
- Add `GET /observability/runtime` to report planned/live-guard status.
- Split tracker wording so live export/write smoke remains a separate unchecked
  task.

## Task Breakdown

- [x] Add eval-store record schema and sink projection.
- [x] Add planned D1 eval-store binding contract.
- [x] Add OTLP endpoint/header env names to env contract.
- [x] Add Worker observability runtime capability route.
- [x] Update tracker and governance docs.
- [x] Verify local checks and workflow strict check.
