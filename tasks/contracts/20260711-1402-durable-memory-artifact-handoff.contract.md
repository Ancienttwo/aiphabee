# Task Contract: durable-memory-artifact-handoff

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-1402-durable-memory-artifact-handoff.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: fastclaw_personal_runner
> **Last Updated**: 2026-07-11 14:19
> **Review File**: `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md`
> **Notes File**: `tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Row 7 can execute a private dedicated runner, but no approved sandbox output can
leave ephemeral compute. Persisting a sandbox-authored manifest, treating an
object key as authorization or skipping cleanup would create an exfiltration,
cross-tenant or orphan-compute boundary before product/admin controls exist.

## Goal

Deliver one private, fail-closed handoff from a run-owned SandboxBackend lease
to AiphaBee-owned R2 bytes and PostgreSQL metadata. Only exact AiphaBee-approved,
within-limit and authoritatively clean memory/artifacts persist; complete
tenant/owner/run/hash/classification/size/retention/scan/provenance/evidence
records are tenant-readable, and every path destroys the sandbox with explicit
release-safety readback.

## Scope

- In scope: provider-neutral Agent Runtime handoff/approval/scan/storage/read/
  destroy contract; hard kind limits; existing R2 + new PostgreSQL metadata
  adapters and RLS migration; focused fixtures; machine contract/capability and
  Sprint truth.
- Out of scope: public route/UI, entitlement/billing/admin surfaces, live
  scanner, live FastClaw protocol, deployment, secret, remote resource or
  staging PostgreSQL mutation and credentialed acceptance.
- Taste constraints: approval precedes sandbox read; safety comes only from an
  injected authority; no filename/MIME/regex heuristic; object keys never
  authorize; metadata must never claim an absent object; cleanup is mandatory
  and destroy failure is never release-safe.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop if approval must be inferred from sandbox content or a sandbox-authored
  field, or if scanning requires a local heuristic to claim clean.
- Stop if rejected/empty/oversize/unsafe bytes can reach R2/PostgreSQL, if a
  wrong tenant can trigger object lookup, or if metadata can point to a missing
  object.
- Stop if any authority/read/scan/store failure skips destroy or an unconfirmed
  destroy can be reported release-safe.
- Stop if the slice requires a public route, live resource mutation, credential,
  new package/service or dependency.

## Falsifier

The direction is false if an unapproved candidate is read, a blocked candidate
persists, a wrong-tenant read probes R2, or a thrown scan/store path leaves the
fixture lease/files alive. The cheapest proof is the focused in-memory handoff
matrix before implementing Worker PostgreSQL/R2 adapters.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-1402-durable-memory-artifact-handoff.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md`
- Notes file: `tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-1402-durable-memory-artifact-handoff.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md
  - tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md
  - tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - packages/agent-runtime/src/durable-memory-artifact-handoff.ts
  - packages/agent-runtime/src/durable-memory-artifact-handoff.test.ts
  - packages/agent-runtime/package.json
  - apps/worker/src/durable-memory-artifact-handoff.ts
  - apps/worker/src/durable-memory-artifact-handoff.test.ts
  - deploy/database/migrations/20260711140000_durable_memory_artifact_handoff.sql
  - deploy/database/migrations.contract.json
  - deploy/fastclaw/durable-memory-artifact-handoff.contract.json
  - scripts/check-durable-memory-artifact-handoff-contract.mjs
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
    - packages/agent-runtime/src/durable-memory-artifact-handoff.ts
    - packages/agent-runtime/src/durable-memory-artifact-handoff.test.ts
    - apps/worker/src/durable-memory-artifact-handoff.ts
    - apps/worker/src/durable-memory-artifact-handoff.test.ts
    - deploy/database/migrations/20260711140000_durable_memory_artifact_handoff.sql
    - deploy/fastclaw/durable-memory-artifact-handoff.contract.json
    - scripts/check-durable-memory-artifact-handoff-contract.mjs
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md
    - tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md
  tests_pass:
    - path: packages/agent-runtime/src/durable-memory-artifact-handoff.test.ts
    - path: apps/worker/src/durable-memory-artifact-handoff.test.ts
  commands_succeed:
    - npm run check:durable-memory-artifact-handoff
    - npx vitest run packages/agent-runtime/src/durable-memory-artifact-handoff.test.ts apps/worker/src/durable-memory-artifact-handoff.test.ts packages/agent-runtime/src/sandbox-terminal-lifecycle.test.ts packages/agent-runtime/src/fastclaw-agent-runner.test.ts apps/worker/src/fastclaw-agent-runner.test.ts
    - npm run typecheck
    - npm run lint
    - npm run check:database
    - npm run check:env
    - npm test
    - node -e "JSON.parse(require('node:fs').readFileSync('.ai/context/capabilities.json','utf8')); JSON.parse(require('node:fs').readFileSync('.ai/context/capability-source-map.json','utf8')); JSON.parse(require('node:fs').readFileSync('deploy/fastclaw/durable-memory-artifact-handoff.contract.json','utf8'))"
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: approval happens before sandbox read; only complete,
  clean and bounded bytes get one R2 object plus one metadata record; destroy
  runs on all paths; tenant-scoped private reads never trust object keys.
- Edge cases: rejected/missing/duplicate/unknown approval; read failure; empty/
  over-limit bytes; unsafe/error/thrown/mismatched scan; R2/metadata/compensation
  failure; wrong tenant/key prefix; destroy failure and repeated destroy.
- Regression risks: sandbox output becoming approval authority, buffered size
  expansion, orphan R2 objects, metadata/object divergence, cross-tenant probes,
  cleanup omission and false live/deployed claims.

## Rollback Point

- Commit / checkpoint: one Row-8 commit stacked on integration base `f9dd6af`.
- Revert strategy: revert the Row-8 commit; no external cleanup is required.
