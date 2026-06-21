# Plan: Observability Eval Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 14:57 +08
> **Slug**: observability-eval-scaffold
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/observability-eval-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/observability-eval-scaffold.notes.md`

## Agentic Routing

- Selected route: local observability/eval event contract for the existing Worker
  dry-run route.
- Routing reason: Sprint 0.4 needs OTel/log/eval wiring, but real external
  destinations and persistent stores are not provisioned.
- Due diligence:
  - P1 map: Worker Wrangler observability config, dry-run route telemetry
    headers, observability package, and event manifest.
  - P2 trace: dry-run request -> runtime skeleton/policy error -> structured
    run.audit/run.eval events -> console sink -> response headers.
  - P3 decision rationale: wire locally verifiable telemetry without introducing
    provider secrets, OTLP credentials, or persistence claims.

## Task Breakdown

- [x] Add `packages/observability`.
- [x] Add structured `run.audit` and `run.eval` event builders.
- [x] Add local console and in-memory telemetry sinks.
- [x] Enable Wrangler Workers Logs and traces in config.
- [x] Emit telemetry events from `POST /agent/runs/dry-run` success and error
      paths.
- [x] Add `deploy/observability/events.contract.json`.
- [x] Add `npm run check:observability` and CI coverage.
- [x] Update tracker/todos/governance docs.
- [x] Verify local checks, Wrangler smoke, and workflow strict check.
