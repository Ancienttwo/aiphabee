# Task Contract: answer-evidence-contract-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-answer-evidence-contract-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-answer-evidence-contract
> **Last Updated**: 2026-06-21 04:17 +08
> **Notes File**: `tasks/notes/answer-evidence-contract-scaffold.notes.md`

## Goal

Create a no-live answer and evidence payload contract proving Agent planner
responses preserve PRD 8.3 answer order, AGT-06 claim labels, and AGT-07
evidence-card payload requirements without enabling frontend rendering.

## Scope

- In scope:
  - `answer_evidence_contract` in `GET /agent/runtime`;
  - `answer_evidence_contract` in `POST /agent/runs/plan`;
  - ordered answer sections:
    `direct_answer`, `data_status`, `key_evidence`, `explanation`,
    `counter_evidence_risks`, `sources_methods`, `next_steps`,
    `disclaimer`;
  - claim labels: `fact`, `calculation`, `inference`, `unknown`;
  - evidence strength values: `strong`, `medium`, `weak`, `unknown`;
  - evidence-card payload required fields for source record, data point,
    document location, `as_of`, data version, methodology version, currency,
    unit, strength, and warnings;
  - planned card sources from existing no-live tool plan;
  - contract checker and tracker/governance updates.
- Out of scope:
  - actual frontend evidence-card click behavior;
  - live evidence binding;
  - generated answer parsing;
  - live model calls or tool execution.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/answer-evidence-contract.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/answer-evidence-contract-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-answer-evidence-contract-scaffold.md
  - scripts/check-answer-evidence-contract.mjs
  - tasks/contracts/answer-evidence-contract-scaffold.contract.md
  - tasks/notes/answer-evidence-contract-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime advertises answer_evidence_contract"
    - "POST /agent/runs/plan returns answer_evidence_contract"
    - "Ordered answer sections match PRD 8.3"
    - "Claim labels include fact, calculation, inference, and unknown"
    - "Facts require evidence cards"
    - "Calculations require calculation refs"
    - "Inferences require evidence strength"
    - "Unknowns require missing reasons"
    - "Evidence cards require source_record_id, data_point, document_location, as_of, data_version, methodology_version, currency, unit, evidence_strength, and warnings"
    - "Frontend rendering remains false"
    - "No model calls, actual tool calls, live evidence binding, or frontend changes are claimed"
  commands_succeed:
    - npm run test
    - npm run test:golden
    - npm run check:answer-evidence-contract
    - npm run check:agent-run-context
    - npm run check:tool-loop-agent
    - npm run check:pre-tool-call-resolution
    - npm run check:budget-stop-policy
    - npm run check:tool-enforcement
    - npm run check:numeric-source-guard
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/plan returns answer_evidence_contract.status=answer_evidence_contract_scaffold"
    - "POST /agent/runs/plan returns frontend_rendering=false"
```

## Acceptance Notes

- This task completes a deterministic backend contract scaffold for answer
  structure and evidence-card payloads.
- It does not complete frontend card rendering or live evidence binding.

## Rollback Point

- Revert the commit that adds answer/evidence contract behavior, checker, and
  tracker/governance updates.
