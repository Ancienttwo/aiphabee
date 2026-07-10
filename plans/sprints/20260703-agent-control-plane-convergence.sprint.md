# Sprint: Agent Control Plane Convergence

> **Status**: Done
> **Slug**: agent-control-plane-convergence
> **Created**: 2026-07-03 20:42 +0800
> **Updated**: 2026-07-10 02:05 +0800
> **Source PRD**: `plans/prds/20260703-2042-agent-control-plane-convergence.prd.md`
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: incremental

Program-level sprint container. The Source PRD summary and ordered backlog
decompose product intent into task-contract slices; each backlog row is a
long-task waypoint that must be expanded with `$think` before code edits.
`tasks/todos.md` stays the deferred-goal ledger and never carries this backlog.

## PRD

Full PRD: `plans/prds/20260703-2042-agent-control-plane-convergence.prd.md` (Draft).

### Problem

- The repo already has Agent runtime scaffolds, Worker `/agent/*` routes, tool registry, answer/evidence contracts, and the landed `parse_chart_image` chain.
- Creating new Agent contract packages would split run/event/tool authority.
- The next slice must converge existing scaffolds into one Agent Control Plane before Generic guarded-live or FastClaw runner work proceeds.

### Users

- Backend/runtime engineer: needs one stable contract for Generic, Research, chart tools, and future FastClaw adapter.
- Product/frontend engineer: needs deterministic selected layer, route reason, event envelope, and evidence state.
- Compliance/support operator: needs traceable route, tool, evidence, and validator decisions.

### Success Criteria

- `@aiphabee/agent-runtime` is the only Agent contract authority.
- Worker `/agent/*` consumes runtime contract; it does not define a second contract.
- Generic layer cannot call `parse_chart_image`.
- Research layer can call `parse_chart_image` only through tenant/image/calibration/evidence gates.
- Existing parse-chart-image and Worker regression tests remain green.

### Acceptance Scenarios

- Generic requested tool policy blocks `parse_chart_image` before any tool/model call.
- Research requested tool policy allows `parse_chart_image` only with technical-analysis entitlement and tenant context.
- Wrong-tenant or inactive imageRef remains fail-closed through existing image-store/fetch semantics.
- No ready calibration, version mismatch, or insufficient sample count cannot produce `auto_match`.

### Non-goals

- No new `packages/agent-contracts`.
- No new `packages/agent-generic`.
- No new `apps/api-worker`.
- No FastClaw adapter implementation in this sprint.
- No Generic guarded-live model cutover in this sprint.
- No production auth/session implementation in this sprint.
- No licensed-advice mode, broker write tools, or automated trading.

## Architecture Notes

### Capabilities Touched

- `packages/agent-runtime`: Agent layer, run mode, execution request/event, runner interface, route decision, and layer tool policy.
- `packages/agent-runtime/src/parse-chart-image`: existing research-only chart parser gates and tests must remain intact.
- `packages/tool-registry`: source for registered tools; may receive or feed layer capability metadata if needed.
- `apps/worker/src/index.ts`: Worker route adapter should record or surface selected layer and route reason without owning a competing contract.
- `apps/worker/src/index.test.ts`: regression and route-policy fixture coverage.

### Dependency Order

- Task 1 establishes contract authority and tool policy.
- Task 2 wires route decision/readback in Worker without enabling live Generic.
- Task 3 hardens evidence/check surfaces for chart parser as research-only.
- Generic guarded-live and FastClaw runner adapter must wait for this sprint's contract convergence.

### Risks

- P0: second Agent authority emerges if Worker or new packages define separate run/event/tool semantics.
- P0: Generic accidentally receives access to `parse_chart_image`, bypassing Research entitlement and calibration expectations.
- P1: `parse_chart_image` is treated as production-auth-ready; current PR #22 boundary is fixture/smoke-level auth with server-owned tenant context.
- P1: scope creeps into Generic live model execution or FastClaw adapter before the control-plane contract is stable.

## Backlog

Ordered execution queue; keep rows in dependency order. Mode `contract` runs
the full plan -> contract -> worktree flow; `inline` allows primary-tree
execution for small tasks. Every row needs a concrete acceptance line.

| # | Status | Task | Mode | Acceptance | Plan |
|---|--------|------|------|------------|------|
| 1 | [x] | Agent layer + runner contract convergence | contract | `npx vitest run packages/agent-runtime/src/index.test.ts` passes with `AgentLayer`, `AgentRunMode`, `AgentExecutionRequest`, `AgentExecutionEvent`, `AgentRunner`, and route decision fixtures; no new `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker` files exist | (pre-satisfied — see Execution Log 2026-07-09) |
| 2 | [x] | Layer tool policy + parse_chart_image research-only gate | contract | Generic policy blocks `parse_chart_image`; Research policy allows it only with technical-analysis entitlement + tenant context; unknown tools default deny; `npx vitest run packages/agent-runtime/src/parse-chart-image` stays green | (pre-satisfied — see Execution Log 2026-07-09) |
| 3 | [x] | Worker route decision readback | contract | Worker `/agent/*` route plan/dry-run response includes `requested_layer`, `selected_layer`, and `route_reason`; route decision is runtime-owned; `npx vitest run apps/worker/src/index.test.ts` passes | (pre-satisfied — see Execution Log 2026-07-09) |
| 4 | [x] | Research chart evidence boundary handoff | contract | Chart parse outcome exposes evidence candidate/data-status handoff fields without exposing pixels/raw bytes; wrong tenant, inactive ref, no ready calibration, version mismatch, and insufficient sample count remain non-`auto_match`; `npm run check:answer-evidence-contract` and targeted vitest pass | plans/plan-20260709-1743-research-chart-evidence-handoff.md |

## 2026-07-10 Completion Audit And Follow-on Boundary

This sprint is genuinely complete at **4/4**. A fresh readback on 2026-07-10
verified `99/99` targeted `agent-runtime`/`parse-chart-image` tests, `252/252`
Worker tests, and `check:answer-evidence-contract=ok`. The forbidden parallel
authority roots remain absent: `packages/agent-contracts`,
`packages/agent-generic`, and `apps/api-worker`.

The following work is **not** missing from this sprint; it was an explicit
non-goal and needs a new executable sprint:

- Provision one dedicated FastClaw Agent identity/profile for each entitled
  paid user. AiphaBee owns the user-to-agent mapping, entitlement, billing,
  audit, disable, and delete lifecycle. Provisioning failure is fail-closed and
  retryable; it must not silently fall back to a shared Agent.
- Implement FastClaw as an `AgentRunner` behind
  `AgentRunner.run(request): AsyncIterable<AgentExecutionEvent>`.
- Implement a thin `SandboxBackend` below FastClaw. The sandbox is ephemeral
  per run/session; it is not the durable per-user Agent identity or memory
  authority.
- Use Cloudflare Sandbox SDK as the production-primary backend. The alternative
  named "Cloudbank" in discussion is recorded as **Sandbank Cloud**; the
  unrelated `cloudbank.org` research-cloud broker is not a sandbox provider.
  Current official pricing and workload estimates are maintained in
  `docs/researches/20260709-fastclaw-sandbox-backend-selection.md`.

No `packages/agent-fastclaw`, `packages/sandbox-runtime`, `SandboxBackend`, or
live FastClaw adapter exists in the current tree, so no FastClaw deployment or
sandbox-cost-at-runtime claim is complete yet.

## Execution Log

Keep this section last; `.ai/harness/scripts/sprint-backlog.sh complete-task` appends rows here.

| When | Task | Plan | Result |
|------|------|------|--------|
| 2026-07-09 17:12 HKT | Rows 1–3 freshness audit (pre-satisfied) | (none) | Rows 1–3 drafted 07-03,已被後續落地覆蓋:parse-chart-image task 5(PR #23 layer tool policy + research-only gate)、5f9e7c1 chart upload routing、f017ff5 ephemeral scaffold。2026-07-09 按 acceptance 原文實跑:agent-runtime/tool-registry/market-data vitest 149 passed;apps/worker vitest 252 passed;`packages/agent-contracts`/`packages/agent-generic`/`apps/api-worker` 不存在;worker readback 含 `requested_layer`/`selected_layer`/`route_reason`(apps/worker/src/index.ts:1238)。Row 4 仍開放:`ParseChartImageOutcome`(parse-chart-image/types.ts:45)無 evidence candidate/data-status handoff 欄位,`check:answer-evidence-contract` 通過但屬既有面。 |
| 2026-07-09 22:53 HKT | Row 4 Research chart evidence boundary handoff | plans/plan-20260709-1743-research-chart-evidence-handoff.md | merged fe19f58, vitest 48/48 + contract check ok + typecheck clean, gatekeeper PASS + Codex adjudicated pass, details in tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md |
