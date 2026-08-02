# Task Contract: business-output-evidence-composition

> **Status**: Completed
> **Plan**: plans/plan-20260713-0602-business-output-evidence-composition.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-13 06:02
> **Review File**: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md`
> **Notes File**: `tasks/notes/20260713-0602-business-output-evidence-composition.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Row 3 depends on frozen output/evidence and denial semantics. Existing envelope, evidence and Agent binding authorities are sound, but no machine-checkable composition boundary prevents channel projections or future business cards from duplicating evidence, mutating identity, or fabricating missing authority.

## Goal

Deliver one reconciliation-only composition ledger, nine representative fixtures and exact checker that prove business projections preserve canonical envelope/evidence/claim/calculation identities, fail closed through frozen Row 1 errors, and create no runtime payload, storage, card or channel semantic authority.

## Scope

- In scope: Data Contracts composition ledger, fixtures, tests, checker, package wiring and workflow evidence.
- Out of scope: Row 3 rights implementation, frontend, DB, persistence, Agent/Evidence/Worker/MCP/FastClaw runtime edits, twelve cards, confidence percentages or semantic fallback.
- Taste constraints: refs-only composition; owner contracts remain authoritative.

## Stop Conditions

- Stop on any required path outside Allowed Paths.
- Stop if runtime DTO/storage/channel semantics or Row 3 rights must be created.
- Stop if evidence is reconstructed, copied into a divergent payload, or inferred locally.
- Stop if channel projection can mutate claim/evidence/calculation/denial identity.
- Stop if Row 1 version/status is not frozen or a baseline failure prevents attribution.

## Falsifier

The design is wrong if existing authorities already provide one cross-owner composition contract, or acceptance requires live user-facing payload changes. Cheapest proof: exact source/contract inventory before runtime edits.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260713-0602-business-output-evidence-composition.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md`
- Notes file: `tasks/notes/20260713-0602-business-output-evidence-composition.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - packages/data-contracts/src/business-output-evidence-composition.contract.json
  - packages/data-contracts/src/business-output-evidence-composition.fixtures.json
  - packages/data-contracts/src/business-output-evidence-composition.contract.test.ts
  - scripts/check-business-output-evidence-composition-contract.mjs
  - package.json
  - plans/plan-20260713-0602-business-output-evidence-composition.md
  - tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md
  - tasks/reviews/20260713-0602-business-output-evidence-composition.review.md
  - tasks/notes/20260713-0602-business-output-evidence-composition.notes.md
```

## Delegation Contract

```yaml
delegation:
  budget:
    tokens: null
    tool_calls: null
    wall_time_minutes: null
  permission_scope:
    mode: inherit_allowed_paths
    writable_paths: []
    network: inherited
  roles:
    parent:
      mode: narrate_and_gatekeep
      purpose: approval_checkpoint_owner
    explorer:
      mode: read_only
      purpose: codebase_research
    worker:
      mode: edit_within_allowed_paths
      purpose: implementation
    verifier:
      mode: read_only
      purpose: exit_criteria_review
  runner:
    preferred:
      - subagent
      - codex-exec
      - main-thread
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - packages/data-contracts/src/business-output-evidence-composition.contract.json
    - packages/data-contracts/src/business-output-evidence-composition.fixtures.json
    - packages/data-contracts/src/business-output-evidence-composition.contract.test.ts
    - scripts/check-business-output-evidence-composition-contract.mjs
  artifacts_exist:
    - tasks/notes/20260713-0602-business-output-evidence-composition.notes.md
  tests_pass:
    - path: packages/data-contracts/src/business-output-evidence-composition.contract.test.ts
  commands_succeed:
    - npm run check:business-output-evidence-composition
    - npm run check:error-taxonomy-reconciliation
    - npm run check:evidence-service
    - npm run check:evidence-lineage
    - npm run check:answer-evidence-contract
    - npm run check:agent-tool-execution-evidence-smoke
    - npm run check:agent-generated-answer-evidence-smoke
    - npx vitest run packages/data-contracts/src packages/evidence-lineage/src packages/agent-runtime/src apps/worker/src/agent-generated-answer-evidence-smoke.test.ts apps/worker/src/agent-tool-execution-evidence-smoke.test.ts
    - npm run typecheck --workspace @aiphabee/data-contracts
    - npm run typecheck --workspace @aiphabee/evidence-lineage
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run typecheck --workspace @aiphabee/worker
    - npm run check:task-sync
    - LC_ALL=C repo-harness run check-task-workflow --strict
    - git diff --check
  manual_checks:
    - "Independent review recommends pass"
    - "Rows 3 and runtime owner files remain untouched"
```

## Acceptance Notes (Human Review)

- Functional behavior: representative projections preserve canonical refs and fail closed when authority is absent.
- Edge cases: contradiction, partial unknown, denial, malformed evidence and channel mutation.
- Regression risks: source selector/version drift and accidental evidence payload duplication.

## Rollback Point

- Commit / checkpoint: current frozen Row 1 state.
- Revert strategy: remove Row 2 ledger/fixtures/checker/tests/package wiring atomically; retain audit artifacts and rerun Row 1/evidence baseline.
