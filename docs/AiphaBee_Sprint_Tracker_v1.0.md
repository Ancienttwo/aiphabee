---
title: "AiphaBee 交付路线图与 Sprint 进度跟踪清单"
subtitle: "Companion tracker to PRD v1.0"
version: "1.0"
status: "Ready for Execution"
source_prd: "docs/researches/AiphaBee_PRD_v1.0.md"
last_updated: "2026-06-20"
owner: "Planner / PM"
---

# AiphaBee 交付路线图与 Sprint 进度跟踪清单（v1.0）

> **配套文档：** [`docs/researches/AiphaBee_PRD_v1.0.md`](researches/AiphaBee_PRD_v1.0.md)
> **作用：** 把 PRD 第 18 章交付路线图 + 第 7/9/17/19 章需求拆成可勾选、可追溯、有退出门槛的 Sprint 清单。
> **本文件不是 harness 的 `*.sprint.md` 执行工件**，而是它们之上的程序级路线图索引。每个 Sprint 真正执行时，按 `plans/sprints/<stamp>-<slug>.sprint.md` 落成有序 Backlog → `tasks/contracts/*` 执行（见文末「§F 接入 harness」）。

---

## ⚠️ 头号阻断假设（Premise Collapse Watch）

> **本路线图假设 Gate 0 成立：数据合作方授予 Web 展示 + MCP/API 机器可读再分发 + 派生数据权，且具体功能不构成 SFC Type 4 受规管活动。**
>
> - 若 **MCP/API 再分发权未获授权** → 整条 MCP 产品线（Sprint 2.3、Phase 3 MCP 部分、商业模式中 Developer/MCP 收入线）**不可上线**，产品退化为「纯 Web 研究工具」。
> - 若 **某功能被判定为 Type 4 / 投资建议** → 取消该功能或接入持牌合作方，Phase 3 GA 签字门无法通过。
> - 因此 **Gate 0（Sprint 0.1）未通过前，不投入大规模产品代码**（PRD 0.2 决策 7）。Phase 1+ 的勾选不应早于 Phase 0 退出门槛全绿。

---

## 如何使用本清单

- **勾选粒度：** 叶子任务用 `- [ ]`；勾上即视为「已落地且通过该任务自带验收点」。
- **每个 Sprint 三段式：** `目标` → `Backlog（勾选项，带 PRD 需求 ID/工具名追溯）` → `退出门槛 DoD`。Sprint 内任一退出门槛不绿，不得进入下一 Sprint 的特性开发。
- **跨 Sprint 长期轨道（§A）：** 不是一次性任务；每个 Sprint 的 DoD 都要回看 §A 是否「本期已维护」。
- **状态图例（用于 §0 看板与小节标题）：**
  - ⬜ 未开始　🟦 进行中　✅ 完成　⛔ 阻塞　🅿️ 暂缓/降级
- **追溯标签：** 任务后括号内为 PRD 需求 ID（如 `MCP-04`）、工具名（如 `get_price_history`）或 PRD 章节号（如 `§10.4`）。全量映射见 §M 追溯矩阵。
- **更新约定：** 改动后同步顶部 `last_updated`，并在 §0 看板更新 Sprint 状态格；重大延迟项写进 `tasks/todos.md` 延迟目标台账（带 tradeoff + 重启触发条件）。

---

## §0 进度总览看板（Dashboard）

### 阶段（Phase）

| Phase | 名称 | 对应 Sprint | 状态 | 退出门槛是否全绿 |
|---|---|---|---|---|
| 0 | 权利·监管·数据基础（**Gate**） | 0.1 – 0.4 | 🟦 | ☐ |
| 1 | 内部 Alpha | 1.1 – 1.4 | ⬜ | ☐ |
| 2 | 封闭 Beta | 2.1 – 2.4 | ⬜ | ☐ |
| 3 | 公开 GA | 3.1 – 3.3 | ⬜ | ☐ |
| 4 | 扩展（Backlog） | — | ⬜ | n/a |

### Sprint

| Sprint | 主题 | 状态 | Backlog 完成度 | 退出门槛 |
|---|---|---|---|---|
| 0.1 | 法务·授权·监管 Gate | 🟦 | 0 / 8 | ☐ |
| 0.2 | 数据契约与口径基线 | 🟦 | 9 / 9 | ☐ |
| 0.3 | 黄金样本·质量规则·商业模型 | 🟦 | 9 / 9 | ☐ |
| 0.4 | 工程地基（脚手架·CI·绑定） | 🟦 | 17 / 23 | ☐ |
| 1.1 | 主真值源 + Data Access Gateway | 🟦 | 18 / 23 | ☐ |
| 1.2 | Tool Registry + 原子数据工具 + 证据/血缘 | ⬜ | 0 / 12 | ☐ |
| 1.3 | Web Agent Runtime + Ask + 证据卡片 | ⬜ | 0 / 10 | ☐ |
| 1.4 | 个股工作台 + 内部账号 + 评估集 v1 | ⬜ | 0 / 9 | ☐ |
| 2.1 | 比较 + 筛选 + 确定性分析 | ⬜ | 0 / 9 | ☐ |
| 2.2 | 公告检索 + 研究保存/重放 | ⬜ | 0 / 9 | ☐ |
| 2.3 | Remote MCP OAuth + Developer Console | ⬜ | 0 / 11 | ☐ |
| 2.4 | 订阅计费 + Workflows 深度任务 + 提醒 + 数据更正 | ⬜ | 0 / 10 | ☐ |
| 3.1 | P0 工具收口 + 事件研究 + 多语言 | ⬜ | 0 / 9 | ☐ |
| 3.2 | 文档·状态页·隐私·分享报告·套餐正式化 | ⬜ | 0 / 9 | ☐ |
| 3.3 | 安全·负载·灾备·发布验收·签字门 | ⬜ | 0 / 17 | ☐ |

> 北极星指标 **WVRO**（周度已验证研究成果，PRD §4.3）从 Phase 1 内部即开始埋点；激活/质量/商业 KPI（PRD §16）随 Phase 推进逐步上线。

---

## §A 跨 Sprint 长期轨道（Always-on Tracks）

> 这些是贯穿全程的不变量。每个 Sprint DoD 必须确认本期未让以下任一轨道回退。

### A1 证据与血缘（Evidence & Lineage）— PRD §8.4 / §9.5 / §10.3 / DAT-09
- [ ] 任一对外数值都能映射到 `source_record_id` + `data_version` + `methodology_version`（DAT-09）
- [ ] 标准响应信封（`as_of` / `market_status` / `provenance` / `usage`）在所有工具一致（§9.5）
- [ ] 答案分层「事实 / 计算 / 推断 / 未知」标签有效（AGT-06、§8.3）
- [ ] 证据强度用「强/中/弱/无法判断」而非伪信心分数（§8.4）

### A2 数据权利运行时执行（Data Rights by Design）— PRD §14.1 / DAT-05
- [ ] 字段级权利矩阵进入运行时，Gateway 按「渠道 × 套餐 × 字段 × 时间范围 × 导出」裁剪（DAT-05、§14.1）
- [ ] **默认拒绝**：未明确授权的字段/渠道/用途一律不分发
- [ ] Web 展示授权**不自动**扩展到 MCP 机器可读再分发

### A3 安全与滥用防护（Security & Abuse）— PRD §13
- [ ] 公告/网页/用户输入标记为「不可信数据」，与系统指令隔离（DOC-03、§13.2）
- [ ] 工具 allowlist；禁止任意 SQL / 任意 URL / 未注册工具（AGT-04、§9.4）
- [ ] 多维限流（用户 × Workspace × 客户端 × 工具 × 数据集 × IP 风险）
- [ ] 生成后 evidence-binding 校验，拦截无来源金融数字（AGT-05）

### A4 评估集与质量（Eval & Quality）— PRD §16.3 / §10.7
- [ ] 评估集覆盖事实正确率 / 计算正确率 / 引用正确率 / 正确拒绝率（§16.3）
- [ ] 黄金样本回归在 CI 中常驻，确定性计算与基准误差在阈值内（ANA-07、§10.7）
- [ ] 「无来源具体金融数字」抽样 < 0.1%（§16.5）

### A5 可观测性与成本（Observability & Cost）— PRD §11.3 / §12.3
- [ ] 每 run/tool-call 审计字段齐全（用户、工具版本、数据版本、模型、Token、成本、延迟、输出哈希，§12.3）
- [ ] AI Gateway 接管模型调用日志/成本/限流/缓存/fallback；模型变更被记录（§11.6）
- [ ] 单 run 预算（步数/Token/行数/时间/费用）上限生效，到顶优雅停止（AGT-03）

---

## §1 Phase 0 — 权利·监管·数据基础（**Gate 0，阻断性**）

> 退出总条件（PRD §18.1）：**P0 每个字段都有授权状态；核心黄金样本通过；产品边界得到书面确认。** 本阶段不写大规模产品代码。

### Sprint 0.1 — 法务·授权·监管 Gate　⬜
**目标：** 拿到可上线的「字段级权利矩阵 + 监管分类书面意见」，确定哪些字段/渠道/用途可分发。

- [ ] 与数据合作方完成**字段级权利矩阵**：所有者/来源、Web 展示、MCP/API 再分发、原始 vs 派生、实时/延迟/EOD、历史范围、导出与缓存、用户类型与地区、订阅者报送、审计与终止、商业条款（PRD §14.1 全 11 维）
- [ ] 逐字段标注分发状态：`Web 可 / MCP 可 / 导出可 / 派生可`，未确认者标 **默认拒绝**
- [ ] HKEX 市场数据授权确认：End-user vs Market Data Vendor Licence、非展示使用费（§14.1、脚注 HKEX）
- [ ] 取得香港律师/合规对**具体功能**的 Type 4 / 研究工具分类书面意见（§14.2、PRD §0.4）
- [ ] 确认 MVP 产品边界文案：用「研究/分析/数据解释」，不承诺荐股/投顾；不收集风险承受度做适合性结论（§14.2）
- [ ] 确认 PCPD 个人资料保障合规路径（privacy-by-design、PDPO 原则，§13.3）
- [ ] 数据合作方商业结算维度落定（按数据集 × 渠道 × 客户类型，§15.4）
- [ ] 产出《Gate 0 决议书》并由 CEO/商务/数据/合规签字

**退出门槛 DoD：** ☐ P0 字段权利矩阵 100% 有状态　☐ Type 4 书面意见到位　☐ MCP 再分发权结论明确（成立/否决，否决则触发 §0 退化路径）　☐ 决议书签字

### Sprint 0.2 — 数据契约与口径基线　🟦
**目标：** 在写服务代码前固定证券主表、时间/复权/重述/指标的口径定义（设计 + 数据字典，不含大规模实现）。

- [x] 数据合作方数据契约：字段字典、时间口径、SLA、CDC/批量同步方式（§11.5）
- [x] **证券主表**模型：company / instrument / listing / identifier_history，公司与证券分离、代码有有效期（DAT-02、§10.2）
- [x] **时间与版本模型**：`period_start/end`、`published_at`、`effective_at`、`ingested_at`、`restated_at`、`valid_from/to`、`data_version`（§10.3）
- [x] point-in-time 查询规则（按 `published_at`，禁止未来数据泄漏，§10.3）
- [x] **复权口径**定义：`raw` / `split_adjusted` / `total_return_adjusted` 及各自方法论说明（§10.4）
- [x] **财务事实与重述**模型：reported/standardized/币种/单位/准则/版本/重述原因，不覆盖历史（DAT-03、§10.5）
- [x] **指标定义库 v0**：`metric_id`、公式与依赖、行业适用、时间口径、缺失/负分母处理、方法版本（DAT-07、§10.6）
- [x] 交易日历模型：港时区、半日市、恶劣天气安排（§10.2）
- [x] 数据产品化流水线设计：Raw 快照 → 标准化 → 质量对账 → 派生 → Serving → Gateway（§10.1、DAT-01）

**退出门槛 DoD：** ☑ 证券主表/时间/复权/重述/指标口径文档评审通过　☐ 数据契约签署　☑ 每个口径有「方法论版本」字段

### Sprint 0.3 — 黄金样本·质量规则·商业模型　🟦
**目标：** 建立可在 CI 常驻的黄金样本与质量规则；锁定套餐/credits/单位经济。

- [x] 黄金样本集（PRD §10.7）：50–100 只跨行业跨年代含退市/复牌/供股/拆股证券
- [x] 黄金样本：20 复杂公司行动 + 20 财务重述 + 10 代码/名称变更 + 10 多币种/双重上市 + 指数历史成分
- [x] 自动质量规则集：主键/时间/币种/单位完整性、OHLC 关系、公司行动前后一致、三表勾稽、同比异常、公告日期逻辑、跨源对账、退市/停牌/双重上市特例（§10.7）
- [x] 数据质量隔离机制设计：严重异常不进 Serving Store，对外返回 `DATA_QUALITY_HOLD`（DAT-06、US-O02）
- [x] 数据更正流程设计：隔离→记录原值/新值/原因→重算派生→标记证据快照→通知→留审计（§10.8、DAT-08）
- [x] 套餐与权益矩阵：Free/Plus/Pro/Developer/Team/Enterprise，Web 与 MCP 权益分列（§15.2）
- [x] 加权 credits 计费模型 + 示例权重（解析 1 … 事件研究 20–50，§15.3）
- [x] 单位经济模型：贡献毛利公式与目标（B2C>70%、Dev/MCP>60%，§15.5）
- [x] Free 层防滥用原则：限范围/限并发/不可商业再分发（§15.2）

**退出门槛 DoD：** ☑ 黄金样本可被自动校验（synthetic v0 smoke corpus）　☑ 质量规则可执行（12-rule deterministic gate）　☐ 套餐/credits/单位经济模型评审通过

### Sprint 0.4 — 工程地基（脚手架·CI·Cloudflare 绑定）　🟦
**目标：** 把 greenfield 仓库拉起到「可部署的空骨架」，建立需求→issue 追溯。

- [x] 初始化 npm workspaces 与根包管理：`package.json` / `package-lock.json` / shared TypeScript + Vitest config（PRD §1.1、§11.3）
- [ ] 初始化前端应用：TanStack Start + Vite（Claude 前端跟进，PRD §1.1、§11.3）
- [x] Hono Worker 空运行面：`apps/worker`、Wrangler local config、`/health` route（§11.3）
- [x] Agent Runtime 骨架：AI SDK v7 beta dry-run runtime on Cloudflare Workers（§11.3）
- [x] Model provider / streaming scaffold：Cloudflare AI Gateway planned contract、AI SDK v7 `generateText`/`streamText` boundary、`/agent/runs/stream` guard、`npm run check:model-provider`（§11.3、§11.6）
- [ ] Model provider live execution smoke：真实 AI Gateway request + `streamText`/`generateText` + token/cost/fallback logs（§11.3、§11.6）
- [x] Cloudflare binding contract：Workers、Workflows、Queues、Cron、Durable Objects、R2、KV、AI Gateway、Hyperdrive 命名/职责/smoke 矩阵（§11.3–§11.4）
- [ ] Cloudflare resources provisioned + binding smoke tests：Workflows、Queues、Cron、Durable Objects、R2、KV、AI Gateway、Hyperdrive（§11.3–§11.4）
- [x] Postgres/Supabase migration scaffold：Supabase-compatible migrations、Hyperdrive connection contract、default-deny governance schema、`npm run check:database`（§11.4）
- [ ] Hyperdrive-backed Postgres/Supabase live connection smoke：真实 Hyperdrive binding ID + read-only `SELECT 1`（§11.4）
- [x] CI 流水线：`npm ci` / lint / typecheck / test / build（§A4）
- [x] 黄金样本回归挂载点：`npm run test:golden` + CI `Golden Regression Hook`（§A4）
- [x] 黄金样本可执行 fixtures 与质量规则断言：8 个 synthetic samples、12 条 deterministic quality rules、`DATA_QUALITY_HOLD` hold 断言、strict `npm run test:golden`（§A4）
- [x] OTel/log/eval event contract：Workers Logs + traces enabled，`run.audit` / `run.eval` 结构化事件，console sink，`npm run check:observability`（§11.3、§12.3）
- [x] OTLP destination + persistent eval store scaffold：planned D1 `AIPHABEE_EVAL_STORE`、OTLP names-only env、eval-store record schema、`/observability/runtime` guard、`npm run check:observability`（§11.3、§12.3）
- [ ] OTLP destination + persistent eval store live smoke：真实 OTLP export + persistent eval write/read + retention/dashboard evidence（§11.3、§12.3）
- [x] 环境变量 names-only template：`deploy/env/.env.example`
- [x] Env/secrets contract：dev/staging/prod names-only templates + schema + `npm run check:env`
- [x] Provider secret stores / rotation / emergency revocation contract：Cloudflare/GitHub/Supabase planned stores、90-day cadence、30-min revocation SLA、`npm run check:secrets`（Cloudflare/GitHub/Supabase）
- [ ] Provider secret stores provisioned + rotation/revocation smoke（Cloudflare/GitHub/Supabase）
- [ ] 复用现有 `docs/AiphaBee Design System` 接入前端基线（Claude 前端跟进）
- [x] 完成 PRD §23「仓库接入后实现核验清单」对照（本仓库为新建，逐项确认现状）
- [x] 建立 shared `packages/data-contracts`：标准响应信封、provenance、usage、默认拒绝错误码（§9.5–§9.6）
- [x] 建立 PRD 每条 P0 需求 → issue/owner/测试/发布门槛 的 traceability：`docs/governance/p0-traceability-ledger.md`（§23.12，对齐本文件 §M）

**退出门槛 DoD：** ☐ 空骨架可本地运行并部署到 staging　☐ CI 绿（remote run pending；local `npm run check` 已通过）　☐ 绑定连通性冒烟通过　☑ §M P0 追溯 ledger 建好（repo-local issue refs）

---

## §2 Phase 1 — 内部 Alpha　⬜

> 退出总条件（PRD §18.2）：**核心工具在黄金样本一致；所有数字有证据；无严重权限串用；内部用户可完成端到端研究。**

### Sprint 1.1 — 主真值源 + Data Access Gateway　⬜
**目标：** Postgres 主数据落地 + 字段级权益运行时执行 + 用量账本。

- [x] 证券主表 schema scaffold：`core.company` / `core.instrument` / `core.listing` / `core.identifier_history` migration + `/data/runtime` capability（DAT-02）
- [x] Raw 不可变快照 + `data_version` 批次 schema scaffold：`core.raw_source_batch` / `core.raw_snapshot` / `core.data_version_batch`，raw 默认 `HOLD`、rights 默认 `default_deny`（DAT-01）
- [x] 财务事实与重述 schema scaffold：`core.financial_statement` / `core.financial_fact` / `core.financial_restatement` migration + `/data/runtime` capability（DAT-03）
- [x] 财务重述 deterministic golden engine scaffold：`@aiphabee/financial-facts` 支持版本保留、point-in-time 选择、restatement delta、identity guard，`/data/runtime` engine capability（DAT-03、§10.5）
- [x] 公司行动与复权 schema scaffold：`core.corporate_action` / `core.adjustment_methodology` / `core.price_adjustment_factor` migration + `/data/runtime` capability（DAT-04、§10.4）
- [x] 公司行动 deterministic adjustment engine golden scaffold：`@aiphabee/corporate-actions` 支持 split/consolidation/dividend backward-adjusted synthetic golden cases，`/data/runtime` engine capability（DAT-04、§10.4）
- [ ] 公司行动 live adjustment engine + partner/public benchmark 黄金样本对齐（DAT-04、§10.4）
- [x] Serving Store schema scaffold：`core.serving_dataset` / `core.serving_field` / `core.serving_snapshot` / `core.serving_record` migration + `/data/runtime` + `/gateway/runtime` capability，默认 `HOLD` / `held` / `default_deny`（§10.1、DAT-06）
- [x] Serving read default-deny scaffold：`@aiphabee/serving-store` read planner + Gateway `servingRead` decision + `/gateway/runtime` read planner capability，default-deny / quality-hold 不触发 live read、SQL 或 served rows（§11.1、§12.2、DAT-06）
- [x] Serving quality release isolation scaffold：`@aiphabee/serving-store` 将 `PASS/WARN/HOLD/REJECT_RAW` 映射为 `released/held/withdrawn`，`HOLD/REJECT_RAW` 对外保持 `DATA_QUALITY_HOLD`，不触发 live write/read/SQL（DAT-06）
- [x] Data Access Gateway Serving query planner scaffold：`@aiphabee/serving-store` query planner + Gateway `servingQuery` decision + `/gateway/runtime` query planner capability，将 released snapshot + allowed fields / rows / time range / cache material 转成 no-SQL query plan（§11.1、§12.2、DAT-06）
- [x] Serving SQL descriptor scaffold：`@aiphabee/serving-store` SQL descriptor planner + Gateway `servingSqlDescriptor` decision + `/gateway/runtime` SQL descriptor capability，将 planned query 转成 allow-listed statement id + parameter bindings，不输出 SQL text / 不执行 SQL（§11.1、§12.2、DAT-06）
- [x] Data Access Gateway default-deny scaffold：`packages/data-access-gateway`、`deploy/gateway/access.contract.json`、`npm run check:data-gateway`、`/gateway/runtime`、`/gateway/access-check`（§11.1、§12.2）
- [ ] **Data Access Gateway live Serving**：真实字段裁剪 + 行数/时间范围限制 + 缓存 key 含数据版本/权限版本/字段集/口径（§11.1、§12.2）
- [x] 字段级权益执行 scaffold：Gateway evaluator 支持 workspace / plan / channel / dataset / field / time_range / export 维度裁剪，cache key 含 workspace/export，`/gateway/runtime` capability（DAT-05、§A2）
- [x] 字段级权益 DB policy source scaffold：`core.data_entitlement` / `core.workspace_entitlement` / `core.workspace_subscription` row snapshot 编译为 Gateway policy，active interval / wildcard field / blocked precedence / export / time range 可测，不触发 live DB read（DAT-05、§A2）
- [ ] 字段级权益 live policy source：接入 partner rights matrix + DB entitlement rows（DAT-05、§A2）
- [x] Usage ledger schema scaffold：`core.usage_meter_rule` / `core.usage_event` / `core.usage_reconciliation_batch` / `core.usage_ledger_entry` migration + `/gateway/runtime` capability，reconciliation target `<=5` 分钟（ACC-04、§15.3）
- [x] Usage ledger event writer scaffold：`@aiphabee/usage-ledger` 将 Gateway decision 转成 usage event + ledger entry plan，workspace-scoped 正常调用为 `preview`，default-deny/quality-hold/missing workspace 为 `blocked`，不触发 live write/SQL/billing（ACC-04、§15.3）
- [ ] **Usage ledger live writes + billing reconciliation**：加权 credits 记账，用量延迟 <5 分钟（ACC-04、§15.3）
- [x] 账户/Workspace/订阅/数据权益分离 schema scaffold：`core.account` / `core.workspace` / `core.workspace_membership` / `core.subscription_plan` / `core.workspace_subscription` / `core.data_entitlement` / `core.workspace_entitlement` migration + `/data/runtime` + `/gateway/runtime` capability（ACC-02）
- [x] 数据质量隔离 Gateway guard scaffold：`quality_state=HOLD` 在 `/gateway/access-check` 返回 `DATA_QUALITY_HOLD`，零 rows/credits（DAT-06）
- [ ] 数据质量隔离接入真实 Serving（DAT-06，`DATA_QUALITY_HOLD`）

**退出门槛 DoD：** ☐ 复权/重述黄金样本一致　☐ Gateway 默认拒绝未授权字段　☐ usage ledger 可对账到单次调用

### Sprint 1.2 — Tool Registry + 原子数据工具 + 证据/血缘　⬜
**目标：** 共享 Tool Registry 与首批 6–8 个只读原子工具 + Evidence/Lineage 服务。

- [ ] **共享 Tool Registry**：工具 Schema/版本/权限/执行/测试（PRD §11.3、决策「共享 Tool Registry」）
- [ ] `resolve_security`（代码/名/历史名 → instrument_id，歧义返回候选，SEC-01/03）
- [ ] `get_security_profile`（档案/状态/币种/覆盖，SEC-04、STK-01）
- [ ] `get_market_calendar`（交易日/半日市/休市）
- [ ] `get_quote_snapshot`（获授权延迟/收盘快照，STK-02）
- [ ] `get_price_history`（OHLCV/回报序列，复权口径，游标，STK-02、§10.4）
- [ ] `get_corporate_actions`（分红/供配股/拆合股/回购，STK-05、DAT-04）
- [ ] `get_financial_facts`（标准化财务事实，期间/币种/版本，STK-03、DAT-03）
- [ ] `get_data_lineage` + `get_entitlements`（血缘与权益自查，DAT-09、US-M03）
- [ ] **Evidence & Lineage Service**：工具调用 ↔ 来源记录/数据版本/方法论/用户可见引用（§11.1、§A1）
- [ ] 所有工具输入/输出 JSON Schema + 标准响应信封 + 标准错误码（MCP-04/08、§9.5–§9.6）
- [ ] 每个工具黄金样本回归用例（§A4）

**退出门槛 DoD：** ☐ 6–8 工具黄金样本一致　☐ 每条响应带 provenance　☐ 未注册工具/任意 SQL 被拒（AGT-04）

### Sprint 1.3 — Web Agent Runtime + Ask + 证据卡片　⬜
**目标：** AI SDK v7 多步工具循环 + 流式 + 预算/停止规则 + 证据优先答案。

- [ ] Agent run 上下文齐全（run/user/workspace、套餐、权益、工具集与版本、预算、模型层级，§8.1）
- [ ] ToolLoopAgent 多步循环 + 流式工具进度（不暴露思维链，AGT-01）
- [ ] 工具调用前完成证券/时间/币种/口径解析，关键歧义澄清或列假设（AGT-02）
- [ ] 规划与停止规则：≤6–8 步、并行≤3 只读工具、连续 2 次同类错误停重试、预算到顶优雅停止（§8.2、AGT-03）
- [ ] 仅调用注册/版本化/权限感知工具（AGT-04）
- [ ] 金融数字只来自工具结果或确定性计算（AGT-05、§8.5 禁止行为）
- [ ] 答案结构：直接回答→数据状态→证据→解释→反证→来源→下一步→免责（§8.3）
- [ ] 事实/计算/推断/未知分层标签（AGT-06）+ 证据卡片可点开（AGT-07）
- [ ] 失败恢复与局部重试，不重复计费（AGT-08）
- [ ] 模型路由 + AI Gateway 日志/fallback，模型变更可审计（§11.6、§A5）

**退出门槛 DoD：** ☐ 评估集中数字 0 凭记忆生成　☐ 歧义不静默猜测　☐ 预算到顶可优雅停止并给下一步

### Sprint 1.4 — 个股工作台 + 内部账号 + 评估集 v1　⬜
**目标：** 个股工作台基础版 + 内部账号/手动套餐 + 可回归评估集。

- [ ] 个股档案：公司实体/证券/市场/币种分离展示（STK-01）
- [ ] 价格/成交/回报/回撤/基准对比，多复权口径（STK-02）
- [ ] 财务三表关键事实与趋势，每值带期间/币种/单位/公告时间/重述版本（STK-03）
- [ ] 估值/盈利能力派生指标，定义/公式/异常处理可查（STK-04、依赖指标库）
- [ ] 公司行动时间线（STK-05）
- [ ] 公告检索入口（基础版，跳转原文证据位置，STK-06）
- [ ] 内部账号 + 手动套餐 + 登录/会话/设备管理（ACC-01、§18.2）
- [ ] Web Agent 与 MCP 配额/用量展示骨架（ACC-04）
- [ ] 评估集 v1：事实/计算/引用正确率 + 正确拒绝率埋点（§16.3、§A4）；WVRO 埋点（§4.3）

**退出门槛 DoD（= Phase 1 退出门槛）：** ☐ 内部用户端到端完成一次研究　☐ 所有展示数字有证据　☐ 无严重权限串用　☐ 核心工具黄金样本一致

---

## §3 Phase 2 — 封闭 Beta　⬜

> 退出总条件（PRD §18.3）：**付费和配额可对账；MCP 首次调用体验达标；工具成功率和数据质量达到发布阈值。**

### Sprint 2.1 — 比较 + 筛选 + 确定性分析　⬜
**目标：** 多证券比较、自然语言筛选、确定性收益/风险计算。

- [ ] `compare_securities`：2–5 证券统一币种/单位比较，不可比时明示（ANA-01、ANA-02）
- [ ] `screen_securities`：自然语言→可编辑结构化条件，执行前展示字段/运算符/时点/缺失值规则（ANA-03）
- [ ] 筛选返回命中原因与可解释排序（ANA-04、US-W05）
- [ ] `get_financial_ratios`：确定性派生指标 + 公式版本 + 分位（依赖指标库 §10.6）
- [ ] `calculate_returns_risk`：回报/波动/回撤/Beta，与黄金测试误差达标（ANA-07）
- [ ] 按同业/指数/自身历史分位比较，基准与成分时点明确（ANA-02）
- [ ] point-in-time 防未来数据：历史筛选不使用今天分类（SEC-05、ANA-03、§10.3）
- [ ] 比较器与筛选器 Web UI（PRD §5.1 比较器/筛选器）
- [ ] 高成本筛选/比较进入独立并发池（§12.2、ANA 权重 8–20）

**退出门槛 DoD：** ☐ 确定性计算黄金样本达标　☐ 筛选条件执行前可编辑　☐ 命中原因可展开

### Sprint 2.2 — 公告检索 + 研究保存/重放　⬜
**目标：** 公告检索与原文定位 + 研究 run 保存与重放。

- [ ] `search_announcements`：按公司/日期/类别/关键词检索（DOC-01）
- [ ] `get_announcement`：原文定位与授权范围内摘录（DOC-02、US-W06）
- [ ] 公告作为不可信数据处理，去脚本/隐藏文本（DOC-03、§A3）
- [ ] pgvector 公告/文件检索（§11.4 搜索）
- [ ] 跨期公告差异与关键数字抽取，抽取值绑定原文位置 + Schema 校验（DOC-04）
- [ ] `RES-01` 保存完整研究 run（问题/工具输入/证据快照/模型与提示词版本）
- [ ] 重新运行并对比差异，区分数据/模型/参数变化（RES-02、US-W08）
- [ ] 旧报告不被新数据静默改写（RES-02、§8.5）
- [ ] 研究库 Web UI（PRD §5.1 研究库）

**退出门槛 DoD：** ☐ 引用可定位到页/段　☐ 文档内恶意指令不触发工具　☐ 保存 run 可重放并显示差异

### Sprint 2.3 — Remote MCP OAuth + Developer Console　⬜
**目标：** 对外 Remote MCP 产品（依赖 Gate 0 的 MCP 再分发权）。

> ⛔ **前置：** Sprint 0.1 的 MCP 再分发权必须为「成立」。否则本 Sprint 全部 🅿️ 暂缓。

- [ ] `/mcp` Streamable HTTP endpoint：初始化/`tools/list`/`tools/call`，校验 `Origin`（MCP-01、§13.2）
- [ ] OAuth + PKCE，scope 清晰可撤销（MCP-02、§9.7）
- [ ] 服务端 API Key：哈希存储/可轮换/限 IP/只显示一次（MCP-03、ACC-06）
- [ ] 输入严格校验 + `structuredContent` 符合 `outputSchema`（MCP-04）
- [ ] 工具版本与弃用策略，破坏性变化走新 major（MCP-05、US-M06）
- [ ] 游标分页 + 最大行数 + 时间范围限制，不能被绕过（MCP-06、US-M07）
- [ ] 响应返回 usage/剩余额度/request_id（MCP-07、US-M05）
- [ ] 标准错误码可机器处理（MCP-08，`DATA_NOT_LICENSED`/`SCOPE_DENIED` 等）
- [ ] 工具级速率/并发/预算限制（MCP-11）
- [ ] Developer Console：连接向导/密钥/scope/配额/日志/示例，首调中位 <10 分钟（MCP-09、US-M01）
- [ ] 协议兼容性测试：官方 SDK/Inspector + 主流目标客户端（MCP-12、US-M08）

**退出门槛 DoD：** ☐ 主流客户端端到端首调成功　☐ 分页/限额不可绕过　☐ Console 可对账　☐ 错误码稳定

### Sprint 2.4 — 订阅计费 + Workflows 深度任务 + 提醒 + 数据更正　⬜
**目标：** 正式计费闭环、长任务、提醒、数据更正闭环。

- [ ] 套餐升降级/续费/取消/宽限期，可审计（ACC-03）
- [ ] 订阅账单与 usage ledger 一致，账单可追溯到调用（ACC-04、§19.5）
- [ ] 高成本任务预估 + 预扣 + 失败退还（US-W10、§15.3）
- [ ] 长任务转 Workflow：返回 `task_id`，可离开/恢复/通知（AGT-09、§6.5）
- [ ] 深度报告 Workflow：取数→确定性分析→生成章节→引用校验→带证据索引与重跑（§6.5、RES-04）
- [ ] Watchlist + 价格/公告/指标提醒，去重 + 频率 + 静默期（RES-05、US-W09）
- [ ] 每日/每周观察列表简报，仅总结实质变化（RES-06）
- [ ] 数据更正闭环：标记受影响已保存报告并通知用户（DAT-08、US-O05、§10.8）
- [ ] MCP OAuth 连接/Key 撤销管理，撤销后新调用立即失败（ACC-06）
- [ ] 模型/工具 Kill Switch + 安全降级（US-O04）

**退出门槛 DoD（= Phase 2 退出门槛）：** ☐ 付费与配额可对账　☐ 工具成功率达发布阈值　☐ 数据更正能通知到已保存报告

---

## §4 Phase 3 — 公开 GA　⬜

> 退出总条件（PRD §18.4）：**数据授权、合规、安全、性能、计费和支持全部签字；发布清单零阻断项。**

### Sprint 3.1 — P0 工具收口 + 事件研究 + 多语言　⬜
**目标：** 补齐 P0 工具、事件研究、多语言关键路径。

- [ ] `get_event_timeline`（公司/市场事件时间线，§9.2）
- [ ] 完整 P0 工具目录收口与一致性回归（§9.2 全 16 工具）
- [ ] 事件研究：事件日/窗口/基准/异常收益方法/样本缺失（ANA-06、`run_event_study` §9.3）
- [ ] 繁中/简中/英文关键路径，切换不改口径（AGT-11、§12.4）
- [ ] 新手/专业模式仅改表达深度不改数据（AGT-12、US-W07）
- [ ] 财务术语中英文与口径解释（§12.4）
- [ ] 会话记忆仅存授权信息，可查看/编辑/删除（AGT-10）
- [ ] 历史成分/历史行业/历史名称（SEC-05）
- [ ] 导出（CSV/图片/PDF）受字段授权/行数/水印约束（ANA-08、`exports.read` 高风险单独授权）

**退出门槛 DoD：** ☐ P0 工具全量一致　☐ 事件研究样本缺失不静默删除　☐ 三语关键路径口径一致

### Sprint 3.2 — 文档·状态页·隐私·分享报告·套餐正式化　⬜
**目标：** 公开运营面与 Pro/Developer 正式套餐。

- [ ] Pro/Developer 套餐正式化与定价（§15.2）
- [ ] 公开状态页 + API/MCP 文档 + 隐私政策 + 条款（§18.4、§19.5）
- [ ] 帮助中心 + 支持流程，支持可用 request_id 调查（US-O03、§19.5）
- [ ] 私人分享链接：分享不扩大接收者数据权益（RES-03、§19.4）
- [ ] 允许范围内静态报告：含生成时间/数据延迟/版本/免责（RES-04）
- [ ] 合作方对账报表：按数据集/渠道/套餐/用户/调用量导出（US-O06、DAT-10）
- [ ] 字段授权可由运营配置，含审批/版本/生效时间（US-O01）
- [ ] 可访问性 WCAG 2.1 AA：图表文本摘要/键盘/高对比（§12.4）
- [ ] 账户数据下载与删除申请，符合保留策略（ACC-05）

**退出门槛 DoD：** ☐ 状态页/文档/隐私/条款上线　☐ 合作方对账可生成　☐ 分享不扩权

### Sprint 3.3 — 安全·负载·灾备·发布验收·签字门　⬜
**目标：** 跑通 PRD §19 全量发布验收清单并签字。

**数据与授权（§19.1）**
- [ ] 所有 P0 字段/工具有权利矩阵；Web/MCP/导出/企业授权分别配置
- [ ] 实时/延迟/EOD 标识正确；公司行动/重述/退市/代码历史覆盖
- [ ] 黄金样本通过；数据更正与回滚演练完成

**产品与 Agent（§19.2）**
- [ ] 证券歧义不静默选择；具体数字 100% 绑定证据/确定性计算
- [ ] 事实/推断/未知标签有效；高成本任务有预算与确认
- [ ] 长任务可恢复；保存报告可重放；新手/专业模式不改口径

**MCP（§19.3）**
- [ ] Streamable HTTP/Origin/认证通过；输入输出 Schema 兼容性测试通过
- [ ] OAuth scope/撤销/Key 轮换通过；游标与限额不可绕过；错误码稳定
- [ ] 主流目标客户端端到端通过；Developer Console 可对账

**安全·隐私·合规（§19.4）**
- [ ] Prompt injection 测试通过；任意 SQL/URL/未注册工具不可调用
- [ ] 个人数据发送与保留合规；共享链接不扩权
- [ ] 合规边界与营销文案审阅；Kill switch/事件响应/审计导出演练

**运营与商业（§19.5）**
- [ ] 套餐/credits/退款/超额规则清楚；账单与 usage ledger 一致
- [ ] 合作方对账可生成；支持可用 request_id 调查
- [ ] 状态页/帮助/隐私/条款已发布；单位经济在预期用量下为正

**性能与可用性（§12.1）**
- [ ] 核心 API 可用性、MCP 工具 P95、Web 首 Token P95、工具成功率 >99.5% 达标
- [ ] 负载/灾备/事故演练完成

**退出门槛 DoD（= GA 签字门）：** ☐ §19 五类清单零阻断项　☐ 数据授权/合规/安全/性能/计费/支持全部签字

---

## §5 Phase 4 — 扩展（Backlog，未排期）　⬜

> 仅在 Gate 0 / GA 稳定后排期；持牌路径确认前不做个性化建议。

- [ ] 组合分析（仅用户授权持仓，不输出交易建议，`get_portfolio_analytics` P1、§9.3）
- [ ] `create_alert` 写操作（显式确认 + 独立 scope + 幂等键，§9.3）
- [ ] `get_market_breadth` / `get_ownership_and_short_selling` / `get_buybacks_and_placements`（授权允许时）
- [ ] `get_consensus_or_estimates`（仅在明确拥有再分发权时，§9.3）
- [ ] Team/Enterprise：席位/SSO/审计/私有数据连接（ACC、MCP-10、US-O01）
- [ ] B2B 白标与嵌入式组件（§15.1）
- [ ] 更多港股数据域与跨市场对照
- [ ] 持牌路径确认后探索个性化建议能力（§14.2 路线 2）
- [ ] MCP resources/prompts 或交互式 MCP Apps（评估客户端成熟度，§18.5）
- [ ] 用户上传文件与公开数据联读，隐私隔离（DOC-05、STK-08 自定义布局）

---

## §R 风险燃尽跟踪（PRD §20）

> 勾上 = 该风险主要缓解措施已落地并验证。

- [ ] 数据合作方无完整再分发权 → Gate 0 权利矩阵 + 默认拒绝 + 分层数据包（**头号阻断，见顶部**）
- [ ] 功能构成投资建议/Type 4 → 限制个性化 + 书面法律意见 + 持牌合作路线
- [ ] 30 年数据口径不一致 → 证券主表 + 版本 + 复权 + 重述 + 黄金样本
- [ ] 模型生成虚假数字 → 工具证据绑定 + 生成后校验 + 禁止凭记忆报数
- [ ] MCP 被用于批量抓取 → 多维限流 + credits + 异常检测 + 企业批量套餐
- [ ] 合作方/模型供应商故障 → 数据快照 + SLA + fallback + Workflows 重试 + 状态提示
- [ ] Cloudflare 单请求边界 → 交互/长任务分界 + Workflows/DO + 可恢复 task_id
- [ ] 产品过于复杂致新手流失 → 模板 + 分层信息 + 默认任务而非空聊天框（§5.3）
- [ ] 套餐成本错配致毛利为负 → 加权 credits + 预算 + 预计算 + 模型路由 + 价格实验
- [ ] 广告/券商合作影响中立 → 商业与研究隔离 + 披露 + 不按佣金排序
- [ ] MCP 客户端兼容差异 → 官方协议 + 兼容测试 + 文本回退 + 版本策略
- [ ] 用户隐私泄露 → 最小化 + 加密 + 供应商评估 + 可删除记忆 + 审计

---

## §D 待确认决策跟踪（PRD §21）

> 勾上 = 已按（或推翻）建议默认值定案。责任人见 PRD §21。

| 状态 | 决策点 | 建议默认值 | 责任人 |
|---|---|---|---|
| ☐ | 首发数据实时/15min/EOD？ | 先延迟/EOD，实时待权利与成本明确 | 商务/数据/合规 |
| ☐ | 覆盖哪些证券？ | 主板/GEM 普通股 + ETF，暂不含衍生品 | 产品/数据 |
| ☐ | 30 年历史是否全量可经 MCP？ | Pro/Developer 分层，限证券数与时间范围 | 商务/产品 |
| ☐ | 是否提供目标价/评级/盈利预测？ | 首发不做（除非有数据权 + 监管意见） | 产品/合规 |
| ☐ | 是否支持投资组合？ | P1 仅分析不调仓，用户显式授权 | 产品/隐私 |
| ☐ | 首发语言？ | 繁中主体验，简中同步关键路径，英文随后 | 产品/市场 |
| ☐ | 数据库选型？ | Postgres/Supabase + Hyperdrive 为主，DO/KV/R2 辅助 | 工程 |
| ☐ | 向量检索？ | pgvector 首发，Vectorize 后评估 | 工程/数据 |
| ☐ | 免费 MCP 额度？ | 小额度/低并发/不可批量，目标转化 | 商业 |
| ☐ | 是否允许外部商业应用？ | Developer 仅个人/内部，商业分发走 Team/Enterprise | 商务/法务 |
| ☐ | 是否与券商合作？ | 可做分发/持牌路径，但不影响答案排序 | CEO/商务/合规 |

---

## §M 需求 → Sprint 追溯矩阵

> PRD §7/§9 每条需求落在哪个 Sprint；勾上 = 该需求验收通过。覆盖 P0 为主，P1/P2 标注阶段。

### 账户与证券（ACC / SEC）
| 需求 | 优先级 | 落点 Sprint | 状态 |
|---|---|---|---|
| ACC-01 登录/会话/设备 | P0 | 1.4 | ☐ |
| ACC-02 账户/Workspace/订阅/权益分离 | P0 | 1.1 | ☐ |
| ACC-03 套餐升降级/宽限期 | P0 | 2.4 | ☐ |
| ACC-04 Web/MCP 配额用量展示 | P0 | 1.1 / 1.4 / 2.4 | ☐ |
| ACC-05 数据下载/删除 | P1 | 3.2 | ☐ |
| ACC-06 MCP OAuth/Key 撤销 | P0 | 2.3 / 2.4 | ☐ |
| SEC-01 多形式证券解析 | P0 | 1.2 | ☐ |
| SEC-02 代码与实体分离 | P0 | 0.2 / 1.1 | ☐ |
| SEC-03 歧义返回候选 | P0 | 1.2 | ☐ |
| SEC-04 上市状态/币种/覆盖 | P0 | 1.2 | ☐ |
| SEC-05 历史成分/行业/名称 | P1 | 3.1 | ☐ |

### Web Agent / 个股工作台（AGT / STK）
| 需求 | 优先级 | 落点 Sprint | 状态 |
|---|---|---|---|
| AGT-01 流式 + 工具进度 | P0 | 1.3 | ☐ |
| AGT-02 调用前口径解析 | P0 | 1.3 | ☐ |
| AGT-03 单 run 预算上限 | P0 | 1.3 | ☐ |
| AGT-04 仅注册工具 | P0 | 1.2 / 1.3 | ☐ |
| AGT-05 数字来自工具/计算 | P0 | 1.3 | ☐ |
| AGT-06 事实/计算/推断/未知 | P0 | 1.3 | ☐ |
| AGT-07 来源引用证据卡片 | P0 | 1.3 | ☐ |
| AGT-08 失败恢复/局部重试 | P0 | 1.3 | ☐ |
| AGT-09 长任务转 Workflow | P0 | 2.4 | ☐ |
| AGT-10 授权记忆 | P1 | 3.1 | ☐ |
| AGT-11 繁/简/英输出 | P1 | 3.1 | ☐ |
| AGT-12 新手/专业模式 | P1 | 3.1 | ☐ |
| STK-01 公司/证券档案 | P0 | 1.2 / 1.4 | ☐ |
| STK-02 价格/回报/回撤/基准 | P0 | 1.4 | ☐ |
| STK-03 财务三表事实趋势 | P0 | 1.4 | ☐ |
| STK-04 估值/盈利派生指标 | P0 | 1.4 | ☐ |
| STK-05 公司行动时间线 | P0 | 1.4 | ☐ |
| STK-06 公告与文件检索 | P0 | 1.4 / 2.2 | ☐ |
| STK-07 图表转研究上下文 | P1 | 3.x | ☐ |
| STK-08 保存自定义布局 | P2 | 4 | ☐ |

### 分析 / 公告 / 研究（ANA / DOC / RES）
| 需求 | 优先级 | 落点 Sprint | 状态 |
|---|---|---|---|
| ANA-01 2–5 证券比较 | P0 | 2.1 | ☐ |
| ANA-02 同业/指数/历史分位 | P0 | 2.1 | ☐ |
| ANA-03 自然语言筛选 | P0 | 2.1 | ☐ |
| ANA-04 命中原因可解释 | P0 | 2.1 | ☐ |
| ANA-05 保存筛选/定期运行 | P1 | 2.4 | ☐ |
| ANA-06 事件研究 | P1 | 3.1 | ☐ |
| ANA-07 收益/波动/回撤/Beta | P0 | 2.1 | ☐ |
| ANA-08 受限导出 | P1 | 3.1 | ☐ |
| DOC-01 公告检索 | P0 | 2.2 | ☐ |
| DOC-02 原文定位摘录 | P0 | 2.2 | ☐ |
| DOC-03 文档作不可信数据 | P0 | 2.2 / §A3 | ☐ |
| DOC-04 跨期差异/数字抽取 | P1 | 2.2 | ☐ |
| DOC-05 用户上传联读 | P2 | 4 | ☐ |
| RES-01 保存完整 run | P0 | 2.2 | ☐ |
| RES-02 重跑对比差异 | P1 | 2.2 | ☐ |
| RES-03 私人分享链接 | P1 | 3.2 | ☐ |
| RES-04 静态报告 | P1 | 2.4 / 3.2 | ☐ |
| RES-05 提醒 | P1 | 2.4 | ☐ |
| RES-06 观察列表简报 | P1 | 2.4 | ☐ |

### MCP / 数据治理（MCP / DAT）
| 需求 | 优先级 | 落点 Sprint | 状态 |
|---|---|---|---|
| MCP-01 Streamable HTTP endpoint | P0 | 2.3 | ☐ |
| MCP-02 OAuth + PKCE | P0 | 2.3 | ☐ |
| MCP-03 服务端 API Key | P0 | 2.3 | ☐ |
| MCP-04 输入/输出 Schema | P0 | 1.2 / 2.3 | ☐ |
| MCP-05 版本与弃用 | P0 | 2.3 | ☐ |
| MCP-06 分页/行数/范围限制 | P0 | 2.3 | ☐ |
| MCP-07 usage/剩余/request_id | P0 | 2.3 | ☐ |
| MCP-08 标准错误码 | P0 | 1.2 / 2.3 | ☐ |
| MCP-09 Developer Console | P0 | 2.3 | ☐ |
| MCP-10 企业审计/细粒度 scope | P1 | 4 | ☐ |
| MCP-11 工具级速率/并发/预算 | P0 | 2.3 | ☐ |
| MCP-12 兼容性测试/状态页 | P0 | 2.3 / 3.2 | ☐ |
| DAT-01 不可变原始快照 | P0 | 1.1 | ☐ |
| DAT-02 统一证券主表 | P0 | 0.2 / 1.1 | ☐ |
| DAT-03 财务事实与重述 | P0 | 0.2 / 1.1 | ☐ |
| DAT-04 公司行动与复权引擎 | P0 | 1.1 | ☐ |
| DAT-05 字段级数据授权 | P0 | 0.1 / 1.1 | ☐ |
| DAT-06 数据质量与隔离 | P0 | 0.3 / 1.1 | ☐ |
| DAT-07 指标定义与方法论库 | P0 | 0.2 | ☐ |
| DAT-08 数据更正与通知 | P1 | 2.4 | ☐ |
| DAT-09 来源/血缘/证据快照 | P0 | 1.2 | ☐ |
| DAT-10 合作方 SLA 与对账 | P0 | 0.1 / 3.2 | ☐ |

---

## §F 接入 harness（执行落地）

本文件是**程序级路线图**。每个 Sprint 真正进入执行时，按仓库三层契约（`repo-harness docs show sprint-contracts`）落地：

1. **PRD 层**（可选）：把 `docs/researches/AiphaBee_PRD_v1.0.md` 注册为 `plans/prds/<stamp>-aiphabee.prd.md`（`repo-harness-prd`）。
2. **Sprint 层**：对将执行的某个 Sprint，生成 `plans/sprints/<stamp>-<slug>.sprint.md`（含 Source PRD + Architecture Notes + 有序 Backlog + Execution Log），把本文件对应 Sprint 的勾选项搬成有序 Backlog 行（每行带可验收 acceptance line）。命令：`scripts/sprint-backlog.sh`（存在时）。
3. **Task Contract 层**：每条 Backlog 行经 `plans/plan-*.md` → `tasks/contracts/*.contract.md` → worktree → `verify-sprint.sh` → `tasks/reviews/*` 执行闭环。
4. **延迟目标**：本路线图中被推迟的项写入 `tasks/todos.md`（带 tradeoff + 重启触发）。
5. **状态回写**：Sprint 完成后回写 §0 看板与本节顶部 `status`。

> 约束：本文件刻意不放在 `plans/plan-*.md` / `*.sprint.md` 等受 `check-task-workflow.sh` 校验的保留路径，避免误判为执行就绪工件。

### 当前接入状态

- [x] 权威 PRD 已注册为 harness PRD：`plans/prds/20260620-1302-aiphabee.prd.md`
- [x] 程序级 tracker 已建立并对齐 PRD v1.0：`docs/AiphaBee_Sprint_Tracker_v1.0.md`
- [x] 首个 Phase 0 执行 Sprint 已建立：`plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
- [x] Gate 0 权利与监管决策包已建立：`docs/governance/gate0-rights-regulatory-decision-pack.md`
- [x] 数据契约与方法论基线已建立：`docs/governance/data-contract-methodology-baseline.md`
- [x] 黄金样本、质量规则与商业模型基线已建立：`docs/governance/golden-quality-commercial-baseline.md`
- [x] 工程地基现状审计已建立：`docs/governance/engineering-foundation-audit.md`
- [x] Phase 0 traceability closeout 已建立：`docs/governance/phase0-traceability-closeout.md`
- [x] 非前端 runtime scaffold 已建立：`docs/governance/engineering-runtime-scaffold.md`；包含 npm workspaces、Hono Worker `/health`、shared data contracts、CI workflow、names-only env template，并通过 local checks + Wrangler health smoke
- [x] P0 requirement traceability ledger 已建立：`docs/governance/p0-traceability-ledger.md`；53 条 P0 需求均有 repo-local issue ref、owner role、test gate、release gate
- [x] Env/secrets contract 已建立：`docs/governance/env-secrets-contract.md`；dev/staging/prod names-only templates、schema、CI validation 已通过
- [x] Cloudflare binding contract 已建立：`docs/governance/cloudflare-bindings-contract.md`；Workers/Workflows/Queues/Cron/DO/R2/KV/AI Gateway/Hyperdrive 命名、职责与 smoke 面已校验
- [x] Agent Runtime scaffold 已建立：`docs/governance/agent-runtime-scaffold.md`；AI SDK v7 beta dry-run capabilities、step-limit、registered-tool policy、Worker dry-run routes 已通过本地 smoke
- [x] Model provider / streaming scaffold 已建立：`docs/governance/model-provider-streaming-scaffold.md`；Cloudflare AI Gateway planned contract、AI SDK v7 execution APIs、`/agent/model-provider` 与 guarded `/agent/runs/stream` 已通过本地 smoke
- [x] Golden fixtures / quality-rule gate 已建立：`docs/governance/golden-quality-rule-fixtures.md`；8 个 synthetic fixtures、12 条 deterministic rules、5 pass / 1 warn / 2 hold、strict `npm run test:golden` 已通过
- [x] Observability/eval scaffold 已建立：`docs/governance/observability-eval-scaffold.md`；Workers Logs/traces、`run.audit`/`run.eval` 事件、console sink、CI contract check 与 dry-run telemetry headers 已通过本地 smoke
- [x] Observability persistent eval store scaffold 已建立：`docs/governance/observability-persistent-eval-store-scaffold.md`；planned D1 eval-store binding、OTLP names-only env、eval-store record schema、`/observability/runtime` guard 已通过本地 smoke
- [x] Postgres/Hyperdrive migration scaffold 已建立：`docs/governance/postgres-hyperdrive-migration-scaffold.md`；Supabase-compatible migration、Hyperdrive contract、default-deny governance schema、`npm run check:database` 与 `/database/runtime` 已通过本地 smoke
- [x] Provider secret stores contract 已建立：`docs/governance/provider-secret-stores-contract.md`；Cloudflare/GitHub/Supabase planned stores、rotation/revocation runbook、`npm run check:secrets` 与 `/secrets/runtime` 已通过本地 smoke
- [x] Data Access Gateway default-deny scaffold 已建立：`docs/governance/data-access-gateway-default-deny-scaffold.md`；default-deny rights、field redaction、row/time limit、cache key、quality hold guard、`npm run check:data-gateway` 与 Worker gateway smoke 已通过
- [x] Security master / raw snapshot schema scaffold 已建立：`docs/governance/security-master-raw-snapshot-scaffold.md`；company/instrument/listing/identifier_history、raw_source_batch/raw_snapshot/data_version_batch、`npm run check:database` 与 `/data/runtime` 已通过本地 smoke
- [x] Financial facts / restatement schema scaffold 已建立：`docs/governance/financial-facts-restatement-scaffold.md`；financial_statement/financial_fact/financial_restatement、restatement version links、`npm run check:database` 与 `/data/runtime` 已通过本地 smoke
- [x] Financial restatement golden engine scaffold 已建立：`docs/governance/financial-restatement-golden-engine-scaffold.md`；`@aiphabee/financial-facts` 支持版本保留、point-in-time 选择、restatement delta、identity guard，`/data/runtime` engine capability 已通过本地 smoke
- [x] Corporate action / adjustment schema scaffold 已建立：`docs/governance/corporate-action-adjustment-scaffold.md`；corporate_action/adjustment_methodology/price_adjustment_factor、closed-open adjustment intervals、`npm run check:database` 与 `/data/runtime` 已通过本地 smoke
- [x] Corporate action adjustment engine golden scaffold 已建立：`docs/governance/corporate-action-adjustment-engine-golden-scaffold.md`；`@aiphabee/corporate-actions` 支持 split/consolidation/dividend backward-adjusted synthetic golden cases，`/data/runtime` engine capability 已通过本地 smoke
- [x] Account / Workspace / entitlement schema scaffold 已建立：`docs/governance/account-workspace-entitlement-scaffold.md`；account/workspace/membership/subscription/data_entitlement/workspace_entitlement、workspace isolation、`npm run check:database` 与 `/data/runtime`、`/gateway/runtime` 已通过本地 smoke
- [x] Usage ledger schema scaffold 已建立：`docs/governance/usage-ledger-scaffold.md`；usage_meter_rule/usage_event/usage_reconciliation_batch/usage_ledger_entry、weighted credits、5-minute reconciliation target、`npm run check:database` 与 `/gateway/runtime` 已通过本地 smoke
- [x] Usage ledger event writer scaffold 已建立：`docs/governance/usage-ledger-event-writer-scaffold.md`；Gateway decision `usageLedger`、deterministic event/ledger IDs、preview/blocked billable states、no live writes/SQL/billing，`/gateway/runtime` capability 已通过本地 smoke
- [x] Field entitlement enforcement scaffold 已建立：`docs/governance/field-entitlement-enforcement-scaffold.md`；Gateway evaluator 支持 workspace/plan/channel/dataset/field/time_range/export，default-deny live route 与 synthetic entitlement tests 已通过
- [x] Field entitlement DB policy source scaffold 已建立：`docs/governance/field-entitlement-policy-source-scaffold.md`；entitlement row snapshots 编译为 Gateway policy，active/expired/wildcard/blocked/export/time-range synthetic tests 与 `/gateway/runtime` capability 已通过
- [x] Serving Store schema scaffold 已建立：`docs/governance/serving-store-schema-scaffold.md`；serving_dataset/field/snapshot/record、versioned snapshots、quality/release/default-deny posture、`/data/runtime` 与 `/gateway/runtime` 已通过本地 smoke
- [x] Serving read default-deny scaffold 已建立：`docs/governance/serving-read-scaffold-default-deny.md`；`@aiphabee/serving-store` read planner、Gateway `servingRead` decision、default-deny/quality-hold no SQL/no rows/no live read、`/gateway/runtime` capability 已通过本地 smoke
- [x] Serving quality release isolation scaffold 已建立：`docs/governance/serving-quality-release-isolation-scaffold.md`；`PASS/WARN -> released`、`HOLD -> held`、`REJECT_RAW -> withdrawn`、`DATA_QUALITY_HOLD`、no live write/read/SQL，`/data/runtime` 与 `/gateway/runtime` capability 已通过本地 smoke
- [x] Data Access Gateway Serving query planner scaffold 已建立：`docs/governance/live-serving-query-planner-scaffold.md`；Gateway decision `servingQuery`、released snapshot gating、row-limit planning、cache material `serving_snapshot_id` / `release_state`、no live read/SQL，`/gateway/runtime` capability 已通过本地 smoke
- [x] Serving SQL descriptor scaffold 已建立：`docs/governance/serving-sql-descriptor-scaffold.md`；Gateway decision `servingSqlDescriptor`、allow-listed statement id、snapshot/field/time/limit bindings、no SQL text / no execute / no live read，`/gateway/runtime` capability 已通过本地 smoke
- [ ] Sprint 0.1 的外部权利矩阵、HKEX/vendor 结论、Type 4 书面意见、商业条款与签字仍未到位；这些证据到位前，Sprint 0.1 八个叶子任务保持未完成
- [ ] Sprint 0.2 的数据契约尚未由数据合作方签署；签署前退出门槛保持未全绿
- [ ] Sprint 0.3 的 synthetic golden fixtures/质量规则已可执行；partner-approved production corpus 与套餐/credits/单位经济真实成本评审尚未完成，退出门槛保持未全绿
- [ ] Sprint 0.4 的前端 scaffold、model provider live execution smoke、Cloudflare resource provisioning/smoke、Hyperdrive live `SELECT 1`、OTLP live export + persistent eval write/read、provider secret live provisioning/rotation smoke、Design System 集成尚未实现
- [ ] Sprint 1.1 的真实数据加载、真实 Serving Gateway、字段级权益 live policy source、usage ledger live writes 尚未实现；财务事实、公司行动/复权、账户/Workspace/权益、usage ledger schema/event planner、Serving Store schema、Serving read planner、Serving quality release isolation planner、Serving query planner、Serving SQL descriptor、entitlement DB policy-source compiler、synthetic financial/restatement engine、synthetic adjustment engine 与 entitlement evaluator 已存在但尚未接入 partner rows / live Serving SQL execution/reads/writes / partner benchmark parity / live DB entitlement reads / billing reconciliation
- [ ] Phase 0 sprint backlog 已完成程序证据收口，但 Phase 0 Gate 仍不绿；前端 scaffold 已按用户指示交给 Claude，Codex 下一非前端可执行 slice 应避开 `apps/web`

---

## 变更记录

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-06-20 | 1.0ah | 完成 `serving-sql-descriptor-scaffold`：新增 `@aiphabee/serving-store` SQL descriptor planner、Gateway decision `servingSqlDescriptor`、Worker `/gateway/runtime` SQL descriptor capability 与 `serving_sql_descriptor_scaffold` contract guard；SQL text / live execution / Hyperdrive reads 未启用，Sprint 1.1 更新为 18/23 |
| 2026-06-20 | 1.0ag | 完成 `live-serving-query-planner-scaffold`：新增 `@aiphabee/serving-store` query planner、Gateway decision `servingQuery`、Worker `/gateway/runtime` query planner capability 与 `serving_query_planner_scaffold` contract guard；live SQL / Hyperdrive reads / partner rows 未启用，Sprint 1.1 更新为 17/22 |
| 2026-06-20 | 1.0af | 完成 `field-entitlement-policy-source-scaffold`：新增 Gateway entitlement row snapshot compiler、Worker `/gateway/runtime` policy source capability 与 `field_entitlement_policy_source_scaffold` contract guard；partner rights matrix / live DB reads 未启用，Sprint 1.1 更新为 16/21 |
| 2026-06-20 | 1.0ae | 完成 `usage-ledger-event-writer-scaffold`：新增 `@aiphabee/usage-ledger` event writer planner、Gateway decision `usageLedger`、Worker `/gateway/runtime` capability 与 `usage_event_writer_scaffold` contract guard；live SQL / billing reconciliation / quota UI 未启用，Sprint 1.1 更新为 15/20 |
| 2026-06-20 | 1.0ad | 完成 `serving-quality-release-isolation-scaffold`：新增 `@aiphabee/serving-store` quality release planner、Worker `/data/runtime` 与 `/gateway/runtime` capability、`serving_quality_release_isolation` contract guard；live SQL / partner rows / Serving writes 未启用，Sprint 1.1 更新为 14/19 |
| 2026-06-20 | 1.0ac | 完成 `serving-read-scaffold-default-deny`：新增 `@aiphabee/serving-store` read planner、Gateway `servingRead` decision、Worker `/gateway/runtime` read planner capability 与 `serving_read_default_deny` contract guard；live SQL / partner rows / served rows 未启用，Sprint 1.1 更新为 13/18 |
| 2026-06-20 | 1.0ab | 完成 `financial-restatement-golden-engine-scaffold`：新增 `@aiphabee/financial-facts` deterministic restatement engine、版本保留/point-in-time/delta/identity synthetic golden cases、Worker `/data/runtime` capability；partner financial data 与 live Serving reads 未启用，Sprint 1.1 更新为 12/17 |
| 2026-06-20 | 1.0aa | 完成 `corporate-action-adjustment-engine-golden-scaffold`：新增 `@aiphabee/corporate-actions` deterministic adjustment engine、split/consolidation/dividend synthetic golden cases、Worker `/data/runtime` capability；partner/public benchmark parity 与 live Serving reads 未启用，Sprint 1.1 更新为 11/16 |
| 2026-06-20 | 1.0z | 完成 `serving-store-schema-scaffold`：新增 Supabase-compatible Serving Store dataset/field/snapshot/record schema、database migration contract、Worker `/data/runtime` 与 `/gateway/runtime` capability；live Serving reads 未启用，Sprint 1.1 更新为 10/15 |
| 2026-06-20 | 1.0y | 完成 `field-entitlement-enforcement-scaffold`：Gateway evaluator 支持 workspace/plan/channel/dataset/field/time_range/export 维度，更新 access contract/cache key/runtime；live policy source 未启用，Sprint 1.1 更新为 9/14 |
| 2026-06-20 | 1.0x | 完成 `usage-ledger-scaffold`：新增 Supabase-compatible usage meter/event/reconciliation/ledger schema、database migration contract、Worker `/gateway/runtime`；不启用 live usage writes，Sprint 1.1 更新为 8/13 |
| 2026-06-20 | 1.0w | 完成 `account-workspace-entitlement-scaffold`：新增 Supabase-compatible account/workspace/membership/subscription/entitlement schema、database migration contract、Worker `/data/runtime` 与 `/gateway/runtime`；不启用 live entitlement enforcement，Sprint 1.1 更新为 7/12 |
| 2026-06-20 | 1.0v | 完成 `corporate-action-adjustment-scaffold`：新增 Supabase-compatible corporate action / adjustment methodology / price adjustment factor schema、database migration contract、Worker `/data/runtime`；不加载真实市场数据，Sprint 1.1 更新为 6/12 |
| 2026-06-20 | 1.0u | 完成 `financial-facts-restatement-scaffold`：新增 Supabase-compatible financial statement/fact/restatement schema、database migration contract、Worker `/data/runtime`；不加载真实市场数据，Sprint 1.1 更新为 5/11 |
| 2026-06-20 | 1.0t | 完成 `security-master-raw-snapshot-scaffold`：新增 Supabase-compatible security master/raw snapshot schema、database migration contract、Worker `/data/runtime`；不加载真实市场数据，Sprint 1.1 更新为 4/11 |
| 2026-06-20 | 1.0s | 完成 `data-access-gateway-default-deny-scaffold`：新增 `packages/data-access-gateway`、default-deny gateway contract、`npm run check:data-gateway`、Worker `/gateway/runtime` 与 `/gateway/access-check`，覆盖 `DATA_NOT_LICENSED` / `DATA_QUALITY_HOLD` guard；真实 Serving/权益/usage ledger 仍未完成，Sprint 1.1 更新为 2/11 |
| 2026-06-20 | 1.0r | 完成 `observability-persistent-eval-store-scaffold`：新增 eval-store record schema/sink、planned D1 `AIPHABEE_EVAL_STORE` binding、OTLP names-only env、`/observability/runtime` guard，并扩展 `check:observability`；真实 OTLP export 与 persistent write/read smoke 仍未完成，Sprint 0.4 更新为 17/23 |
| 2026-06-20 | 1.0q | 完成 `golden-quality-rule-fixtures`：`npm run test:golden` 改为 strict fixture gate，新增 8 个 synthetic golden samples、12 条 deterministic quality rules、`DATA_QUALITY_HOLD` hold 断言；production partner corpus 与商业成本评审仍未完成，Sprint 0.4 更新为 16/22 |
| 2026-06-20 | 1.0p | 完成 `model-provider-streaming-scaffold`：新增 model provider / AI Gateway contract、`npm run check:model-provider`、`MODEL_PROVIDER_NOT_CONFIGURED`、Worker `/agent/model-provider` 与 guarded `/agent/runs/stream`；真实 AI Gateway / `streamText` / token logs 仍未完成，Sprint 0.4 更新为 15/22 |
| 2026-06-20 | 1.0o | 完成 `provider-secret-stores-contract`：新增 Cloudflare/GitHub/Supabase secret stores contract、rotation/revocation runbook、`npm run check:secrets`、Worker `/secrets/runtime`；真实 provider store provisioning/rotation smoke 仍未完成，Sprint 0.4 更新为 14/21 |
| 2026-06-20 | 1.0n | 完成 `postgres-hyperdrive-migration-scaffold`：新增 Supabase-compatible migration、database migration manifest、Hyperdrive connection contract、`npm run check:database`、Worker `/database/runtime`；真实 Hyperdrive binding / `SELECT 1` smoke 仍未完成，Sprint 0.4 更新为 13/20 |
| 2026-06-20 | 1.0m | 完成 `observability-eval-scaffold`：启用 Workers Logs/traces，新增 `packages/observability`、`run.audit`/`run.eval` 事件契约、console sink、`npm run check:observability` 与 dry-run telemetry headers；真实 OTLP destination / persistent eval store 仍未完成，Sprint 0.4 更新为 12/19 |
| 2026-06-20 | 1.0l | 完成 `agent-runtime-scaffold`：新增 `packages/agent-runtime`、AI SDK v7 beta dry-run skeleton、Worker `/agent/runtime` 与 `/agent/runs/dry-run`，补齐 PRD §9.6 错误码；Sprint 0.4 更新为 11/18 |
| 2026-06-20 | 1.0k | 完成 `cloudflare-bindings-contract`：新增 Cloudflare binding manifest、`npm run check:bindings` 与 CI step；真实资源 provision/smoke 仍未完成，Sprint 0.4 更新为 10/18 |
| 2026-06-20 | 1.0j | 完成 `env-secrets-contract`：新增 env schema、dev/staging/prod names-only templates、`npm run check:env` 与 CI Env Contract；provider secret stores/rotation 仍未完成，Sprint 0.4 更新为 9/17 |
| 2026-06-20 | 1.0i | 完成 `golden-regression-hook`：新增 `npm run test:golden`、CI Golden Regression Hook、fixture manifest validator 与 `tests/golden` 说明；fixtures 仍未完成，Sprint 0.4 更新为 8/16 |
| 2026-06-20 | 1.0h | 完成 `p0-traceability-ledger`：新增 53 条 P0 requirement owner/issue/test/release gate ledger；Sprint 0.4 更新为 7/15，§M 需求实现状态不变 |
| 2026-06-20 | 1.0g | 完成 `engineering-runtime-scaffold` 非前端切片：新增 npm workspaces、Hono Worker health、shared data contracts、CI、env template 与 runtime evidence；按用户指示撤出前端/TanStack/Vite，Sprint 0.4 更新为 6/15 |
| 2026-06-20 | 1.0f | 完成 `phase0-traceability-closeout`：新增 Phase 0 证据/阻断/traceability closeout，更新 `tasks/todos.md` deferred blockers；Phase 0 Gate 仍保持未全绿 |
| 2026-06-20 | 1.0e | 完成 `engineering-foundation-audit`：新增 PRD §23 工程地基现状审计；Sprint 0.4 完成度 1/10，其余 runtime scaffold / CI / binding / traceability 任务保持未完成 |
| 2026-06-20 | 1.0d | 完成 `golden-quality-commercial-baseline`：新增黄金样本、质量规则、数据隔离/更正、套餐权益、credits、单位经济与 Free 防滥用基线；Sprint 0.3 设计 backlog 9/9，CI/商业评审门槛保持未绿 |
| 2026-06-20 | 1.0c | 完成 `data-contract-methodology-baseline`：新增数据契约与口径基线、task contract 与执行计划；Sprint 0.2 设计 backlog 9/9，合作方签署门槛保持未绿 |
| 2026-06-20 | 1.0b | 完成 `gate0-rights-regulatory-decision-pack`：新增 Gate 0 权利/监管决策包、task contract 与执行计划；外部审批项保持未勾选 |
| 2026-06-20 | 1.0a | 建立首个 Phase 0 Gate 0 sprint 执行入口；更新看板为 Phase 0 / Sprint 0.1 进行中；仅勾选已完成的 harness 接入任务 |
| 2026-06-20 | 1.0 | 依据 PRD v1.0 首次生成完整 Sprint 跟踪清单 |
