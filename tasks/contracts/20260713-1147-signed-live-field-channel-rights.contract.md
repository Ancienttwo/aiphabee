# Task Contract: signed-live-field-channel-rights

> **Status**: Completed
> **Plan**: plans/plan-20260713-1147-signed-live-field-channel-rights.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-13 11:47
> **Review File**: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md`
> **Notes File**: `tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

`check:p0-field-distribution-status` fails by comparing the canonical 23-ID P0 rights set against the 24-ID registry-required floor with `===`. The three tool authorities (23 partner-licensed catalog, 24 registry-required, 25 registered) legitimately differ, but no exact-ID contract records why. Row 3 must reconcile them by named classification so unresolved rights stay default-denied, and external activation must remain blocked without authentic signed evidence.

## Goal

Replace the count comparison with exact-ID cross-source reconciliation anchored on the canonical `p0-tool-catalog` 23-ID set: prove `catalog(23) ⊆ registry(24) ⊆ RegisteredToolName(25)` and that every extra ID is a named, authority-grounded non-P0-rights-scoped exclusion. Keep deployed `required_p0_tool_count: 23`. Preserve default deny. With 0/6 signed packets, the only lawful terminal is `local_readiness_complete + blocked_external_activation`.

## Scope

- In scope: exact IDs + named exclusions in `p0-field-distribution-status` and `p0-rights-matrix-coverage` contracts; rewrite both checkers to exact-ID reconciliation with printed missing/extra; a fail-closed negative fixture; workflow artifacts.
- Out of scope: Data Access Gateway runtime (25-layer, already passing), `packages/tool-registry/src/index.ts`, `registry.contract.json`, `p0-tool-catalog.contract.json` (frozen SoT), any `gate0-*` contract, any packet file, live activation, DB, frontend, completed FastClaw, `.claude/agents/**`, `.claude/worktrees/**`, `_ref/**`, `_ops/**`.
- Taste constraints: exact-ID reconciliation only; never bump a count; never weaken a checker; never self-sign or infer rights.

## Stop Conditions

- Stop on any required path outside Allowed Paths.
- Stop if reconciliation needs an unapproved product-scope decision (e.g. moving a tool into/out of the partner-licensed P0 set), only a count change, or checker weakening.
- Stop if a signed packet is absent/placeholder/self-authored/stale/scope-mismatched, or live cutover/readback is unavailable — external activation stays blocked.
- Stop if any path would allow an unresolved dimension, bypass the Gateway, omit `rights_policy_version`, or infer rights from storage/ingestion/provider/fixtures/Netquity mirror.
- Stop if rollback cannot restore default deny, or a baseline failure prevents attribution.

## Falsifier

The direction is wrong if a governance owner asserts (with authority) that `analyze_public_technical_signal`'s ephemeral OHLCV is partner-redistributable, which would require a new dataset group — a product decision → STOP. Cheapest proof: `docs/spec.md §Ephemeral Public OHLCV` states no market storage / shared cache / redistribution, and its dataClasses are absent from the 10 partner-licensed dataset groups.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260713-1147-signed-live-field-channel-rights.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md`
- Notes file: `tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - deploy/governance/p0-field-distribution-status.contract.json
  - deploy/gateway/p0-rights-matrix-coverage.contract.json
  - scripts/check-p0-field-distribution-status-contract.mjs
  - scripts/check-p0-rights-matrix-coverage-contract.mjs
  - scripts/check-p0-field-distribution-status-fixtures.mjs
  - package.json
  - plans/plan-20260713-1147-signed-live-field-channel-rights.md
  - tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md
  - tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md
  - tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md
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
    - deploy/governance/p0-field-distribution-status.contract.json
    - deploy/gateway/p0-rights-matrix-coverage.contract.json
    - scripts/check-p0-field-distribution-status-contract.mjs
    - scripts/check-p0-field-distribution-status-fixtures.mjs
  artifacts_exist:
    - tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md
  commands_succeed:
    - npm run check:p0-field-distribution-status
    - npm run check:p0-field-distribution-status-fixtures
    - npm run check:p0-rights-matrix-coverage
    - npm run check:tool-registry
    - npm run check:field-rights-runtime
    - npm run check:field-rights-live-policy-source
    - npm run check:gate0-external-evidence-intake
    - npm run check:gate0-signed-evidence-manifest
    - npm run check:gate0-signed-evidence-packets
    - npm run check:gate0-signed-evidence-transition-review
    - npm run check:traceability-matrix
    - npx vitest run packages/tool-registry/src packages/data-access-gateway/src packages/evidence-lineage/src
    - npm run typecheck --workspace @aiphabee/data-access-gateway
    - npm run typecheck --workspace @aiphabee/tool-registry
    - npm run check:task-sync
    - LC_ALL=C repo-harness run check-task-workflow --strict
    - git diff --check
  manual_checks:
    - "Independent review recommends pass"
    - "required_p0_tool_count stays 23 in both deployed contracts; no count bumped"
    - "Gate 0 accepted_packets remain 0/6; terminal is local_readiness_complete + blocked_external_activation with default deny"
```

## Acceptance Notes (Human Review)

- Functional behavior: exact-ID reconciliation over 23/24/25 with named exclusions; both P0 rights contracts pass; runtime and gate0 unchanged.
- Edge cases: an unclassified 26th tool, a P0 id missing from the catalog, or an unexplained registry/registered extra must fail closed with printed missing/extra.
- Regression risks: `required_p0_tool_count` must stay 23 in the deployed contracts; gateway runtime 25-layer and gate0 packets untouched.

## Rollback Point

- Commit / checkpoint: frozen Rows 1–2 state at pre-row HEAD.
- Revert strategy: revert both contracts, both checkers, the fixture and package wiring atomically; rerun p0-field-distribution/p0-rights-matrix/field-rights/gate0 checks to prove default deny restored. Activation rollback (disable live reads, restore prior rights_policy_version, invalidate versioned caches, return to default deny) is reserved for a separately approved activation only.
