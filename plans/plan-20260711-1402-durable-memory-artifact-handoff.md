# Plan: Durable Memory Artifact Handoff

> **Status**: Complete
> **Created**: 20260711-1402
> **Slug**: durable-memory-artifact-handoff
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#durable-memory-artifact-handoff
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Deterministic Agent Runtime and Worker fixtures prove explicit approval before sandbox read, bounded authoritative scan, complete tenant-owned R2/PostgreSQL records, fail-closed cross-tenant reads, compensation and residual-free destroy; full test/type/lint, database/env, machine contract, independent review and strict Sprint verification pass without a live-complete claim.
> **Rollback Surface**: Revert the single stacked Row-8 AiphaBee commit; no Cloudflare deploy/resource, staging PostgreSQL mutation, live scanner, secret, public route or live Agent run is created.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md`
> **Task Review**: `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md`
> **Implementation Notes**: `tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#durable-memory-artifact-handoff
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-1402-durable-memory-artifact-handoff.md`
- Sprint contract: `tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md`
- Sprint review: `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md`
- Implementation notes: `tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-1402-durable-memory-artifact-handoff.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-1402-durable-memory-artifact-handoff.md`.

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
- Contract file: `tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md`
- Review file: `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md`
- Implementation notes file: `tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-1402-durable-memory-artifact-handoff.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the single stacked Row-8 AiphaBee commit; no Cloudflare deploy/resource, staging PostgreSQL mutation, live scanner, secret, public route or live Agent run is created.
- **Verification boundary**: Deterministic Agent Runtime and Worker fixtures prove explicit approval before sandbox read, bounded authoritative scan, complete tenant-owned R2/PostgreSQL records, fail-closed cross-tenant reads, compensation and residual-free destroy; full test/type/lint, database/env, machine contract, independent review and strict Sprint verification pass without a live-complete claim.
- **Review/acceptance boundary**: `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-1402-durable-memory-artifact-handoff.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md`, `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md`, and `tasks/notes/20260711-1402-durable-memory-artifact-handoff.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the single stacked Row-8 AiphaBee commit; no Cloudflare deploy/resource, staging PostgreSQL mutation, live scanner, secret, public route or live Agent run is created.

## Captured Planning Output

## Approved Design Summary

Land Row 8 as one fail-closed, private handoff boundary between a run-owned
SandboxBackend lease and AiphaBee-owned durable storage. The sandbox may create
files, but it cannot approve persistence. An injected AiphaBee approval
authority receives only declared candidate metadata and returns an exact
candidate decision set. Only approved candidates are read from the sandbox;
each approved payload must then pass fixed size limits and an injected
authoritative safety scanner before any R2 or PostgreSQL write occurs.

Accepted bytes are content-addressed under tenant/user/run ownership in the
existing AIPHABEE_ARTIFACTS R2 binding. A PostgreSQL record stores tenant,
owner, run, lease, kind, SHA-256, classification, byte size, retention,
scanner result, approval, provenance and evidence references. Reads first
resolve a tenant-scoped active record and then enforce the tenant key prefix;
an object key is never authorization. Object-write/metadata-write failure is
compensated by deleting the object. Rejected, over-limit, unsafe, scan-error or
unapproved candidates create neither object nor record.

The orchestrator owns cleanup: after candidate processing, including approval,
read, scan or persistence failures, it invokes idempotent sandbox destroy and
reports whether release is safe. Tests prove the fixture backend has no lease
or files after destroy. This row adds no public route, UI, live scanner,
Cloudflare deployment or staging PostgreSQL mutation; Row 9 owns product/admin
surfaces and Row 10 owns credentialed live acceptance.

The user approved continued execution by saying `go on` after Row 7 completed.

## Not Building

- No public upload/download/memory API, UI, billing/admin status, entitlement
  routing, live FastClaw transport, live scanner, deploy, secret or external
  resource mutation.
- No sandbox-authored approval field, filename/content-type inference,
  extension allowlist heuristic, regex malware scan, scan bypass, shared
  storage prefix or cross-tenant lookup by object key.
- No persistence of raw process output, private reasoning, tool inputs/results,
  provider IDs or credentials. Candidate bytes stay private to the handoff and
  object store.
- No compatibility fallback when approval, classification, provenance,
  evidence, scan authority or cleanup confirmation is absent.

## P1: Architecture Map

```text
AiphaBee private run orchestration
  -> run-owned SandboxLease + declared candidate metadata
  -> AiphaBee approval authority (exact decisions; sandbox has no vote)
  -> SandboxBackend.readFile for approved candidates only
  -> size gate -> SHA-256 -> authoritative scanner
  -> existing AIPHABEE_ARTIFACTS R2 object store
  -> PostgreSQL durable_handoff_record metadata/RLS authority
  -> tenant-scoped read port
  -> finally SandboxBackend.destroy -> cleanup readback
```

Authority and ownership:

1. Agent Runtime owns the provider-neutral handoff contract, limits, candidate
   validation, approval/scan orchestration, storage transaction compensation,
   tenant-scoped reads and destroy semantics.
2. SandboxBackend remains execution/file/cleanup authority only. A sandbox path
   or generated manifest is untrusted and cannot approve durable state.
3. AiphaBee approval and safety scanner are injected authorities. Missing,
   incomplete, duplicate, mismatched or error decisions block persistence.
4. Worker owns concrete PostgreSQL metadata and existing R2 adapters. The new
   table has account/workspace RLS matching the established platform session
   settings; the R2 key embeds validated tenant/user/run segments but is not an
   access-control substitute.
5. Evidence lineage is stored as immutable evidence references and provenance
   metadata. This row does not write new evidence_record semantics or invent
   citations from artifact content.

At 10x, the first pressure point is scanner/R2 throughput and buffering a
bounded 10 MiB artifact per handoff, followed by PostgreSQL metadata volume.
Streaming/multipart storage and live concurrency/cost measurements belong to
Row 10; the hard byte caps keep this version bounded.

## P2: Concrete Trace

1. Private orchestration supplies an authentic run-owned SandboxLease, exact
   tenant/user/run identity and a bounded list of candidate declarations. Each
   declaration contains a safe candidate ID/path, kind, explicit
   classification, content type, retention policy, provenance and at least one
   evidence reference.
2. The handoff validates that the lease grant is run-owned and matches the run,
   then validates identity segments, candidate uniqueness/count and metadata.
   Invalid input stops before approval, sandbox read or persistence.
3. The injected approval authority sees candidate metadata but no sandbox
   bytes. It must return one exact decision per candidate, bound to tenant,
   user, run and a non-empty decision/approver/time. Unknown, duplicate or
   missing decisions fail closed. Rejected candidates are recorded only in the
   returned in-memory result and are never read from the sandbox.
4. For each approved candidate, SandboxBackend.readFile uses the same lease and
   validated workspace path. Missing/read failure yields an item rejection.
   Empty or over-kind-limit bytes are rejected before hash, scan or writes.
5. SHA-256 is calculated over the actual bytes. The scanner receives bytes,
   declared kind/classification/content type and hash. Only an exact `clean`
   result with engine/version/scanned_at persists; `unsafe`, `error`, thrown or
   classification mismatch rejects without writes.
6. The object store receives a content-addressed key under
   `agent-handoff/v0/<tenant>/<user>/<run>/<kind>/<sha256>`. Then the metadata
   store inserts the complete record. If insert fails, the object is deleted;
   the failure remains explicit and no metadata claims success.
7. In a finally path the orchestrator destroys the lease. Destroyed or already
   destroyed is release-safe; failed/unconfirmed cleanup is reported and the
   operation cannot claim a clean handoff. Fixture readback proves the lease
   and sandbox files no longer exist.
8. A later private read supplies tenant and record ID. The metadata store query
   includes tenant_id and deleted_at is null; the returned key must also have
   the exact tenant prefix before object read. Wrong tenant, missing metadata or
   mismatched key returns not_found without probing another tenant object.

Async boundaries are approval, each sandbox read, scanner, R2 put/delete,
PostgreSQL insert/select and sandbox destroy. Final durable side effects are one
object plus one complete metadata record per accepted candidate; cleanup is
always attempted.

## P3: Decision Rationale

- Approval precedes byte read and scanning. This proves unapproved files do not
  leave the sandbox boundary at all, rather than merely avoiding persistence.
- Scanning remains an injected authority. A local extension/MIME/regex check
  would fabricate safety; missing or errored scan blocks the item.
- Reuse AIPHABEE_ARTIFACTS plus PostgreSQL instead of adding another storage
  service/package. R2 owns bytes; PostgreSQL owns tenant-scoped metadata and
  lifecycle. Object keys assist partitioning but never authorize reads.
- Persist only records for accepted items. Rejection reasons are returned to
  private orchestration and can be audited by Row 9 without creating a durable
  rejected payload or a false artifact record.
- Use object-first then metadata with compensating delete. PostgreSQL cannot
  atomically commit R2; metadata-first would expose records for absent objects.
  A failed compensation is surfaced as cleanup_required rather than hidden.
- Couple handoff and destroy in one operation so every approval/read/scan/write
  path shares cleanup. Do not add a best-effort cleanup fallback or claim
  release safety when destroy is unconfirmed.
- Add the concrete table/adapters now without applying them remotely. A pure
  in-memory port would pass fixtures but would not establish AiphaBee-owned
  durable storage. Live migration/readback remains a separately authorized
  deployment action.

Rollback is one stacked Row-8 commit. Revert removes the private module,
migration and contract artifacts; no external cleanup is required because this
slice creates or mutates no live resource.

## Expected File Surface

Product/tests:

- `packages/agent-runtime/src/durable-memory-artifact-handoff.ts` (new)
- `packages/agent-runtime/src/durable-memory-artifact-handoff.test.ts` (new)
- `packages/agent-runtime/package.json`
- `apps/worker/src/durable-memory-artifact-handoff.ts` (new)
- `apps/worker/src/durable-memory-artifact-handoff.test.ts` (new)
- `deploy/database/migrations/20260711140000_durable_memory_artifact_handoff.sql` (new)
- `deploy/fastclaw/durable-memory-artifact-handoff.contract.json` (new)
- `scripts/check-durable-memory-artifact-handoff-contract.mjs` (new)
- `package.json`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- active Sprint plus Row-8 plan/contract/review/notes artifacts.

No dependency, binding, public Worker route or remote deployment is added.

## Test Matrix

- Happy path: approved memory and artifact persist with exact byte hash,
  classification, size, retention, clean scan, approval, provenance and
  evidence fields; destroy succeeds and residual fixture state is zero.
- Approval: explicit rejection is never read or stored; missing/duplicate/
  unknown/mismatched authority decisions fail closed and still destroy.
- Content gates: empty, memory >64 KiB and artifact >10 MiB reject before
  persistence; unsafe, scan error/throw and classification mismatch do not
  persist.
- Storage failures: read failure, R2 put failure, metadata insert failure and
  compensating-delete failure are explicit; no metadata claims an absent or
  rejected object; destroy remains attempted.
- Isolation: same-tenant read succeeds; wrong tenant and key-prefix mismatch
  return not_found without cross-tenant R2 get.
- Cleanup: destroyed/already-destroyed are safe; destroy failure marks
  release_safe false; repeat cleanup is idempotent; backend fixture read after
  destroy returns file_not_found.
- Worker adapters: SQL uses exact tenant predicates; complete JSON metadata is
  inserted/read; R2 round trip preserves bytes/content type; migration has RLS,
  constraints and grants.
- Regression: targeted Agent Runtime/Worker tests, full test/type/lint,
  database/env, machine contract/capability JSON, diff check, independent
  review and strict contract/Sprint verification.

## Acceptance Checklist

- [x] Only exact AiphaBee-approved candidates are read from the sandbox.
- [x] Only clean, within-limit bytes persist to AiphaBee R2/PostgreSQL.
- [x] Records contain tenant/owner/run/lease, hash, classification, size,
      retention, scan, approval, provenance and evidence.
- [x] Rejected, oversize, empty, unsafe and scan-error items create no durable
      object or record.
- [x] Metadata failure compensates the object write and exposes cleanup failure.
- [x] Wrong-tenant reads fail before object access.
- [x] Every path attempts idempotent destroy and reports release safety.
- [x] Fixture readback proves no residual sandbox handle/files after success.
- [x] No public route, deploy, live scanner, secret, Cloudflare resource or
      staging PostgreSQL mutation is introduced.
- [x] Targeted/full regression, machine contract, review and strict harness
      verification pass.

## Stop Conditions

- Stop if approval must be inferred from sandbox content, filenames, MIME or a
  compatibility heuristic.
- Stop if safety requires treating a local rule as an authoritative scanner.
- Stop if a rejected/unsafe/oversize payload can reach R2/PostgreSQL, if a
  metadata record can point to a missing object, or if wrong tenant can trigger
  object lookup.
- Stop if cleanup is skipped on any thrown authority/read/scan/store path or a
  failed destroy can be reported release-safe.
- Stop if implementation requires a public route, live resource mutation,
  credential, new package/service or unapproved path outside the contract.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Approval-before-read and exact candidate decisions implemented.
- [x] Bounded authoritative scan and complete durable records implemented.
- [x] Rejected/empty/oversize/unsafe/scan-error no-write matrix passes.
- [x] R2/PostgreSQL compensation and ambiguous-commit readback implemented.
- [x] Tenant-scoped metadata-first reads block cross-tenant object probes.
- [x] Every path destroys; fixture residual state is absent after success.
- [x] PostgreSQL/R2 Worker stores, RLS migration and machine contract land.
- [x] No public/live/deploy/staging mutation is introduced.
- [x] Targeted/full regression, review and strict verification pass.
