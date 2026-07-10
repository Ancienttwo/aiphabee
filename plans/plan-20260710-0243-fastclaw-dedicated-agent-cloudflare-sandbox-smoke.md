# Plan: FastClaw 专属 Agent + Cloudflare Sandbox Smoke

> **Status**: Completed
> **Created**: 20260710-0243
> **Slug**: fastclaw-dedicated-agent-cloudflare-sandbox-smoke
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: user-approved:2026-07-10
> **Artifact Level**: work-package
> **Promotion Reason**: cross_repo_runtime_security_provider_boundary
> **Verification Boundary**: AiphaBee vitest/typecheck/contract checks + FastClaw go test/vet + deterministic integration smoke + credential-gated live readback
> **Rollback Surface**: Revert additive AiphaBee Bridge/smoke branch and FastClaw cloudflare backend branch; production runner remains disabled and no production DB migration exists
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md`
> **Task Review**: `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md`
> **Implementation Notes**: `tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: user-approved:2026-07-10
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md`
- Sprint contract: `tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md`
- Sprint review: `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md`
- Implementation notes: `tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md`.

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
- Contract file: `tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md`
- Review file: `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md`
- Implementation notes file: `tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert additive AiphaBee Bridge/smoke branch and FastClaw cloudflare backend branch; production runner remains disabled and no production DB migration exists
- **Verification boundary**: AiphaBee vitest/typecheck/contract checks + FastClaw go test/vet + deterministic integration smoke + credential-gated live readback
- **Review/acceptance boundary**: `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: cross_repo_runtime_security_provider_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md`, `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md`, and `tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert additive AiphaBee Bridge/smoke branch and FastClaw cloudflare backend branch; production runner remains disabled and no production DB migration exists

## Captured Planning Output

# FastClaw 专属 Agent + Cloudflare Sandbox 端到端 Smoke

## Goal

在不打开 AiphaBee production `runner_remote`、不引入真实 LLM 费用、也不写入生产数据库的前提下，完成一条可重复、可验收的端到端链路：为一个付费用户身份 provision 一个 FastClaw 专属 Agent；AiphaBee 以 run-scoped 授权调用 FastClaw；FastClaw 的 `exec` / file tools 经官方 Cloudflare Sandbox Bridge 在 `standard-1` 沙箱内写入、读取并校验 artifact；无论成功失败都销毁 sandbox，并输出用量与成本估算证据。

## Scope and Non-goals

### In scope

- AiphaBee 新增独立内部 Cloudflare Sandbox Bridge Worker，使用官方 `@cloudflare/sandbox` SDK。
- AiphaBee 新增 run-scoped HMAC token、Durable Object 调用预算/终态保护、Bridge HTTP API 和单元测试。
- AiphaBee 新增 deterministic smoke orchestrator：FastClaw user/agent provision、streaming run、artifact hash 校验、销毁 readback、成本估算。
- FastClaw 在 `dev@c4c4194` 基线上新增 `cloudflare` sandbox backend，通过现有 `sandbox.Executor` / `ExecutorPool` seam 接 Bridge。
- FastClaw 将 `X-AiphaBee-Sandbox-Authorization` 仅放入 request context，供 executor 使用；不得进入 request params、LLM prompt、日志或持久会话。
- deterministic fake model/fake bridge integration tests；真实 Bridge operator smoke 保持显式 opt-in。
- 更新 FastClaw sandbox 选型研究与三份历史 sprint completion 文档，使成本、identity/sandbox 边界和当前实现事实一致。

### Out of scope

- 不启用 AiphaBee production `runner_remote`，现有 public `/agent/*` dry-run 行为不变。
- 不做 production DB migration、不持久化 user-to-agent mapping、不改 billing/UI。
- 不接真实 LLM provider，不把一次 smoke 的估算写成实际账单。
- 不加入 Sandbank/Boxlite provider fallback；Bridge 或 Cloudflare 失败时 fail closed。
- 不改变 `AgentRunner.run(request): AsyncIterable<AgentExecutionEvent>` public authority contract，也不新增公开 event semantics。

## P1: Architecture Map

### Authority and ownership

1. `packages/agent-runtime` 继续拥有 AiphaBee run request 和 `AgentExecutionEvent` 公共 contract。
2. smoke orchestrator 负责 app-user / dedicated-agent provision、run token 签发、FastClaw SSE 消费、结果聚合与 operator evidence。
3. FastClaw 继续拥有 agent/tool loop；Cloudflare backend 只实现既有 `sandbox.Executor`，不拥有 run/event public API。
4. Sandbox Bridge Worker 是 provider adapter 和安全边界；官方 SDK 只在 Worker 内运行，外部 Go runtime 只调用 Bridge HTTP API。
5. Durable Object 只拥有单个 identity-bound run token 的调用计数、结构化 exec argv/stdout hash receipt 与 terminal destroy 状态。

### Entry points

- AiphaBee operator entrypoint: `npm run smoke:fastclaw-cloudflare-sandbox`。
- Bridge entrypoints: `/v1/sandboxes/:id/exec`、`/files/*` 和 `/destroy` 的受限内部 API。
- FastClaw entrypoint: `/v1/chat/completions`，使用现有 `agent_id`、app-user 和 SSE contract。
- FastClaw sandbox entrypoint: `internal/sandbox.ExecutorPool.Get` -> Cloudflare executor。

### Authoritative files

- AiphaBee: `packages/agent-runtime/src/index.ts`、新增 `apps/sandbox-bridge/`、新增 smoke scripts/tests、root `package.json`。
- FastClaw: `internal/sandbox/executor.go`、新增 Cloudflare backend、sandbox config、gateway pool construction、OpenAI request context propagation及其 tests。
- Ops evidence: `docs/researches/20260709-fastclaw-sandbox-backend-selection.md` 与 task notes/review。

## P2: Concrete Trace

1. Operator 提供 FastClaw base URL/admin API key/template agent id、Bridge URL、共享 HMAC key，以及 Cloudflare deploy credentials；live smoke 缺任一项即在网络调用前失败。
2. smoke orchestrator 以稳定 external user key 调 `POST /v1/users`，再以 admin contract 调 `POST /api/users/{id}/agents` fork template，得到本次临时数据库内的 dedicated `agent_id`。
3. orchestrator 生成 `v=1, jti/run_id, tenant_hash, user_hash, scopes, max_calls, iat, exp<=600s` 的 HMAC-SHA256 token；原始 tenant/user 不写入 token；sandbox/RunGuard identity 同时绑定 jti + tenant_hash + user_hash，避免不同租户复用 run id 时碰撞。
4. orchestrator 请求 `/v1/chat/completions`，token 只通过 `X-AiphaBee-Sandbox-Authorization` header 进入 FastClaw request context。
5. deterministic model 产生一次 exec tool call；FastClaw Cloudflare executor 从 context 取 token，计算 server-derived sandbox id，并调用 Bridge。
6. Bridge 校验签名、时间窗、scope、sandbox id 和 RunGuard quota；用 `standard-1`、`enableInternet=false` 创建 sandbox，执行 write/read/hash。
7. FastClaw 将 tool result 返回给 deterministic model 并完成 SSE；Bridge RunGuard 保存 exec 的 argv SHA-256、exit code 与 stdout SHA-256。AiphaBee 直接读取 receipt 和 sandbox artifact，验证 exact argv、`sha256sum` stdout hash 与文件 hash，LLM 回显本身不构成 authority evidence。
8. FastClaw turn 结束只 forget/scrub 本地 executor/token；AiphaBee 是唯一 provider cleanup owner，在 `finally` 调用 Bridge destroy，RunGuard 标记 terminal。销毁失败必须使 smoke 失败并标为 leak candidate。
9. active run 最多 540s，token 最多 600s，给 evidence + cleanup 保留 60s；evidence 只记录 run id、agent id、hash、wall-clock、sandbox class、估算 memory/disk seconds 和 CPU low/high 区间，不记录 secret/token/artifact content。

## P3: Design Decision

- 官方 Sandbox SDK 的 runtime 边界是 Cloudflare Workers，因此采用独立 Bridge Worker；让 Go runtime 直接导入 SDK不可行，让 AiphaBee 自建另一个 `SandboxBackend` 又会绕开 FastClaw 实际 tool path。
- 复用 FastClaw `Executor/ExecutorPool` 是最小 coherent change：工具循环、agent 选择、session 和公共 API 不变，只替换执行 provider。
- token 放 header/context 而不是 `params`，因为 FastClaw 会把 params 渲染进 LLM prompt；这是 credential non-disclosure invariant。
- smoke 用 temporary FastClaw DB + deterministic model，隔离 agent-create 幂等缺口和真实模型成本；production mapping/entitlement 属后续产品 slice。
- `max_instances=10` 是第一阶段并发上限。10x 后首先失效的是 Durable Object/bridge queue latency 与 provider concurrency，不是 event schema；在测得容量前不扩大。

## Security Contract

- HMAC-SHA256；固定版本；canonical payload；constant-time signature compare。
- token TTL 最大 600 秒；未来时间、过期、未知 scope、重复 terminal 调用全部拒绝。
- server-derived sandbox id 与 RunGuard DO identity 同时绑定 token jti、tenant_hash、user_hash；caller 不得选择任意 sandbox id，也不能用相同 run id 跨 tenant/user 碰撞。
- RunGuard Durable Object 原子执行 `max_calls`，destroy 后所有非幂等 cleanup 调用拒绝。
- exec receipt 只保存 argv/stdout SHA-256 与 exit code；AiphaBee 必须再直接读取 artifact 并 hash，model completion 不是执行证据。
- active budget 最大 540s，token TTL 最大 600s，60s cleanup reserve 不可被执行预算占用。
- sandbox profile 固定 `standard-1`，`enableInternet=false`；不提供 outbound compatibility fallback。
- sensitive header 必须从结构化日志、错误体、LLM prompt、persisted session 中排除。

## Task Breakdown

- [x] 捕获 Approved contract/worktree，隔离 AiphaBee 现有 Netquity WIP；FastClaw 从 `dev@c4c4194` 建独立 worktree。
- [x] 实现 Bridge token verifier、RunGuard Durable Object、受限 HTTP routes、Cloudflare Sandbox lifecycle 和单元测试。
- [x] 实现 FastClaw Cloudflare `Executor/ExecutorPool`、request-context credential threading、config/gateway wiring 和 Go tests。
- [x] 实现 AiphaBee deterministic orchestrator、FastClaw provision/SSE client、receipt/artifact/hash/destroy/cost evidence 和 tests。
- [x] 加入 root scripts、Bridge `.dev.vars` example、operator runbook 与 FastClaw README；更新研究文档，明确 Cloudflare 与 Sandbank 成本及选择。
- [x] 运行 AiphaBee targeted/full tests/typecheck/contract checks、FastClaw Go tests/vet/race、secret non-disclosure grep 和 deterministic model smoke。
- [x] 使用 Wrangler OAuth、Docker 与 disposable FastClaw 完成 live Bridge smoke：serial 1/1、最终 concurrency 10/10；随后删除 staging Worker 与 Container application 并 readback。
- [x] 完成 implementation notes、独立 review evidence 和 rollback/readback。

## Verification

### AiphaBee

```sh
npm --workspace @aiphabee/sandbox-bridge test
npm --workspace @aiphabee/sandbox-bridge run typecheck
npx vitest run packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts
npm run check:fastclaw-cloudflare-sandbox-smoke
npm run typecheck
git diff --check
repo-harness run verify-contract --strict
```

### FastClaw

```sh
go test ./internal/sandbox/... ./internal/api/... ./internal/gateway/...
go vet ./internal/sandbox/... ./internal/api/... ./internal/gateway/...
git diff --check
```

### Security/readback

```sh
rg -n "X-AiphaBee-Sandbox-Authorization|sandbox_authorization" <changed-files>
rg -n "params.*sandbox|log.*sandbox.*authorization" <changed-files>
```

Expected: credential only appears in header/context access and test redaction assertions; no prompt/log/persistence sink.

## Evidence Contract

- **State/progress path**: active plan Task Breakdown、task contract、implementation notes、review file。
- **Verification evidence**: AiphaBee vitest/typecheck/check output；FastClaw go test/vet；live smoke JSON evidence when credentials exist。
- **Evaluator rubric**: dedicated agent id is provisioned；one tool execution crosses FastClaw -> Bridge -> Cloudflare sandbox；artifact hash matches；destroy readback proves terminal；no secret disclosure；cost output is estimate-labelled。
- **Stop condition**: deterministic integration and all targeted checks pass；live smoke either passes with real evidence or explicitly records missing credentials without claiming deployment success；public runner remains disabled。
- **Rollback surface**: delete/revert new Bridge Worker and smoke code；disable/remove FastClaw `cloudflare` backend config and revert its isolated branch；no DB rollback and no production data cleanup required。

## Promotion Gate

- **Merge/PR unit**: one AiphaBee contract branch plus one explicitly linked FastClaw branch; each remains independently reviewable.
- **Rollback surface**: additive Worker/backend/smoke surfaces only; public production runtime unchanged.
- **Verification boundary**: AiphaBee tests/typecheck/contract checks plus FastClaw Go tests/vet and deterministic end-to-end smoke。
- **Review/acceptance boundary**: task review must verify both repos and record live smoke state without fabricated success。
- **High-risk surface**: auth token leakage、sandbox leak、cross-run access、Bridge API mismatch。
- **Why not checklist row**: cross-repo runtime/security/provider boundary and independently rollbackable deployment unit require a work-package contract。

## Risks and Rollback

- Bridge HTTP API 与 FastClaw executor 所需 streaming/file semantics 不匹配：在 adapter 处失败，保持 `runner_remote` disabled，不切换到其他 provider。
- destroy 超时/失败：返回失败并记录 sandbox id hash 为 leak candidate；operator runbook执行 provider-side cleanup。
- Cloudflare credentials 不可用：完成 deterministic contract verification，live 状态记为未运行，不将估算冒充账单。
- FastClaw upstream diverges：分支固定从 `dev@c4c4194`；不携入当前 SalesKo 专用分支 commits。

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] 捕获 Approved contract/worktree，隔离 AiphaBee 现有 Netquity WIP；FastClaw 从 `dev@c4c4194` 建独立 worktree。
- [x] 实现 Bridge token verifier、RunGuard Durable Object、受限 HTTP routes、Cloudflare Sandbox lifecycle 和单元测试。
- [x] 实现 FastClaw Cloudflare `Executor/ExecutorPool`、request-context credential threading、config/gateway wiring 和 Go tests。
- [x] 实现 AiphaBee deterministic orchestrator、FastClaw provision/SSE client、receipt/artifact/hash/destroy/cost evidence 和 tests。
- [x] 加入 root scripts、Bridge `.dev.vars` example、operator runbook 与 FastClaw README；更新研究文档，明确 Cloudflare 与 Sandbank 成本及选择。
- [x] 运行 AiphaBee targeted/full tests/typecheck/contract checks、FastClaw Go tests/vet/race、secret non-disclosure grep 和 deterministic model smoke。
- [x] 使用 Wrangler OAuth、Docker 与 disposable FastClaw 完成 live Bridge smoke：serial 1/1、最终 concurrency 10/10；随后删除 staging Worker 与 Container application 并 readback。
- [x] 完成 implementation notes、独立 review evidence 和 rollback/readback。
