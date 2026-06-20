# Plan: answer-evidence-contract-scaffold

> **Status**: Implemented
> **Owner**: Codex
> **Created**: 2026-06-21
> **Sprint**: 1.3
> **Tracker Items**: answer structure, AGT-06, AGT-07

## Goal

Add a no-live Agent planner contract for PRD 8.3 answer structure, AGT-06
fact/calculation/inference/unknown labels, and AGT-07 evidence-card payloads.

## Scope

- Extend `@aiphabee/agent-runtime` runtime capabilities with
  `answer_evidence_contract`.
- Extend `POST /agent/runs/plan` with ordered answer sections, claim label
  rules, evidence strength values, and evidence-card payload requirements.
- Add a local deploy contract and checker:
  `deploy/agent/answer-evidence-contract.contract.json` and
  `npm run check:answer-evidence-contract`.
- Update worker/runtime tests and tracker/governance notes.

## Out of Scope

- Frontend rendering or clickable UI behavior.
- Live tool execution.
- Live evidence binding.
- Model generation or post-generation answer parsing.

## Verification

- `npm run check:answer-evidence-contract`
- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- local `POST /agent/runs/plan` smoke after implementation
