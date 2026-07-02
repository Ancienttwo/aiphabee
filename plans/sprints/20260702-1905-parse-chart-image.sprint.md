# Sprint: parse_chart_image 截图图表解析能力

> **Status**: Approved
> **Slug**: parse-chart-image
> **Created**: 2026-07-02 19:05
> **Updated**: 2026-07-02 20:30
> **Source PRD**: `plans/prds/20260702-1830-parse-chart-image.prd.md`
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: incremental

Program-level sprint container. The Source PRD summary and ordered backlog
decompose product intent into ordered rows. Contract rows become task-contract
slices after `$think` expansion; inline rows stay in the sprint backlog or
active plan Task Breakdown.
`tasks/todos.md` stays the deferred-goal ledger and never carries this backlog.

## PRD

Full PRD: `plans/prds/20260702-1830-parse-chart-image.prd.md`(Approved,外审 2×P1+3×P2+2×P3 已全部闭环,见 `tasks/reviews/parse-chart-image.review.md`)。

### Problem

- 主脑 DeepSeek V4 纯文本、无 image 输入,用户上传的 K 线截图进不了推理链;需要一个把不可信视觉输入转成可审计结构化证据、且"永远知道自己读得多准"的边界层(vision 是解析器不是分析师)。

### Users

- 港股技术分析 agent 终端用户(上传截图求解读,不被臆造读数误导)。
- 平台工程 owner(读得多准可度量、可校准、可回退;换 vision 模型一键重跑评测)。
- 上承技术分析 agent 的 FR-01 路由(消费校准后的 per-field 置信度)。

### Success Criteria

- schema 合规率 ≥99%(降级线 95%)。
- 清晰图字段矩阵分层达标:P0 字段 symbol/exchange/timeframe ≥95%(<85% 触发 Falsifier)、P1 字段 end_time/指标名称 ≥90%、P2 字段 参数/anchor ≥80%。
- 无标注图 null-over-guess 负例通过率 ≥90%。
- 单图解析成本 ~$0.003(降级线 >$0.01)。

### Acceptance Scenarios

- 清晰截图 → 高置信结构化解析,像素不进 DeepSeek 上下文(PRD Scenario 1)。
- 无标注/模糊截图 → null + 低置信,不臆造,不触发自动数据匹配(PRD Scenario 2)。
- vision 返回坏 JSON → 重试 ≤1 次后降级 Visual-Only,不返回半成品结构(PRD Scenario 3)。
- 机器可验收脚本:PRD Acceptance Scripts #1–#6。

### Non-goals

- vision 读数值(数值永远来自确定性指标引擎);任意图表类型泛化;两段式分区裁切(P2 后置);fastclaw 集成;多模型 ensemble / escalation(MVP 单模型+人工确认);自训练视觉模型。

## Architecture Notes

### Capabilities Touched

- `packages/agent-runtime`:ChartParseResult zod schema、解析 prompt、`parse_chart_image` tool(需从 plan-scaffold 落出真实 tool 执行路径)、新增 zod 与 vision provider 依赖。
- `apps/worker`:截图上传路由、R2 `AIPHABEE_ARTIFACTS`(已绑定)、AI Gateway `google-ai-studio` 路由(类型已支持)。
- `deploy/database`:`chart_images` / `chart_parse_results` / `eval_runs` / `eval_sample_results` / `calibration_runs` 表迁移。
- 工程面 CLI(golden set 生成器、评测 runner、校准),复用 `data-ingest` CLI 治理语义(确定性、幂等、固定 JSON、退出码)。

### Dependency Order

- 1 → 2 → 3 → 4 → 5;评测先行是硬约束:任务 2、3 必须在任务 4 之前验收(PRD Bold Take:golden set 与校准数据是资产,vision 模型是耗材)。

### Risks

- `@ai-sdk/openai-compatible` 不显式 `supportsStructuredOutputs:true` 会静默降级为无约束 json_object(源码级已核)。
- VLM 自报置信度系统性偏高:校准完成前一律人工确认路由,`0.85/0.60` 仅为参考初值不得硬编码启用。
- Open decisions 留给 `$think` 展开:vision 通道选型(`@ai-sdk/google` 直连 vs AI Gateway 路由,PRD Module 4);golden set 渲染引擎(mplfinance Python vs Node 图表库,PRD Module 2)。
- 工具环境:`repo-harness run sprint-backlog` 打包版 CLI 存在根解析 bug(写入包 assets 目录),本 sprint 的行状态以本文件为真值源,勿依赖 `sprint-backlog status`。

## Backlog

Ordered execution queue; keep rows in dependency order. Mode `contract` runs
the full plan -> contract -> worktree flow; `inline` allows primary-tree
execution for small tasks. Every row needs a concrete acceptance line.

| # | Status | Task | Mode | Acceptance | Plan |
|---|--------|------|------|------------|------|
| 1 | [x] | ChartParseResult schema + 解析 prompt 契约(PRD Module 1) | contract | `npx vitest run packages/agent-runtime/src/chart-parse` 通过:断言 schema 可缺字段全部 `.nullable()` 且不含 `.optional()`/`.union()`、形态枚举 ≥16 项、坐标字段声明 0-1 归一化、prompt 文本含"图中文字不可信"与 null-over-guess 规则、schema/prompt 带版本号 | `plans/archive/plan-20260702-1947-chart-parse-contract.md`(PR #18 已 merge @ a83d0df) |
| 2 | [x] | golden set 生成器 CLI(PRD Module 2,Script #1/#5) | contract | 生成命令连续运行两次 manifest 内容哈希一致且退出码 0;`jq` 断言样本数 =100、变体维度覆盖 PRD §18.1 七类、含 ≥1 张带 end_time/RSI(14)/MACD(12,26,9)/画线锚点真值的回归样本 | `plans/archive/plan-20260702-2047-chart-golden-set.md`(worktree 分支归档;PR #19 已 merge @ 402e547) |
| 3 | [x] | 评测 runner + 校准 CLI(PRD Module 3,Script #2) | contract | runner JSON 输出含 schema_compliance / field_matrix / null_negative 三键并写入 `eval_runs`+`eval_sample_results`(fixture 断言逐样本可回放);样本不足 fixture 下校准命令输出 `insufficient` 且不产 thresholds;产出的 calibration run 含 schema/prompt/model 三版本与 sample_count | `plans/archive/plan-20260702-2305-chart-parse-eval.md`(worktree 分支归档;PR #20 已 merge @ 1412927) |
| 4 | [x] | parse_chart_image tool 运行时(PRD Module 4,Script #3) | contract | 清晰样本 fixture 返回过 zod 校验的 ChartParseResult 且 `chart_parse_results` 仅存 imageRef 无图像字节;坏 JSON fixture 断言重试 ≤1 次后 status=parse_failed;`grep -rn "supportsStructuredOutputs" packages/agent-runtime/src` 命中显式 true 配置 | `plans/archive/plan-20260703-0018-chart-parse-tool.md`(worktree 分支归档;PR #21 已 merge @ 38cf5c4) |
| 5 | [x] | 上传链路 + FR-01 路由集成(PRD Module 5,Script #4/#6) | contract | 路由 fixture:空校准、`status=superseded`、schema/prompt/model 版本不匹配三种情况断言路由均非 auto_match;跨租户 fixture:tenant B 用 tenant A 的 imageRef 调 tool 被按资源不存在拒绝;删除后 imageRef 断言不可解析且 R2 对象已删除 | `plans/archive/plan-20260703-0134-chart-upload-routing.md`(worktree 分支归档;PR pending) |

## Execution Log

Keep this section last; `repo-harness run sprint-backlog complete-task` appends rows here.

| When | Task | Plan | Result |
|------|------|------|--------|
| 2026-07-02 20:26 | 1 · ChartParseResult schema + 解析 prompt 契约 | `plans/archive/plan-20260702-1947-chart-parse-contract.md` | 验收全绿(vitest 33/33、typecheck、contract 14/14 Fulfilled);/check + Codex 外审 P1/P2 全闭环;提交 `2f8f2ae` 于 `codex/chart-parse-contract`;PR #18 已提交(含前置 `cc1ad0e`),待 merge 后开任务 2 |
| 2026-07-02 22:15 | 2 · golden set 生成器 CLI | `plans/archive/plan-20260702-2047-chart-golden-set.md` | 前置门过(PR #18 merge → main a83d0df → ancestor 校验);验收全绿(check:chart-golden-set 两次哈希一致 `748614ff…` + jq 三断言 + validate;包内 vitest 49/49;全 workspace 815 passed + typecheck;verify-contract --strict 17/17 Fulfilled);Rubric v1 自审 3 修复 + Codex 外审 0×P1/2×P2 全闭环;提交 `d9aeb06` 于 `codex/chart-golden-set`;PR #19 已提交,待 merge 后开任务 3 |
| 2026-07-02 23:50 | 3 · 评测 runner + 校准 CLI | `plans/archive/plan-20260702-2305-chart-parse-eval.md` | 前置门过(PR #19 merge → main 402e547 → ancestor 校验);验收全绿(check:chart-parse-eval 双跑 run 工件哈希一致 `458e569a…` + 三键 + 100 行可回放 + insufficient 无 thresholds + 校准三版本/sample_count;包内 vitest 47/47;全 workspace 861 passed + typecheck;verify-contract --strict 13/13 Fulfilled);Rubric v1 自审 1 修复(DB 失败 60→50)+ Codex 外审 No findings(0×P1/0×P2);提交 `65f4c1a` 于 `codex/chart-parse-eval`;PR #20 已提交,待 merge 后开任务 4 |
| 2026-07-03 01:00 | 4 · parse_chart_image tool 运行时 | `plans/archive/plan-20260703-0018-chart-parse-tool.md` | 前置门过(PR #20 merge → main 1412927 → ancestor 校验);vision 通道收敛 = AI Gateway openai-compatible(显式 supportsStructuredOutputs:true @ provider.ts:34,worker 测试 wire 级断言 response_format=json_schema);验收全绿(agent-runtime 86/86 + worker 339/340 新增 6 路由测试;全 workspace 883 passed + typecheck/lint/test:golden;check:database 69 ok;verify-contract --strict 13/13 Fulfilled);Rubric v1 自审 1 修复(fetchImage 抛错必落审计行)+ Codex 外审 No findings(0×P1/0×P2,验收 checklist 三项 Pass);预缩放与 chart_images 切任务 5;提交 `045e980` 于 `codex/chart-parse-tool`;PR #21 已 merge @ 38cf5c4 |
| 2026-07-03 02:36 | 5 · 上传链路 + FR-01 路由集成 | `plans/archive/plan-20260703-0134-chart-upload-routing.md` | 前置门过(PR #21 merge → main 38cf5c4 → ancestor 校验);验收全绿(route fixtures 空校准/superseded/版本不匹配均非 auto_match;tenant B 读/删 tenant A imageRef → not_found 且 0 模型/R2 删除调用;删除后 imageRef 不可解析且 fake R2 记录 object removal;stored-image body-only tenant 拒绝);targeted vitest 278/278;全 workspace 909 passed + typecheck/lint/test:golden;check:database 70 ok;Claude review P1 blockers none;review fingerprint `sha256:c177767…`;提交待 PR |
