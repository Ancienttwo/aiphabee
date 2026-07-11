# Plan: Entitlement Billing Admin User Status

> **Status**: Complete
> **Created**: 20260711-1512
> **Slug**: entitlement-billing-admin-user-status
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#entitlement-billing-admin-user-status
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Deterministic account/usage/admin fixtures prove temporal entitlement without auto-routing, five-state user status, observed per-run model/tool/sandbox/storage attribution into existing preview billing trace, current owner/admin authority, idempotent lifecycle/kill/audit actions and non-leakage; full test/type/lint, database/env, machine contract, review and strict Sprint verification pass without live dispatch or posted billing.
> **Rollback Surface**: Revert the single stacked Row-9 AiphaBee commit; no Cloudflare deploy/resource, staging PostgreSQL mutation, billing-provider post, secret, public route or live Agent run is created.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md`
> **Task Review**: `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md`
> **Implementation Notes**: `tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#entitlement-billing-admin-user-status
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-1512-entitlement-billing-admin-user-status.md`
- Sprint contract: `tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md`
- Sprint review: `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md`
- Implementation notes: `tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-1512-entitlement-billing-admin-user-status.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-1512-entitlement-billing-admin-user-status.md`.

## Approach
### Strategy
Use the captured planning output below as the execution source of truth.

### Trade-offs
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Captured plan | Preserves the approved Codex Plan or Waza think decision | Requires the captured text to be concrete enough to execute | Use |

## Detailed Design
### File Changes
| File | Action | Description |
|------|--------|-------------|
| See captured planning output | Follow | Implement only the approved scope named below |

### Code Snippets
See captured planning output.

### Data Flow
See captured planning output.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Captured plan lacks enough detail | Medium | Execution may need clarification | Stop before implementation if the captured output contradicts repo rules or lacks concrete file targets |

## Task Contracts
- Contract file: `tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md`
- Review file: `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md`
- Implementation notes file: `tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-1512-entitlement-billing-admin-user-status.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the single stacked Row-9 AiphaBee commit; no Cloudflare deploy/resource, staging PostgreSQL mutation, billing-provider post, secret, public route or live Agent run is created.
- **Verification boundary**: Deterministic account/usage/admin fixtures prove temporal entitlement without auto-routing, five-state user status, observed per-run model/tool/sandbox/storage attribution into existing preview billing trace, current owner/admin authority, idempotent lifecycle/kill/audit actions and non-leakage; full test/type/lint, database/env, machine contract, review and strict Sprint verification pass without live dispatch or posted billing.
- **Review/acceptance boundary**: `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-1512-entitlement-billing-admin-user-status.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md`, `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md`, and `tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the single stacked Row-9 AiphaBee commit; no Cloudflare deploy/resource, staging PostgreSQL mutation, billing-provider post, secret, public route or live Agent run is created.

## Captured Planning Output

## Approved Design Summary

Land Row 9 as one private Worker-owned product-control boundary that reuses the
existing account/workspace/entitlement authority, research Agent lifecycle,
usage ledger and sandbox kill contract. It exposes serializable user status,
observed per-run usage/billing attribution and authorised admin operations
without creating a second runner-selection authority or turning a paid plan
into automatic FastClaw routing.

User status resolves the Better Auth subject to one active account/workspace
membership and reads the temporal entitlement plus research Agent profile in a
single PostgreSQL snapshot. It maps internal lifecycle states to exactly
`provisioning|ready|retryable|blocked|disabled`, reports FastClaw availability,
and explicitly says selection remains Agent Runtime-owned, default Edge is
unchanged, and paid/entitled status does not auto-select FastClaw.

Observed model/tool/sandbox/storage measurements are stored once per run in a
new AiphaBee detail table and linked to the existing `usage_event` and
`usage_ledger_entry` records with a preview credit delta. Replays must match the
original measurement exactly; mismatched replay fails closed. Admin
`retry|disable|delete|kill` requires a current owner/admin membership, writes a
request-keyed admin event, reuses the lifecycle service or an injected
idempotent run-killer, and resumes safely after partial completion. Audit reads
are tenant-scoped and never expose raw FastClaw identifiers.

This row adds a deterministic private service and concrete PostgreSQL
repository but no public route, billing-provider post, live run registry,
Cloudflare deployment or staging database mutation. Row 10 owns credentialed
live dispatch, real concurrent kill/readback, security/load/cost evidence and
release approval.

The user approved completing the remaining Sprint by setting the active goal
to `完成整个Sprint方案` after Row 8 completed.

## Not Building

- No second runner router, plan-tier-to-runner mapping, automatic FastClaw use
  for every paid request, public admin endpoint, raw bearer-header user auth,
  billing-provider charge, invoice post, live price formula or credit estimate.
- No fabricated sandbox/storage usage. Only observed measurements from the
  model/tool/lifecycle/handoff authorities are accepted; `estimated:true` is
  rejected.
- No admin bypass by service token alone. Actor identity and current temporal
  owner/admin membership are required for every action and audit read.
- No direct sandbox handle/object-key authority, shared user identity, remote
  FastClaw ID exposure, compatibility fallback or heuristic state repair.
- No live Cloudflare resource, scanner, secret or staging PostgreSQL mutation.

## P1: Architecture Map

```text
Better Auth subject
  -> platform active account + exact workspace membership
  -> temporal subscription/product/entitlement + research_agent_profile
  -> user status projection (no routing decision)

observed run measurements
  -> research_agent_run_usage detail
  -> existing usage_event
  -> existing usage_ledger_entry (preview, not provider-posted)

admin auth subject
  -> current owner/admin membership
  -> request-keyed research_agent_admin_event
  -> retry/disable/delete -> existing lifecycle service
  -> kill -> injected idempotent run-killer
  -> tenant-scoped audit read
```

Authority and ownership:

1. Agent Runtime remains the only runner-selection authority. Row 9 reports
   availability and default Edge posture; it never returns a selected runner.
2. Platform account/workspace/membership/subscription/product/entitlement rows
   and the Row-6 research Agent profile remain status authority. One SQL
   snapshot prevents mixed-clock status.
3. The Row-6 lifecycle service remains provisioning/retry/disable/delete
   authority. Admin control supplies actor approval and audit, not a parallel
   lifecycle state machine.
4. Row-5 SandboxBackend kill remains compute authority. Row 9 defines and tests
   an idempotent killer port; live lease/runner composition remains Row 10.
5. Existing usage_event/usage_ledger_entry remain billing trace authority. The
   new detail table preserves dimensions those generic tables cannot represent:
   observed sandbox resource and storage operation measurements.
6. PostgreSQL RLS scopes status/usage/admin rows by account/workspace. Raw
   FastClaw user/Agent IDs and sandbox handles are absent from all product
   responses and admin events.

This touches more than eight files because one new service/test, one migration,
the migration registry, machine contract/checker, capability truth and the
required plan/contract/review/notes/Sprint artifacts must move together. It adds
no dependency, package or service.

At 10x, the first pressure point is usage-event write volume and admin/lifecycle
contention on one profile, not status projection. A unique run row plus existing
request-keyed lifecycle/admin idempotency bounds duplicates; load and billing
cost calibration remain Row 10.

## P2: Concrete Trace

### User status

1. A private caller supplies `better-auth:<uuid>`, workspace ID and request ID.
2. One PostgreSQL statement resolves the active account, current membership,
   subscription/plan, product access, `research_agent_enabled` entitlement and
   exact account/workspace profile. Missing/multiple/mismatched authority fails
   closed; no default workspace is invented.
3. The service maps authority/profile to a stable user state:
   unentitled/inactive -> blocked; active -> ready; retryable failure ->
   retryable; pending lifecycle -> provisioning; disabled/deleted/no profile ->
   disabled.
4. The response includes plan code, entitlement state, lifecycle state,
   availability and latest observed usage totals, but runner fields state
   `selection_owner=agent_runtime`, `selected_runner_family=null`,
   `paid_plan_auto_selects_fastclaw=false`, `default_runner_family=edge`.

### Usage and billing attribution

1. Private run orchestration supplies exact workspace/account/request/run IDs,
   occurred time, model input/output tokens, successful/failed tool calls,
   sandbox wall/CPU/peak memory/peak disk, storage bytes/operations, preview
   credit delta, policy/methodology/source IDs and `measurement=observed`.
2. Validation rejects negative/non-integer dimensions, unsafe identifiers,
   invalid time, estimated measurement and missing attribution before SQL.
3. The repository begins one transaction, reads an existing run record, and
   either returns an exact replay or rejects a mismatched replay.
4. A new record inserts deterministic `usage_event` and preview
   `usage_ledger_entry` linked to an active FastClaw meter rule, then inserts the
   detailed run row. Concurrent conflict is read back and must match exactly.
5. Status aggregation sums only exact tenant/account rows. No provider billing
   call or posted charge occurs in Row 9.

### Admin action and audit

1. Admin input contains actor Better Auth subject, workspace, target account,
   request ID, reason, action and run ID only for kill.
2. PostgreSQL resolves current temporal membership. Only owner/admin is
   allowed; member/viewer/billing/inactive/missing actors fail before lifecycle
   or killer calls and write a denied admin event when actor identity is known.
3. `beginAdminAction` inserts or replays the exact request/action/target tuple.
   A different tuple under the same request ID fails closed.
4. retry/disable/delete invoke the existing lifecycle service with the same
   request ID; kill invokes the injected run-killer with tenant/run ownership.
   Both dependencies must be idempotent.
5. Success/failure finalises one admin event. If the process dies after the
   dependency succeeds, retry resumes the started event, the dependency replay
   is idempotent, and finalisation completes.
6. Authorised audit queries filter by workspace and optional target account;
   returned events contain actor/target/action/outcome/error/run hash/reference
   but no FastClaw remote IDs, tokens, sandbox lease or raw error message.

Async boundaries are PostgreSQL authority/status/transaction/audit, lifecycle
service, run killer and usage writes. Every downstream call happens only after
current authority resolution.

## P3: Decision Rationale

- Project status, not routing. Returning a selected FastClaw runner here would
  duplicate Agent Runtime authority and make paid entitlement a hidden routing
  rule. Status reports capability only.
- Reuse generic usage/billing rows and add one detail table. Encoding sandbox
  CPU/memory/disk and storage operations into `metered_rows` or token fields
  would corrupt meaning; a linked detail row is the smallest honest extension.
- Preview credits only. Row 9 proves attribution and billing traceability; Row
  10 must establish live cost and approved price methodology before posted
  billing or provider calls.
- Reuse lifecycle and kill ports. Admin control owns authorisation/idempotency/
  audit, while lifecycle and compute remain the side-effect authorities.
- Use Better Auth subject resolution and DB membership, not a trusted user ID
  header or shared lifecycle token. Service bindings may transport the call but
  never replace actor authority.
- Record started admin operations before side effects and require idempotent
  dependency replay. This closes crash windows without an unbounded queue or a
  second lifecycle model.

The fragile assumption is that live runner orchestration can provide observed
sandbox resource and storage-operation counters. If Row 10 proves a required
counter unavailable, release stays blocked; Row 9 does not synthesize it from
wall time or file size.

Rollback is one stacked Row-9 commit. Revert removes the private service,
migration and local contracts; no external cleanup is required because this row
does not apply the migration or create live state.

## Expected File Surface

- `apps/worker/src/research-agent-product-control.ts` (new)
- `apps/worker/src/research-agent-product-control.test.ts` (new)
- `deploy/database/migrations/20260711151100_research_agent_product_control.sql` (new)
- `deploy/database/migrations.contract.json`
- `deploy/fastclaw/research-agent-product-control.contract.json` (new)
- `scripts/check-research-agent-product-control-contract.mjs` (new)
- `package.json`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- active Sprint plus Row-9 plan/contract/review/notes artifacts.

No dependency, package, public route, Worker binding or live deploy change.

## Test Matrix

- Status: entitled+active -> ready; pending -> provisioning; retryable ->
  retryable; disabled/deleted/no profile -> disabled; entitlement/account/
  workspace/membership/subscription/product failure -> blocked.
- Routing boundary: free, paid, entitled and ready statuses all report no
  selected runner; default Edge and Agent Runtime selection authority remain.
- Usage: all model/tool/sandbox/storage fields persist under one run and link to
  usage_event/preview ledger; exact replay succeeds; changed replay, estimated,
  negative/overflow/malformed IDs and cross-tenant aggregation fail.
- Admin auth: owner/admin allowed; member/viewer/billing/inactive/missing actor
  denied before side effect; target identity never grants admin authority.
- Admin lifecycle: retry/disable/delete call existing lifecycle intent exactly
  once per initial request and replay idempotently; dependency denial/failure is
  recorded without raw error leakage.
- Kill: exact workspace/run ownership reaches idempotent killer; replay and
  crash-window retry are one logical action; wrong/missing run blocks.
- Audit: workspace/target filters, stable ordering, RLS, actor/action/outcome and
  no remote IDs/tokens/lease/raw error.
- Regression: existing lifecycle/runner/handoff tests, full test/type/lint,
  database/env, machine contract/JSON/diff, independent review and strict
  contract/Sprint verification.

## Acceptance Checklist

- [x] Temporal entitlement gates FastClaw availability but never auto-selects it.
- [x] User status exposes provisioning/ready/retryable/blocked/disabled.
- [x] Observed model/tool/sandbox/storage usage is attributable by run.
- [x] Usage links to existing usage_event and preview usage_ledger_entry.
- [x] Exact replay is idempotent; mismatched replay fails closed.
- [x] Only current owner/admin can retry/disable/delete/kill or read audit.
- [x] Admin side effects reuse existing lifecycle/kill authorities and are
      request-idempotent and recorded.
- [x] Product/admin records expose no remote IDs, tokens, lease or raw errors.
- [x] No public route, provider billing, deploy or staging PG mutation lands.
- [x] Targeted/full regression, review and strict verification pass.

## Stop Conditions

- Stop if product control must select a runner or plan tier becomes an automatic
  FastClaw route.
- Stop if sandbox/storage usage must be estimated, inferred or stuffed into an
  unrelated generic usage field.
- Stop if admin action can proceed without current owner/admin membership or if
  lifecycle/kill is reimplemented locally.
- Stop if idempotency cannot distinguish exact replay from changed payload, or
  if a crash window can create an unrecorded repeated side effect.
- Stop if the slice requires public auth/header trust, billing-provider calls,
  live resources, secrets, staging mutation, a new dependency/package/service
  or paths outside the contract.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Temporal entitlement gates FastClaw availability but never auto-selects it.
- [x] User status exposes provisioning/ready/retryable/blocked/disabled.
- [x] Observed model/tool/sandbox/storage usage is attributable by run.
- [x] Usage links to existing usage_event and preview usage_ledger_entry.
- [x] Exact replay is idempotent; mismatched replay fails closed.
- [x] Only current owner/admin can retry/disable/delete/kill or read audit.
- [x] Admin side effects reuse existing lifecycle/kill authorities and are
      request-idempotent and recorded.
- [x] Product/admin records expose no remote IDs, tokens, lease or raw errors.
- [x] No public route, provider billing, deploy or staging PG mutation lands.
- [x] Targeted/full regression, review and strict verification pass.
