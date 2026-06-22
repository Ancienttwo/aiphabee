# Agent User-Run Persistence Release Gate Contract

## Intent

Create a no-write release gate that links the existing Agent persistence and
billing smokes before any production user-run persistence cutover.

## In Scope

- Add `POST /agent/release-gates/user-run-persistence/plan`.
- Expose `agent_user_run_persistence_release_gate` from `GET /agent/runtime`.
- Link:
  - `POST /agent/runs/live-write-smoke`
  - `POST /agent/runs/state-persistence-smoke`
  - `POST /agent/runs/billing-posted-ledger-smoke`
- Return `smoke_gates`, `production_prerequisites`, `release_checks`,
  `release_gate`, and `validation`.
- Keep `production_cutover_allowed=false`.
- Keep `production_persistence_enabled=false`.
- Add migration, deploy contract, checker, unit tests, and tracker/todo updates.

## Out of Scope

- Production Agent run persistence.
- Production state/checkpoint writer.
- Production billing provider posting or invoice writes.
- User-facing live model streaming.
- Frontend Ask, resume, or evidence-card rendering.
- AI Gateway logs/cost/cache/rate-limit/fallback read evidence.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts`
- `npm run test -- apps/worker/src/index.test.ts`
- `npm run check:agent-user-run-persistence-release-gate`
- `npm run check:database`
- `npm run check:agent-run-live-write-smoke`
- `npm run check:agent-run-state-persistence-smoke`
- `npm run check:agent-billing-posted-ledger-smoke`
