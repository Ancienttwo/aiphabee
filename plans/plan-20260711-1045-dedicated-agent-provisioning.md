# Plan: Dedicated Agent Provisioning

> **Status**: Complete
> **Created**: 20260711-1045
> **Slug**: dedicated-agent-provisioning
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#dedicated-agent-provisioning
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Disposable PostgreSQL fixtures prove one active identity under concurrent provision, audited retryable conflict, partial-success retry, idempotent disable/re-enable/delete, temporal entitlement expiry denial and expired-lease reclaim; the exact FastClaw dev commit and five control routes are machine-pinned; targeted/full/type/lint/strict review and Sprint verification pass.
> **Rollback Surface**: Revert the single Row-6 stacked commit; no deploy, migration, secret, shared staging database write, FastClaw checkout mutation or live resource is created.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md`
> **Task Review**: `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md`
> **Implementation Notes**: `tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#dedicated-agent-provisioning
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-1045-dedicated-agent-provisioning.md`
- Sprint contract: `tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md`
- Sprint review: `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md`
- Implementation notes: `tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-1045-dedicated-agent-provisioning.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-1045-dedicated-agent-provisioning.md`.

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
- Contract file: `tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md`
- Review file: `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md`
- Implementation notes file: `tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-1045-dedicated-agent-provisioning.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the single Row-6 stacked commit; no deploy, migration, secret, shared staging database write, FastClaw checkout mutation or live resource is created.
- **Verification boundary**: Disposable PostgreSQL fixtures prove one active identity under concurrent provision, audited retryable conflict, partial-success retry, idempotent disable/re-enable/delete, temporal entitlement expiry denial and expired-lease reclaim; the exact FastClaw dev commit and five control routes are machine-pinned; targeted/full/type/lint/strict review and Sprint verification pass.
- **Review/acceptance boundary**: `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-1045-dedicated-agent-provisioning.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md`, `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md`, and `tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the single Row-6 stacked commit; no deploy, migration, secret, shared staging database write, FastClaw checkout mutation or live resource is created.

## Captured Planning Output

## Approved Design Summary

Adopt the existing AiphaBee-to-FastClaw dedicated lifecycle as Row 6's product
implementation, then close the proof gaps that prevent the Sprint acceptance
from being machine-verifiable. The only product-code change is to make a
lease-losing concurrent request produce its own hashed lifecycle audit event
using the authoritative profile returned by PostgreSQL. The rest of the slice
is a true-concurrency and recovery matrix plus a machine-readable pin to the
FastClaw lifecycle authority at `dev@35cd5ad006d991713c91a1fc641bcf01dbaf3a8b`.

`expiry` has two existing authority meanings and does not become a new public
intent: temporal entitlement expiry must deny a new activation and be audited,
and lifecycle lease expiry must allow a new request to reclaim the operation.
The profile state model remains active/disabled/deleted; explicit entitlement
removal continues to require the existing disable operation, while future
runner dispatch must re-check entitlement before every run.

The user approved continued execution of the programme by saying `go on` after
Rows 4 and 5 were completed.

## Not Building

- No new `expire` intent/status, scheduler, queue, outbox or migration.
- No shared FastClaw identity, name lookup, semantic fallback or local
  re-derivation of upstream state.
- No runner dispatch, sandbox creation, Agent event translation, billing,
  admin UI, production enablement or live credentialed acceptance; those stay
  in Rows 7, 9 and 10.
- No change to the unrelated FastClaw `salesko/erase-user-cascade` checkout and
  no FastClaw product change unless the pinned upstream fixture falsifies its
  documented idempotency contract.

## P1: Architecture Map

```text
internal lifecycle route (feature-gated, bearer-authenticated)
  -> deterministic workspace/account identities (Agent Runtime)
  -> audit replay by profile/request
  -> temporal authority read (PostgreSQL)
  -> unique profile + lease CAS (PostgreSQL)
       winner -> owner-scoped FastClaw user/Agent routes -> final state + audit
       loser  -> authoritative busy profile -> retryable conflict audit

FastClaw authority pin
  dev@35cd5ad006d991713c91a1fc641bcf01dbaf3a8b
  -> owner/external_id user idempotency
  -> user/external_id Agent idempotency and incomplete-clone recovery
  -> explicit disable/re-enable and idempotent absence receipt
```

Authoritative components:

1. AiphaBee `(workspace_id, account_id)` profile uniqueness and PostgreSQL
   lease own local concurrency and lifecycle audit truth.
2. Temporal account/workspace/membership/subscription/product/entitlement rows
   own activation authority; `valid_to` is evaluated by PostgreSQL `now()`.
3. FastClaw `dev@35cd5ad...` owns remote user/Agent idempotency and remote
   status/absence receipts. AiphaBee stores protected IDs and audits only their
   hashes.
4. The Worker internal route remains off by default; sandbox and runner
   capabilities remain disabled.

The implementation surface is one existing service, two existing fixture
files, one Agent Runtime client contract test, one machine-readable upstream
contract/check, package check registration, capability truth and workflow
artifacts. No dependency, route, schema or deployment resource is added.

## P2: Concrete Trace

1. Two services using separate PostgreSQL clients receive concurrent activate
   requests for the same workspace/account with different request IDs.
2. Both derive the same opaque user and Agent external identities and pass the
   same temporal entitlement query.
3. The profile uniqueness constraint converges both requests on one row. One
   lease CAS wins; the other CAS fails and re-reads the authoritative profile.
   A concurrent duplicate carrying the winner's request ID returns transient
   `LIFECYCLE_REQUEST_IN_PROGRESS` and leaves the single owning attempt to
   write its eventual audit, preventing a conflict event from racing/poisoning
   that success.
4. A different-request loser writes a conflict audit event for its request ID and returns
   `LIFECYCLE_LEASE_BUSY`, `retryable=true`, and
   `retry_with_new_request_id=true` without any upstream call. Replaying that
   request ID replays the same attempt; a new request ID starts the retry.
5. The winner provisions one FastClaw user and one Agent, finalizes `active`,
   releases the lease and writes its success audit. The fixture proves one
   profile, one active identity, two audit events and one remote provision path.
6. A partial user-success/Agent-failure stores the user ID in
   `blocked_retryable`. A new request reclaims the lease, reactivates/reuses
   that user, provisions only the missing Agent and finalizes active.
7. Disable moves local state to `disable_pending` before remote disable;
   re-enable reuses both IDs; repeated terminal requests only add their own
   idempotent audit and do not call upstream again. Closed-account delete
   proves remote absence and clears local IDs; replay is terminal and audited.
8. A manually expired lifecycle lease is reclaimed by a new request. An
   entitlement with expired `valid_to` denies activation before upstream and
   records denial. No expiry semantics are inferred from `reason`.
9. Upstream retryable failures remain `blocked_retryable`; non-retryable
   failures remain fail-closed and audited. No result ever substitutes a shared
   identity.

Async/error boundaries are PostgreSQL claim/finalize/audit transactions and
FastClaw HTTP calls. A remote partial success crosses the boundary only after
its returned ID is retained in failure finalization; deterministic external IDs
cover a process crash before local retention.

## P3: Decision Rationale

- Keep the existing state machine because it already implements the product
  invariant. Replacing it would create a second authority without improving
  the missing evidence.
- Return the authoritative profile with a busy claim and audit the loser. This
  is the smallest production change needed for the acceptance phrase “under
  concurrent provision ... idempotent and audited.”
- Do not add an `expire` intent. The approved PRD states do not contain
  `expired`; temporal entitlement and operation-lease expiry already have
  separate authoritative clocks. A new intent would enlarge the public
  contract without an owner or trigger.
- Pin FastClaw by full commit and exact allowed route/method shapes in a
  machine-readable contract, while leaving the current unrelated checkout
  untouched. This prevents branch-name drift from being mistaken for upstream
  capability truth.
- Use real PostgreSQL clients for CAS/reclaim evidence and deterministic remote
  fixtures for call counts and crash windows. Live staging belongs to Row 10,
  where credentials, load and cost evidence can be evaluated together.

At 10x, FastClaw latency increases lease contention first; losers remain
retryable and perform no remote work. A durable queue/outbox is justified only
if Row 10 proves contention or crash-recovery SLOs cannot be met. Rollback is
one stacked code/test/contract commit; no migration or live state cleanup is
needed.

## Public Contract Changes

- Repository busy claims include the authoritative profile used for audit and
  response truth.
- Concurrent lease conflict becomes a persisted lifecycle event with
  `outcome=conflict` and `error_code=LIFECYCLE_LEASE_BUSY`.
- Retry semantics are explicit: one request ID is one idempotent attempt and a
  retryable result requires a new request ID. Deleted profiles return a
  non-retryable `RESEARCH_AGENT_PROFILE_DELETED`, not a false lease conflict.
- Concurrent delivery of the lease owner's same request ID is transient and
  unaudited until the owning attempt completes; it explicitly retries with the
  same ID and cannot preempt the final success/failure audit.
- A new deploy contract pins the exact FastClaw commit, identity uniqueness
  scopes and allowed lifecycle route methods. It is documentation/check truth,
  not a runtime fallback.
- No lifecycle intent, endpoint, database schema or feature flag changes.

## Expected File Surface

Product and tests:

- `apps/worker/src/research-agent-lifecycle.ts`
- `apps/worker/src/research-agent-lifecycle.test.ts`
- `apps/worker/src/research-agent-lifecycle.postgres.test.ts`
- `packages/agent-runtime/src/fastclaw-lifecycle.test.ts`
- `deploy/fastclaw/dedicated-agent-provisioning.contract.json` (new)
- `scripts/check-fastclaw-dedicated-agent-provisioning-contract.mjs` (new)
- `package.json`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- active Sprint and Row-6 workflow artifacts.

Dependencies: none added.

## Test Matrix

- Two real PostgreSQL clients concurrently activate one workspace/account:
  one winner, one audited retryable conflict, one profile and one upstream
  user/Agent path; an in-flight duplicate cannot poison the owner's audit,
  completed same-attempt replay is stable and a new attempt converges on the
  winner's terminal identity without a second upstream call.
- Partial user success then retry activation: reuse user, provision only Agent,
  finalize active and audit both attempts.
- Disable, same-ID re-enable, repeated disable, repeated activate and
  closed-account delete/replay are idempotent and audited.
- Expired lifecycle lease is reclaimed; unexpired lease conflicts and is
  audited.
- Expired entitlement `valid_to` denies activation before upstream and is
  audited; explicit disable remains the state transition for an active remote
  user.
- Retryable and non-retryable upstream failures remain fail-closed with no raw
  ID leakage or shared identity.
- FastClaw client contract proves exact five lifecycle route shapes, stable
  owner-scoped external IDs, disable/re-enable and idempotent absence response.
- Contract checker validates the full upstream commit pin, route allowlist,
  identity authority, retry/expiry semantics and disabled activation posture;
  executable behavior remains owned by the targeted unit/PostgreSQL tests.
- Targeted tests, PostgreSQL integration, full regression, typecheck, lint,
  contract check, capability JSON, exact diff review/fingerprint, strict task
  contract and Sprint verification.

## Dependency, Rollback and Live Boundary

- Upstream mismatch or missing authority remains a hard failure; the slice
  never probes a shared/user-name fallback.
- PostgreSQL integration uses only disposable database names beginning with
  `aiphabee_lifecycle_test`; it must not target the shared staging database.
- Rollback reverts Row 6. No Cloudflare deploy, secret change, database
  migration or FastClaw checkout mutation is part of this slice.
- Local fixtures prove semantics and upstream protocol shape. Credentialed
  concurrency/load/cost and current live resource readback stay Row 10.

## Task Breakdown

- [x] Capture the approved Row-6 plan/contract in a stacked isolated worktree.
- [x] Add the pinned FastClaw dedicated-provisioning contract and checker.
- [x] Make busy lease conflicts use authoritative profile truth and write an audit event.
- [x] Add true PostgreSQL concurrency, partial-retry, lease-expiry and entitlement-expiry fixtures.
- [x] Add disable/re-enable/delete/replay and upstream route/idempotency matrices.
- [x] Keep route/runner/sandbox/live capability activation off and update truth maps.
- [x] Run targeted/full/type/lint/contract/strict verification and Deep review.
- [x] Backfill Sprint row 6, bind final fingerprint and commit one stacked slice.

## Unknowns

- Row 10 still owns measured FastClaw/Cloudflare latency, contention, provider
  limits and invoice-grade cost evidence.
- Row 7 must re-check current entitlement before every run; Row 6 only owns
  provisioning lifecycle and proves new activation is denied after temporal
  expiry.
