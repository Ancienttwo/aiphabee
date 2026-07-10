# Plan: Cloudflare Sandbox Adapter Spike

> **Status**: Complete
> **Created**: 20260710-2237
> **Slug**: cloudflare-sandbox-adapter-spike
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#cloudflare-sandbox-adapter-spike
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Pinned Cloudflare SDK/image, provider adapter conformance, grant-bound lease isolation, streaming/file/kill/destroy failures, no activation, image dry-run build, strict review and Sprint verification.
> **Rollback Surface**: Revert the row-3 commit; no deploy or live Cloudflare resource is created.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md`
> **Task Review**: `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md`
> **Implementation Notes**: `tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#cloudflare-sandbox-adapter-spike
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md`
- Sprint contract: `tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md`
- Sprint review: `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md`
- Implementation notes: `tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md`.

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
- Contract file: `tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md`
- Review file: `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md`
- Implementation notes file: `tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the row-3 commit; no deploy or live Cloudflare resource is created.
- **Verification boundary**: Pinned Cloudflare SDK/image, provider adapter conformance, grant-bound lease isolation, streaming/file/kill/destroy failures, no activation, image dry-run build, strict review and Sprint verification.
- **Review/acceptance boundary**: `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md`, `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md`, and `tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the row-3 commit; no deploy or live Cloudflare resource is created.

## Captured Planning Output

# Cloudflare Sandbox Adapter Spike

## Approved Design Summary

Extend the current, landed `apps/sandbox-bridge` instead of creating a second provider service. The execution stack has first been merged with current `main`, preserving the reviewed Row 1/2 commits while making the existing Cloudflare bridge, SDK pin, image, RunGuard, and staging evidence visible. Row 3 adds one `CloudflareSandboxBackend` implementation of the Agent Runtime port, refines every post-create operation to carry its opaque lease/grant binding, and uses a private Durable Object lease registry so a lease ID is routing data rather than authorization.

The provider is fixed to `@cloudflare/sandbox@0.12.3` and the matching official image digest `docker.io/cloudflare/sandbox:0.12.3@sha256:23f67e16131b780865a5fa5aa3c8607408a730105c248836409f4e02bb6bf042`. RPC transport, `enableDefaultSession:false`, `normalizeId:true`, `sleepAfter:"2m"`, and `AiphaBeeSandbox.enableInternet=false` remain mandatory. Use the supported base execution APIs, not a new `execStream()` dependency; the provider must retain a process handle so `kill()` terminates provider work rather than merely aborting a connection.

## Not Building

- No FastClaw enablement, executable `runner_remote` selection, or production grant mint; Row 7 owns that atomic activation.
- No Tool Gateway token, egress allowlist, App DB/provider/payment/broker secret, or arbitrary outbound network; Row 4 owns scoped egress and v0 remains no-Internet.
- No public sandbox route or new HTTP API. The existing bridge remains an internal provider surface and is not made an Agent authority.
- No full terminal lifecycle orchestration, usage accounting, semantic Agent event translation, deploy, staging mutation, or live-complete claim.
- No second sandbox package/service, sandbank abstraction, compatibility adapter, deprecated `execStream()`, or copied FastClaw smoke orchestration.

## Architecture Map

```text
Agent Runtime SandboxBackend authority
  create(opaque grant) / execute|file|kill|destroy(lease)
                 |
                 v
apps/sandbox-bridge CloudflareSandboxBackend
  argv -> official shellQuote -> provider process
  raw stdout/stderr -> untrusted SandboxExecutionEvent
                 |
        +--------+--------+
        |                 |
        v                 v
private LeaseRegistry DO  @cloudflare/sandbox 0.12.3
grant identity + state    RPC Sandbox DO / pinned image
```

Authoritative boundaries:

1. Agent Runtime owns the port, policy, grant and result shapes.
2. The adapter owns Cloudflare API translation and provider errors only.
3. The private registry owns lease existence, provider ID, grant binding, process ID and terminal marker; it exposes no public route.
4. Existing HMAC RunGuard/token and smoke artifacts are evidence for provider mechanics, not the Row-2 grant authority, and are not copied into this adapter.
5. Capability truth may set `sandbox_adapter_implemented=true`, but backend registration, runner dispatch and live execution stay false.

The task changes more than eight files because it must refine the shared port, implement/test a provider adapter and private registry, pin build truth, update capability/Sprint truth, and carry mandatory plan/contract/review/notes artifacts. It adds no service or dependency: current `main` already owns `apps/sandbox-bridge` and exact `@cloudflare/sandbox@0.12.3`.

## Concrete Flow

Create:

1. A future typed caller supplies the opaque Row-2 grant; Row 3 tests use an explicit test-only cast because no production mint exists.
2. Adapter generates an unguessable lease/provider ID and reserves a pending registry record containing canonical tenant/user/owner/runner binding.
3. It resolves the Cloudflare Sandbox DO with mandatory RPC/no-default-session/no-Internet options and performs a bounded readiness operation.
4. On success the registry marks ready and returns a lease carrying the same grant. On provider failure it destroys best-effort, deletes the reservation, and returns `create_failed`.

Operations:

1. Each input carries the full `SandboxLease`, not a naked string.
2. Registry compares backend ID, lease ID and every ordinary grant/owner field with its private record before returning the provider ID.
3. Unknown, cross-owner, terminal, or mismatched leases return the same fail-closed operation result and never call Cloudflare.
4. Execute quotes argv with the official helper, starts/streams provider output, marks chunks untrusted, records the provider process handle for kill, emits one terminal exit/failure event, and removes the process handle.
5. File paths are mapped only from branded workspace-relative paths to `/workspace/<path>`; binary bytes use RPC stream/base64 semantics supported by the pinned SDK.
6. Kill uses the retained provider process handle (or provider stop primitive proven by the pinned SDK); aborting the client connection alone is never reported as killed.
7. Destroy reserves terminal transition, calls provider destroy with a bounded wait, marks destroyed only on success, and returns `already_destroyed` on repeat. Row 5 later owns orchestration/retry/audit across all terminal causes.

## Key Decisions

- Reuse the landed bridge, exact SDK pin and current image rather than duplicate an adapter in `apps/worker`.
- Pin both npm package and image digest. Version equality remains an executable contract because the SDK checks image compatibility at startup.
- Use current recommended RPC/base execution API. The June 2026 deprecation guide makes new `execStream()` use unacceptable even though 0.12.3 still exposes it.
- Refine the shared port to pass `SandboxLease` on every operation. A private registry cannot reject cross-owner access if it receives only a naked lease ID.
- Keep provider registration false: Row 3 proves mechanics and buildability but cannot be called by product code until Row 7 mints a real grant and enables dispatch.
- Treat the existing HTTP bridge/HMAC RunGuard as separately owned landed behavior. Row 3 may reuse its provider configuration and official helpers but does not make it the grant authority.

## Test Matrix

- Compile-time: operation inputs reject naked lease IDs; forged grants remain rejected outside explicit test-only fixtures.
- Create: ready success, provider start failure cleanup, registry reservation failure, exact owner preservation.
- Isolation: run/session leases, cross-tenant, cross-user, cross-owner, wrong backend ID, unknown lease and terminal lease all fail before provider calls.
- Execute: ordered stdout/stderr, normal nonzero/zero exit, provider throw, process-start failure, stream failure, output remains untrusted.
- Files: binary write/read round trip, missing file, invalid/mismatched lease, workspace path cannot escape.
- Kill: active process killed, missing process fails closed, repeated terminal result, client abort is not treated as provider kill.
- Destroy: success, provider failure remains retryable/nonterminal, repeated success is idempotent, concurrent ownership remains isolated.
- Drift: package is exactly 0.12.3; Docker base is the matching digest; RPC/default-session/no-Internet/wrangler bindings are pinned; deprecated API search is empty in the new adapter.
- Build: targeted Vitest, bridge/Agent Runtime typecheck, root typecheck/lint/full regression, `wrangler deploy --dry-run` image build, contract/context/capability assertions, diff check, independent review, fingerprint and Sprint verification.

## Dependency and Failure Attacks

- Dependency failure: provider exceptions become explicit retryable/nonretryable port failures; no fallback backend or fabricated success.
- Scale: the first 10x bottleneck is one registry DO per lease and Cloudflare container quota, not an in-memory global map. Row 10 owns credentialed concurrency/cost evidence.
- Rollback: no deploy occurs. Reverting the row removes adapter/registry/config and restores the sealed Row-2 port without data migration.
- Most fragile assumption: Cloudflare 0.12.3 can expose a killable process while streaming output through RPC. If the pinned SDK cannot supply both, Row 3 must use its documented process API or stop as blocked; it must not claim kill from AbortSignal or silently fall back to buffered exec.

## File Surface

Expected product files:

- `packages/agent-runtime/src/index.ts`
- `packages/agent-runtime/src/index.test.ts`
- `apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts`
- `apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts`
- `apps/sandbox-bridge/src/lease-registry.ts`
- `apps/sandbox-bridge/src/lease-registry.test.ts`
- `apps/sandbox-bridge/src/index.ts`
- `apps/sandbox-bridge/Dockerfile`
- `apps/sandbox-bridge/wrangler.jsonc`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- the active Sprint and generated workflow artifacts.

No manifest/lockfile change is expected because current main already pins the sole required SDK dependency.

## Rollback

Revert the single Row-3 implementation commit. The preceding main-sync merge is repository convergence, not provider activation. No Cloudflare deploy, migration application, secret write, database write, or live sandbox is authorized by this plan.

## Task Breakdown

- [ ] Capture the approved Row-3 plan/contract after current-main convergence.
- [ ] Add failing Agent Runtime lease-bound operation tests and adapter/registry conformance tests.
- [ ] Implement the minimal port refinement, private registry and Cloudflare adapter.
- [ ] Pin image digest and capability truth without registering or activating the backend.
- [ ] Run targeted/full/type/build/drift/contract verification and exact-diff reviews.
- [ ] Backfill Sprint row 3, verify fingerprint and commit one reviewable Row-3 slice.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [ ] Capture the approved Row-3 plan/contract after current-main convergence.
- [ ] Add failing Agent Runtime lease-bound operation tests and adapter/registry conformance tests.
- [ ] Implement the minimal port refinement, private registry and Cloudflare adapter.
- [ ] Pin image digest and capability truth without registering or activating the backend.
- [ ] Run targeted/full/type/build/drift/contract verification and exact-diff reviews.
- [ ] Backfill Sprint row 3, verify fingerprint and commit one reviewable Row-3 slice.
