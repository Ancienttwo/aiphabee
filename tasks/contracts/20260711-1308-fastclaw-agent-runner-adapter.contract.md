# Task Contract: fastclaw-agent-runner-adapter

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: fastclaw_personal_runner
> **Last Updated**: 2026-07-11 13:38
> **Review File**: `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md`
> **Notes File**: `tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Row 6 proves one dedicated FastClaw identity, but the registered remote family
is still non-executable and no authentic sandbox grant can be minted. Enabling
the registry without a separate activation capability would turn routing config
into compute authorization; adapting opaque FastClaw SSE would also let hidden
tool calls bypass AiphaBee policy and leak raw upstream material.

## Goal

Deliver an executable `fastclaw.personal-v0` implementation behind the existing
AgentRunner contract. Selection, active dedicated identity, a private frozen
run-owned sandbox grant, callback-only tool policy, post-checked final answer,
monotonic events and unique terminal semantics must converge atomically. A
registry flip, forged object, inactive/unentitled profile, opaque transport or
failed post-check must not execute or expose authority.

## Scope

- In scope: Agent Runtime remote selection; required prompt and optional abort
  signal; internal activation/grant brand; callback-capable FastClaw runner;
  cancellation/error/budget/final normalization; Worker PostgreSQL profile and
  temporal-entitlement authority composition; machine contract/capability and
  Sprint truth.
- Out of scope: public run route, UI, billing/admin, durable memory/artifacts,
  migration, secret, deploy/resource, live FastClaw SSE compatibility and
  credentialed acceptance.
- Taste constraints: registry is routing, never authorization; raw upstream
  content/private reasoning/tool data/errors are temporary and non-public; no
  prompt/regex/transcript heuristic may stand in for callback tool policy; no
  shared identity or direct FastClaw fallback.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop if the grant mint must become a root package export or selection alone
  can construct a grant.
- Stop if a transport cannot surface every tool call through the AiphaBee
  callback before execution; do not treat the current opaque SSE as compliant.
- Stop if any terminal path can emit twice, any index can regress, or a raw
  remote ID/token/reasoning/tool input/result/error/final leaks into events.

## Falsifier

The direction is false if TypeScript/runtime callers can forge the activation,
if an opaque transport can activate, if an unlisted tool can execute, or if
abort/timeout can race into two terminal events. The cheapest proof is the
focused activation/runner test matrix before Worker composition.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md`
- Notes file: `tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md
  - tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md
  - tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - packages/agent-runtime/src/index.ts
  - packages/agent-runtime/src/index.test.ts
  - packages/agent-runtime/src/sandbox-access-grant.ts
  - packages/agent-runtime/src/fastclaw-agent-runner.ts
  - packages/agent-runtime/src/fastclaw-agent-runner.test.ts
  - packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts
  - packages/agent-runtime/package.json
  - apps/worker/src/fastclaw-agent-runner.ts
  - apps/worker/src/fastclaw-agent-runner.test.ts
  - apps/worker/src/research-agent-lifecycle.ts
  - apps/worker/src/index.ts
  - apps/worker/src/index.test.ts
  - deploy/fastclaw/fastclaw-agent-runner.contract.json
  - scripts/check-fastclaw-agent-runner-contract.mjs
  - package.json
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
    - packages/agent-runtime/src/sandbox-access-grant.ts
    - packages/agent-runtime/src/fastclaw-agent-runner.ts
    - packages/agent-runtime/src/fastclaw-agent-runner.test.ts
    - apps/worker/src/fastclaw-agent-runner.ts
    - apps/worker/src/fastclaw-agent-runner.test.ts
    - apps/worker/src/research-agent-lifecycle.ts
    - deploy/fastclaw/fastclaw-agent-runner.contract.json
    - scripts/check-fastclaw-agent-runner-contract.mjs
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md
    - tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md
  tests_pass:
    - path: packages/agent-runtime/src/index.test.ts
    - path: packages/agent-runtime/src/fastclaw-agent-runner.test.ts
    - path: apps/worker/src/fastclaw-agent-runner.test.ts
  commands_succeed:
    - npm run check:fastclaw-agent-runner
    - npx vitest run packages/agent-runtime/src/index.test.ts packages/agent-runtime/src/fastclaw-agent-runner.test.ts packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts apps/worker/src/fastclaw-agent-runner.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run lint
    - npm run check:database
    - npm run check:env
    - npm test
    - node -e "JSON.parse(require('node:fs').readFileSync('.ai/context/capabilities.json','utf8')); JSON.parse(require('node:fs').readFileSync('.ai/context/capability-source-map.json','utf8')); JSON.parse(require('node:fs').readFileSync('deploy/fastclaw/fastclaw-agent-runner.contract.json','utf8'))"
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: executable remote selection and authentic activation
  converge on the existing AgentRunner contract; exact active entitlement is
  re-read before a run; every tool and final answer crosses AiphaBee authority.
- Edge cases: forged activation/grant, invalid request, inactive/deleted or
  expired identity, issuer failure, unlisted/denied tool, transport failure,
  post-check denial, pre/in-flight cancellation, timeout, token/step overrun and
  late transport completion.
- Regression risks: edge runner selection drift, public grant constructor,
  double terminal, event-index regression, raw protected material leakage,
  hidden FastClaw tool execution and false live-complete posture.

## Rollback Point

- Commit / checkpoint: one Row-7 commit stacked on integration base `7b7e2dc`.
- Revert strategy: revert the Row-7 commit; no external cleanup is required.
