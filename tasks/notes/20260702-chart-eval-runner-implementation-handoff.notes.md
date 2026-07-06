# Session Handoff: sprint 任务 3 实现——评测 runner + 校准 CLI(2026-07-02)

> **Scope**: 任务 2 已验收并提交 PR #19;本文件是任务 3(chart-eval-runner + 校准)实现会话的开工包。
> **上一份 handoff**: `tasks/notes/20260702-chart-golden-set-implementation-handoff.notes.md`(任务 2 开工包,执行台账已回写闭环)
> **注意**: 任务 3 与任务 2 不同——**plan 尚未展开**(sprint 行 3 Plan 列 = pending),开工第一步是 `$think` 出 plan,不是直接实现。

## Task Overview

Sprint `plans/sprints/20260702-1905-parse-chart-image.sprint.md` backlog 行 3:评测 runner + 校准 CLI(PRD Module 3,Script #2)。

验收(sprint 行 3 原文):runner JSON 输出含 `schema_compliance` / `field_matrix` / `null_negative` 三键并写入 `eval_runs`+`eval_sample_results`(fixture 断言逐样本可回放);样本不足 fixture 下校准命令输出 `insufficient` 且不产 thresholds;产出的 calibration run 含 schema/prompt/model 三版本与 sample_count。

PRD 全文:`plans/prds/20260702-1830-parse-chart-image.prd.md`(Module 3 章节是本任务真值源,$think 前先读)。

## 当前状态(2026-07-02 23:50 执行台账回写:本 handoff 已执行完毕)

- [x] 任务 1(chart-parse 契约):PR #18 已 merge(`a83d0df`)。
- [x] 任务 2(chart-golden-set):**PR #19 已 merge**(merge commit `402e547`),前置门 `git merge-base --is-ancestor d9aeb06 main` 实测通过;预警的 `.gitignore` 冲突未发生(`32613f1` 已提前把工作区遗留工件全部提交)。
- [x] 任务 3 plan:`$think` 已展开并收敛四决策点(fixture-only 调用面/迁移落三表且不建 golden_set_samples/tier 池化 isotonic 阈值零硬编码/治理语义镜像),capture 为 `plans/plan-20260702-2305-chart-parse-eval.md`(Approved,现已随 finish 归档)。
- [x] 任务 3 实现:**已完成并验收**——worktree `AiphaBee-wt-chart-parse-eval` 分支 `codex/chart-parse-eval` 提交 `65f4c1a`,**PR #20 已提交** https://github.com/Ancienttwo/aiphabee/pull/20。验收:`check:chart-parse-eval` 双跑 run 工件哈希一致(`458e569a…`)+ 三键 + 100 行可回放 + insufficient 无 thresholds + 校准三版本/sample_count;包内 vitest 47/47(RED 7/7 先失败);全 workspace 861 passed + typecheck/lint/test:golden/check:database;`verify-contract --strict` 13/13 Fulfilled;Rubric v1 自审(1 修复:DB 写失败 60→50)+ Codex 外审 No findings(0×P1/0×P2)。sprint 行 3 已回填。
- 本次新增 gotchas(下会话直接吃):① `capture-plan --execute` 一步做完 capture+开 worktree+plan 随迁,**不需要再跑 plan-to-todo**(handoff 步骤 2 可跳过);② `verify-contract` 会翻 contract 的 Status 头且 contract 在 fingerprint 范围内——正确顺序 = 先 verify 到 Fulfilled 终态 → 再取 fingerprint → 回写 review 指纹行(review 文件在排除清单,改它不破坏新鲜度);③ 真 manifest 清晰子集仅 11 张(info_missing≠none 占 75)——校准观测面须按全 schema 合规样本设计,矩阵仍只算清晰子集(plan 偏差已记 notes);④ Codex read-only sandbox 里 codegraph 打不开索引 DB,它会自行 fallback 到 rg,属预期。

## 任务 3 可直接消费的资产面(任务 2 交付)

- **manifest**:`tests/golden/chart-parse/manifest.json`(100 样本;`image_path` 为 repo-root 相对;`image_sha256` 逐样本)。图像不入 git,重建:`npm run check:chart-golden-set` 或 `node packages/chart-golden-set/bin/chart-golden-set.mjs generate`(写 gitignored `runtime/chart-golden-set/`)。
- **库入口** `@aiphabee/chart-golden-set`:`GoldenSetManifest`/`GoldenSample`/`SampleTruth` 类型、`collectInvariantViolations`、`isRegressionSample`、`buildSampleSpecs`、`SET_VERSION`/`GENERATOR_VERSION`/`RENDER_ENGINE` 常量。
- **负例集**:`variant_dims.info_missing != "none"` 子集即 null-over-guess 负例(truth 对应字段为 null:no_symbol→symbol+exchange、no_timeframe→timeframe、no_axes→end_time)。
- **回归样本**:`cgs-000`(end_time + RSI(14) + MACD(12,26,9) + trendline anchors 全真值)。
- **chart-parse 契约** `@aiphabee/agent-runtime/chart-parse`:`CHART_PARSE_CONTRACT`(schema+prompt+双版本单一真值源)、`safeParseChartParseResult`、全部枚举。评测比对与版本记录都从这里取。

## $think 要收敛的决策点(勿在 handoff 里预设结论)

- runner 的 vision 调用面:注入接口(fixture 可替换)与真 provider 通道的边界——验收只要求 fixture 断言可回放,真模型评测是运行时能力;vision 通道选型(直连 vs AI Gateway)是 PRD Module 4 的 open decision,任务 3 勿提前锁死。
- DB 写入:`eval_runs`/`eval_sample_results`/`calibration_runs` 表迁移(sprint Architecture Notes 点名)。迁移账本 = `deploy/database/migrations/`(时间戳命名),契约 = `deploy/database/migrations.contract.json` + `npm run check:database`。`golden_set_samples` 表是否此刻建:上轮决策"任务 3 需要时再建,manifest sample id 是稳定引用"。
- 校准算法与阈值语义:PRD 记"0.85/0.60 仅参考初值不得硬编码启用";样本不足 → `insufficient` 且不产 thresholds 是验收硬线。
- CLI 治理语义继续镜像 data-ingest(单文档 JSON stdout、exit codes 0/40/50/60、stableHash)——任务 2 的 `packages/chart-golden-set/src/cli.ts` 可直接参照。

## Next Steps(依赖序,逐步执行)

0. **前置门**:PR #19 merge 进 main → 主仓库 `git pull`(**预警:主仓库工作区 `.gitignore` 有未提交修改,与 PR 的 `/runtime/` 规则可能冲突,先备份内容再合一**,任务 2 的 todos.md 字节级保全流程可复用)→ 校验 `git merge-base --is-ancestor d9aeb06 main` 为真。未过门不得开工(评测 runner 要 import `@aiphabee/chart-golden-set` 与 manifest)。
1. 读 PRD Module 3 → `$think` 展开 sprint 行 3 为 plan → `repo-harness run capture-plan --source waza-think --source-ref "sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#评测 runner + 校准 CLI(PRD Module 3,Script #2)"`。
2. `repo-harness run plan-to-todo --plan plans/plan-<ts>-<slug>.md`——**注意:这一步会自动开 worktree 并把 plan 移进去**(任务 2 实证,不需要再跑 contract-worktree start)。
3. 填 contract:allowed_paths ≈ 新包目录 + `deploy/database/migrations/` + 契约 json + tests fixtures + 根 package.json/lockfile + plans/ + tasks 三件套;exit_criteria 用真实命令(vitest 路径过滤 + 新 check script),**勿用 `tests_pass:`**(走 bun test,与 vitest 不兼容)。
4. TDD:先 RED 再 GREEN;完成后 `/check` 自审 + `codex-review` 外审 → review 文件按机器格式(见 Gotchas)→ `LC_ALL=C repo-harness run verify-contract --contract <path> --strict` → `repo-harness run contract-worktree finish --no-merge --message "feat(...): ..."` → push 分支 → PR → 回填 sprint 行 3 + 本 handoff 台账。

## Important Context / Gotchas(两轮会话实证,新会话直接吃)

- **fingerprint 可随时自取**:`repo-harness-hook review-fingerprint --base main --format json`(与 hook 同源;review 文件本身在 excluded_paths,写 review 不破坏 freshness)。**review 文件写入后勿再改 diff 内文件**,否则 stale。
- **External acceptance gate 是机器精确匹配**:review 文件逐字 `> **External Acceptance**: pass`、`> **External Reviewer**: Codex`、`> **External Source**: codex-review`、`- P1 blockers: none`、header `> **Recommendation**: pass`;另需 `> **Review Rubric Version**: 1`、`> **Reviewed Diff Fingerprint**: sha256:<当轮值>`、`> **Reviewed Scope**: branch+staged+unstaged+untracked`。
- **qa_scores gate**:Scorecard 表 `| Functionality | 9/10 | … |`(第 3 列首个数字 ≥7)。
- **Node 22 type stripping 不解析无扩展名导入**:任何要用 node 直接跑、且 import 链穿过 `@aiphabee/agent-runtime`(或其他无扩展名导入的包)的 CLI,bin 壳用 `tsx/esm/api` 的 `register()`(tsx 已在 chart-golden-set devDeps,根 node_modules 可见;参照 `packages/chart-golden-set/bin/chart-golden-set.mjs`)。
- **contract-worktree finish 用法**:`finish --no-merge --message "…"`,**不吃 `--plan` 参数**;它自动 commit + 归档 plan/contract/review/notes 到 `plans/archive/`+`tasks/archive/`。主仓库 dirty 时必须 `--no-merge` 走 PR。
- **codex-review 跑法**:`codex exec -s read-only "<prompt>" -c 'model_reasoning_effort="high"' </dev/null`,输出取 final message(`awk '/^codex$/'` 之后);read-only sandbox 里 Codex 跑不了 vitest(EPERM)是正常的,它会做静态复验。
- **strict check 必须 `LC_ALL=C`**;唯一预期失败 = `Deploy SQL order check failed`(todos 已记治理决策)。**任务 3 若加迁移文件,注意这条 check 的行为**。
- **`repo-harness run sprint-backlog status/next` 不可用**(打包版根解析 bug);sprint 行状态以 sprint 文件为真值源,手动编辑回填。
- **vitest include** = `packages/**/*.{test,spec}.{ts,tsx}`(根 vitest.config.ts),新包测试自动拾取;repo 无根级 `@types/node`,需要 node 类型的包自带 devDep + tsconfig `types: ["node","vitest"]`。
- **CI verify** = npm ci → lint → typecheck → test → test:golden(不跑图像生成/DB);新增 check script 默认不进 CI。
- **网络**:GitHub raw/jsdelivr 大文件间歇断连(直连也断);npm registry 全程稳定——资产类下载优先走 npm 包提取(任务 2 字体实证:`@expo-google-fonts/*`)。
- **并发会话检查**:开工前 `ps aux | grep claude` + 确认 `plans/`/`tasks/` 无异常新工件;历史事故见 `tasks/archive/notes-20260702-2026-chart-parse-contract.md` Incident Log。
- **主仓库遗留未提交工件仍在工作区**(研究/PRD/sprint/handoff/skills 目录 + 模板/gitignore/todos/data-ingest 修改),属用户决策面;实现会话照旧"不动无关文件",回填只碰 sprint 与 handoff。

## 残留(不阻塞任务 3)

- `image_sha256` 跨平台一致性未验证(评测 runner 固定单机跑即可;若未来 CI 要跑 validate 全量,先实测 linux resvg/canvas 字节)。
- 形态注入视觉逼真度中等:任务 3 校准若发现 patterns 维度命中率异常,回到 chart-golden-set 调模板参数 + bump `SET_VERSION` 全量重生成(流程在包内 notes/README 注释)。
- 父 PRD(20260624 TA agent)§12.1 技术栈章节修订——仍未动。
- repo-harness 上游 bug ×2 与 Deploy SQL 布局治理——`tasks/todos.md` 已记,等专门切片。
- 任务 4、5 依赖序:4(tool 运行时)必须在 2、3 验收之后;5(上传链路 + FR-01 路由)最后。

## Files Modified(handoff 撰写会话)

- 新增:`packages/chart-golden-set/`(整包,经 PR #19)、`tests/golden/chart-parse/manifest.json`、`plans/archive/plan-20260702-2047-chart-golden-set.md`、`tasks/archive/{contract,notes,review,todo}-20260702-2208-chart-golden-set.md`(均在分支 `codex/chart-golden-set` 提交 `d9aeb06`)、本文件
- 修改(worktree 内经 PR):根 `package.json`(+`check:chart-golden-set`)、`package-lock.json`、`.gitignore`(+`/runtime/`)、`tasks/todos.md`(Updated 字段)
- 修改(主仓库工作区):`plans/sprints/20260702-1905-parse-chart-image.sprint.md`(行 1/2 回填 + Execution Log)、`tasks/notes/20260702-chart-golden-set-implementation-handoff.notes.md`(执行台账回写 + 4 条新 gotchas)、`tasks/todos.md`(pull 前后字节级保全,内容未变)
- 远程:分支 `codex/chart-golden-set` 已 push;**PR #19 已创建,CI 绿,待 merge**;PR #18 已 merge

## Files Modified(实现会话回写,2026-07-02 23:50)

- 新增(分支 `codex/chart-parse-eval` 提交 `65f4c1a`,经 PR #20):`packages/chart-parse-eval/`(整包:bin/src/scripts/tsconfig/package.json)、`deploy/database/migrations/20260703001000_chart_parse_eval_foundation.sql`、`plans/archive/plan-20260702-2305-chart-parse-eval.md`、`tasks/archive/{contract,notes,review,todo}-20260702-2341-chart-parse-eval.md`
- 修改(worktree 内经 PR):`deploy/database/migrations.contract.json`(+1 登记)、根 `package.json`(+`check:chart-parse-eval`)、`package-lock.json`、`tasks/todos.md`(Updated 字段)
- 修改(主仓库工作区):`plans/sprints/20260702-1905-parse-chart-image.sprint.md`(行 3 回填 + Execution Log)、本文件(执行台账回写 + 4 条新 gotchas)
- 新增(主仓库工作区):`tasks/notes/20260703-chart-parse-tool-implementation-handoff.notes.md`(任务 4 开工包,镜像本文件结构)
- 远程:PR #19 已 merge(`402e547`);分支 `codex/chart-parse-eval` 已 push;**PR #20 已创建,CI verify SUCCESS,待 merge**
