# Task Contract: live-security-load-cost-release-evidence

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-1552-live-security-load-cost-release-evidence.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: fastclaw_personal_runner
> **Last Updated**: 2026-07-11 15:52
> **Review File**: `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md`
> **Notes File**: `tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Rows 1-9 define the only acceptable dedicated-Agent path but deliberately keep
live transport, scanner, terminal sinks, staging migrations and release evidence
off. Promoting fixture success without Row 10 could bypass AiphaBee tool policy,
leak tenants, leave billable sandboxes, persist unsafe artifacts or report a
list-price estimate as an actual bill.

## Goal

Deliver a private callback-before-execution FastClaw transport and staging
composition, then produce a fresh credentialed packet for ten concurrent,
distinct tenants proving policy/isolation, authoritative scan, terminal usage,
kill, handoff, destroy, Cloudflare resource/log/billing metrics and truthful
per-run cost. Complete the Sprint only with a fresh independent security and
compliance acceptance; any missing live field keeps the feature off and this
contract Active.

## Scope

- In scope: AiphaBee service-binding transport and callback tool executor;
  FastClaw linked `dev` worktree external-tool broker/protocol and isolated VPS
  deployment; Cloudflare
  Sandbox Bridge plus independent scanner; shared staging Hyperdrive migration
  and synthetic tenant fixtures; terminal usage/handoff/kill/cleanup; official
  list-price methodology, Analytics/Logs/Billing readback, redacted packet and
  independent review.
- Out of scope: production/public enablement, automatic plan-tier routing,
  permanent sandbox, opaque SSE/local FastClaw tool execution, Sandbank/
  Cloudbank/Boxlite fallback, raw secrets/identifiers/payload evidence, posted
  customer billing, or an `actual_bill=true` claim without Billing Read.
- Taste constraints: AiphaBee remains run/event/tool-policy authority; every
  tool proposal blocks for its exact callback result; observed fields come only
  from provider/runtime authority; scanner is independent from the execution
  sandbox; live failure is explicit and feature-off, never compatibility code.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop live execution before mutation if the target is not exact shared staging
  PostgreSQL/Cloudflare account or cleanup ownership is incomplete.
- Stop release completion if callback transport, authoritative scanner,
  migration readback, ten distinct live tenants, any required metric, terminal
  cleanup/kill readback, Billing Read or fresh independent review is absent.
- Stop if any design lets FastClaw execute a tool locally before AiphaBee policy,
  treats provider IDs as authorization, or stores raw credentials/payloads.
- Stop if implementation requires a production/public route or provider fallback.

## Falsifier

The direction is false if a FastClaw tool proposal can execute without an exact
AiphaBee callback, two tenants can address the same run/lease, timeout/cancel
leaves a provider instance, or measured provider units cannot be joined to one
run. The cheapest proof is the deterministic linked protocol test: hold the
FastClaw model loop at a tool proposal, prove no executor side effect, post one
matching result, then reject duplicate-changed/cross-run results.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md`
- Notes file: `tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-1552-live-security-load-cost-release-evidence.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - plans/sprints/20260710-fastclaw-aiphabee-staging.sprint.md
  - plans/sprints/20260703-agent-control-plane-convergence.sprint.md
  - plans/sprints/20260703-dual-agent-v2.sprint.md
  - plans/sprints/20260703-dual-agent.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md
  - tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md
  - tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - apps/worker/package.json
  - packages/agent-runtime/src/
  - packages/agent-runtime/package.json
  - packages/sandbox-run-auth/src/
  - apps/worker/src/
  - apps/worker/wrangler.jsonc
  - apps/sandbox-bridge/src/
  - apps/sandbox-bridge/scanner/
  - apps/sandbox-bridge/Dockerfile
  - apps/sandbox-bridge/ScannerDockerfile
  - apps/sandbox-bridge/package.json
  - apps/sandbox-bridge/wrangler.jsonc
  - deploy/database/migrations.contract.json
  - deploy/database/migrations/20260711140000_durable_memory_artifact_handoff.sql
  - deploy/database/migrations/20260711151100_research_agent_product_control.sql
  - deploy/database/migrations/20260711164500_fastclaw_live_runtime_policies.sql
  - deploy/env/
  - deploy/cloudflare/bindings.contract.json
  - deploy/secrets/stores.contract.json
  - deploy/fastclaw/
  - scripts/deploy-fastclaw-vps-staging.mjs
  - deploy/runbooks/fastclaw-row10-live-acceptance.md
  - docs/researches/20260711-fastclaw-live-cost-methodology.md
  - docs/researches/20260709-fastclaw-sandbox-backend-selection.md
  - docs/researches/20260710-gpt-planning-pack-distillation.md
  - docs/spec.md
  - scripts/check-fastclaw-live-release-evidence-contract.mjs
  - scripts/check-fastclaw-aiphabee-staging-contract.mjs
  - scripts/check-durable-memory-artifact-handoff-contract.mjs
  - scripts/check-fastclaw-agent-runner-contract.mjs
  - scripts/check-fastclaw-dedicated-agent-provisioning-contract.mjs
  - scripts/check-research-agent-product-control-contract.mjs
  - scripts/run-fastclaw-live-release-evidence.ts
  - scripts/apply-fastclaw-row10-staging-migrations.mjs
  - scripts/cleanup-fastclaw-row10-live-acceptance.mjs
  - package.json
  - package-lock.json
  - tests/shims/cloudflare-workers.ts
  - plans/prds/20260710-1702-dual-agent-v3.prd.md
  - plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md
  - plans/plan-20260710-1837-runner-selection-contract.md
  - plans/plan-20260710-2129-sandbox-backend-port.md
  - plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md
  - plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md
  - plans/plan-20260711-0346-sandbox-terminal-lifecycle.md
  - plans/plan-20260711-1045-dedicated-agent-provisioning.md
  - plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md
  - plans/plan-20260711-1402-durable-memory-artifact-handoff.md
  - plans/plan-20260711-1512-entitlement-billing-admin-user-status.md
  - tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md
  - tasks/contracts/20260710-1837-runner-selection-contract.contract.md
  - tasks/contracts/20260710-2129-sandbox-backend-port.contract.md
  - tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md
  - tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md
  - tasks/contracts/20260711-0346-sandbox-terminal-lifecycle.contract.md
  - tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md
  - tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md
  - tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md
  - tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md
  - tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md
  - tasks/notes/20260710-1837-runner-selection-contract.notes.md
  - tasks/notes/20260710-2129-sandbox-backend-port.notes.md
  - tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md
  - tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md
  - tasks/notes/20260711-0346-sandbox-terminal-lifecycle.notes.md
  - tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md
  - tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md
  - tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md
  - tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md
  - tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md
  - tasks/reviews/20260710-1837-runner-selection-contract.review.md
  - tasks/reviews/20260710-2129-sandbox-backend-port.review.md
  - tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md
  - tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md
  - tasks/reviews/20260711-0346-sandbox-terminal-lifecycle.review.md
  - tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md
  - tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md
  - tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md
  - tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md
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
    - apps/worker/src/fastclaw-service-transport.ts
    - apps/worker/src/fastclaw-live-composition.ts
    - deploy/fastclaw/live-security-load-cost-release-evidence.contract.json
    - scripts/check-fastclaw-live-release-evidence-contract.mjs
    - scripts/run-fastclaw-live-release-evidence.ts
    - deploy/runbooks/fastclaw-row10-live-acceptance.md
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md
    - tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md
  tests_pass:
    - path: apps/worker/src/fastclaw-service-transport.test.ts
    - path: apps/worker/src/fastclaw-live-composition.test.ts
  commands_succeed:
    - npm run check:fastclaw-live-release-evidence
    - npx vitest run apps/worker/src/fastclaw-service-transport.test.ts apps/worker/src/fastclaw-live-composition.test.ts packages/agent-runtime/src/fastclaw-agent-runner.test.ts apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts
    - npm run typecheck
    - npm run lint
    - npm run check:database
    - npm run check:env
    - npm test
    - npx wrangler deploy --dry-run --containers-rollout=none --config apps/sandbox-bridge/wrangler.jsonc
    - node scripts/run-fastclaw-live-release-evidence.ts --check-packet _ops/fastclaw-row10/live-release-evidence.json
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 7
```

## Acceptance Notes (Human Review)

- Functional behavior: exact callback-before-execution, private service binding,
  ten-way distinct tenant execution, terminal usage/handoff/destroy, measured
  provider facts and truthful raw/invoice cost separation.
- Edge cases: changed/duplicate/cross-run tool result; timeout/cancel/kill;
  scanner unsafe/error; migration partial state; Analytics/Logs/Billing denial;
  cross-tenant lease/object access; cleanup retry and residual instance.
- Regression risks: local FastClaw tools execute before callback, normal
  FastClaw flows inherit external broker, service-binding route becomes public,
  synthetic rows survive, metrics are sampled/estimated, included allotments
  are double counted, or stale reviewer fingerprint promotes the feature.

## Rollback Point

- Commit / checkpoint: one AiphaBee Row-10 commit stacked on `4a4dde7` plus one
  explicitly linked FastClaw commit from `dev@35cd5ad`.
- Revert strategy: revert both commits; disable staging release flag; delete
  temporary acceptance Worker/Container/scanner resources, secrets, synthetic
  rows and objects; read back no public route, no active sandbox and no lease.
