# Plan: FastClaw Dedicated Agent Lifecycle

> **Status**: Completed
> **Created**: 20260710-1129
> **Slug**: fastclaw-dedicated-agent-lifecycle
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#(none)
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: FastClaw idempotency and disabled-user fail-closed tests; AiphaBee DB/env/type/Worker lifecycle checks; staging readback only when credentials exist
> **Rollback Surface**: Disable lifecycle flag; revert application commits; retain additive schema and audit tombstones
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md`
> **Task Review**: `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md`
> **Implementation Notes**: `tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#(none)
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md`
- Sprint contract: `tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md`
- Sprint review: `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md`
- Implementation notes: `tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md`.

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
- Contract file: `tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md`
- Review file: `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md`
- Implementation notes file: `tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Disable lifecycle flag; revert application commits; retain additive schema and audit tombstones
- **Verification boundary**: FastClaw idempotency and disabled-user fail-closed tests; AiphaBee DB/env/type/Worker lifecycle checks; staging readback only when credentials exist
- **Review/acceptance boundary**: `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md`, `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md`, and `tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Disable lifecycle flag; revert application commits; retain additive schema and audit tombstones

## Captured Planning Output

# FastClaw Dedicated Agent Lifecycle

## Objective

Implement a durable, fail-closed mapping from an entitled AiphaBee account in a workspace to exactly one dedicated FastClaw app-user and Agent. AiphaBee owns entitlement, desired state, audit, disable, and delete authority. FastClaw owns its app-user/Agent runtime records. Cloudflare Sandbox remains ephemeral and is not created by this lifecycle slice.

## Architecture and authority

- Keep `@aiphabee/agent-runtime` as the only Agent control-plane contract authority. Do not add `packages/agent-fastclaw`, another Agent schema package, or another API service.
- Add an internal Worker lifecycle route protected by a server-side bearer credential and disabled by default.
- Resolve eligibility only from authoritative Postgres rows: active account/workspace/membership, active or grace-period subscription, active product/policy/access, and an approved temporal `research_agent_enabled` workspace entitlement.
- Scope the durable mapping to `(workspace_id, account_id)` so user memory and identity cannot cross workspace boundaries.
- Derive a stable non-email FastClaw external identity as `aiphabee:v1:<sha256(workspace_id + NUL + account_id)>`.
- Persist desired/observed lifecycle state and a short lease in `aiphabee_core.research_agent_profile`; persist append-only transition evidence in `aiphabee_audit.research_agent_lifecycle_event` with remote identifiers hashed in audit metadata.

## Phase 1: FastClaw prerequisite

Base a stacked FastClaw branch on `c522523`.

- Add an optional owner-scoped Agent `external_id` with a partial unique index on `(user_id, external_id)`.
- Extend `POST /api/users/{id}/agents` with `externalId`. Repeated and concurrent clone requests for the same owner/externalId must return the same Agent and a `created` boolean.
- Preserve the existing fork allowlist: copy identity/config only, never memory, sessions, cron, or channel bindings.
- Reject disabled app-users during identity switching. Header and OpenAI body switching errors must fail closed; they must never continue under the API-key owner identity.
- Make deletion an explicit idempotent absent contract so a retry after a remote-success/local-crash can converge safely.
- Add targeted store, users, auth, API, and setup tests.

## Phase 2: AiphaBee lifecycle

Base a stacked AiphaBee contract worktree on `3ac36e6`; do not touch the primary Netquity worktree.

- Add an additive database migration and migration-contract entry for profile and lifecycle audit tables.
- Add `packages/agent-runtime/src/fastclaw-lifecycle.ts` for lifecycle types, state transitions, eligibility inputs, remote client contract, bounded response parsing, and standard error mapping. Export it from the existing package.
- Add a focused Worker lifecycle module for Postgres eligibility/profile/audit/lease operations and remote orchestration; wire only the route and bindings from `apps/worker/src/index.ts`.
- Route: `POST /internal/research-agent/lifecycle` with `account_id`, `workspace_id`, `intent=activate|disable|delete`, reason, and `x-request-id`.
- Activate requires a live authoritative entitlement. Disable first makes the local profile non-runnable, then disables the FastClaw app-user. Delete first makes the local profile non-runnable; it is permitted only for an already closed AiphaBee account, and it records `deleted` only after remote absence is verified.
- Claim remote work with a bounded DB lease/CAS. FastClaw externalId idempotency closes the crash window after remote creation and before the local commit.
- On any remote failure, retain a local pending/blocked-retryable state and an audit event. Never fall back to a shared Agent and never synthesize remote success.
- Add env-schema/example entries for the lifecycle enable flag, route credential, FastClaw base URL, admin API key, and template Agent id. No secret values enter git.

## API status contract

- `200`: terminal state reached or an idempotent replay read back the same terminal state.
- `400`: malformed input.
- `401`: lifecycle route credential missing, too short, or wrong.
- `403`: activate entitlement denied, or delete precondition not met.
- `409`: another unexpired lifecycle lease owns the profile, or the request id is already bound to another lifecycle intent.
- `503`: feature disabled, binding/config missing, FastClaw unavailable/rate-limited, or retryable remote failure.
- `500`: unexpected database/internal error. Responses expose stable error codes, not remote bodies or credentials.

## Explicit non-goals

- No public onboarding or account UI.
- No real billing provider webhook or subscription writes; this slice consumes authoritative rows only.
- No production `runner_remote` cutover, chat adapter, Generic Agent changes, memory UI, queue/scheduler, or Cloudflare Sandbox creation.
- No compatibility fallback, shared advisor fallback, email identity, or heuristic remote Agent lookup by name.

## Verification

- FastClaw: `go test ./internal/auth ./internal/api ./internal/setup ./internal/store ./internal/users`.
- AiphaBee: lifecycle unit/route tests, existing Worker tests, `npm run check:database`, `npm run check:env`, `npm run typecheck`, and `git diff --check` in both repos.
- Staging acceptance, when credentials are present: create an isolated entitlement fixture; activate twice and prove one user/Agent; disable and prove local denial plus FastClaw denial; reactivate the same identity; close/delete and prove remote absence, local tombstone, and audit; then clean the fixture.
- Missing credentials are `not_run_missing_credentials`, never PASS.

## Rollout and rollback

Deploy FastClaw prerequisite first, then apply the additive DB migration, then deploy AiphaBee with the lifecycle flag off. Enable only in staging for acceptance. Production runner remains disabled. Roll back by disabling the lifecycle flag and reverting application commits; retain additive schema/tombstones for audit rather than performing a destructive down migration.

## Scale and failure boundary

Provisioning is infrequent control-plane work, so a synchronous bounded route plus DB lease is sufficient for this slice. At 10x, FastClaw control-plane latency and lease contention fail first; requests return retryable state without holding a DB transaction across HTTP. A queue/outbox is deferred until a real billing event source and measured provisioning volume justify it.

## Task Breakdown

- [x] Capture Approved plan/contract and isolate the AiphaBee worktree from primary WIP.
- [x] Implement and verify FastClaw Agent externalId idempotency, disabled-user fail-closed switching, and idempotent deletion.
- [x] Add AiphaBee research Agent profile/audit migration and contract registration.
- [x] Implement lifecycle contract, FastClaw client, Worker repository/orchestration, route, and env contract.
- [x] Run deterministic FastClaw and AiphaBee verification, contract review, and strict verification.
- [x] Run staging lifecycle acceptance if credentials are present; otherwise record the exact missing inputs.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->
