# Plan: Research Run Replay Scaffold

## Scope

- Sprint: 2.2
- Requirements: RES-02, US-W08
- Package: `@aiphabee/research-runtime`
- Worker routes:
  - `GET /research/runtime`
  - `POST /research/runs/replay/plan`
- Contract: `deploy/research/research-run-replay.contract.json`
- Checker: `npm run check:research-run-replay`

## Task Breakdown

- [x] Add no-write replay planner to `@aiphabee/research-runtime`
- [x] Preserve saved report snapshot identity without mutation
- [x] Compare saved vs current run snapshots across data/model/parameters
- [x] Expose replay planner through Worker standard envelope
- [x] Add local contract gate and tests
- [x] Update Sprint Tracker and traceability docs

## Explicit Non-Goals

- No live DB/R2 reads or writes
- No live model calls
- No live tool execution
- No frontend research-library rendering
- No notification workflow for changed reports
