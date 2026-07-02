# Session Handoff: 双模式投资 Agent → parse_chart_image(2026-07-02)

> **Scope**: 本次会话从调研到 sprint 就绪的完整交接;新会话从"Next Steps"直接继续。
> **Machine packet**: `.ai/harness/handoff/{current,resume}.md`(由 prepare-codex-handoff 生成,本文件是人读叙事层)

## Task Overview

用户目标:双模式投资 agent——① generic 技术分析+基本面分析;② 个人专属投资 agent。本次会话完成:平台调研与收敛 → K 线读取路线定案 → parse_chart_image PRD → Codex 跨模型外审并修完全部 findings → sprint backlog 草稿。

## Completed

- [x] 平台决策(`docs/researches/20260702-dual-mode-agent-platform-and-chart-reading.md`):generic 留 CF Workers + AI SDK v7 + Hono;主脑 DeepSeek V4(官方 API 无图片输入,2026-07-02 schema 核实;旧模型名 7-24 弃用);EdgeOne 全线移除(用户确认不做大陆部署;fastclaw 是 Go 常驻 daemon,与 FaaS 结构性冲突);个人专属 = fastclaw 二开 on Hetzner VPS(6-23 评估沿用)+ 二开补视觉工具。
- [x] K 线读取三通道:数据通道为主(OHLCV→TS 确定性引擎→Evidence JSON)、截图通道为辅(vision sidecar 只做解析)、ASCII 不作数据通道。
- [x] 开源与最佳实践调研(`docs/researches/20260702-parse-chart-image-oss-and-best-practices.md`):抽样检索未发现可整体复用方案;可搬资产 = QuantAgent 形态清单(MIT)、ChartLlama candlestick QA、ChartArena 打分范式、arXiv 2604.12659 语料构造法(渲染参数即真值)。
- [x] PRD `plans/prds/20260702-1830-parse-chart-image.prd.md`(**Approved**,359 行):imageRef 隔离、评测先行、校准机制化启用(auto_match 需 status=ready + 三版本匹配 + 样本量达标)、Data Model v2(chart_images/chart_parse_results/eval_runs/eval_sample_results/calibration_runs)。
- [x] Codex 外审(`tasks/reviews/parse-chart-image.review.md`):2×P1 + 3×P2 + 2×P3 全部修复闭环(三个 Fix Log)。
- [x] Sprint 草稿 `plans/sprints/20260702-1905-parse-chart-image.sprint.md`:5 个 contract 行(schema契约 → golden set CLI → 评测/校准 CLI → tool → 上传+路由),验收全部机器可判定并回溯 PRD Scripts #1–#6。
- [x] 手尾清理:plan 模板同步包内新版(补 Artifact Level/Promotion Reason/Verification Boundary/Rollback Surface/## Promotion Gate);`20260625-data-ingest.prd.md` → `20260625-0156-data-ingest.prd.md` 并补 PRD header(原为无头问答文档,引用零);`runtime/` 入 .gitignore;deploy-sql 布局冲突与 repo-harness 上游 bug 记入 `tasks/todos.md` 延期账本。

## In Progress

- [x] Sprint 状态 = Approved(用户已批准,sprint 文件 2026-07-02 19:35)。
- [ ] 任务 1 合回 main:提交 `2f8f2ae` 在分支 `codex/chart-parse-contract`,`finish --no-merge` 完成;**merge 被主仓库 dirty 工作区阻塞(用户决策面)**,命令:`git -C /Users/ancienttwo/Projects/AiphaBee merge --ff-only codex/chart-parse-contract`。

## Not Started

- [ ] Backlog 任务 2–5 的实现(依赖序执行,2、3 必须在 4 之前验收;任务 2 开工前先完成任务 1 merge)。
- [ ] 父 PRD(20260624 TA agent)§12.1 技术栈章节修订(Python/FastAPI/TA-Lib → TS 指标引擎,与仓库基线对齐)——尚未动。

## Execution Log(2026-07-02 19:45–20:30,本次执行会话)

- [x] 任务 1(ChartParseResult schema + 解析 prompt 契约)全流程闭环:`$think` 展开 → `capture-plan --execute`(worktree `AiphaBee-wt-chart-parse-contract`,plan `plans/archive/plan-20260702-1947-chart-parse-contract.md`)→ TDD 实现 `packages/agent-runtime/src/chart-parse/`(7 文件:versions/patterns/schema/prompt/index + 2 测试)→ `/check`(typescript-reviewer:0C/0H/3M/1L,M 级已修/防护)→ Codex 外审(3P1+2P2 全闭环,真发现 = prompt 禁读数值与 params 转录冲突,已修)→ `verify-contract --strict` 14/14 Fulfilled → `finish --no-merge` 提交 `2f8f2ae`(17 files,+1537)→ sprint backlog 行 1 置 [x] 并记 Execution Log。
- 验收证据:`npx vitest run packages/agent-runtime/src/chart-parse` 33/33;包 typecheck 通过;全包 71/71 无回归;strictObject 降级 mutation 验证有效。
- ⚠️ 事件:19:56 检测到并发进程在同 worktree 生成第二套 plan/contract 套件(另一方案:22 项枚举、改 src/index.ts),active-plan marker 被改指;已收敛(marker 指回、残件删除、todos 还原),详见 `tasks/archive/notes-20260702-2026-chart-parse-contract.md` Incident Log。**用户需检查并停掉响应同一 sprint 的重复 claude 会话(ps 当时可见 7 个)。**
- 工具注记:verify-sprint 的 diff base 默认 origin/main,因本地 main 领先一个未 push 提交 `cc1ad0e` 会误报 allowed_paths;本次以 `HARNESS_DIFF_BASE=main` 覆盖。建议 push main 消除根源。

## Key Decisions

- vision 模型是可替换耗材,golden set 与校准数据才是资产;置信度未离线校准前一律人工确认路由。
- 执行面分层:生产运行时 = AI SDK `tool()`(Workers 无子进程);工程面 = CLI(复用 data-ingest 治理语义);fastclaw 沙箱面后置(凭证不进沙箱)。
- vision sidecar 默认 Gemini 2.5 Flash(~$0.003/图),经 `@ai-sdk/google` 或 AI Gateway `google-ai-studio`(open decision 留给任务 4 的 $think)。

## Important Context / Gotchas

- **`@ai-sdk/openai-compatible` 陷阱**:不显式 `supportsStructuredOutputs:true`,json_schema 静默降级为无约束 json_object(源码级核实;现有 `runAiGatewayLiveSmoke` 未设)。
- **zod 纪律**:可缺字段全 `.nullable()`,禁 `.optional()`/`.union()`;Anthropic strict 有可选参数 ≤24 上限。
- **repo-harness 工具 bug ×2(todos 已记)**:① 打包版 `sprint-backlog` 根解析错误(init 曾写进 bun 包 assets,已搬回;status/next 不可用,sprint 行状态以 sprint 文件为真值源);② strict check 的 awk 在默认 locale 对中文段落误报,**运行 strict check 必须带 `LC_ALL=C`**。
- strict check 当前唯一预期失败:`Deploy SQL order check failed`(deploy/database/migrations 时间戳账本 vs 检查器硬编码 deploy/sql,治理决策见 todos)。
- `packages/agent-runtime` 现状:`ai@7.0.0-beta.182`,无 zod,`index.ts` 是 plan-scaffold(`actual_tool_execution:false`),任务 4 需落出真实 tool 执行路径;R2 桶 `AIPHABEE_ARTIFACTS` 可复用,仓库目前没有任何图片上传代码。

## Next Steps(更新于 2026-07-02 20:30;步骤 1–3 原文已执行完毕,见 Execution Log)

1. ~~用户批准 sprint backlog~~(已完成)。
2. ~~任务 1 `$think` 展开 → capture-plan~~(已完成,`2f8f2ae`)。
3. ~~任务 1 实现→/check→外审→finish→回填~~(已完成;merge 待用户,见 In Progress)。
4. ~~merge 路径~~(已改走 PR:分支已 push,**PR #18** https://github.com/Ancienttwo/aiphabee/pull/18 已提交,含 `cc1ad0e`+`2f8f2ae`;merge 后主仓库 `git pull` 即同步)。用户仍需:停掉重复会话 + 处理主仓库遗留工件。
5. ~~任务 2 `$think` 展开 → capture-plan~~(已完成 2026-07-02 20:47:`plans/plan-20260702-2047-chart-golden-set.md`,Approved。open decision 已收敛 = **ECharts 6.1.0 SSR + @resvg/resvg-js 纯 npm 方案**,弃 mplfinance/Python——研究 agent 实测 `convertToPixel` 无浏览器可算 anchor 真值、fresh-process 渲染字节级一致;OHLCV 用 seeded synthetic 合成器保证两次运行哈希一致;图像不入 git 只提交 manifest。证据与权衡见 plan 的 Captured Planning Output)。
6. 任务 2 实现:**前置门 = 步骤 4 的 merge 完成**(truth labels 必须 import chart-parse 枚举防漂移)。merge 后走 `repo-harness run plan-to-todo --plan plans/plan-20260702-2047-chart-golden-set.md` → `contract-worktree start` → TDD 实现 → /check → 外审 → finish;逐行推进,勿并行两行。

## Files Modified(本会话)

- 新增:`docs/researches/20260702-dual-mode-agent-platform-and-chart-reading.md`、`docs/researches/20260702-parse-chart-image-oss-and-best-practices.md`、`plans/prds/20260702-1830-parse-chart-image.prd.md`、`plans/sprints/20260702-1905-parse-chart-image.sprint.md`、`tasks/reviews/parse-chart-image.review.md`、`tasks/notes/20260702-parse-chart-image-session-handoff.notes.md`(本文件)、`.ai/harness/sprint/active-sprint`
- 修改:`.claude/templates/plan.template.md`(同步新版)、`.gitignore`(+runtime/)、`tasks/todos.md`(+2 延期行)、`plans/prds/20260625-0156-data-ingest.prd.md`(改名+补 header)
- 会话前已存在的未跟踪/修改(未动):`packages/data-ingest/bin/data-ingest.mjs`、`scripts/dev-worker.mjs`、`skills/autoresearch-hkex-news-crawl-qa-20260627-230018/`
