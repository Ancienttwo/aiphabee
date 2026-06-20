# Plan: eval-v1-wvro-scaffold

> **Status**: Implemented
> **Owner**: Codex
> **Created**: 2026-06-21
> **Sprint**: 1.4
> **Tracker Item**: Eval v1 + WVRO instrumentation

## Goal

Add a no-write evaluation v1 scaffold covering fact accuracy, calculation
accuracy, citation accuracy, correct refusal rate, unsourced numeric claim
sampling, and WVRO eligibility instrumentation.

## Scope

- Extend `@aiphabee/observability` with eval v1 capability and record helpers.
- Attach eval v1 payloads to existing `run.eval` events.
- Add `GET /observability/runtime` eval v1 capability output.
- Add `POST /observability/eval-v1/plan` no-write planning route.
- Add `deploy/observability/eval-v1.contract.json` and
  `npm run check:eval-v1`.
- Update worker/package tests and tracker/governance notes.

## Out of Scope

- Persistent D1 eval writes.
- Live OTLP export.
- Frontend analytics dashboards.
- Production partner-approved eval corpus.
- Automatic post-generation answer grading.

## Verification

- `npm run check:eval-v1`
- `npm run test -- packages/observability/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/observability`
- `npm run typecheck --workspace @aiphabee/worker`
- local `POST /observability/eval-v1/plan` smoke after implementation
