# Archived Sprint: AiphaBee 双层 Agent + FastClaw/E2B 投研 Runner

> **Status**: Archived
> **Slug**: dual-agent
> **Created**: 2026-07-03 17:42 +0800
> **Updated**: 2026-07-10 04:10 +0800
> **Source PRD**: `plans/prds/20260703-1742-dual-agent.prd.md`
> **Source Spec**: `docs/spec.md`
> **Superseded By**: `plans/prds/20260703-2042-agent-control-plane-convergence.prd.md`, `plans/sprints/20260703-agent-control-plane-convergence.sprint.md`
> **Goal Mode**: archived

## 2026-07-10 完成度审计与当前决策

这份原始 1,232 行的 v0.1 是历史方案，不是当前可执行 sprint；下方未勾选的
checklist 不能当作当前 backlog，也不能把 Archived 误读成 Done。

| 范围 | 当前完成度 | 证据 |
|---|---|---|
| Agent Control Plane 收敛 | **已完成 4/4** | 替代 sprint `20260703-agent-control-plane-convergence.sprint.md`；2026-07-10 复跑 Agent runtime `99/99`、Worker `252/252`、answer/evidence contract `ok` |
| FastClaw `AgentRunner` adapter | **staging/smoke 已实现；production 未启用** | 独立 contract branch 的 `packages/agent-runtime/src/fastclaw-sandbox-smoke.ts` 实现既有 `AgentRunner`；production `runner_remote` 保持关闭 |
| 付费用户专属 Agent provisioning | **smoke provision 已实现；产品生命周期未实现** | 每次 smoke 通过 `/v1/users` + fork template 创建 disposable dedicated Agent；durable user→agent mapping、entitlement/billing/disable/delete 仍缺 |
| Cloudflare sandbox execution | **deterministic contract 已实现；live 未验收** | `apps/sandbox-bridge` + linked FastClaw `cloudflare` Executor/Pool 已有 receipt/artifact/destroy tests；Docker/凭证缺失，live=`not_run_missing_credentials` |

当前产品记录已经收紧为：

1. 每个有 entitlement 的付费用户 provision 一个**专属 FastClaw Agent
   identity/profile**；AiphaBee 持有映射、鉴权、计费、审计、停用和删除
   authority。provision 失败必须 fail-closed/retryable，不得静默降级到共享
   Agent。
2. 专属 Agent 不等于 24x7 常驻 sandbox。sandbox 按 run/session 临时创建，
   只拿 job-scoped token；批准的 artifact 同步到 AiphaBee-owned storage 后销毁。
3. sandbox 生产主选为 **Cloudflare Sandbox SDK**；讨论中的
   “Cloudbank”按 **Sandbank Cloud** (`sandbank.dev/cloud`) 记录，
   `cloudbank.org` 是研究云资源经纪平台，不是本方案候选。
4. Cloudflare 与 Sandbank Cloud 的最新官方价格、公式和 100/1,000/10,000
   付费用户情境见
   `docs/researches/20260709-fastclaw-sandbox-backend-selection.md`。Cloudflare
   继续作为 production-primary；Sandbank Cloud 只保留成本比较/data-free
   prototype，不进入合规生产路径。

**以下 v0.1 内容仅保留历史 provenance。所有 E2B、shared-template fallback
与未勾选 checklist 都已被上面的审计和替代 sprint 路由覆盖，不可直接执行。**

版本：v0.1
Sprint 长度：默认 2 周；Sprint 0 为 1 周技术预备。
核心目标：先把 **CF Worker Generic 问答 Agent** 上线为稳定基础能力，再把 **FastClaw + E2B 沙箱** 接成付费 AI 投研助手。
关键前提：**FastClaw/E2B 的并发沙箱与存算分离不重造，只做集成、隔离、压测、观测和产品化验收。**

FastClaw 当前适合作为 Agent Runtime：它负责 LLM 通信、工具执行、sandbox isolation、session management；其 upstream API 也明确支持上游应用用 `/v1/chat/completions`、`agent_id`、`user`、`X-Fastclaw-End-User`、`X-Fastclaw-Session-Key` 来接入，且 API key 要留在服务端。([GitHub][1])
E2B 侧要重点管好并发和成本：当前公开文档列出了不同计划的 concurrent sandboxes、sandbox creation rate、按运行秒数计费等限制；如果使用 E2B Volumes，还要注意 Volumes 当前文档标注为 private beta，并且是独立于 sandbox 生命周期的持久化存储能力。([E2B][2])

---

## 0. 项目总目标

上线后系统形态：

```text
Web / Mobile
  ↓
AiphaBee API / CF Worker
  ├─ Layer 1: Generic 问答 Agent
  │    └─ Vercel AI SDK v7
  │
  └─ Layer 2: Paid AI 投研助手
       └─ FastClaw Runner
            └─ E2B sandbox / FastClaw 存算分离
```

不变原则：

```text
前端只连接 AiphaBee API
鉴权只在 AiphaBee API
订阅/计费只以 AiphaBee 为准
合规/证据/审计只以 AiphaBee 为准
FastClaw 只做 execution plane
E2B sandbox 只做隔离计算环境
```

---

## 1. 全局 Definition of Done

所有 Sprint 都必须满足这些基础条件。

### 架构边界

* [ ] 前端 network tab 中没有 FastClaw base URL。
* [ ] 前端没有 FastClaw API key、E2B key、provider key。
* [ ] Web 只调用 `/api/agent/*`。
* [ ] AiphaBee API 是唯一 public contract。
* [ ] FastClaw Runner 只能被 AiphaBee server-side adapter 调用。
* [ ] Runner 不直接写 AiphaBee production DB。
* [ ] Runner 不直接读取用户真实 broker token / payment token / user secret。
* [ ] Tool Gateway 使用 run-scoped、短 TTL、最小权限 token。

### 产品边界

* [ ] 免费用户只能使用 Generic Agent。
* [ ] 付费用户才可使用 AI 投研助手。
* [ ] MVP 对外叫“AI 投研助手”，不叫“AI 投顾”。
* [ ] 默认 `research_only` mode。
* [ ] 买入、卖出、持有、目标价、止损价、仓位比例、自动交易请求必须触发 rewrite/block。
* [ ] 所有市场事实型回答有 evidence refs 或明确说明数据不可用。
* [ ] 所有 Layer 2 最终回答经过 AiphaBee post-check。

### 可靠性边界

* [ ] FastClaw down 时，登录、主 API、Generic Agent 仍可用。
* [ ] E2B sandbox 创建失败时，premium run 可进入 queued/retryable，不拖垮 API。
* [ ] Runner 超时、断流、429、5xx 都有明确 error code。
* [ ] 所有 run 有 `run_id`、`request_id`、`user_id_hash`、`selected_layer`。
* [ ] 所有 stream event 可幂等重放或至少可恢复最终结果。
* [ ] 所有 cost/token/tool usage 可按 run 聚合。

---

## 2. Sprint 总览

| Sprint   |    周期 | 主题                                | 主要产出                                                              | Release Gate              |
| -------- | ----: | --------------------------------- | ----------------------------------------------------------------- | ------------------------- |
| Sprint 0 |   1 周 | 架构冻结 + 技术 Spike                   | contracts、smoke tests、FastClaw/E2B 接入验证                           | Gate 0：能跑通两层最小链路          |
| Sprint 1 |   2 周 | Generic Agent MVP                 | `/api/agent/runs`、SSE、AI SDK v7 generic runner                    | Gate 1：内部可用               |
| Sprint 2 |   2 周 | Generic Agent 产品化                 | evidence、quota、policy、UI、观测                                       | Gate 2：可给免费用户灰度           |
| Sprint 3 |   2 周 | FastClaw Runner Alpha             | FastClaw adapter、app-user/session mapping、shared advisor template | Gate 3：付费用户可跑深度研究 smoke   |
| Sprint 4 |   2 周 | E2B 并发 + 存算分离验收                   | sandbox load test、artifact sync、Tool Gateway read-only            | Gate 4：Runner 可承受 beta 并发 |
| Sprint 5 |   2 周 | AI 投研助手 Alpha                     | onboarding、research-only post-check、报告历史、付费入口                     | Gate 5：20-50 人内测          |
| Sprint 6 |   2 周 | Premium 专属 Agent + Beta hardening | per-user clone、memory policy、admin、事故演练                           | Gate 6：公开 beta            |
| Sprint 7 | 1-2 周 | Launch + 成本优化                     | GA checklist、pricing guardrail、增长闭环                               | Gate 7：付费发布               |

---

# Sprint 0：架构冻结 + 技术 Spike

周期：1 周
目标：不写大功能，先确认两层链路都能跑通，避免后面返工。

## 0.1 交付物

```text
agent-contracts v0
Generic Agent Worker smoke
FastClaw upstream API smoke
E2B sandbox/concurrency/storage decision note
数据模型 migration draft
风险/合规边界文档
```

Vercel AI SDK v7 当前文档说明其 v7 版本有 Node.js 22 与 ESM import 要求，并且 AI SDK Core 支持 `streamText`、tool calling、多步调用等能力；因此 Sprint 0 必须先做 Cloudflare Worker runtime compatibility spike。([Vercel][3])

## 0.2 Checklist

### Product / Architecture

* [ ] 明确 Layer 1 与 Layer 2 的用户可见命名。
* [ ] 明确免费、Pro、Premium 三档 entitlement。
* [ ] 明确 `research_only` MVP 边界。
* [ ] 明确哪些问题走 Generic，哪些问题走 Research。
* [ ] 明确哪些输出必须 block/rewrite。
* [ ] 确认 FastClaw 只作为 Runner，不作为 public API。
* [ ] 确认 E2B sandbox 只承载计算，不成为用户数据 authority。

### Contracts

* [ ] 定义 `AgentRunRequest`。
* [ ] 定义 `AgentExecutionRequest`。
* [ ] 定义 `AgentExecutionEvent`。
* [ ] 定义 `EvidenceItem`。
* [ ] 定义 `ComplianceDecision`。
* [ ] 定义 `ToolInvocation`。
* [ ] 定义统一 SSE event envelope。
* [ ] 定义 FastClaw event → AiphaBee event mapping。
* [ ] 定义 error code taxonomy。

建议第一版 contract：

```ts
type AgentLayer = 'generic' | 'research';

type AgentRunStatus =
  | 'created'
  | 'queued'
  | 'running'
  | 'streaming'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'retryable'
  | 'runner_unavailable';

interface AgentExecutionEvent {
  runId: string;
  eventIndex: number;
  layer: AgentLayer;
  type:
    | 'run.created'
    | 'run.queued'
    | 'runner.started'
    | 'model.delta'
    | 'tool.started'
    | 'tool.finished'
    | 'evidence.added'
    | 'validator.started'
    | 'answer.final'
    | 'error';
  payload: Record<string, unknown>;
  visibleToUser: boolean;
  createdAt: string;
}
```

### Generic Worker Spike

* [ ] 创建最小 `/api/agent/runs`。
* [ ] 创建最小 `/api/agent/runs/:id/stream`。
* [ ] 跑通 Vercel AI SDK v7 `streamText`。
* [ ] 跑通一个 mock tool call。
* [ ] 验证 Worker bundle size。
* [ ] 验证 `AbortSignal` / timeout。
* [ ] 验证 client disconnect 行为。
* [ ] 验证 SSE 在现有前端可消费。
* [ ] 记录 Cloudflare Worker runtime 兼容性问题。

### FastClaw / E2B Spike

* [ ] Pin FastClaw commit。
* [ ] 本地或 staging build FastClaw image。
* [ ] 配置 server-side FastClaw API key。
* [ ] 调通 `/v1/chat/completions` non-stream。
* [ ] 调通 `/v1/chat/completions` stream。
* [ ] 设置 `agent_id`。
* [ ] 设置 `user` 或 `X-Fastclaw-End-User`。
* [ ] 设置 deterministic `X-Fastclaw-Session-Key`。
* [ ] 确认 FastClaw `params` 能传入 run context。
* [ ] 确认 FastClaw E2B sandbox backend 配置方式。
* [ ] 确认 sandbox 创建、运行、清理流程。
* [ ] 确认并发 sandbox limit。
* [ ] 确认 sandbox creation rate limit。
* [ ] 确认 sandbox 超时与 idle cleanup。
* [ ] 确认存算分离中的“存储 source of truth”。
* [ ] 确认 output artifacts 最终保存到 AiphaBee object storage / S3，而不是只留在 sandbox。

### Data / Infra

* [ ] 建 `agent_runs` migration draft。
* [ ] 建 `agent_run_events` migration draft。
* [ ] 建 `tool_invocations` migration draft。
* [ ] 建 `research_agent_profiles` migration draft。
* [ ] 建 `compliance_decisions` migration draft。
* [ ] 建 staging secrets namespace。
* [ ] 建 FastClaw health check endpoint。
* [ ] 建 E2B cost/concurrency dashboard 初版。
* [ ] 建 alert channel。

## 0.3 Exit Criteria

* [ ] Worker Generic smoke 可 streaming。
* [ ] Worker Generic smoke 可调用 mock tool。
* [ ] API server-side 可调用 FastClaw stream。
* [ ] 前端不需要知道 FastClaw。
* [ ] FastClaw/E2B 基本配置路径确认。
* [ ] 数据模型 v0 通过 review。
* [ ] 合规边界 v0 通过 review。

---

# Sprint 1：Generic Agent MVP

周期：2 周
目标：让 Layer 1 可以内部使用，成为后续所有 Agent 的统一入口。

## 1.1 交付物

```text
/api/agent/runs
/api/agent/runs/:id/stream
Generic runner
基本路由器
基础 UI streaming
run/event persistence
mock evidence
```

## 1.2 Checklist

### Backend / API

* [ ] 实现 `POST /api/agent/runs`。
* [ ] 实现 `GET /api/agent/runs/:run_id/stream`。
* [ ] 创建 run 时写入 `agent_runs`。
* [ ] stream event 写入 `agent_run_events`。
* [ ] 支持 `requested_layer = auto | generic | research`。
* [ ] Sprint 1 暂时强制 route 到 `generic`。
* [ ] 支持 `request_id` 幂等。
* [ ] 支持 run timeout。
* [ ] 支持 user cancellation。
* [ ] 支持 basic rate limit。
* [ ] 支持 basic usage metering。

### Generic Runner

* [ ] 封装 `GenericAgentRunner`。
* [ ] 接入 AI SDK v7 provider。
* [ ] 实现 `streamText` → AiphaBee SSE event。
* [ ] 实现 `onStepFinish` 或等价 step capture。
* [ ] 支持 tool call event。
* [ ] 支持 final answer event。
* [ ] 支持 model error event。
* [ ] 支持 abort/cancel。

### Tools v0

* [ ] `get_product_help_doc` mock。
* [ ] `get_public_market_snapshot` mock。
* [ ] `get_company_profile` mock。
* [ ] `get_page_context`。
* [ ] tool allowlist by layer。
* [ ] tool input schema validation。
* [ ] tool output redaction。
* [ ] tool timeout。
* [ ] tool error fallback。

### Frontend

* [ ] 新增 Ask 入口。
* [ ] 新增 stream message renderer。
* [ ] 渲染 `model.delta`。
* [ ] 渲染 `tool.started`。
* [ ] 渲染 `tool.finished`。
* [ ] 渲染 final answer。
* [ ] 渲染 error state。
* [ ] 支持 stop generating。
* [ ] 支持 retry。
* [ ] 支持 thumbs up/down feedback。

### QA

* [ ] 单轮问答测试。
* [ ] 多轮问答测试。
* [ ] tool success 测试。
* [ ] tool timeout 测试。
* [ ] model timeout 测试。
* [ ] user cancel 测试。
* [ ] duplicate request_id 测试。
* [ ] disconnected SSE 测试。

## 1.3 Exit Criteria

* [ ] 内部用户可以从 UI 发起 Generic Agent 问答。
* [ ] p95 first token < 3 秒，或有明确优化 backlog。
* [ ] Generic run 失败不影响主页面。
* [ ] 所有 run 可在 DB 查到。
* [ ] 所有 error 有稳定 error code。
* [ ] 基础 demo 可演示 5 个成功用例和 5 个失败降级用例。

---

# Sprint 2：Generic Agent 产品化 + 灰度

周期：2 周
目标：把 Generic Agent 从“能跑”变成“可灰度上线”。

## 2.1 交付物

```text
evidence v1
compliance soft-block v1
quota/usage v1
observability v1
free-user grey release
upgrade CTA
```

## 2.2 Checklist

### Evidence

* [ ] 定义 `EvidenceItem` schema。
* [ ] 所有 market/public factual tools 返回 evidence。
* [ ] final answer 关联 evidence refs。
* [ ] 前端展示 evidence cards。
* [ ] evidence 缺失时显示“数据源不足”。
* [ ] evidence 保存到 DB。
* [ ] evidence 中不保存敏感 token。
* [ ] evidence 可按 run_id 查询。

### Compliance v1

* [ ] 实现 pre-classifier。
* [ ] 实现 post-classifier。
* [ ] 识别 `buy/sell/hold`。
* [ ] 识别 `target price`。
* [ ] 识别 `stop loss`。
* [ ] 识别 `position sizing`。
* [ ] 识别 `guaranteed return`。
* [ ] 触发 rewrite/block。
* [ ] 前端显示安全替代回答。
* [ ] compliance decision 写入 DB。

### Quota / Usage

* [ ] 免费用户每日请求额度。
* [ ] 付费用户每日请求额度。
* [ ] 每次 run token budget。
* [ ] 每次 run tool call budget。
* [ ] 每次 run wall-clock budget。
* [ ] 达到 quota 时返回 upgrade CTA。
* [ ] usage 可按用户查询。
* [ ] usage 可按 plan 聚合。

### Observability

* [ ] `agent_runs_total{layer,status}`。
* [ ] `agent_first_token_ms{layer}`。
* [ ] `agent_total_latency_ms{layer}`。
* [ ] `agent_errors_total{error_code}`。
* [ ] `tool_invocations_total{tool,status}`。
* [ ] `compliance_blocks_total{rule}`。
* [ ] `cost_estimate_usd{layer}`。
* [ ] 日志带 `run_id`。
* [ ] dashboard v1。
* [ ] alert v1。

### Frontend Productization

* [ ] 免费用户入口文案。
* [ ] 付费升级 CTA。
* [ ] evidence 展示。
* [ ] compliance blocked 展示。
* [ ] run history 简版。
* [ ] feedback reason 采集。
* [ ] 空状态。
* [ ] loading skeleton。
* [ ] mobile basic support。

### QA / Release

* [ ] 20 个 golden prompts。
* [ ] 10 个 compliance prompts。
* [ ] 10 个 evidence prompts。
* [ ] 10 个 failure prompts。
* [ ] 免费用户灰度 flag。
* [ ] 内部 dogfood 1 周。
* [ ] bug bash。
* [ ] rollback switch。

## 2.3 Exit Criteria

* [ ] 免费用户可灰度使用 Generic Agent。
* [ ] compliance block 准确触发核心高风险请求。
* [ ] evidence 展示可用。
* [ ] dashboard 能看到请求量、错误率、延迟。
* [ ] 出现模型/工具故障时用户看到可理解文案。
* [ ] Generic Agent 不引入主 API 稳定性问题。

---

# Sprint 3：FastClaw Runner Alpha

周期：2 周
目标：把 FastClaw 接成 AiphaBee 的 internal runner，先跑通 shared advisor template。

## 3.1 交付物

```text
FastClaw adapter
server-side key management
app-user/session mapping
shared advisor template
research run stream
runner health/circuit breaker v0
```

## 3.2 Checklist

### FastClaw Adapter

* [ ] 新建 `packages/agent-fastclaw`。
* [ ] 实现 `FastClawClient`。
* [ ] 实现 `FastClawStreamAdapter`。
* [ ] 支持 `agent_id`。
* [ ] 支持 `user`。
* [ ] 支持 `X-Fastclaw-End-User`。
* [ ] 支持 `X-Fastclaw-Session-Key`。
* [ ] 支持 `params`。
* [ ] 支持 streaming SSE parse。
* [ ] 支持 non-stream fallback。
* [ ] 支持 timeout。
* [ ] 支持 retry。
* [ ] 支持 abort。
* [ ] 支持 error mapping。
* [ ] 支持 usage extraction。

### Identity / Session

* [ ] AiphaBee user id → FastClaw app-user stable id。
* [ ] conversation id → deterministic session key。
* [ ] 不使用 email 作为 FastClaw user key。
* [ ] 不复用 unrelated conversations 的 session key。
* [ ] research run 关联 `fastclaw_user_id`。
* [ ] research run 关联 `fastclaw_session_key`。
* [ ] research run 关联 `runner_run_ref`。

### Advisor Template

* [ ] 创建 shared advisor template agent。
* [ ] 写 `SOUL.md` / system behavior。
* [ ] 写 `research_only` policy。
* [ ] 写 forbidden output rules。
* [ ] 写 evidence-first answer format。
* [ ] 写 portfolio risk answer format。
* [ ] 写 “不能给买卖建议” fallback。
* [ ] 配置默认模型。
* [ ] 配置默认工具为空或只接 Tool Gateway stub。
* [ ] 内部 prompt review。

### API Routing

* [ ] 付费用户可选择 `mode=research`。
* [ ] 免费用户请求 research 时返回 upgrade。
* [ ] `auto` mode 初版支持 route decision。
* [ ] route reason 写入 DB。
* [ ] selected layer 写入 DB。
* [ ] `research` run 进入 FastClaw adapter。
* [ ] FastClaw event 转换为 AiphaBee event。
* [ ] final answer 仍回到 AiphaBee validator。
* [ ] Web 仍只读 AiphaBee stream。

### Runner Health

* [ ] `/internal/runner-health/fastclaw`。
* [ ] FastClaw ping。
* [ ] E2B sandbox smoke ping。
* [ ] consecutive failure counter。
* [ ] circuit breaker state。
* [ ] `healthy/degraded/unavailable`。
* [ ] health dashboard。
* [ ] alert on unavailable。

### QA

* [ ] 付费用户 research smoke。
* [ ] 免费用户 research denied。
* [ ] FastClaw 401。
* [ ] FastClaw 404 agent not found。
* [ ] FastClaw 429。
* [ ] FastClaw 5xx。
* [ ] stream disconnect。
* [ ] duplicate callback/event。
* [ ] API timeout。
* [ ] kill FastClaw process。
* [ ] Generic Agent remains available。

## 3.3 Exit Criteria

* [ ] 付费内部用户能通过 AiphaBee UI 调用 FastClaw。
* [ ] 前端没有 FastClaw 暴露。
* [ ] shared advisor template 能回答 research-only 问题。
* [ ] FastClaw 挂掉时主 API 和 Generic Agent 正常。
* [ ] Research run 的所有状态、事件、错误可查。

---

# Sprint 4：E2B 并发 + 存算分离验收

周期：2 周
目标：不重写 FastClaw 的存算分离，但必须把它压到 AiphaBee 可上线标准。

## 4.1 交付物

```text
E2B concurrency test report
storage/compute separation acceptance report
sandbox lifecycle policy
artifact sync policy
Tool Gateway read-only v1
cost guardrail v1
```

## 4.2 E2B / FastClaw 验收重点

按你的前提，FastClaw 已经有成熟的 E2B 并发与存算分离方案。这里的任务不是重写，而是验证：

```text
AiphaBee 用户隔离是否成立
AiphaBee 成本上限是否可控
AiphaBee evidence/audit 是否完整
Runner crash 是否不会丢最终 artifact
sandbox 泄漏是否可检测和清理
多用户并发是否不会串 session / 串文件 / 串 memory
```

## 4.3 Checklist

### Sandbox Lifecycle

* [ ] 定义 sandbox lifecycle：created / running / idle / paused / killed / failed。
* [ ] 每个 research run 记录 sandbox id。
* [ ] 每个 sandbox 记录 owner run_id。
* [ ] 每个 sandbox 记录 owner user_id_hash。
* [ ] sandbox timeout 可配置。
* [ ] idle sandbox 自动清理。
* [ ] failed sandbox 自动 kill。
* [ ] zombie sandbox scanner。
* [ ] sandbox cleanup job。
* [ ] sandbox cleanup metrics。
* [ ] sandbox cleanup alert。
* [ ] sandbox creation failure fallback。
* [ ] sandbox rate limit fallback。

### Concurrency

* [ ] 定义全局 max active research runs。
* [ ] 定义 per-user max active research runs。
* [ ] 定义 per-plan max active research runs。
* [ ] 定义 FastClaw max concurrent calls。
* [ ] 定义 E2B max concurrent sandboxes。
* [ ] 定义 sandbox creation rate limiter。
* [ ] 定义 queue depth limit。
* [ ] queue full 时返回 retryable。
* [ ] 支持 queued status。
* [ ] 支持 estimated wait text。
* [ ] 支持 cancel queued run。
* [ ] 支持 cancel running run。
* [ ] 支持 load shedding。
* [ ] 支持 admin pause premium runner。

### Load Test Matrix

* [ ] 1 concurrent research run。
* [ ] 5 concurrent research runs。
* [ ] 10 concurrent research runs。
* [ ] 25 concurrent research runs。
* [ ] 50 concurrent research runs。
* [ ] 100 concurrent research runs，若当前 E2B plan 支持。
* [ ] 每个 run 3 tool calls。
* [ ] 每个 run 10 tool calls。
* [ ] 每个 run 1 个小文件。
* [ ] 每个 run 1 个大文件。
* [ ] 每个 run 生成 artifact。
* [ ] 50% run 被用户中途取消。
* [ ] 10% sandbox creation failure injection。
* [ ] 10% tool timeout injection。
* [ ] FastClaw restart during run。
* [ ] E2B API temporary 429 injection。
* [ ] API client disconnect during stream。

### 存算分离验收

* [ ] 明确 FastClaw DB 存什么。
* [ ] 明确 AiphaBee DB 存什么。
* [ ] 明确 object storage / S3 存什么。
* [ ] 明确 E2B sandbox workspace 存什么。
* [ ] 明确哪些数据是 ephemeral。
* [ ] 明确哪些数据是 durable。
* [ ] 明确哪些数据需要 audit retention。
* [ ] 明确哪些数据用户可删除。
* [ ] 明确 output artifact sync 时机。
* [ ] 明确 artifact sync 成功后 sandbox 文件是否清理。
* [ ] 明确 runner crash 后 artifact recovery 策略。
* [ ] 明确 per-user storage prefix。
* [ ] 明确 per-run workspace prefix。
* [ ] 明确 file name sanitization。
* [ ] 明确 path traversal 防护。
* [ ] 明确 user A 不能读 user B workspace。
* [ ] 明确同一用户不同 conversation 是否隔离。
* [ ] 明确 shared advisor template 下 memory/session 是否隔离。

FastClaw README 里把平台 DB、sessions、agent files、skills、应用侧 billing/output files 分开描述，并建议多 pod 用 Postgres；这和 AiphaBee 的边界一致：FastClaw 存 agent/runtime 状态，AiphaBee 保留用户、计费、最终 artifact 和审计。([GitHub][1])

### Tool Gateway v1

* [ ] 新建 `/internal/tools/market_snapshot`。
* [ ] 新建 `/internal/tools/company_profile`。
* [ ] 新建 `/internal/tools/filing_search`。
* [ ] 新建 `/internal/tools/news_search`。
* [ ] 新建 `/internal/tools/portfolio_readonly`。
* [ ] 所有工具需要 job token。
* [ ] job token 包含 `run_id`。
* [ ] job token 包含 `user_id`。
* [ ] job token 包含 scopes。
* [ ] job token 包含 expiry。
* [ ] job token 包含 max calls。
* [ ] job token 包含 max cost。
* [ ] 工具输出自动生成 evidence refs。
* [ ] 工具输出脱敏。
* [ ] 工具调用写 `tool_invocations`。
* [ ] 工具超时返回 structured error。
* [ ] 工具失败不暴露内部 stack trace。

### Cost Guardrail

* [ ] 每个 run max token。
* [ ] 每个 run max tool calls。
* [ ] 每个 run max sandbox runtime。
* [ ] 每个 run max E2B cost estimate。
* [ ] 每个用户 daily research run cap。
* [ ] 每个用户 monthly research cost cap。
* [ ] 每个 plan cost cap。
* [ ] 接近 cap 时预警。
* [ ] 超过 cap 时停止新建 run。
* [ ] dashboard 展示 active sandboxes。
* [ ] dashboard 展示 per-run estimated cost。
* [ ] dashboard 展示 failed sandbox cost leakage。

## 4.4 Exit Criteria

* [ ] 通过 25 并发 research run 压测，或明确当前 plan 上限。
* [ ] sandbox 泄漏率为 0，或有自动清理与告警。
* [ ] user isolation 测试通过。
* [ ] artifact sync 测试通过。
* [ ] cost cap 生效。
* [ ] FastClaw/E2B 故障不拖垮 AiphaBee API。
* [ ] Tool Gateway read-only 工具可用于真实 research run。

---

# Sprint 5：AI 投研助手 Alpha

周期：2 周
目标：让付费用户可以真正用 AI 投研助手完成深度研究，但仍保持 research-only。

## 5.1 交付物

```text
research onboarding
premium entitlement
research-only policy
post-check validator
report artifact
research history
20-50 人 alpha
```

## 5.2 Checklist

### Paid Entitlement

* [ ] 新增 `research_agent_enabled` entitlement。
* [ ] 新增 plan check。
* [ ] 新增 usage check。
* [ ] 新增 jurisdiction check。
* [ ] 新增 disclaimer accepted check。
* [ ] 免费用户 upgrade CTA。
* [ ] 订阅过期后禁用新 research run。
* [ ] 订阅过期后历史 run 可读。
* [ ] 订阅恢复后可继续使用。

### Onboarding

* [ ] 投资经验问题。
* [ ] 风险偏好问题。
* [ ] 关注市场问题。
* [ ] 常看行业问题。
* [ ] research-only disclaimer。
* [ ] 非投资建议声明。
* [ ] 用户确认按钮。
* [ ] onboarding 状态保存。
* [ ] onboarding 可重新编辑。
* [ ] onboarding 影响 `params`。

### Research UX

* [ ] 新增“深度投研助手”入口。
* [ ] 模式选择：快速问答 / 深度研究。
* [ ] premium badge。
* [ ] run progress timeline。
* [ ] tool progress 展示。
* [ ] evidence 展示。
* [ ] final answer 展示。
* [ ] report artifact 展示。
* [ ] history 展示。
* [ ] retry。
* [ ] cancel。
* [ ] copy/share internal link。
* [ ] feedback。

### Post-check Validator

* [ ] FastClaw draft hash 保存。
* [ ] draft 不直接给前端 final。
* [ ] evidence coverage check。
* [ ] high-risk claim check。
* [ ] personalized advice check。
* [ ] hallucination risk check。
* [ ] stale data check。
* [ ] no evidence fallback。
* [ ] rewrite response。
* [ ] block response。
* [ ] human review flag。
* [ ] final answer hash 保存。
* [ ] compliance decision 保存。

### Research Templates

* [ ] 单股票风险分析模板。
* [ ] 持仓风险分析模板。
* [ ] 财报总结模板。
* [ ] 新闻影响分析模板。
* [ ] 多公司比较模板。
* [ ] watchlist 周报模板。
* [ ] 反方观点模板。
* [ ] 情景分析模板。
* [ ] “不能提供买卖建议”替代表达模板。

### Alpha QA

* [ ] 50 个 research golden prompts。
* [ ] 20 个 portfolio prompts。
* [ ] 20 个 filings/news prompts。
* [ ] 20 个 compliance block prompts。
* [ ] 10 个 no-data prompts。
* [ ] 10 个 runner failure prompts。
* [ ] 10 个 sandbox failure prompts。
* [ ] 10 个 evidence failure prompts。
* [ ] 人工 review top 100 answers。
* [ ] Alpha bug bash。

## 5.3 Exit Criteria

* [ ] 20-50 个内部/种子付费用户可用。
* [ ] Research answer 有稳定结构。
* [ ] 高风险建议类问题不会直接输出买卖指令。
* [ ] Tool Gateway 证据链可追踪。
* [ ] Report/history 可回看。
* [ ] p95 research run 在目标范围内，或长任务进入 async 状态。
* [ ] 成本/run 在可接受范围内。

---

# Sprint 6：Premium 专属 Agent + Beta Hardening

周期：2 周
目标：把“付费独立 AI 投研助手”的专属感和运营能力做出来。

## 6.1 交付物

```text
per-user agent provisioning
memory policy
quota sync
admin run inspector
incident drills
public beta readiness
```

## 6.2 Checklist

### Per-user Agent Provisioning

* [ ] 定义 shared template → per-user clone 策略。
* [ ] 新增 `fastclaw_agent_id` 字段。
* [ ] 付费开通时 provision agent。
* [ ] provision 失败时标记 retryable/blocked 并停止；不得 fallback shared template。
* [ ] provision job 可重试。
* [ ] agent clone 带 research-only SOUL。
* [ ] agent clone 带用户 risk profile。
* [ ] agent clone 带 allowed tools。
* [ ] agent clone 不带其他用户 memory。
* [ ] 订阅取消时 disable agent。
* [ ] 用户删除时触发 FastClaw cleanup best-effort。
* [ ] cleanup 结果写 audit。

### Memory Policy

* [ ] 定义哪些记忆可保存。
* [ ] 定义哪些记忆禁止保存。
* [ ] 用户可查看记忆。
* [ ] 用户可删除记忆。
* [ ] 用户可关闭记忆。
* [ ] memory 写入需要 AiphaBee policy。
* [ ] memory 不保存 broker token。
* [ ] memory 不保存支付信息。
* [ ] memory 不保存敏感原文文件，除非用户明确上传并授权。
* [ ] memory sync error 可恢复。

### Admin / Ops

* [ ] Admin run inspector。
* [ ] 按 run_id 查所有事件。
* [ ] 按 user 查 research usage。
* [ ] 查 FastClaw runner status。
* [ ] 查 E2B active sandboxes。
* [ ] 查 tool invocations。
* [ ] 查 compliance decisions。
* [ ] 查 cost estimate。
* [ ] 查 failed runs。
* [ ] 支持 replay event。
* [ ] 支持 manually mark retryable。
* [ ] 支持 runner pause。
* [ ] 支持 user-level research disable。

### Incident Drills

* [ ] FastClaw process kill drill。
* [ ] FastClaw DB unavailable drill。
* [ ] E2B API 429 drill。
* [ ] E2B sandbox creation failure drill。
* [ ] Tool Gateway timeout drill。
* [ ] Market data provider down drill。
* [ ] Model provider down drill。
* [ ] Object storage write failure drill。
* [ ] Compliance validator failure drill。
* [ ] Frontend SSE disconnect drill。

### Beta QA

* [ ] 100 用户并发 simulation。
* [ ] 真实 beta 用户 1 周 dogfood。
* [ ] 每日人工抽样 30 条回答。
* [ ] P0 bug 清零。
* [ ] P1 bug 有 owner 和 ETA。
* [ ] release notes。
* [ ] support playbook。
* [ ] rollback playbook。

## 6.3 Exit Criteria

* [ ] Premium 用户有自己的 research agent profile。
* [ ] Memory 可控、可删、可关闭。
* [ ] Admin 能查清每一次失败。
* [ ] 事故演练通过。
* [ ] Beta 用户稳定使用 1 周。
* [ ] 无 P0 安全/合规/数据隔离 bug。

---

# Sprint 7：Launch + 成本优化

周期：1-2 周
目标：公开发布前最后一轮商业化、成本、稳定性收口。

## 7.1 交付物

```text
pricing guardrail
launch dashboard
growth funnel
support workflow
GA release
```

## 7.2 Checklist

### Pricing / Cost

* [ ] 计算 Generic cost/run。
* [ ] 计算 Research cost/run。
* [ ] 计算 E2B cost/run。
* [ ] 计算 tool data cost/run。
* [ ] 计算 p50 / p95 / p99 cost。
* [ ] 定义 Free quota。
* [ ] 定义 Pro quota。
* [ ] 定义 Premium quota。
* [ ] 超量策略。
* [ ] 账单页展示 usage。
* [ ] 内部毛利 dashboard。
* [ ] 异常成本 alert。

### Growth

* [ ] Generic → Premium upgrade CTA。
* [ ] Research locked preview。
* [ ] 示例问题库。
* [ ] 用户首次投研报告 onboarding。
* [ ] “本周组合风险报告”入口。
* [ ] paywall copy。
* [ ] conversion tracking。
* [ ] retention tracking。
* [ ] feedback loop。

### Support

* [ ] 用户看不到答案怎么办。
* [ ] 用户觉得答案像投资建议怎么办。
* [ ] 用户要求删除记忆怎么办。
* [ ] 用户要求删除历史 run 怎么办。
* [ ] 用户报告错误市场数据怎么办。
* [ ] 用户报告 hallucination 怎么办。
* [ ] 用户退款/降级时 research agent 怎么处理。
* [ ] support macro。
* [ ] escalation path。

### GA Release

* [ ] Launch flag。
* [ ] Rollback flag。
* [ ] Runner pause flag。
* [ ] Generic fallback flag。
* [ ] Status page。
* [ ] Release notes。
* [ ] Legal copy final review。
* [ ] Privacy copy final review。
* [ ] Terms copy final review。
* [ ] Final security review。
* [ ] Final load test。
* [ ] Final incident drill。

## 7.3 Exit Criteria

* [ ] 可以公开给付费用户使用。
* [ ] 成本有上限。
* [ ] 故障有降级。
* [ ] Support 有话术。
* [ ] Legal/Privacy copy 完成。
* [ ] 关键指标 dashboard 完成。

---

# 3. FastClaw/E2B 专项验收 Checklist

这个部分建议单独建一个 Tracker，因为它是 Layer 2 最大技术风险。

## 3.1 并发

* [ ] 当前 E2B plan concurrent sandbox limit 已确认。
* [ ] 当前 sandbox creation rate 已确认。
* [ ] FastClaw 自身 max runner concurrency 已确认。
* [ ] AiphaBee premium max concurrent run 已确认。
* [ ] per-user concurrent run cap 已确认。
* [ ] per-plan concurrent run cap 已确认。
* [ ] queue 策略已实现。
* [ ] queue 满时不会打爆 FastClaw。
* [ ] E2B 429 时不会打爆 AiphaBee API。
* [ ] FastClaw 5xx 时 circuit breaker 生效。
* [ ] 长任务不会占满所有 sandbox。
* [ ] 被取消任务会释放 sandbox。
* [ ] client disconnect 后 run 策略明确：继续/取消/转 async。

## 3.2 存算分离

* [ ] Sandbox 只作为 compute。
* [ ] 用户长期数据不以 sandbox 为 source of truth。
* [ ] Agent/session/memory 的 source of truth 明确。
* [ ] Evidence/artifact 的 source of truth 明确。
* [ ] Object storage prefix 包含 tenant/user/run。
* [ ] Sandbox workspace prefix 包含 run。
* [ ] output artifact sync 成功后有 checksum。
* [ ] output artifact sync 失败可重试。
* [ ] sandbox kill 后 artifact 不丢。
* [ ] sandbox kill 后 scratch data 清除。
* [ ] 用户删除时 durable storage 可清理。
* [ ] 合规 retention 与用户删除策略不冲突。
* [ ] 跨用户读文件测试通过。
* [ ] 跨 session 读文件测试通过。
* [ ] 跨 agent 读文件测试通过。

## 3.3 安全

* [ ] FastClaw 没有生产 DB 写权限。
* [ ] E2B sandbox 没有生产 DB 凭证。
* [ ] E2B sandbox 没有用户 broker token。
* [ ] E2B sandbox 没有 payment secret。
* [ ] E2B sandbox 只拿 job token。
* [ ] job token TTL <= 15 分钟。
* [ ] job token scope 最小化。
* [ ] job token max calls 生效。
* [ ] job token max cost 生效。
* [ ] Tool Gateway 校验 run/user/scope。
* [ ] Tool Gateway 记录审计。
* [ ] Tool Gateway 输出脱敏。
* [ ] Tool Gateway 禁止 write tools。
* [ ] Sandbox egress policy 已评审。
* [ ] Sandbox 依赖安装策略已评审。

## 3.4 成本

* [ ] 每个 research run 有预算。
* [ ] 每个 sandbox 有 runtime cap。
* [ ] 每个 sandbox 有 idle cap。
* [ ] 每个用户有 daily cap。
* [ ] 每个用户有 monthly cap。
* [ ] 每个 plan 有 monthly cap。
* [ ] E2B active sandbox dashboard。
* [ ] E2B cost dashboard。
* [ ] 异常长任务 alert。
* [ ] 异常 sandbox 数 alert。
* [ ] 异常 tool cost alert。
* [ ] 异常 token cost alert。
* [ ] kill switch 可用。

---

# 4. 推荐 Tracker 模板

可以直接复制到 Notion / Linear / GitHub Projects。

## 4.1 Epic Tracker

| Epic                        | Owner           | Sprint | Priority | Status | Gate   | Notes                     |
| --------------------------- | --------------- | -----: | -------- | ------ | ------ | ------------------------- |
| Agent Contracts             | Backend         |     S0 | P0       | ⬜      | Gate 0 | run/event/tool/compliance |
| AI SDK v7 Worker Spike      | Backend         |     S0 | P0       | ⬜      | Gate 0 | Worker compatibility      |
| FastClaw Stream Adapter     | Backend         |     S3 | P0       | ⬜      | Gate 3 | server-side only          |
| E2B Concurrency Validation  | Infra           |     S4 | P0       | ⬜      | Gate 4 | sandbox load              |
| Tool Gateway                | Backend/Data    |     S4 | P0       | ⬜      | Gate 4 | read-only                 |
| Evidence Pipeline           | Backend         |  S2/S5 | P0       | ⬜      | Gate 5 | refs + cards              |
| Compliance Post-check       | Backend/Product |  S2/S5 | P0       | ⬜      | Gate 5 | rewrite/block             |
| Research UX                 | Frontend        |     S5 | P0       | ⬜      | Gate 5 | paid assistant            |
| Per-user Agent Provisioning | Backend/Infra   |     S6 | P1       | ⬜      | Gate 6 | premium clone             |
| Admin Run Inspector         | Ops/Backend     |     S6 | P0       | ⬜      | Gate 6 | support/debug             |

Status 建议：

```text
⬜ Not started
🟨 In progress
🟦 In review
✅ Done
⛔ Blocked
🧊 Deferred
```

## 4.2 每日 Standup 模板

```text
Date:
Sprint:
Release Gate:

Done yesterday:
- 

Doing today:
- 

Blocked:
- 

Risk changed:
- 

Metric snapshot:
- agent_runs_total:
- generic_error_rate:
- research_error_rate:
- fastclaw_health:
- active_e2b_sandboxes:
- avg_cost_per_research_run:
- compliance_blocks:
```

## 4.3 每周 Review 模板

```text
Sprint:
Week:
Demo links:
Dashboard links:

Completed checklist:
- 

Not completed:
- 

New risks:
- 

Decisions needed:
- 

P0 bugs:
- 

P1 bugs:
- 

Go / No-go:
```

---

# 5. Release Gates

## Gate 0：技术链路成立

* [ ] AI SDK v7 Worker smoke 成功。
* [ ] FastClaw stream smoke 成功。
* [ ] E2B sandbox smoke 成功。
* [ ] 前端不直连 Runner。
* [ ] Contracts v0 冻结。

## Gate 1：Generic 内部可用

* [ ] Generic Agent UI 可用。
* [ ] SSE 稳定。
* [ ] run/event persistence 可用。
* [ ] basic tools 可用。
* [ ] basic errors 可用。

## Gate 2：Generic 免费灰度

* [ ] evidence v1 可用。
* [ ] quota v1 可用。
* [ ] compliance soft-block 可用。
* [ ] observability v1 可用。
* [ ] rollback flag 可用。

## Gate 3：FastClaw Alpha 链路

* [ ] Paid user 可 route 到 FastClaw。
* [ ] FastClaw events 转为 AiphaBee events。
* [ ] FastClaw down 不影响 Generic/API。
* [ ] shared advisor template 可用。
* [ ] run history 可查。

## Gate 4：E2B 并发与存算分离通过

* [ ] 并发压测通过。
* [ ] user isolation 通过。
* [ ] artifact sync 通过。
* [ ] sandbox cleanup 通过。
* [ ] cost guardrail 生效。

## Gate 5：AI 投研助手 Alpha

* [ ] onboarding 可用。
* [ ] paid entitlement 可用。
* [ ] research-only post-check 可用。
* [ ] evidence/report/history 可用。
* [ ] 20-50 人内测可用。

## Gate 6：Premium Beta

* [ ] per-user agent provisioning 可用。
* [ ] memory policy 可用。
* [ ] admin inspector 可用。
* [ ] incident drills 通过。
* [ ] 无 P0 合规/安全/隔离 bug。

## Gate 7：GA

* [ ] 成本模型通过。
* [ ] support playbook 完成。
* [ ] legal/privacy copy 完成。
* [ ] rollback 演练完成。
* [ ] launch dashboard 完成。

---

# 6. 最推荐的开发顺序

不要先做 per-user clone，也不要先做复杂投研 prompt。优先级应该是：

```text
1. 统一 Agent contract
2. Generic Agent 可灰度
3. FastClaw server-side adapter
4. E2B 并发/存算分离验收
5. Tool Gateway read-only
6. Research-only post-check
7. 付费投研 Alpha
8. Per-user premium agent
9. Memory / report / weekly digest
```

原因很简单：**只要 contract、routing、SSE、run state、Tool Gateway、post-check 稳，FastClaw 后面可以扩；但如果一开始把 FastClaw 当主 API 或直接暴露给前端，后面鉴权、审计、计费、合规都会返工。**

[1]: https://github.com/fastclaw-ai/fastclaw "GitHub - fastclaw-ai/fastclaw: Multi-Agent Framework · GitHub"
[2]: https://e2b.dev/docs/billing "Documentation - E2B"
[3]: https://vercel.com/changelog/ai-sdk-7?utm_source=chatgpt.com "AI SDK 7 is now available"
