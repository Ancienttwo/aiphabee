# Task Contract: runner-selection-contract

> **Status**: Fulfilled
> **Plan**: plans/plan-20260710-1837-runner-selection-contract.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: agent_control_plane
> **Last Updated**: 2026-07-10 19:08
> **Review File**: `tasks/reviews/20260710-1837-runner-selection-contract.review.md`
> **Notes File**: `tasks/notes/20260710-1837-runner-selection-contract.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Sprint Row 1 must establish one executable runner-selection authority before any
sandbox or FastClaw adapter work begins. Without it, Worker, future provisioning,
and future runners can each invent family/mode semantics, causing Generic/
Research permission to be coupled to execution location or explicit FastClaw
requests to silently fall back to edge. Either outcome violates the stable spec
and makes later isolation/evidence work unauditable.

## Goal

Agent Runtime owns a versioned static registry with exactly `edge` and
`fastclaw`, a pure fail-closed selector, and concrete runner IDs. Worker consumes
that selector and exposes requested/selected runner family, selected runner ID,
selection reason, owner, and contract version on successful `/agent/*` readback.
The selector rejects invalid, disabled, and mode-incompatible requests before
planning/execution while preserving `AgentRunMode` and dry-run-only execution.

## Scope

- In scope:
  - Agent Runtime runner-family constants, static registry, concrete IDs,
    selection types/reasons, pure selector, `AgentRunner` family/ID contract, and
    capability readback.
  - Worker request parsing, selector consumption, fail-closed error mapping, and
    runner-selection readback on existing `/agent/*` routes.
  - Targeted Agent Runtime/Worker tests for exact families, default edge,
    workflow/service rejection, mode incompatibility, disabled FastClaw, current
    `runner_required`, and successful readback.
  - Capability registry/source-map status truth and Sprint Row 1 closeout.
- Out of scope:
  - No actual `AgentRunner.run()` dispatch, FastClaw adapter, sandbox,
    provisioning, persistence, billing, network, credential, deployment, or
    live-execution change.
  - No dynamic registry, compatibility alias, Worker-owned selection table, or
    third runner family.
- Taste constraints: keep one static two-entry authority in Agent Runtime; no
  dependency or new package; explicit invalid/unavailable requests fail closed
  and never fall back.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop if naming `edge.worker-v0` would be interpreted as claiming
  `AgentRunner.run()` dispatch rather than selection/audit identity.
- Stop if the implementation would require enabling `runner_remote` or live
  FastClaw execution in this row.

## Falsifier

The direction is wrong if runner family is already an authoritative runtime
axis elsewhere or Worker already dispatches a concrete runner. The cheapest
proof is a repository-wide symbol/route trace: current code exposes only
`AgentRunMode`, free-form `AgentRunner.runner_id`, and dry-run Worker planning;
no family registry or runner dispatch exists, so the gap is real.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260710-1837-runner-selection-contract.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260710-1837-runner-selection-contract.review.md`
- Notes file: `tasks/notes/20260710-1837-runner-selection-contract.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - packages/agent-runtime/src/index.ts
  - packages/agent-runtime/src/index.test.ts
  - apps/worker/src/index.ts
  - apps/worker/src/index.test.ts
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - plans/plan-20260710-1837-runner-selection-contract.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/contracts/20260710-1837-runner-selection-contract.contract.md
  - tasks/reviews/20260710-1837-runner-selection-contract.review.md
  - tasks/notes/20260710-1837-runner-selection-contract.notes.md
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
    - packages/agent-runtime/src/index.ts
    - packages/agent-runtime/src/index.test.ts
    - apps/worker/src/index.ts
    - apps/worker/src/index.test.ts
    - .ai/context/capabilities.json
    - .ai/context/capability-source-map.json
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260710-1837-runner-selection-contract.notes.md
  tests_pass: []
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:answer-evidence-contract
    - repo-harness run check-context-files
    - bash -lc 'test "$(jq -r ".capabilities[] | select(.id == \"agent_control_plane\") | .invariants.runner_selection_implemented" .ai/context/capabilities.json)" = "true"'
    - bash -lc 'test "$(jq -r ".capabilities[] | select(.id == \"fastclaw_personal_runner\") | .invariants.runtime_dispatch_implemented" .ai/context/capabilities.json)" = "false"'
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 8
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: omitted family selects enabled `edge.worker-v0` for
  `dry_run`; successful Worker payloads expose the new runner fields without
  removing existing layer/mode readback.
- Edge cases: workflow/service/unknown family, disabled FastClaw, incompatible
  family/mode, and supported-but-not-executable mode all fail before planning or
  execution with stable reasons and no fallback.
- Regression risks: changing route reason precedence can break existing
  `runner_required` behavior; capability metadata must not claim dispatch or live
  execution; adding required request fields would break current clients.

## Rollback Point

- Commit / checkpoint: stacked branch from approval commit
  `a3c3966fff4c0b4b1410741f8adf8f5eeadb08b1`.
- Revert strategy: revert the single runner-selection commit; no data,
  deployment, credential, or external-state rollback exists.
