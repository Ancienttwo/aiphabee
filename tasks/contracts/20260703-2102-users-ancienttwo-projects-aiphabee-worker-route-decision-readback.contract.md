# Task Contract: users-ancienttwo-projects-aiphabee-worker-route-decision-readback

> **Status**: Fulfilled
> **Plan**: plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-03 21:02
> **Review File**: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md`
> **Notes File**: `tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md`

## Goal

Wire Worker `/agent/*` planning/readback responses to the existing `@aiphabee/agent-runtime` control-plane contract so callers can see `requested_layer`, `selected_layer`, and `route_reason` without Worker owning a second layer or route-decision vocabulary.

## Scope

- In scope:
- `apps/worker/src/index.ts` route readback for `/agent/runtime` and the existing `/agent/runs/*` planning surfaces.
- `apps/worker/src/index.test.ts` focused assertions for Worker route decision readback.
- `packages/agent-runtime/src/index.ts` only if the previous Task 1 contract needs a small helper exported for Worker consumption.
- Sprint plan/contract/review/notes artifacts for this captured work package.
- Out of scope:
- FastClaw/E2B runner implementation.
- Generic guarded-live model execution.
- Generic access to `parse_chart_image`.
- Production auth/session semantics.
- New package or app roots such as `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.

## Workflow Inventory

- Source plan: `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md`
- Notes file: `tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - docs/spec.md
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md
  - tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md
  - tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md
  - .ai/context/capabilities.json
  - .claude/templates/
  - apps/worker/
  - packages/agent-runtime/
  - src/
  - tests/
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
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - apps/worker/src/index.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md
  commands_succeed:
    - npx vitest run apps/worker/src/index.test.ts
    - npx vitest run packages/agent-runtime/src/index.test.ts
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior:
- Worker `/agent/*` readback includes `requested_layer`, `selected_layer`, and `route_reason` on the relevant planning surface.
- Worker derives route/layer values from `@aiphabee/agent-runtime` exports or capability readback instead of local enum copies.
- Dry-run/no-live-execution behavior remains unchanged.
- Edge cases:
- Missing layer requests default to a deterministic Generic dry-run route readback.
- Unsupported live/remote modes remain non-executable in this slice.
- Regression risks:
- Worker must not become a competing Agent contract owner.
- Existing runtime and Worker tests must remain green.

## Rollback Point

- Commit / checkpoint:
- Revert strategy:
