# Task Contract: sandbox-terminal-lifecycle

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-0346-sandbox-terminal-lifecycle.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: fastclaw_personal_runner
> **Last Updated**: 2026-07-11 04:21
> **Review File**: `tasks/reviews/20260711-0346-sandbox-terminal-lifecycle.review.md`
> **Notes File**: `tasks/notes/20260711-0346-sandbox-terminal-lifecycle.notes.md`

## Why

Rows 2–4 provide the sandbox port, concrete backend and scoped egress, but no
single Agent Runtime owner currently arbitrates cancel/timeout/kill versus the
execution stream, guarantees one terminal record, performs terminal destroy and
records actual observed usage. Row 7 cannot safely activate the runner until
that lifecycle boundary exists.

## Goal

Deliver a reviewed provider-neutral terminal lifecycle in Agent Runtime. The
matrix must cover success, execution failure, client cancellation, stream
interruption, soft timeout, hard timeout, tenant/global kill, kill switch and
repeated cleanup. Each run records one terminal semantic state after one
lifecycle destroy call, leaves no authorized residual handle/file on successful
cleanup, and reports observed rather than estimated execution usage. Keep
backend registration, terminal persistence, runner dispatch, deploy and live
execution disabled.

## Scope

- In scope: standard AbortSignal/timer arbitration; shared termination grace;
  added kill reasons; terminal cause and cleanup record; observed duration,
  bytes/events and exit code; callback contract; lifecycle matrix; concrete
  Cloudflare adapter integration; capability/Sprint truth.
- Out of scope: public/Worker routes, semantic Agent events, DB/audit/usage
  ledger implementation, credits/cost estimates, CPU/memory/disk/network usage,
  artifact promotion, backend registration, runner activation, deploy and live
  acceptance.
- Taste constraints: no new dependency, scheduler framework, provider-specific
  lifecycle authority, local fallback recorder or compatibility event shape.

## Stop Conditions

- Stop if implementation requires a path outside Allowed Paths.
- Stop if one required terminal path can emit two terminal callback records or
  skip cleanup after a created lease.
- Stop rather than estimate provider resource/cost values unavailable from the
  authoritative backend.
- Stop if Cloudflare kill/destroy cannot be bounded by the shared termination
  grace without weakening fail-closed cleanup truth.

## Falsifier

The direction is false if the lifecycle must live in the Cloudflare adapter to
work, if cancellation cannot race a live async iterator without exposing raw
output, or if the terminal callback must persist through a new database. The
cheapest proof is the provider-neutral fake matrix plus one real adapter fixture
using the same public port.

## Root Cause Evidence

Not a bugfix.

## Workflow Inventory

- Source plan: `plans/plan-20260711-0346-sandbox-terminal-lifecycle.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review: `tasks/reviews/20260711-0346-sandbox-terminal-lifecycle.review.md`
- Notes: `tasks/notes/20260711-0346-sandbox-terminal-lifecycle.notes.md`
- Checks: `.ai/harness/checks/latest.json`
- Base: Row-4 commit `af695fc56cac41db6c0da72eb9910fdb09fd9f3b`
- Completion: passing strict contract/review/fingerprint and `verify-sprint`
  with the Row-4 base.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-0346-sandbox-terminal-lifecycle.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-0346-sandbox-terminal-lifecycle.contract.md
  - tasks/reviews/20260711-0346-sandbox-terminal-lifecycle.review.md
  - tasks/notes/20260711-0346-sandbox-terminal-lifecycle.notes.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - packages/agent-runtime/src/index.ts
  - packages/agent-runtime/src/index.test.ts
  - packages/agent-runtime/src/sandbox-terminal-lifecycle.ts
  - packages/agent-runtime/src/sandbox-terminal-lifecycle.test.ts
  - apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts
  - apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts
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
    verifier:
      mode: read_only
      purpose: exit_criteria_review
  runner:
    preferred:
      - subagent
      - main-thread
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - packages/agent-runtime/src/sandbox-terminal-lifecycle.ts
    - packages/agent-runtime/src/sandbox-terminal-lifecycle.test.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-0346-sandbox-terminal-lifecycle.notes.md
  tests_pass:
    - path: packages/agent-runtime/src/index.test.ts
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/sandbox-terminal-lifecycle.test.ts packages/agent-runtime/src/index.test.ts apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts
    - npm run typecheck
    - npm run lint
    - npm run check:answer-evidence-contract
    - npx vitest run
    - npx wrangler deploy --dry-run --config apps/sandbox-bridge/wrangler.jsonc
    - node -e "const fs=require('node:fs'); const s=fs.readFileSync('packages/agent-runtime/src/sandbox-terminal-lifecycle.ts','utf8'); if(!s.includes('measurement: \\\"observed\\\"')||!s.includes('estimated: false')||s.includes('cost_usd')||s.includes('estimateCloudflare')) process.exit(1)"
    - node -e "JSON.parse(require('node:fs').readFileSync('.ai/context/capabilities.json','utf8')); JSON.parse(require('node:fs').readFileSync('.ai/context/capability-source-map.json','utf8'))"
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional: first terminal cause wins, cleanup truth is independent, and one
  callback records actual observed use after cleanup.
- Edge cases: pre-abort, live cancel, stream reject/end, nonzero exit, typed
  failure, soft/hard timeout, tenant/global/kill-switch, kill timeout, destroy
  timeout/failure and terminal callback failure.
- Regression risks: detached iterator leakage, timer/listener leakage, terminal
  duplication, cleanup fabrication, output-content retention, estimated usage,
  provider authority drift and accidental runtime activation.

## Rollback Point

- Commit/checkpoint: one Row-5 commit stacked on Row 4.
- Revert: revert that commit; no external state exists.
