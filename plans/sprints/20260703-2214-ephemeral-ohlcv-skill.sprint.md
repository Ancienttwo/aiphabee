# Sprint: 临时公开 OHLCV 技术分析 Skill

> **Status**: Done
> **Slug**: ephemeral-ohlcv-skill
> **Created**: 2026-07-03 22:14
> **Updated**: 2026-07-09
> **Source PRD**: `plans/prds/20260703-2207-ohlcv-skill.prd.md`
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: incremental

Program-level sprint container. The Source PRD summary and ordered backlog
decompose product intent into ordered rows. Contract rows become task-contract
slices after `$think` expansion; inline rows stay in the sprint backlog or
active plan Task Breakdown.
`tasks/todos.md` stays the deferred-goal ledger and never carries this backlog.

## PRD

Full PRD: `plans/prds/20260703-2207-ohlcv-skill.prd.md`(对话式方案,已三轮定稿:raw OHLCV 可进 LLM + 可展示、TTL 24h、三存储层分离、transcript 默认 `temporary_only`、术语 `public_observation_signal`)。

### Problem

- 用户要「用户发起的临时公开 OHLCV 技术分析」,但未授权公开行情不能被产品化成平台默认/批量/后台/持久化数据源。需要一个 ephemeral skill:raw OHLCV 可进 LLM ephemeral context、可展示给用户,但守六约束(`no-persistence`/`bounded-scope`/`user-initiated`/`no-background`/`no-batch`/`no-authorized-claim`),并精确处理三个独立存储层(平台持久层不写 / chat transcript 由 policy 决定 / 第三方 provider 只标注不控制)。

### Users

- Research/Pro 终端用户(问单标的技术面,拿到带标注的公开观察信号)。
- Research Agent(唯一可调 `analyze_public_technical_signal` 的层;Generic Agent 被拒)。
- 平台合规 owner(三存储层边界可审计,对外话术对齐层 1、不说「完全不存」)。

### Success Criteria

- Generic Agent 调用被拒;Research Agent 必须 `user_initiated=true` 才能调用。
- bounded 强约束:`max_symbols_per_run=1`、`max_bars ≤500`、cache TTL=24h(86400s)。
- raw OHLCV 不写平台持久层 DB(不建 `market_bars`);transcript 层由 `raw_to_chat_transcript` 控制,默认 `temporary_only`。
- 输出标 `public_observation_signal`,不声称 authorized/verified,不含 buy/sell/hold/仓位/止损。
- 全市场扫描 / 后台刷新 / 批量拉取 / 跨用户 cache 全部被拒;provider 失败优雅降级;有 kill switch。

### Acceptance Scenarios

- 用户发起单标的请求 → signal summary + (detail_level=with_bars 时)bounded bars 进 LLM + 带 public_observation 标注展示(PRD §8/§10/§18.4)。
- 后台 / 批量 / 全市场请求 → 按六约束拒绝并返回结构化 error code(PRD §16/§17.1)。
- follow-up within 24h TTL 复用同 cache、跨 24h refetch、user A 不能命中 user B cache(PRD §18.3)。
- transcript 模式 B → raw table 不写入持久聊天历史(PRD §6.3 / §18.2)。
- 机器可验收:PRD §21 Release Gate 17 条 + §18 测试清单四组。

### Non-goals

- 授权行情数据源;可复现的正式技术分析报告;长期历史行情库;自动 watchlist 信号;订阅型预警;组合级批量技术面扫描;后台定时刷新;跨用户缓存复用。这些等正式数据授权后另开路径(PRD §4.3)。

## Architecture Notes

### Capabilities Touched

- `packages/agent-runtime`:`analyze_public_technical_signal` tool contract + tool policy(六约束 + 三存储层分层字段)+ error codes(PRD §8/§13/§16)。
- `packages/market-data`(新建):`EphemeralPublicOhlcvProvider`(接 stock-sdk)、`normalizeEphemeralBars`、user-private session-scoped TTL cache、technical indicators/signals 引擎(PRD §6/§9)。
- `apps/worker`:Tool Gateway 内完成 fetch + indicator computation;FastClaw/E2B 只拿结果、不自 fetch(PRD §3/§14)。
- `apps/web`:consent 提示、status chips、signal card、带标注的 OHLCV 展示、TTL notice(PRD §11)。
- 限流与护栏面:entitlement tier gating + per-user rate limit(§12)、防批量化拦截(§17.1)、beta flag + kill switch + abuse/violation/cost 监控(§20 Sprint E),落在 tool policy 层 + `apps/worker` + 监控埋点。

### Dependency Order

- 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9;契约先行。1 锁定 tool schema + 六约束 + 三存储层字段;2(provider+normalize)依赖 1 的 schema;3(cache+隔离+timeout)依赖 2 的 provider;4(indicators+signals)依赖 2 的 normalized bars;5(entitlement+rate-limit)在 agent 接入前立好限流闸门,依赖 1 policy + 2/3 provider/cache;6(agent+template)依赖 1 tool + 4 signals;7(post-check+transcript)依赖 6 的 agent 输出;8(UI)依赖 6/7;9(beta guardrails+kill switch)上线前最后一环,依赖全部。原 PRD §19 PR1–5 的 provider/agent 两块在此各拆两片。

### Risks

- **工具环境**:`repo-harness run sprint-backlog` 打包版 CLI 存在根解析 bug(把 `.sprint.md` 写入包 assets 目录而非 `plans/sprints/`),本 sprint 行状态以本文件为真值源,勿依赖 `sprint-backlog status/next`。init 已在 harness state 留下 orphan Draft 记录,后续如需用 CLI 先 archive。
- **第三方 provider 存储层不可控**:raw OHLCV 发给 OpenAI/其他模型后,provider 的 abuse monitoring logs 默认最多保留 30 天(ZDR/Modified Abuse Monitoring 需额外申请);对外话术只能对齐层 1「不写 AiphaBee 正式行情库」,不能说「完全不存」(PRD §6.3 层 3)。
- **transcript 层是独立存储**:回答里展示 raw rows 即进 chat transcript;模式 A/B 的选择直接决定合规话术,默认走 B(严格不落持久历史)。
- **VLM/provider 数据质量**:bounded bars 必须先过 `normalizeEphemeralBars`(校验 OHLC 关系/去重/补齐/识别未完成 bar),不得把 provider 原始 response 直接喂 LLM。
- Open decisions 留给 `$think` 展开:stock-sdk 具体依赖版本与 provider adapter 选型(PRD §19 PR2);signal 阈值默认值(不得硬编码启用,PRD §9.3)。

### Approval Addendum: Traceability + Runtime Binding

This sprint was approved as an ordered backlog and has now completed its
contract/scaffold implementation pass. Runtime/live worker execution remains
out of scope for this sprint unless a follow-up sprint explicitly enables it.

Before Row 2 starts, Row 1 must bind the ephemeral OHLCV capability across:

- `docs/spec.md`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- `packages/tool-registry`
- `packages/agent-runtime`

The runtime skill name is `analyze_public_technical_signal`. The capability id is `technical_analysis_ephemeral`. The data classification is `public_observation_signal`.

Existing `get_price_history` is not this skill. It remains a separate price-history scaffold and must not be reused as the public OHLCV technical-analysis entrypoint.

Non-negotiable invariants:

- raw OHLCV may enter bounded LLM context
- raw OHLCV may be displayed to the user
- raw OHLCV must not be written to AiphaBee market database
- raw OHLCV must not be written to shared cache
- transcript policy defaults to `temporary_only`
- provider output must be normalized before use
- Generic Agent must be denied
- Research Agent requires `user_initiated=true`
- no background refresh
- no batch scan
- no full-market scan
- no authorized/verified claim
- no buy/sell/hold/position/stop-loss instruction
- kill switch must fail closed

## Backlog

Ordered execution queue; keep rows in dependency order. Mode `contract` runs
the full plan -> contract -> worktree flow; `inline` allows primary-tree
execution for small tasks. Every row needs a concrete acceptance line.

| # | Status | Task | Mode | Acceptance | Plan |
|---|--------|------|------|------------|------|
| 1 | [x] | Ephemeral OHLCV Contract + Tool Policy(PRD §8/§13/§16) | contract | `npx vitest run packages/agent-runtime/src packages/tool-registry/src` + `npm run check:tool-registry` 通过: `docs/spec.md`、`.ai/context/capabilities.json`、`.ai/context/capability-source-map.json` 均命中 `technical_analysis_ephemeral`/`analyze_public_technical_signal`/`public_observation_signal`;tool policy 拒 Generic、Research 需 `user_initiated`;`grep` 命中 `raw_to_llm_context: true`/`raw_to_market_database: false`/`raw_to_shared_cache: false`/`raw_to_chat_transcript`/`provider_as_authorized_feed: false`;output schema 含 `bars?` 与 `chat_transcript_policy`;error codes 含 `RAW_OHLCV_PERSISTENCE_BLOCKED`/`RAW_OHLCV_BATCH_EXPORT_BLOCKED` 且**不含** `RAW_OHLCV_OUTPUT_BLOCKED`;existing `get_price_history` 未注册为该 skill entrypoint | `plans/archive/plan-20260707-ephemeral-ohlcv-contract-tool-policy.md` |
| 2 | [x] | stock-sdk Provider adapter + normalizeEphemeralBars(PRD §6.1/§9.1) | contract | `npx vitest run packages/market-data/src/ephemeral/normalize` + provider fixture 通过:fetch 单标的 ≤500 bars 成功;`normalizeEphemeralBars` 对非法 fixture(high<max(open,close)/重复 timestamp/volume<0)返回 `INVALID_OHLC_RELATION`/`DUPLICATE_TIMESTAMP` 而非静默通过;识别未完成 latest bar;provider 原始 response 不透传(仅出 normalized bars) | `plans/archive/plan-20260707-ephemeral-ohlcv-provider-normalize.md` |
| 3 | [x] | Ephemeral 24h TTL cache + 跨用户隔离 + provider timeout/retry(PRD §6.2/§12.2) | contract | `npx vitest run packages/market-data/src/ephemeral/cache` 通过:within-24h 复用同 key、跨 24h refetch、user A 不命中 user B key;`grep -rn "market_bars" packages/market-data/src` 无 raw 写入;provider 超时 fixture 触发 ≤1 retry 后返回 `PROVIDER_UNAVAILABLE`,不 fabricate | `plans/archive/plan-20260707-ephemeral-ohlcv-cache-timeout.md` |
| 4 | [x] | Indicators + Signal Engine(PRD §9.2/§9.3) | contract | `npx vitest run packages/market-data/src/ephemeral/technical` 通过:golden bars 下 MA/EMA/MACD(12,26,9)/RSI(14)/BOLL(20,2)/ATR(14) 数值对齐参考值;`computeTechnicalSignals` 输出 trend/momentum/volatility/volume 观察信号;类型与 `grep` 断言输出**不含** `buy_signal`/`sell_signal`/`stop_loss`/`target_price`/`position_size` | `plans/archive/plan-20260707-ephemeral-ohlcv-indicators-signals.md` |
| 5 | [x] | Entitlement + Rate limit + 防批量化(PRD §12/§17.1) | contract | 限流测试通过:Free tier 调用被拒、Research/Pro 放行(entitlement fixture);per-user fixture 断言 hour>20/day>100/concurrent>2 返回 `PROVIDER_RATE_LIMITED`;全市场扫描/批量 symbol 请求返回结构化拒绝(`BATCH_FETCH_NOT_ALLOWED`) | `plans/archive/plan-20260707-ephemeral-ohlcv-entitlement-rate-limit.md` |
| 6 | [x] | Agent tool integration + answer template(PRD §10) | contract | agent fixture:Research Agent 接 `analyze_public_technical_signal` 成功、Generic agent 调用被拒;answer 含 `public_observation` label + `retrieved_at` + delay notice;`detail_level=with_bars` 时 bounded bars 进 LLM context;SSE 事件含 `tool.started`/`tool.finished`/`answer.final` | `plans/archive/plan-20260707-ephemeral-ohlcv-agent-template.md` |
| 7 | [x] | Post-check + transcript 模式(PRD §17.2/§6.3) | contract | post-check fixture 断言 answer 不含 买入/卖出/持有/仓位/止损、不声称 authorized/verified;transcript 模式 B fixture 断言 raw table 不写入持久聊天历史;超长完整 OHLCV 表 rewrite 成摘要 + 关键数值引用 | `plans/archive/plan-20260707-ephemeral-ohlcv-post-check-transcript.md` |
| 8 | [x] | UI/UX consent + signal card + OHLCV 展示(PRD §11) | contract | `apps/web` 组件测试:consent 文案含「临时公开数据 / 24 小时 / 不是授权行情验证 / 不构成投资建议」;signal card 渲染 trend/momentum/volatility/volume;OHLCV 表格/图带 `public_observation` 标注 + 获取时间;断言 UI 无「批量导出 / 常驻下载 API」入口 | `plans/archive/plan-20260707-ephemeral-ohlcv-ui-display.md` |
| 9 | [x] | Beta Guardrails + kill switch + 监控 + Release Gate Evidence(PRD §20 Sprint E/§21#15) | contract | kill switch fixture:flag off 时 tool 全拒返回 `KILL_SWITCH_ACTIVE`;abuse 测试套件(后台/批量/全市场/raw 违规导出)全绿;`grep` 断言 beta flag gate 存在;监控埋点(rate-limit/violation/cost/provider/cache/post-check)事件 schema 测试通过;产出 `plans/archive/*ephemeral-ohlcv-release-gate.evidence.md`,逐条覆盖 PRD §21 17 个 gate | `plans/archive/plan-20260707-ephemeral-ohlcv-beta-guardrails.md` |

## Execution Log

Keep this section last; `repo-harness run sprint-backlog complete-task` appends rows here.

| When | Task | Plan | Result |
|------|------|------|--------|
| 2026-07-07 03:19 HKT | Row 1: Ephemeral OHLCV Contract + Tool Policy | `plans/archive/plan-20260707-ephemeral-ohlcv-contract-tool-policy.md` | Completed. Added `technical_analysis_ephemeral` traceability, `analyze_public_technical_signal` registry/runtime policy, Generic deny + Research `userInitiated` gate, storage/output/error-code invariants; verified with vitest, `npm run check:tool-registry`, typecheck, grep assertions, and `git diff --check`. |
| 2026-07-07 03:26 HKT | Row 2: stock-sdk Provider adapter + normalizeEphemeralBars | `plans/archive/plan-20260707-ephemeral-ohlcv-provider-normalize.md` | Completed. Added `EphemeralPublicOhlcvProvider`, `fetchNormalizedEphemeralBars`, `normalizeEphemeralBars`, 500-bar bound, invalid OHLC/duplicate/negative-volume/incomplete-latest-bar tests, and raw-response non-passthrough checks; verified with Row 2 vitest, market-data vitest, typecheck, grep assertions, and `git diff --check`. |
| 2026-07-07 03:32 HKT | Row 3: Ephemeral 24h TTL cache + isolation + timeout/retry | `plans/archive/plan-20260707-ephemeral-ohlcv-cache-timeout.md` | Completed. Added in-memory 24h TTL cache scoped by `tenant_id:user_id:session_id`, cache hit/expiry/user-isolation tests, provider timeout with one retry, and fail-closed `PROVIDER_UNAVAILABLE` result without fabricated bars; verified with cache/ephemeral/market-data vitest, typecheck, grep assertions, and `git diff --check`. |
| 2026-07-07 03:35 HKT | Row 4: Indicators + Signal Engine | `plans/archive/plan-20260707-ephemeral-ohlcv-indicators-signals.md` | Completed. Added deterministic MA/EMA/MACD/RSI/BOLL/ATR/volume/OBV indicators and observation-only trend/momentum/volatility/volume signal summaries; verified with technical/ephemeral/market-data vitest, typecheck, forbidden-term grep, and `git diff --check`. |
| 2026-07-07 03:38 HKT | Row 5: Entitlement + Rate limit + anti-batch guardrail | `plans/archive/plan-20260707-ephemeral-ohlcv-entitlement-rate-limit.md` | Completed. Added fail-closed `evaluateEphemeralTechnicalAnalysisGuardrails` for Free vs Research/Pro entitlement, hourly/daily/concurrent limits, and batch/full-market rejection; verified with agent-runtime vitest, typecheck, grep assertions, and `git diff --check`. |
| 2026-07-07 03:41 HKT | Row 6: Agent tool integration + answer template | `plans/archive/plan-20260707-ephemeral-ohlcv-agent-template.md` | Completed. Added Research-only `createEphemeralTechnicalAnalysisAgentPlan`, `public_observation` answer template, retrieved/delay metadata, with-bars LLM context, and event names; verified with agent-runtime vitest, typecheck, grep assertions, and `git diff --check`. |
| 2026-07-07 03:43 HKT | Row 7: Post-check + transcript mode | `plans/archive/plan-20260707-ephemeral-ohlcv-post-check-transcript.md` | Completed. Added answer post-check blocking trade instructions and authorized/verified claims, default `temporary_only` transcript behavior, and long raw-table summary rewrite; verified with agent-runtime vitest, typecheck, grep assertions, and `git diff --check`. |
| 2026-07-07 03:47 HKT | Row 8: UI/UX consent + signal card + OHLCV display | `plans/archive/plan-20260707-ephemeral-ohlcv-ui-display.md` | Completed. Added SSR-testable `EphemeralOhlcvSignalCard` with consent copy, signal dimensions, public-observation OHLCV table, retrieved time, and no batch export/standing download API affordance; verified with component vitest, web/full typecheck, grep assertions, and `git diff --check`. |
| 2026-07-07 03:50 HKT | Row 9: Beta Guardrails + kill switch + monitoring + release evidence | `plans/archive/plan-20260707-ephemeral-ohlcv-beta-guardrails.md` | Completed. Added beta flag/kill-switch guardrail, abuse probe rejections, monitoring event schema, and PRD §21 17-gate evidence file `plans/archive/20260707-ephemeral-ohlcv-release-gate.evidence.md`; verified with agent-runtime vitest, focused sprint vitest, `check:tool-registry`, typecheck, grep assertions, and `git diff --check`. |
