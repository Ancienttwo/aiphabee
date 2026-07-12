# Plan: Live Security Load Cost Release Evidence

> **Status**: Complete
> **Created**: 20260711-1552
> **Slug**: live-security-load-cost-release-evidence
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#live-security-load-cost-release-evidence
> **Artifact Level**: work-package
> **Promotion Reason**: risk_boundary
> **Verification Boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md --strict`.
> **Rollback Surface**: Before execution remove `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md`; after execution revert branch `codex/live-security-load-cost-release-evidence` or the explicitly reviewed diff.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md`
> **Task Review**: `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md`
> **Implementation Notes**: `tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#live-security-load-cost-release-evidence
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md`
- Sprint contract: `tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md`
- Sprint review: `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md`
- Implementation notes: `tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-1552-live-security-load-cost-release-evidence.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-1552-live-security-load-cost-release-evidence.md`.

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
- Contract file: `tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md`
- Review file: `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md`
- Implementation notes file: `tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Before execution remove `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md`; after execution revert branch `codex/live-security-load-cost-release-evidence` or the explicitly reviewed diff.
- **Verification boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md --strict`.
- **Review/acceptance boundary**: `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: risk_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md`, `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md`, and `tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Before execution remove `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md`; after execution revert branch `codex/live-security-load-cost-release-evidence` or the explicitly reviewed diff.

## Captured Planning Output

## Approved Design Summary

### 2026-07-11 User Architecture Correction

FastClaw runs as an always-on, isolated service on the existing VPS; it is not
hosted in a Cloudflare Container. Cloudflare Sandbox remains the only ephemeral
compute backend through the Sandbox Bridge. The VPS FastClaw has its own compose
project, volume, shared-staging-PG role/schema and two-secret ingress gate; it
does not share the Salesko FastClaw service, database state or credentials.
AiphaBee reaches the VPS HTTPS endpoint directly and still owns callback-before-
execution policy. The old private Cloudflare FastClaw Container is rollback-only
until VPS acceptance, then must be removed.

Land Sprint Row 10 as a cross-repository staging release gate, not as a
fixture-only checker. AiphaBee remains the public run/event/tool-policy
authority; FastClaw remains the dedicated reasoning Agent; every FastClaw tool
proposal crosses a new callback-before-execution protocol back into AiphaBee;
the Cloudflare Sandbox Bridge remains the only compute adapter. No opaque SSE
or local FastClaw tool execution may substitute for the callback contract.

The release evidence runner creates ten distinct synthetic staging
workspace/account identities, provisions ten dedicated FastClaw Agents, starts
ten concurrent standard-1 Cloudflare sandboxes, drives one controlled tool
proposal per run, and records provider facts for cold start, first progress,
duration, CPU, memory, disk, egress, Worker requests/CPU, Durable Object
requests/duration/storage, log events, R2 operations/storage, terminal destroy,
residual instance count and kill-switch readback. Cross-tenant negative probes
must fail before execution. Synthetic identities, agents, rows, objects and
temporary Workers/Containers are deleted after evidence capture.

Cost evidence uses current official Cloudflare list prices and records two
separate values: raw marginal list cost per run from measured units, and
allocated invoice cost only when Billing Read proves the account-period
increment. Included monthly allotments are never silently allocated. Missing
Billing Read forces `actual_bill=false`; missing any required live metric,
scanner, migration readback, kill readback, cleanup proof or external reviewer
keeps the Row and feature blocked even when deterministic checks pass.

Row 10 also wires the Row-8 authoritative scanner and Row-9 terminal usage sink
in the private staging composition, applies Rows 6/8/9 migrations to the shared
PlanetScale staging PostgreSQL through its existing Cloudflare Hyperdrive
authority, and deploys the sandbox bridge/control composition only after dry
run and fail-closed preflight. Production and public FastClaw routes remain
off. Temporary acceptance resources are rollback-owned by the runner.

The current environment has Cloudflare OAuth with Worker/Container write and
Workers tail access, the persistent VPS FastClaw service and
standard-1 Container, the shared staging Hyperdrives and required FastClaw
secrets. It does not currently prove Account Analytics Read, Logs Read, Billing
Read, an authoritative scanner, callback transport, applied Row-8/9 migrations,
live terminal usage sink or external acceptance. Those are explicit gates, not
assumptions.

## Not Building

- No production enablement, public FastClaw endpoint, paid-plan auto-routing,
  compatibility fallback, opaque SSE acceptance, local shadow policy parser,
  estimated sandbox metrics labelled observed, or fabricated invoice cost.
- No permanent per-user sandbox. FastClaw profiles and approved R2 artifacts
  are durable; execution compute is ephemeral and destroy/readback is required.
- No use of raw user/provider IDs, tokens, prompts, outputs, database URLs or
  secrets in committed packets. Committed evidence is redacted/hash-only;
  sensitive live output remains ignored under `_ops/`.
- No Sandbank/Cloudbank/Boxlite provider fallback. Cloudflare is the selected
  production-primary sandbox; provider failure blocks the run.

## P1: Architecture Map

```text
AiphaBee Agent Runtime
  -> FastClaw service-binding transport
     -> FastClaw dedicated Agent/model loop
        -> tool proposal event (no execution)
           -> AiphaBee callback + policy executor
              -> Tool Gateway or Cloudflare Sandbox Bridge
                 -> ephemeral standard-1 Container + lease/RunGuard
        <- exact tool result
     <- raw final + measured model/step usage
  -> AiphaBee post-check + public semantic events
  -> terminal lifecycle + usage/detail/preview ledger + handoff + destroy

Row-10 operator
  -> shared staging PG/Hyperdrive migration and synthetic tenants
  -> temporary/private live acceptance composition
  -> Cloudflare Analytics/Logs/Billing/R2/Container readback
  -> redacted evidence packet + independent security/compliance acceptance
  -> cleanup and feature-off/readback
```

Authority split:

1. Agent Runtime owns runner selection, budgets, callbacks, post-check and
   public events. FastClaw cannot execute a proposed tool until AiphaBee returns
   its exact result.
2. FastClaw owns dedicated Agent/model/session state and a bounded in-memory
   run broker in its singleton staging Container. Run/call IDs and result
   hashes are request-idempotent; timeout/cancel closes pending callbacks.
3. Sandbox Bridge owns Cloudflare provider leases and Tool Gateway egress.
   Tenant/user/run/lease identity, not provider ID, authorizes operations.
4. Shared staging PostgreSQL owns product/profile/usage/audit metadata; R2 owns
   approved bytes; an independent injected scanner owns clean/unsafe verdicts.
5. Cloudflare provider APIs own measured resource/log/billing facts. Raw list
   formulas are repository code; invoice allocation requires Billing Read.
6. The acceptance operator owns temporary tenants/resources and cleanup. It
   cannot mark release pass; the evidence checker and independent reviewer do.

At 10x beyond this test, the first pressure points are the singleton FastClaw
run broker, Container cold-start/concurrency caps and log/analytics sampling.
The release packet records those ceilings and does not extrapolate unmeasured
capacity.

## P2: Concrete Trace

1. Preflight resolves current official price version, Wrangler account,
   Worker/Container/Analytics/Logs/Billing permissions, Docker, shared staging
   Hyperdrive, FastClaw secrets, scanner and migration state. Every required
   field has `passed|blocked`; blocked preflight performs no run or release flip.
2. A migration operator using the existing staging Hyperdrive applies only the
   missing Rows 6/8/9 SQL in order, then reads tables, constraints, RLS and meter
   rule back. Production/database URLs never enter evidence.
3. The operator creates ten distinct synthetic workspace/account/membership/
   subscription/product/entitlement rows and provisions ten dedicated profiles.
   Exact IDs are stored only in `_ops`; the packet records hashes.
4. AiphaBee starts ten `research+runner_remote+fastclaw` runs. Its service-bound
   transport opens the FastClaw external-tool stream. FastClaw emits
   `remote_accepted`, then a tool proposal and blocks.
5. AiphaBee validates run/call uniqueness, allowed tool, budget, tenant and
   policy; one controlled sandbox operation goes through the Bridge. A cross-
   tenant replay, wrong result call, arbitrary egress and expired/wrong token
   are rejected before a side effect.
6. AiphaBee posts the exact result hash to FastClaw. FastClaw resumes its model
   loop, returns raw final and model/step usage; AiphaBee post-check alone can
   publish the final semantic answer.
7. Success plus a concurrent kill run traverse Row-5 terminal lifecycle. Every
   terminal path writes observed Row-9 usage with terminal state, performs Row-8
   scanner/handoff where applicable, destroys the sandbox and reads terminal /
   residual provider state. Missing destroy makes the whole packet fail.
8. The operator joins sandbox instance IDs to GraphQL Container metrics and
   reads Worker/DO/Logs/R2/account billing deltas. It calculates raw list cost
   from measured units and allocates invoice cost only with billing evidence.
9. Independent security/compliance review consumes the final fingerprint and
   live packet. Only a passing, fresh review may set Row 10 and the Sprint
   complete. Cleanup deletes synthetic data/resources and reads feature-off,
   no residual sandbox and no public route.

Async boundaries are the FastClaw stream/result callback, model calls,
Sandbox/Tool Gateway operations, PG/R2/scan writes, Cloudflare analytics and
cleanup. Each boundary has a bounded timeout and exact error state.

## P3: Decision Rationale

- Use a pull/resume external-tool protocol over the existing private service
  binding. It lets AiphaBee receive every proposal before execution without
  exposing a public callback URL or trusting opaque FastClaw SSE.
- Add a bounded FastClaw broker rather than a second Agent contract. It is a
  transport mechanism under the existing Agent/model loop; Agent Runtime still
  owns semantics and Tool Gateway still owns policy execution.
- Use the shared staging PG named by the user and existing Hyperdrive rather
  than create another database. Synthetic tenant rows are transactional and
  cleanup-owned; production is out of scope.
- Separate raw marginal list cost from invoice allocation. Provider inclusions
  make per-run invoice cost non-additive, so a single number without both
  methodology and billing-period authority would be misleading.
- Use an independent scanner service/credential. Sandbox-authored or local
  extension/MIME heuristics cannot become clean authority.
- Keep feature off on any evidence gap. Row 10 is a release gate; a deterministic
  packet or previous smoke is useful evidence but not a substitute for current
  credentialed facts.

## File and Repository Changes

AiphaBee:

- Add private FastClaw service-binding compliant transport and its tests.
- Add concrete live composition for callback tool execution, terminal usage,
  scanner/handoff, kill and cleanup without a public product route.
- Add Row-10 live evidence schema/checker/operator, official price contract,
  redacted packet template, staging migration and cleanup operators.
- Update sandbox bridge/control Worker configs, capability truth, Sprint,
  package scripts and task artifacts.

FastClaw (`dev` linked worktree):

- Add a versioned AiphaBee external-tool run/result protocol, bounded run broker
  and exact replay/cancel/timeout behavior.
- Route Agent tool execution through the broker only for authenticated AiphaBee
  runs; normal FastClaw paths remain unchanged.
- Extend the private Cloudflare control Worker allowlist/config and tests; no
  workers.dev/public FastClaw route.

## Verification and Live Acceptance

- AiphaBee focused/full Vitest, typecheck/lint, database/env/machine contracts,
  Bridge dry-run, secret non-disclosure and strict repo-harness verification.
- FastClaw focused Go tests/vet/race for broker, external executor, API, config,
  route allowlist and unchanged normal tool execution.
- Credentialed packet: exactly 10 distinct tenants/users/Agents/sandboxes;
  concurrent success, cross-tenant negative probes, kill switch, scanner,
  terminal usage, handoff/destroy, no residual instance/file, all latency /
  resource/egress/Worker/DO/log/R2/cost fields and cleanup readback.
- External security/compliance review must be fresh for both repository diffs
  and the live packet. Manual override cannot satisfy the Row-10 live gate.

## Task Breakdown

- [x] Capture contract/worktrees and pin current provider prices/permissions.
- [x] Implement and verify FastClaw callback-before-execution run broker.
- [x] Implement AiphaBee compliant service-binding transport and live composition.
- [x] Wire authoritative scanner, terminal usage, kill and durable handoff sinks.
- [x] Implement fail-closed staging migration/fixture/evidence/cleanup operators.
- [x] Dry-run, deploy private staging dependencies and apply/read back migrations.
- [x] Run 10-way cross-tenant security/load/kill/cleanup acceptance. Ten provider-linked Sandboxes overlapped and cleanup returned zero residual rows/objects.
- [x] Read Cloudflare metrics/logs/billing and calculate per-run costs. All required provider reads and per-run raw list costs are complete; invoice allocation remains truthfully null.
- [x] Obtain fresh independent security/compliance acceptance for both diffs and packet.
- [x] Clean temporary state and prove feature/public route off. Row 10 is complete while production/public dispatch remains disabled.

## Evidence Contract

- State/progress: this plan, linked AiphaBee/FastClaw task contracts, notes,
  reviews, Sprint Row 10 and ignored `_ops/fastclaw-row10/` live run state.
- Verification: deterministic command output, Cloudflare deployment IDs/hashes,
  PG migration/schema hashes, 10 redacted run rows, provider metric query hashes,
  cost methodology/version and cleanup readback.
- Evaluator rubric: callback-before-execution, ten-way tenant isolation, exact
  terminal cleanup, scanner and usage sinks, all required live metrics, truthful
  raw/invoice cost separation, kill-switch proof and fresh external acceptance.
- Stop condition: all checklist rows and required fields pass; otherwise Row 10
  stays unchecked, feature remains off and the packet records exact blockers.
- Rollback: revert linked AiphaBee/FastClaw commits; disable staging feature;
  delete temporary Worker/Container/scanner resources, secrets, synthetic rows
  and objects; read back no public route, no live sandbox and no residual lease.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Capture contract/worktrees and pin current provider prices/permissions.
- [x] Implement and verify FastClaw callback-before-execution run broker.
- [x] Implement AiphaBee compliant service-binding transport and live composition.
- [x] Wire authoritative scanner, terminal usage, kill and durable handoff sinks.
- [x] Implement fail-closed staging migration/fixture/evidence/cleanup operators.
- [x] Dry-run, deploy private staging dependencies and apply/read back migrations.
- [x] Run 10-way cross-tenant security/load/kill/cleanup acceptance. Ten provider-linked Sandboxes overlapped and cleanup returned zero residual rows/objects.
- [x] Read Cloudflare metrics/logs/billing and calculate per-run costs. All required provider reads and per-run raw list costs are complete; invoice allocation remains truthfully null.
- [x] Obtain fresh independent security/compliance acceptance for both diffs and packet.
- [x] Clean temporary state and prove feature/public route off. Row 10 is complete while production/public dispatch remains disabled.
