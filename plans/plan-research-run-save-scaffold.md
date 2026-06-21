# Research Run Save Scaffold Plan

## Objective

Complete the backend-only Sprint 2.2 RES-01 scaffold for saving complete
research run snapshots.

## Boundary

- Package: `@aiphabee/research-runtime`
- Runtime route: `GET /research/runtime`
- Save-plan route: `POST /research/runs/save/plan`
- Contract: `deploy/research/research-run-save.contract.json`
- Checker: `npm run check:research-run-save`
- Frontend: out of scope; user delegated frontend work to Claude

## Task Breakdown

- [x] Add `@aiphabee/research-runtime`
- [x] Capture question, tool input, evidence, model, and prompt snapshots
- [x] Generate immutable snapshot ID and replay seed
- [x] Expose Worker runtime and save-plan routes
- [x] Add contract JSON and checker
- [x] Add package and Worker tests
- [x] Update tracker, governance, and notes

## Non-Goals

- No live DB writes
- No report UI
- No live replay execution
- No frontend data/model/parameter diff rendering
- No old-report mutation workflow
