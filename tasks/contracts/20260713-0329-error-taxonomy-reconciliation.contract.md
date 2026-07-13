# Task Contract: error-taxonomy-reconciliation

> **Status**: Completed
> **Plan**: plans/plan-20260713-0329-error-taxonomy-reconciliation.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-13 03:29
> **Review File**: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md`
> **Notes File**: `tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Rows 2–3 depend on a frozen failure contract. Today the owner-local error sets are valid, but the deployed MCP mapping declares only 12 of the 36 private MCP errors mapped in source. Without one exact reconciliation ledger, public exposure, retry ownership, redaction, and future additions can drift without detection.

## Goal

Deliver one machine-checkable cross-owner error reconciliation contract that covers the selected current authorities, preserves their ownership boundaries, completes MCP source/deployed 36/36 mapping parity, and rejects missing, extra, aliased, heuristic, or private-leaking semantics. Runtime behavior and the deliberate 11-code MCP public subset remain unchanged.

## Scope

- In scope:
  - Add a Data Contracts-owned reconciliation-only JSON ledger.
  - Add positive and mutation-based negative tests.
  - Add an AST/JSON exact-set checker with deterministic missing/extra diagnostics.
  - Complete `deploy/mcp/error-codes.contract.json` private mapping parity from 12/36 to 36/36.
  - Add the checker to root package scripts and record implementation evidence.
- Out of scope:
  - Rows 2–3, evidence composition, rights, exact tool-ID reconciliation, Gate 0, or live activation.
  - Any Agent Runtime, Tool Registry, Worker, Web, database, FastClaw implementation, or completed Sprint behavior change.
  - A global mega-enum, planning-pack seventeen-error import, compatibility aliases, regex mapping, or heuristic retry.
- Taste constraints: existing owner-local error types remain authoritative; the matrix validates but never generates runtime enums.

## Stop Conditions

- Stop if the change requires a path outside Allowed Paths.
- Stop if one semantic identity has multiple canonical owners or any owner/retry value must be guessed.
- Stop if extraction requires regex, names, messages, HTTP status, locale, or another semantic heuristic.
- Stop if the design requires expanding shared `ERROR_CODES` into a mega-enum or publishing Agent/FastClaw/provider/sandbox details.
- Stop if unknown errors cannot project to generic non-retryable `INTERNAL_ERROR` while retaining raw identity only in internal audit.
- Stop if Worker, Agent Runtime, Tool Registry, rights, evidence, database, or live behavior must change.
- Stop if a fresh-worktree baseline failure prevents attribution or an exit command cannot run.

## Falsifier

The direction is wrong if an existing canonical cross-owner error contract already owns these semantics, or exact source extraction proves the proposed ledger must replace owner-local enums. Cheapest proof: run the checker in source-inventory mode before adding public semantics; any unresolved owner collision stops implementation.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260713-0329-error-taxonomy-reconciliation.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md`
- Notes file: `tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - packages/data-contracts/src/error-taxonomy-reconciliation.contract.json
  - packages/data-contracts/src/error-taxonomy-reconciliation.contract.test.ts
  - deploy/mcp/error-codes.contract.json
  - scripts/check-error-taxonomy-reconciliation-contract.mjs
  - package.json
  - plans/plan-20260713-0329-error-taxonomy-reconciliation.md
  - tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md
  - tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md
  - tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md
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
    - packages/data-contracts/src/error-taxonomy-reconciliation.contract.json
    - packages/data-contracts/src/error-taxonomy-reconciliation.contract.test.ts
    - scripts/check-error-taxonomy-reconciliation-contract.mjs
  artifacts_exist:
    - tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md
  tests_pass:
    - path: packages/data-contracts/src/error-taxonomy-reconciliation.contract.test.ts
  commands_succeed:
    - npm run check:error-taxonomy-reconciliation
    - npm run check:mcp-error-codes
    - npm run check:tool-registry
    - npx vitest run packages/data-contracts/src packages/mcp-runtime/src packages/agent-runtime/src packages/tool-registry/src
    - npm run typecheck --workspace @aiphabee/data-contracts
    - npm run typecheck --workspace @aiphabee/mcp-runtime
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run typecheck --workspace @aiphabee/tool-registry
    - npm run check:task-sync
    - LC_ALL=C repo-harness run check-task-workflow --strict
    - git diff --check
  manual_checks:
    - "Independent review recommends pass"
    - "Diff is contained by allowed_paths and Rows 2-3 remain untouched"
```

## Acceptance Notes (Human Review)

- Functional behavior: exact source/matrix/deployed parity with unchanged runtime semantics and unchanged 11-code MCP public subset.
- Edge cases: missing/extra code, duplicate owner, alias, private channel leakage, undeclared retry, unknown redaction, and open-string promotion fail closed.
- Regression risks: TypeScript source selectors and deployed mapping drift; checker diagnostics must print exact IDs.

## Rollback Point

- Commit / checkpoint: pre-row HEAD `ab624e777adb47babd93590a3c631178a6023fad` plus this isolated worktree diff.
- Revert strategy: remove matrix/checker/test/script wiring and restore the pre-row MCP contract atomically; keep plan/contract/review/notes as audit evidence and rerun the pre-row baseline.
