# Session Handoff: sprint 任务 2 实现——golden set 生成器 CLI(2026-07-02)

> **Scope**: 任务 1 已验收并提交 PR #18;本文件是任务 2(chart-golden-set)实现会话的开工包。
> **上一份 handoff**: `tasks/notes/20260702-parse-chart-image-session-handoff.notes.md`(调研→sprint→任务 1 全流程,已执行完毕)
> **Approved plan(决策完整,勿再议方向)**: `plans/plan-20260702-2047-chart-golden-set.md`

## Task Overview

Sprint `plans/sprints/20260702-1905-parse-chart-image.sprint.md` backlog 行 2:golden set 生成器 CLI(PRD Module 2)。目标 = 新包 `packages/chart-golden-set`,确定性生成 100 张 K 线截图变体 + 逐样本真值 manifest(渲染参数即 ground truth)。

验收(sprint 行 2 原文):生成命令连续运行两次 manifest 内容哈希一致且退出码 0;`jq` 断言样本数 =100、变体维度覆盖七类、含 ≥1 张带 end_time/RSI(14)/MACD(12,26,9)/画线锚点真值的回归样本。

## 当前状态(2026-07-02 21:05 核实)

- [x] 任务 1(ChartParseResult 契约):实现+双审+机器验收全绿,**PR #18 已提交** https://github.com/Ancienttwo/aiphabee/pull/18(base main,含 `cc1ad0e` 前置 chore + `2f8f2ae` 本切片;MERGEABLE,CI verify 提交时 pending)。
- [x] 任务 2 plan:Approved 且决策完整(引擎/数据源/产物策略/变体矩阵全部收敛,证据在 plan 的 Captured Planning Output)。
- [ ] 任务 2 实现:**尚未开工,前置门未过**(见 Next Steps 步骤 0)。

## Key Decisions(已定案,来自 plan)

- **渲染引擎 = ECharts 6.1.0 SSR(SVG)+ @resvg/resvg-js 转 PNG + @napi-rs/canvas 做降质变体**;弃 mplfinance(beta 停更近 3 年 + Python 边车)。实测依据:`ssr:true` 无浏览器下 `convertToPixel` 可算画线 anchor 精确像素;fresh-process 两次渲染 SHA-256 一致。
- **OHLCV = seeded synthetic 合成器**(确定性 PRNG + 形态片段注入,种子入 manifest);不打行情 API(两次运行哈希一致是验收硬线;仓库现有行情 fixture 仅 5 根 bar 不可用)。
- **图像不入 git**:manifest(含每样本 image_sha256)提交 `tests/golden/chart-parse/`,PNG 写 gitignored `runtime/chart-golden-set/`;生成器即图像的"源码"。
- **truth labels 必须 import `@aiphabee/agent-runtime/chart-parse` 枚举**(TIMEFRAME/INDICATOR_NAME/CHART_PATTERN 等),禁复制枚举——这是前置门存在的原因。
- **变体七类**:theme / platform_style / timeframe_class / degradation / language / annotations / info_missing(压缩自父 PRD §18.1 九 bullet;`info_missing≠none` 子集即任务 3 的 null-over-guess 负例集)。
- **CLI 治理语义镜像 data-ingest**:`generate`/`validate` 子命令、单文档 JSON stdout、exit codes 0/40/50/60(参数与标签不一致 = 60 invariantViolation)、sha256 stableHash。
- 字体 pin 进包 `assets/fonts/`(Noto Sans + Noto Sans SC subset,OFL,附 LICENSE)——中英文变体跨机确定的前提。
- golden_set_samples DB 表**不在**本任务(任务 3 需要时再建;manifest sample id 是稳定引用)。

## Next Steps(依赖序,逐步执行)

0. **前置门(必须先过)**:PR #18 merge 进 main → 主仓库 `git pull`(或 fetch+ff)→ 校验 `git merge-base --is-ancestor 2f8f2ae main` 为真。未过门不得写实现代码(truth 枚举 import 会失败)。
1. `repo-harness run plan-to-todo --plan plans/plan-20260702-2047-chart-golden-set.md` → `repo-harness run contract-worktree start --plan plans/plan-20260702-2047-chart-golden-set.md`(开 worktree)。
2. 填 contract(Goal/Scope/allowed_paths/exit_criteria):allowed_paths ≈ `packages/chart-golden-set/`、`tests/golden/chart-parse/`、根 `package.json`、`package-lock.json`、plans/、tasks 三件套;exit_criteria 的 commands_succeed 用真实验收命令(vitest 路径过滤 + 两次生成哈希对比脚本 + jq 断言),**勿用 `tests_pass:`**(它走 `bun test`,与 vitest 不兼容——任务 1 已踩过)。
3. TDD:先 RED(小样本确定性/truth 一致性/负例结构断言)再 GREEN(prng → synthetic-ohlcv → variant-matrix → render → manifest → CLI)。
4. 生成 100 样本 manifest 入 `tests/golden/chart-parse/`;根 package.json 接 `check:chart-golden-set` script。
5. `/check` 自审 + `codex-review` 外审 → 修 findings → review 文件按 gate 格式记录(见 Gotchas)→ `verify-contract --strict` → `contract-worktree finish`(主仓库若仍 dirty 用 `--no-merge`,之后走 PR)→ 回填 sprint 行 2。

## Important Context / Gotchas(前会话实证,新会话直接吃)

- **External acceptance gate 格式是机器精确匹配**:review 文件必须逐字 `> **External Reviewer**: Codex`、`> **External Source**: codex-review`、`- P1 blockers: none`(细节写在别的行);Recommendation 行必须 `> **Recommendation**: pass`。
- **ReviewFreshness hook**:review 文件需记录 `> **Review Rubric Version**: 1`、`> **Reviewed Diff Fingerprint**: sha256:<hook 当轮给出的值>`、`> **Reviewed Scope**: branch+staged+unstaged+untracked`(fingerprint 以实现完成后 hook 输出为准,勿抄旧值)。
- **verify-sprint 的 diff base**:PR #18 merge 且 origin/main 同步后恢复正常;若 origin/main 再度落后,用 `HARNESS_DIFF_BASE=main` 覆盖(任务 1 实证)。
- **qa_scores gate**:review Scorecard 表格式 `| Functionality | 9/10 | … |`(第 3 列首个数字被解析,≥7 过)。
- **strict check 必须 `LC_ALL=C`**;唯一预期失败 = `Deploy SQL order check failed`(todos 已记治理决策)。
- **`repo-harness run sprint-backlog status/next` 不可用**(打包版根解析 bug,todos 已记);sprint 行状态以 sprint 文件为真值源,手动编辑回填。
- **并发会话风险**:2026-07-02 19:56 曾有并行进程在任务 1 worktree 生成冲突 plan 套件(事件详录 `tasks/archive/notes-20260702-2026-chart-parse-contract.md` Incident Log)。开工前 `ps aux | grep claude` 检查,确保只有一个会话在推进本 sprint。
- **ECharts SSR 确定性边界**:fresh-process 字节级一致(实测);同进程连续渲染有内部计数器漂移——生成器按样本 id 固定顺序单进程生成即可复现;跨 echarts 版本必然漂移 → manifest 记引擎版本,升级 = set_version bump + 全量重生成。
- **@resvg/resvg-js(2.6.2, 2024-03)与 @napi-rs/canvas 均为 native binding**;安装失败的降级路径在 plan 风险节(degradation 改 resvg fitTo,矩阵降一维)。
- 主仓库遗留未提交工件(上会话研究/PRD/sprint/handoff/skills 实验目录 + 模板/gitignore/todos 修改)**仍在工作区**,属用户决策面;实现会话照旧"不动无关文件"。

## 残留(不阻塞任务 2)

- 父 PRD(20260624 TA agent)§12.1 技术栈章节修订(Python/FastAPI/TA-Lib → TS 指标引擎)——仍未动。
- repo-harness 上游 bug ×2 与 Deploy SQL 布局治理——`tasks/todos.md` 已记,等专门切片。
- 任务 3-5 依赖序:3(评测+校准 CLI)在 2 之后;2、3 必须在 4(tool 运行时)之前验收。

## Files Modified(本会话)

- 新增:`tasks/notes/20260702-chart-golden-set-implementation-handoff.notes.md`(本文件)、`plans/plan-20260702-2047-chart-golden-set.md`(任务 2 plan)
- 修改:`plans/sprints/20260702-1905-parse-chart-image.sprint.md`(行 1 [x] + Execution Log + 行 2 Plan 列)、`tasks/notes/20260702-parse-chart-image-session-handoff.notes.md`(执行台账回写)
- 远程:分支 `codex/chart-parse-contract` 已 push;PR #18 已创建
