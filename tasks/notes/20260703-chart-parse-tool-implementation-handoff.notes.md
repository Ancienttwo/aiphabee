# Session Handoff: sprint 任务 4 实现——parse_chart_image tool 运行时(2026-07-03)

> **Scope**: 任务 3 已验收并提交 PR #20;本文件是任务 4(parse_chart_image tool 运行时)实现会话的开工包。
> **上一份 handoff**: `tasks/notes/20260702-chart-eval-runner-implementation-handoff.notes.md`(任务 3 开工包,执行台账已回写闭环)
> **注意**: 任务 4 与任务 3 相同——**plan 尚未展开**(sprint 行 4 Plan 列 = pending),开工第一步是 `$think` 出 plan,不是直接实现。这是 sprint 里第一个碰**已有运行时代码**(agent-runtime/worker)的任务,不再是纯新增包。

## Task Overview

Sprint `plans/sprints/20260702-1905-parse-chart-image.sprint.md` backlog 行 4:parse_chart_image tool 运行时(PRD Module 4,Script #3)。

验收(sprint 行 4 原文):清晰样本 fixture 返回过 zod 校验的 ChartParseResult 且 `chart_parse_results` 仅存 imageRef 无图像字节;坏 JSON fixture 断言重试 ≤1 次后 status=parse_failed;`grep -rn "supportsStructuredOutputs" packages/agent-runtime/src` 命中显式 true 配置。

PRD 全文:`plans/prds/20260702-1830-parse-chart-image.prd.md`(Module 4 章节是本任务真值源,$think 前先读;Scenario 3 是重试/降级语义的验收剧本)。

## 当前状态(2026-07-03 01:00 执行回写;本 handoff 的 Next Steps 已全部执行完毕)

- [x] 任务 1(chart-parse 契约):PR #18 已 merge(`a83d0df`)。
- [x] 任务 2(chart-golden-set):PR #19 已 merge(`402e547`)。
- [x] 任务 3(chart-parse-eval):PR #20 已 merge(`1412927`)。
- [x] 任务 4 plan:$think 五决策点全收敛(vision 通道 = AI Gateway openai-compatible,理由与变形缝见 plan P3-D1;修复先于重调的状态机定读;supportsStructuredOutputs 落 provider 装配层;迁移只切 chart_parse_results;预缩放切任务 5)→ `capture-plan --execute` 产出 `plans/plan-20260703-0018-chart-parse-tool.md`(随迁 worktree 后归档)。
- [x] 任务 4 实现:实现+双审+机器验收全绿(agent-runtime 86/86、worker 339/340、全 workspace 883 passed、verify-contract --strict 13/13 Fulfilled、Rubric v1 自审 1 修复、Codex 外审 No findings),**PR #21 已提交** https://github.com/Ancienttwo/aiphabee/pull/21(单提交 `045e980`,base main,待 merge)。sprint 行 4 已回填。
- [ ] 任务 5(上传链路 + FR-01 路由集成):待 PR #21 merge 后开工,plan pending(第一步照旧 $think);开工包已写好 → `tasks/notes/20260703-chart-upload-routing-implementation-handoff.notes.md`。

## 任务 4 可直接消费的资产面(任务 1/2/3 交付)

- **chart-parse 契约** `@aiphabee/agent-runtime/chart-parse`:`CHART_PARSE_CONTRACT`(schema+buildPrompt+双版本冻结单一真值源)——tool 的 generateObject schema 与 prompt 必须从这取,生产解析与评测永不漂移;`safeParseChartParseResult` 是二次校验入口;zod 依赖已在 agent-runtime。
- **评测回归面** `@aiphabee/chart-parse-eval`:fixture v1 形状(`FIXTURE_VERSION = "chart-parse-eval-fixture.v1"`,`outputs: {<sample_id>: {raw|error_code, token_cost?, latency_ms?}}`,声明 schema/prompt/model 三版本)——**任务 4 落地后录制真模型输出成此形状,直接喂 `chart-parse-eval run` 即得真实三项指标**,runner 零改动;`--record-fixture` 思路已记在归档 notes 的 Open Questions。库导出 record 类型/`EvalSink`/`PgEvalSink` 可复用。
- **golden set**:`tests/golden/chart-parse/manifest.json`(100 样本;清晰子集=degradation none 且 info_missing none,仅 11 张,选清晰样本 fixture 时注意);图像重建 `npm run check:chart-golden-set` 或 `node packages/chart-golden-set/bin/chart-golden-set.mjs generate`(写 gitignored `runtime/chart-golden-set/`)。
- **DB 面**:`aiphabee_core.eval_runs/eval_sample_results/calibration_runs` 三表已建账(`20260703001000_chart_parse_eval_foundation.sql`,local_contract 未 apply);`chart_parse_results.calibration_run_id` 语义见 PRD Data Model v2(null = 未校准必须人工确认)。迁移登记套路已有两轮先例可抄。
- **worker 面**(sprint Architecture Notes 已核):R2 `AIPHABEE_ARTIFACTS` 已绑定;AI Gateway `AIGatewayProviders` 类型已含 `google-ai-studio` 路由。
- **scaffold 现状**:`packages/agent-runtime/src/index.ts` 仍 plan-scaffold,`actual_tool_execution: false`(:399/:417)——任务 4 要落真实 tool 执行路径(sprint Capabilities Touched 点名)。
- 依赖先例:pg 三处(data-ingest/worker/chart-parse-eval);`jsonrepair` 仓库尚无,需新增。

## $think 要收敛的决策点(勿在 handoff 里预设结论)

- **vision 通道选型**:`@ai-sdk/google` 直连 vs AI Gateway `google-ai-studio` 路由——PRD 全篇唯一遗留 open decision(Known Unknowns 表点名对比 POC),**本次必须收敛,不能再推**。对比面:计费与 per-image token 观测(成本验收 ~$0.003 靠什么日志)、vision 模型可替换硬约束(换档只改配置)、Workers 运行时兼容性。
- **tool 执行路径落法**:AI SDK v7 `tool()`(Workers 进程内函数,无 CLI)怎么接进 agent-runtime 现有 plan-scaffold(`actual_tool_execution:false` 翻真的边界);vision 调用怎么做成 fixture 可替换注入面——坏 JSON fixture → jsonrepair + zod 二次校验重试 ≤1 → 降级 Visual-Only `parse_failed` 不返回半成品(PRD Scenario 3)的状态机必须离线可断言。
- **`supportsStructuredOutputs:true` 落点**:验收 grep 面是 `packages/agent-runtime/src`——显式配置放 provider 装配的哪一层(`@ai-sdk/openai-compatible` 不显式传即静默降级 json_object,源码级已核,PRD Risks 首条)。
- **`chart_parse_results`(与 `chart_images`?)迁移时机**:任务 4 验收要求 `chart_parse_results` 仅存 imageRef 无图像字节 → 该表此刻建;`chart_images`(上传 metadata/保留策略/tenant ownership)是 Module 5 主场——跨租户防护与级联删除的验收都在任务 5,表与校验切在哪刀由 $think 定。
- **预缩放(长边 1000-1568px)切任务 4 还是 5**:PRD Module 4 Recommended Defaults 提"提交前缩放",Freedoms 允许客户端预缩放;Workers 无 sharp,`@cf-wasm/photon` 需评估——若切给 5,任务 4 的 fixture 面对缩放解耦。

## Next Steps(依赖序,逐步执行)

0. **前置门**:PR #20 merge 进 main → 主仓库 `git pull`(工作区脏文件 = sprint + 三份 handoff,与 PR #20 文件清单零重叠,预期无冲突)→ 校验 `git merge-base --is-ancestor 65f4c1a main` 为真。未过门不得开工(tool 要与 main 上的契约/评测面同基线)。顺手可清两个已 merge 的 worktree(`git worktree remove ../AiphaBee-wt-chart-golden-set ../AiphaBee-wt-chart-parse-eval`,用户决策面,不强制)。
1. 读 PRD Module 4 → `$think` 展开 sprint 行 4 为 plan → `repo-harness run capture-plan --slug <slug> --title <title> --status Approved --artifact-level work-package --promotion-reason worktree_boundary --source waza-think --source-ref "sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#parse_chart_image tool 运行时(PRD Module 4,Script #3)" --body-file <plan正文> --execute`——**--execute 一步做完 capture+开 worktree+plan 随迁,勿再跑 plan-to-todo**(任务 3 实证)。
2. 填 contract:allowed_paths ≈ `packages/agent-runtime/` + `apps/worker/`(若 tool 装配进 worker)+ `deploy/database/migrations/` + `deploy/database/migrations.contract.json` + 根 package.json/lockfile + `plans/` + tasks 三件套;exit_criteria 用真实命令(vitest 路径过滤 + 验收 grep),**勿用 `tests_pass:`**(bun test 与 vitest 不兼容)。
3. TDD:先 RED 再 GREEN;完成后 `/check` 自审 + `codex-review` 外审 → review 按机器格式(见 Gotchas)→ **verify-contract 到 Fulfilled 终态后再取 fingerprint**(见 Gotchas 时序)→ `repo-harness run contract-worktree finish --no-merge --message "feat(...): ..."` → push → PR → 回填 sprint 行 4 + 本 handoff 台账。

## Important Context / Gotchas(三轮会话实证累积,新会话直接吃)

- **capture-plan --execute 一步到位**(任务 3 实证):capture + 开 worktree + plan 随迁 + 契约三件套脚手架全部自动;plan 正文走 stdin 或 `--body-file`(先写 /tmp 再传)。
- **fingerprint 时序**(任务 3 实证,重要):`verify-contract` 会翻 contract 的 `Status` 头(Active→Partial→Fulfilled),而 **contract 在 fingerprint 范围内**。正确顺序 = 代码与台账全部冻结 → 写 review(review 文件在 excluded_paths)→ `verify-contract --strict` 跑到 Fulfilled 终态 → `repo-harness-hook review-fingerprint --base main --format json` 取终态指纹 → 回写 review 两处指纹行 → 复跑 verify 确认 13/13 且指纹幂等。
- **External acceptance gate 机器精确匹配**:review 文件逐字 `> **External Acceptance**: pass`、`> **External Reviewer**: Codex`、`> **External Source**: codex-review`、`- P1 blockers: none`、header `> **Recommendation**: pass`;另需 `> **Review Rubric Version**: 1`、`> **Reviewed Diff Fingerprint**: sha256:<当轮值>`、`> **Reviewed Scope**: branch+staged+unstaged+untracked`。
- **qa_scores gate**:Scorecard 表 `| Functionality | 9/10 | … |`(第 3 列首个数字 ≥7)。
- **contract-worktree finish 用法**:`finish --no-merge --message "…"`,不吃 `--plan`;自动 commit + 归档 plan/contract/review/notes 到 `plans/archive/`+`tasks/archive/`。主仓库 dirty 时必须 `--no-merge` 走 PR。
- **codex-review 跑法**:`codex exec -s read-only "<prompt>" -c 'model_reasoning_effort="high"' </dev/null`,输出取 `awk '/^codex$/'` 之后的 final message;read-only sandbox 里 vitest 跑不了(EPERM)、codegraph 打不开索引 DB(自行 fallback rg),均属预期,Codex 会做静态复验。后台跑约 15 分钟。
- **Node 22 type stripping 不解析无扩展名导入**:import 链穿过 `@aiphabee/agent-runtime` 的 CLI/脚本,bin 壳用 `tsx/esm/api` 的 `register()`(两个先例:`packages/chart-golden-set/bin/`、`packages/chart-parse-eval/bin/`)。
- **迁移登记套路**(任务 3 实证):14 位时间戳命名;`migrations.contract.json` 逐条登记 file/purpose/schemas/tables/indexes/market_data:false/default_rights_status:default_deny;SQL 必须含 `create schema if not exists`、每表 `create table if not exists <fq>`、字面 `default_deny`;禁词裸 `token`/`secret`/`password`/`drop`/`delete`(下划线连接如 `token_cost` 安全);`npm run check:database` 即时验证。
- **strict check 必须 `LC_ALL=C`**;上一轮预警的 "Deploy SQL order check failed" 在任务 3 的 `verify-contract --strict` 13/13 中**未出现**(新增迁移未触发)——该预期失败属于别的 check 面,遇到再对照 `tasks/todos.md` 治理决策。
- **`repo-harness run sprint-backlog status/next` 不可用**(打包版根解析 bug);sprint 行状态以 sprint 文件为真值源,手动编辑回填。
- **vitest include** = `packages/**/*.{test,spec}.{ts,tsx}`;需要 node 类型的包自带 `@types/node` devDep + tsconfig `types: ["node","vitest"]`。
- **CI verify** = npm ci → lint → typecheck → test → test:golden(不跑图像生成/DB);新增 check script 默认不进 CI(`check:chart-golden-set`/`check:chart-parse-eval` 两个先例)。
- **网络**:npm registry 全程稳定;GitHub raw/jsdelivr 大文件间歇断连——资产类下载优先 npm 包提取。
- **并发会话检查**:开工前 `ps aux | grep claude` + 确认 `plans/`/`tasks/` 无异常新工件;历史事故见 `tasks/archive/notes-20260702-2026-chart-parse-contract.md` Incident Log。
- **主仓库工作区脏文件现状**:sprint 回填 + 三份 handoff(任务 2/3 台账回写 + 本文件),属用户决策面;实现会话照旧"不动无关文件",回填只碰 sprint 与 handoff。
- **golden set 组成**:清晰子集仅 11 张、null 负例 75 张——任务 4 选"清晰样本 fixture"与任务 3 校准观测面设计(全 schema 合规样本)都源于此,勿假设清晰样本充裕。

## 残留(不阻塞任务 4)

- live DB apply/readback 未做(三表账本 local_contract;首次真库写入属任务 4/5 之后的运维动作)。
- 校准观测面为全 schema 合规样本(plan 偏差已记归档 notes/review):若上游要求严格清晰面校准,`calibrate` 加子集过滤旗标即可(单点改动)。
- 清晰子集 11 张 → field_matrix 分层断言统计噪声偏大;golden set 扩容(`--count` 提升 + bump SET_VERSION 重生成)是演进路径。
- `image_sha256` 跨平台一致性、形态注入视觉逼真度、父 PRD §12.1 修订、repo-harness 上游 bug ×2——均为前轮遗留,`tasks/todos.md` 已记。
- 任务 5(上传链路 + FR-01 路由)最后:跨租户防护、级联删除、路由启用条件 fixture 都在那一刀。

## Files Modified(任务 4 实现会话,2026-07-03 回写)

- 新增(分支 `codex/chart-parse-tool` 提交 `045e980`,经 PR #21):`packages/agent-runtime/src/parse-chart-image/`(12 文件:types/provider/repair/executor/sink/tool/index + 4 test + test-util)、`deploy/database/migrations/20260703003000_parse_chart_image_runtime.sql`、`plans/archive/plan-20260703-0018-chart-parse-tool.md`、`tasks/archive/{contract,notes,review,todo}-20260703-0051-chart-parse-tool.md`
- 修改(worktree 内经 PR):`packages/agent-runtime/package.json`(+`./parse-chart-image` exports +`jsonrepair@^3.14.1`)、`apps/worker/src/index.ts`(+2 bindings、`RuntimeR2BucketObject` 扩展、live-smoke 路由与 6 helpers)、`apps/worker/src/index.test.ts`(+body 类型、chart-vision mock fetch、6 路由测试)、`deploy/database/migrations.contract.json`(+1 登记)、`package-lock.json`、`tasks/todos.md`(Updated 字段)
- 修改(主仓库工作区):`plans/sprints/20260702-1905-parse-chart-image.sprint.md`(行 4 回填 + Execution Log)、本文件(执行台账回写)
- 远程:PR #20 已 merge(`1412927`);分支 `codex/chart-parse-tool` 已 push;**PR #21 已创建,待 merge**
- 新会话可用的 gotcha 增量:①`ai@7.0.0-beta.182` 已弃用 `{type:"image"}` content part,用 `{type:"file", data, mediaType}`(deprecation warning 驱动,wire 仍是 openai-compat image_url data URL);②`ai/test` 的 `MockLanguageModelV4` 自带 `doGenerateCalls` 计数 + 序列响应,V4 usage 是嵌套形状(`inputTokens.total`)且 `finishReason` 是对象 `{unified, raw}`;③executor 内 `generateObject` 必须显式 `maxRetries: 0`,否则 provider 级重试会把真实视觉调用放大超出 PRD 重调上限;④worker smoke 路由三段门(header 403 → env 424 → Bearer≥16 403)与响应脱敏(hash 模型 id、不回字节)是既定模式,新路由照抄 `AGENT_LIVE_TOOL_LOOP` 先例即可。

## Files Modified(上一会话,任务 3 实现)

- 新增(分支 `codex/chart-parse-eval` 提交 `65f4c1a`,经 PR #20):`packages/chart-parse-eval/`(整包:bin/src/scripts/tsconfig/package.json)、`deploy/database/migrations/20260703001000_chart_parse_eval_foundation.sql`、`plans/archive/plan-20260702-2305-chart-parse-eval.md`、`tasks/archive/{contract,notes,review,todo}-20260702-2341-chart-parse-eval.md`
- 修改(worktree 内经 PR):`deploy/database/migrations.contract.json`(+1 登记)、根 `package.json`(+`check:chart-parse-eval`)、`package-lock.json`、`tasks/todos.md`(Updated 字段)
- 修改(主仓库工作区):`plans/sprints/20260702-1905-parse-chart-image.sprint.md`(行 3 回填 + Execution Log)、`tasks/notes/20260702-chart-eval-runner-implementation-handoff.notes.md`(执行台账回写 + 4 条新 gotchas)、本文件(新增,任务 4 开工包)
- 远程:PR #19 已 merge(`402e547`);分支 `codex/chart-parse-eval` 已 push;**PR #20 已创建,CI verify SUCCESS,mergeStateStatus CLEAN,待 merge**
