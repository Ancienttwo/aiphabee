# Task Contract: sandbox-backend-port

> **Status**: Fulfilled
> **Plan**: plans/plan-20260710-2129-sandbox-backend-port.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: agent_control_plane
> **Last Updated**: 2026-07-10 22:19
> **Review File**: `tasks/reviews/20260710-2129-sandbox-backend-port.review.md`
> **Notes File**: `tasks/notes/20260710-2129-sandbox-backend-port.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Sprint row 2 must establish the provider-neutral execution seam before the
approved Cloudflare adapter is introduced. Without it, provider SDK types and
lifecycle semantics would leak into `AgentRunner`, Worker, or product policy,
making Cloudflare a second authority and leaving Generic denial, timeout,
egress, kill, and repeated cleanup behavior implicit.

## Goal

Agent Runtime exposes one versioned `SandboxBackend` port with provider-neutral
create, streamed raw execution output, workspace read/write, kill, and destroy
contracts. Mandatory policy fixes default-deny egress, 180-second soft timeout,
and 600-second hard timeout. Access composes authoritative runner selection and
is blocked-only in this row: FastClaw is disabled and `runner_remote` is not yet
executable. Create requires an opaque grant whose private mint is deliberately
deferred until row 7 activates selector and dispatch together. Capability truth
reports the port ready while adapter, registration, dispatch, and live execution
remain false.

## Scope

- In scope:
  - Agent Runtime constants, mandatory sandbox policy, access decision, port and
    input/output/failure types, workspace-path validation, run/session ownership,
    and capability readback.
  - Tests for exact policy, Generic/edge denial, disabled FastClaw enforcement,
    method surface, untrusted/failed output, file success/failure, kill,
    idempotent destroy, and negative type contracts.
  - Capability registry/source-map truth and Sprint row 2 closeout.
- Out of scope:
  - No provider SDK/adapter, sandbox creation, Worker route/binding, network,
    token, credential, persistence, database, billing, deploy, semantic Agent
    events, lifecycle orchestration, or live execution.
  - No new package, production/test file, dependency, factory, registry,
    sandbank abstraction, compatibility alias, arbitrary URL, env, or shell
    command-string surface.
- Taste constraints: add the single necessary port beside the existing
  `AgentRunner` authority; use argv plus provider-neutral `kill()` cancellation;
  raw output is always untrusted; exact unavailable/forbidden states fail closed.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop if the port cannot express the approved backend without importing
  Cloudflare/provider types or adding a second abstraction layer.
- Stop if the row would require registering an adapter, enabling FastClaw,
  dispatching a runner, or creating external state.

## Falsifier

The direction is wrong if an authoritative sandbox port already exists in this
stacked branch or if provider-neutral types cannot represent the approved
Cloudflare operations. CodeGraph found no current `SandboxBackend` or public
sandbox call path; the only current authority is `AgentRunner`. The separate
dirty-main smoke implementation is user WIP and provider-specific evidence, not
landed contract authority, so this row must not edit or absorb it.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260710-2129-sandbox-backend-port.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260710-2129-sandbox-backend-port.review.md`
- Notes file: `tasks/notes/20260710-2129-sandbox-backend-port.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - packages/agent-runtime/src/index.ts
  - packages/agent-runtime/src/index.test.ts
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - plans/plan-20260710-2129-sandbox-backend-port.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/contracts/20260710-2129-sandbox-backend-port.contract.md
  - tasks/reviews/20260710-2129-sandbox-backend-port.review.md
  - tasks/notes/20260710-2129-sandbox-backend-port.notes.md
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
    - .ai/context/capabilities.json
    - .ai/context/capability-source-map.json
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260710-2129-sandbox-backend-port.notes.md
  tests_pass: []
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/index.test.ts
    - npm run typecheck
    - npm run check:answer-evidence-contract
    - repo-harness run check-context-files
    - bash -lc 'test "$(jq -r ".capabilities[] | select(.id == \"fastclaw_personal_runner\") | .invariants.sandbox_backend_port_implemented" .ai/context/capabilities.json)" = "true"'
    - bash -lc 'test "$(jq -r ".capabilities[] | select(.id == \"fastclaw_personal_runner\") | .invariants.sandbox_adapter_implemented" .ai/context/capabilities.json)" = "false"'
    - bash -lc 'test ! -d packages/sandbox-runtime'
    - git diff --quiet 2be96ce982e4b665c2490f1ef86f473367303f9c -- package.json package-lock.json
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 8
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: exact port and frozen deny-only policy are exported;
  run/session ownership, opaque access, failures, and path rejection are
  representable; capability readback is honest; there is no adapter or dispatch.
- Edge cases: Generic under either family and Research/edge are blocked;
  Research/FastClaw is also blocked by disabled/non-executable authoritative
  selection; unknown lease operations fail in the conformance fixture; kill and
  repeated destroy terminal results are representable.
- Regression risks: a provider-shaped type, mutable policy, raw-family runner
  bypass, unvalidated path, fail-open file result, shell-string/env surface, or
  optimistic capability flag would weaken the intended seam.
- Activation boundary: flipping FastClaw `enabled` alone must not mint a grant.
  Row 7 owns executable `runner_remote` selection, private frozen-grant minting,
  and enabled-path integration coverage. Row 3 must bind each lease ID to the
  grant identity server-side and reject unknown/cross-owner operations.

## Rollback Point

- Commit / checkpoint: stacked from row-1 commit
  `2be96ce982e4b665c2490f1ef86f473367303f9c`.
- Revert strategy: revert the single row-2 commit; no external rollback exists.
