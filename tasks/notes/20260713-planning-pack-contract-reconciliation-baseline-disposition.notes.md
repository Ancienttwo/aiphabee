# Planning Pack Contract Reconciliation Closure — Baseline Disposition

> **Status**: Recorded
> **Date**: 2026-07-13
> **Source PRD**: `plans/prds/20260713-0029-planning-pack-contract-reconciliation-closure.prd.md`
> **Source Sprint**: `plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md`
> **Scope**: Planning-only workflow baseline attribution; no contract-row implementation or workflow-gate bypass.

## Decision

The Draft PRD and Draft Sprint are synchronized through this task note. `tasks/todos.md` remains the deferred-goal ledger and is not the active backlog.

The deployment SQL checker mismatch has been closed through an explicit fail-closed `operations.deploy_sql` policy in `.ai/harness/policy.json`. The policy names the repository's four existing, non-overlapping SQL roots and their filename contracts; it does not move, rename, copy, or reinterpret any SQL asset. `repo-harness run check-deploy-sql-order` now passes.

The completed FastClaw metadata findings have been reconciled under separate user authorisation by changing only their unsupported `Status: Complete` metadata to the policy-supported terminal status `Done`. Their backlog, Execution Log, acceptance evidence, implementation, and completed scope remain unchanged.

No compatibility shim, alternate checker, weakened gate, or false green status is introduced.

## P1 — Authority Map

- Workflow policy: `.ai/harness/policy.json`, including the explicit `operations.deploy_sql` roots and naming modes.
- Global helper runtime: `repo-harness run ...`; the installed CLI is linked to the reviewed `/Users/ancienttwo/Projects/repo-harness` source while this unreleased checker change is in use.
- Deployment layout authority: `deploy/README.md` and the configured policy retain `deploy/database/migrations`, `deploy/database/roles`, `deploy/account`, and `deploy/ingest` as the only SQL roots.
- Existing deferred decision: `tasks/todos.md` records the historical deploy SQL/checker mismatch and the locale-sensitive PRD parser; the SQL mismatch is now locally resolved by explicit policy without migrating assets.
- Completed FastClaw boundary: the two tracked completed Sprint files are read-only for this goal.

## P2 — Reproduced Path

1. `repo-harness run check-task-sync` scans modified/untracked files and requires at least one synchronized file under `tasks/**` or `docs/researches/**`.
2. Before this note, the Draft PRD and Sprint were planning changes without a synchronized task artifact, so the checker exited 1.
3. This note is the bounded synchronization artifact for the planning-only goal; it does not create an active task checklist.
4. `repo-harness run check-task-workflow --strict` invokes the SQL checker and validates every PRD/Sprint status.
5. The SQL checker reads `operations.deploy_sql`, rejects invalid, traversing, missing, or overlapping roots, requires every `deploy/**/*.sql` file to belong to exactly one configured direct-child root, and validates each root's declared naming mode.
6. Under the default locale, the packaged AWK parser can fail on Chinese PRD text. `LC_ALL=C` removes that parser false positive.
7. After separate user authorisation, both completed FastClaw files use the policy-supported terminal status `Done`; no non-metadata content changed.

## P3 — Smallest Coherent Change

The task note, explicit deploy SQL policy, and two status-only FastClaw metadata corrections are the only AiphaBee baseline changes. No SQL asset or reference changes, and no completed FastClaw backlog, execution evidence, acceptance, or implementation changes.

At 10× SQL assets, copying or symlinking files into `deploy/sql/` would create two deployment authorities and fail first through migration identity/reference drift. The safe invariant is one authoritative SQL path per asset, with any checker change made explicitly rather than through duplicate files.

## Verification Record

Commands rerun for this disposition:

```bash
repo-harness run check-task-sync
LC_ALL=C repo-harness run check-task-workflow --strict
repo-harness run check-deploy-sql-order
git diff --check
```

Expected interpretation:

- task sync, deploy SQL, and strict workflow checks must pass;
- locale-related PRD parsing must disappear under `LC_ALL=C`;
- both completed FastClaw files must differ from their pre-reconciliation content only at the `Status` value;
- no check result may be reported as green when it exits non-zero.

## Stop Conditions Preserved

- Do not touch `.claude/agents/**`, `.claude/worktrees/**`, `_ref/**`, `_ops/**`, or unrelated user WIP.
- Do not modify or reopen completed FastClaw Sprints in this goal.
- Do not move, rename, duplicate, or relabel deployment SQL without a dedicated migration contract and reference audit.
- Do not execute any of the three Sprint contract rows.
- Do not commit, push, deploy, sign, or activate live rights.
