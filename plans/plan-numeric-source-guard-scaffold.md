# Plan: Numeric Source Guard Scaffold

> **Status**: Implemented
> **Owner**: Codex
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/numeric-source-guard-scaffold.contract.md`
> **Notes**: `tasks/notes/numeric-source-guard-scaffold.notes.md`

## Goal

Complete the Sprint 1.3 AGT-05 scaffold that prevents concrete financial
numbers from being claimed unless they come from tool results or deterministic
calculations.

## Task Breakdown

- [x] Extend Agent runtime capabilities with `numeric_source_guard`.
- [x] Return `numeric_source_guard` from `createToolLoopAgentPlan()`.
- [x] Block no-source concrete financial numbers in the no-live answer contract.
- [x] List allowed numeric sources: tool results and deterministic calculations.
- [x] List blocked sources: model memory, training data, unverified prompt
      numbers, and unstated sources.
- [x] Derive planned tool-result numeric sources from requested tools.
- [x] Derive planned deterministic calculation gates from price-history,
      financial-facts, and corporate-action source tools.
- [x] Add `deploy/agent/numeric-source-guard.contract.json` and
      `npm run check:numeric-source-guard`.
- [x] Update runtime and Worker tests.
- [x] Update Sprint tracker, governance notes, task contract, and deferred
      ledger.

## Out of Scope

- Live tool execution.
- Actual post-generation numeric extraction.
- Model generation.
- Frontend evidence cards or UI labels.

## Verification Surface

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:numeric-source-guard`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- Local Wrangler smoke for `numeric_source_guard`.
