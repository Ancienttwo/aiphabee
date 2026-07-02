# Plan: golden set 生成器 CLI(ECharts SSR + seeded synthetic OHLCV)

> **Status**: Archived
> **Created**: 20260702-2047
> **Slug**: chart-golden-set
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#task-2
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: 两次 generate 运行 manifest 哈希一致且退出码 0;jq 断言样本数=100、七类变体维度覆盖、回归样本存在;npx vitest run packages/chart-golden-set;repo-harness run verify-contract --strict
> **Rollback Surface**: 纯新增 packages/chart-golden-set 包与根 package.json 一行 script 及 lockfile;revert 提交即完全回滚,无数据/部署面
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260702-2047-chart-golden-set.contract.md`
> **Task Review**: `tasks/reviews/20260702-2047-chart-golden-set.review.md`
> **Implementation Notes**: `tasks/notes/20260702-2047-chart-golden-set.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#task-2
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260702-2047-chart-golden-set.md`
- Sprint contract: `tasks/contracts/20260702-2047-chart-golden-set.contract.md`
- Sprint review: `tasks/reviews/20260702-2047-chart-golden-set.review.md`
- Implementation notes: `tasks/notes/20260702-2047-chart-golden-set.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260702-2047-chart-golden-set.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260702-2047-chart-golden-set.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260702-2047-chart-golden-set.md`.

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
- Contract file: `tasks/contracts/20260702-2047-chart-golden-set.contract.md`
- Review file: `tasks/reviews/20260702-2047-chart-golden-set.review.md`
- Implementation notes file: `tasks/notes/20260702-2047-chart-golden-set.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260702-2047-chart-golden-set.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260702-2047-chart-golden-set.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: 纯新增 packages/chart-golden-set 包与根 package.json 一行 script 及 lockfile;revert 提交即完全回滚,无数据/部署面
- **Verification boundary**: 两次 generate 运行 manifest 哈希一致且退出码 0;jq 断言样本数=100、七类变体维度覆盖、回归样本存在;npx vitest run packages/chart-golden-set;repo-harness run verify-contract --strict
- **Review/acceptance boundary**: `tasks/reviews/20260702-2047-chart-golden-set.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260702-2047-chart-golden-set.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260702-2047-chart-golden-set.contract.md`, `tasks/reviews/20260702-2047-chart-golden-set.review.md`, and `tasks/notes/20260702-2047-chart-golden-set.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260702-2047-chart-golden-set.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: 纯新增 packages/chart-golden-set 包与根 package.json 一行 script 及 lockfile;revert 提交即完全回滚,无数据/部署面

## Captured Planning Output

# golden set 生成器 CLI(Sprint 任务 2 / PRD Module 2)

## 目标与验收

新建工程面 CLI `packages/chart-golden-set`,确定性生成 100 张 K 线截图变体 + 逐样本真值 manifest(渲染参数即 ground truth),为任务 3 评测 runner 提供数据资产。

机器验收(sprint backlog 行 2 原文):生成命令连续运行两次 manifest 内容哈希一致且退出码 0;`jq` 断言样本数 =100、变体维度覆盖 PRD §18.1 七类、含 ≥1 张带 end_time/RSI(14)/MACD(12,26,9)/画线锚点真值的回归样本。

## 前置条件(硬依赖)

- **任务 1 已合回 main**(`git merge --ff-only codex/chart-parse-contract`):truth labels 的 timeframe/indicator/pattern/坐标语义必须 import `@aiphabee/agent-runtime/chart-parse` 枚举,禁止复制枚举(防漂移)。本 plan 捕获后**不得开工实现**,直到 merge 完成。

## 尽调

### P1 map

- 落点:新包 `packages/chart-golden-set`(bin CLI + src),职责独立于 data-ingest(HKEX 新闻管线);治理语义镜像 `packages/data-ingest/bin/data-ingest.mjs`(已核:exit codes 表 :61-69、单文档 JSON stdout `emit` :2045、`stableHash` sha256 :1815、`--local-contract` 离线模式 :2032)。
- 数据真值:仓库无可用行情数据(golden fixtures 仅 2 根 bar,`SYNTHETIC_PRICE_HISTORY` 仅 4 根;渲染一张图需 60+ 根蜡烛)→ OHLCV 必须由 seeded 确定性合成器生成。
- 图像基建:仓库零 chart/canvas 依赖、tests/ 无图像 fixture、无 git LFS → 图像产物不入 git,只提交 manifest+truth。
- Python 先例存在(data-ingest scrapy,spawnSync、不进 CI)但本方案不需要。

### P2 trace(生成→消费路径)

`chart-golden-set generate --seed <n> --count 100 --out runtime/chart-golden-set/` → seeded PRNG 合成 OHLCV(含形态注入片段)→ 按变体矩阵组装 ECharts option(theme/style/language/info_missing 由参数控制)→ `echarts.init(null,null,{ssr:true,renderer:'svg'})` 渲 SVG → `convertToPixel` 计算画线 anchor 像素 → /width,/height 得 0-1 归一化真值(origin top-left,与 chart-parse 契约坐标声明一致)→ `@resvg/resvg-js`(pin 字体文件)转 PNG → degradation 变体经 `@napi-rs/canvas` 降采样/JPEG 低质量再编码 → manifest 逐样本落 `{id, image_path, image_sha256, truth, variant_dims}` → `tests/golden/chart-parse/manifest.json`(提交)。任务 3 评测 runner 按 manifest sample id 回放。压力点:任何非确定源(时间戳、Math.random、字体回退、并行顺序)都会破坏两次运行哈希一致——全链路禁用。

### P3 decision rationale

- **引擎选 ECharts 6.1.0 SSR + @resvg/resvg-js,弃 mplfinance(PRD open decision 收敛)**:研究 agent 实测闭环——`ssr:true` 无 DOM 下 `convertToPixel` 返回精确像素([345,201.5]),独立进程两次渲染 SHA-256 一致;纯 npm 与 TS monorepo 同进程共享 chart-parse 类型。mplfinance 虽是 arXiv 2604.12659 参考管线,但 0.12.10b0(beta)自 2023-08 停更(Snyk Inactive),且给 TS monorepo 引入 Python/uv/CJK 字体边车,CI 复杂度高。lightweight-charts 需浏览器、确定性最弱,排除。mplfinance 保留为后期"风格多样性第二引擎"选项(PRD Freedoms),不进本任务。
- **OHLCV 用 seeded synthetic 合成器,不打行情 API**:两次运行哈希一致是验收硬线,live API 结构性违背;仓库也无足量真实数据。PRD"公开行情数据"是 Recommended Default,让位于确定性 hard constraint。`--source synthetic` 为默认并留出未来 snapshot 源接口(仅接口,不实现)。合成器 = 确定性 PRNG(splitmix/mulberry 类,种子记入 manifest)驱动 random walk + 参数化形态片段注入(形态种类即 patterns 真值)。
- **图像不入 git**:100 张 PNG(~10MB+)且无 LFS;确定性生成器本身就是"图像的源码"。manifest(含每张 image_sha256)提交到 `tests/golden/chart-parse/`,图像写 `runtime/chart-golden-set/`(runtime/ 已在 .gitignore)。任何环境重跑生成器即可按哈希校验重建。
- **字体 pin 进包**(`assets/fonts/`,Noto Sans + Noto Sans SC subset,OFL):resvg `fontFiles` 显式加载,消除系统字体差异——中英文变体跨机确定的前提。SSR 文本宽度为估算值的已知限制不伤真值链路:标签**内容**即真值,像素级文本对齐不是真值字段;唯一需要像素精度的 anchor 走 convertToPixel(数据坐标变换,与文本无关)。
- **变体七类矩阵**(压缩父 PRD §18.1 九 bullet,与 sprint 验收"七类"对齐):`theme`(light/dark)、`platform_style`(2-3 个 ECharts 布局 preset)、`timeframe_class`(分钟/小时/日/周)、`degradation`(none/downscale/jpeg_artifact)、`language`(zh/en)、`annotations`(none/trendline/horizontal_line/rectangle)、`info_missing`(none/no_symbol/no_timeframe/no_axes)。100 样本用确定性加权组合覆盖每类每值 ≥1;`info_missing≠none` 子集即任务 3 的 null-over-guess 负例集;≥1 张回归样本固定含 end_time + RSI(14) + MACD(12,26,9) + 画线锚点全真值(验收行硬点)。
- **truth 结构复用 chart-parse 契约枚举**:import `TIMEFRAME_VALUES`/`INDICATOR_NAME_VALUES`/`CHART_PATTERN_VALUES` 等,truth 的形状即 ChartParseResult 的"应然值"投影(无 confidence 字段)。这是任务 1 merge 前置的根本原因。
- **CLI 子命令**:`generate`(产出)+ `validate`(对既有输出重算哈希与不变量,渲染参数与标签一致性校验失败 → exit 60 invariantViolation;镜像 data-ingest validate 语义)。exit codes 复用 data-ingest 表(0/40/50/60)。
- **golden_set_samples DB 表不在本任务**:验收只到 manifest 文件;落库(platform 表)推迟到任务 3 评测 runner 需要时一并处理,manifest sample id 已为稳定引用。

## 设计

### 文件布局(全部新增)

| 文件 | 内容 |
|------|------|
| `packages/chart-golden-set/package.json` | `@aiphabee/chart-golden-set`;deps:`echarts@^6.1.0`、`@resvg/resvg-js@^2.6.2`、`@napi-rs/canvas@^1.0.2`、`@aiphabee/agent-runtime`(file:);bin `chart-golden-set` |
| `packages/chart-golden-set/tsconfig.json` | 对齐 data-ingest(types: node, vitest) |
| `packages/chart-golden-set/bin/chart-golden-set.mjs` | CLI 入口:generate/validate 分发、参数解析、emit(单文档 JSON + exit code) |
| `packages/chart-golden-set/src/prng.ts` | 确定性 PRNG(seed → 数值流),禁 Math.random/Date.now |
| `packages/chart-golden-set/src/synthetic-ohlcv.ts` | seeded random walk + 形态片段注入(返回 bars + 注入形态真值) |
| `packages/chart-golden-set/src/variant-matrix.ts` | 七类维度矩阵 + 100 样本确定性组合(含固定回归样本 spec) |
| `packages/chart-golden-set/src/render.ts` | ECharts SSR option 组装、convertToPixel anchor 计算、resvg PNG、degradation 链路 |
| `packages/chart-golden-set/src/manifest.ts` | manifest 组装、stableHash、truth 组装(import chart-parse 枚举) |
| `packages/chart-golden-set/src/*.test.ts` | 小样本(2-3 张)确定性/真值一致性/负例结构 vitest 断言 |
| `packages/chart-golden-set/assets/fonts/` | Noto Sans + Noto Sans SC subset(OFL,附 LICENSE) |
| `tests/golden/chart-parse/manifest.json` | 100 样本 manifest(generate 产物,提交) |
| `package.json`(根) | workspaces 自动覆盖;新增 `check:chart-golden-set` script(两次生成哈希一致 + jq 断言) |

### manifest 形状

```jsonc
{
  "set_version": "<date>.chart-golden-set.v1",
  "generator_version": "<date>.chart-golden-set-generator.v1",
  "seed": 20260702,
  "sample_count": 100,
  "render_engine": { "echarts": "6.1.0", "resvg": "2.6.2" },
  "samples": [{
    "id": "cgs-000",
    "image_path": "runtime/chart-golden-set/cgs-000.png",
    "image_sha256": "…",
    "variant_dims": { "theme": "dark", "platform_style": "…", "timeframe_class": "…", "degradation": "…", "language": "zh", "annotations": "…", "info_missing": "none" },
    "truth": { "chart_type": "candlestick", "symbol": "0700.HK", "exchange": "HKEX", "timeframe": "1d", "end_time": "2026-06-30", "indicators": [{"name":"RSI","params":[14]}], "drawn_lines": [{"kind":"trendline","anchors":[{"x":0.12,"y":0.80},…]}], "patterns": ["ascending_triangle"] }
  }]
}
```

- `info_missing` 样本的对应 truth 字段为 null(评测负例期望值)。
- 两次运行哈希一致的实现约束:样本按 id 固定顺序单进程生成(实测 fresh-process 字节一致;同进程 ECharts 内部计数器按固定顺序亦稳定),manifest 序列化 key 排序。

## 边界与风险

- **不做**:golden_set_samples DB 迁移、R2 上传、评测 runner(任务 3)、mplfinance 第二引擎、真实行情 snapshot 源(仅留接口)、两段式裁切变体。
- **最脆弱假设**:ECharts SSR 输出跨"同机重跑"确定(已实测)但**跨 echarts 版本必然漂移**——manifest 记录引擎版本,升级 echarts = set_version bump + 全量重生成(与 PRD"版本漂移即失效"机制同构)。
- **依赖失败面**:@resvg/resvg-js(2024-03 后未更新)与 @napi-rs/canvas 均为 native binding,Node 22 darwin/linux 预编译产物已验证存在;若安装失败,降级路径 = degradation 链路改用 resvg fitTo 纯 PNG(损失 JPEG 伪影变体,矩阵降为 6 类 + downscale)。
- **回滚面**:纯新增包 + 根 package.json 一行 script + lockfile;revert 即回滚,无数据/部署面。
- **10x 视角**:1000 样本时单进程顺序生成变慢(分钟级)——manifest 分片与并行子进程(每进程独立 ECharts 实例)是后续扩容路径,不进 v1。

## Task Breakdown

- [x] 前置门:确认 `codex/chart-parse-contract` 已 ff-merge 进 main(`git merge-base --is-ancestor` 校验),否则停止
- [x] 脚手架:`packages/chart-golden-set` 包骨架 + 依赖安装 + 字体资产(含 OFL LICENSE)
- [x] RED:小样本确定性/truth 一致性/负例结构 vitest 断言(先失败)
- [x] GREEN:prng / synthetic-ohlcv / variant-matrix / render / manifest + CLI generate/validate
- [x] 生成 100 样本 manifest 入 `tests/golden/chart-parse/`;连续两次运行哈希一致 + jq 三断言通过;根 `check:chart-golden-set` script 接入
- [x] `/check` 自审 + Codex 跨模型外审,修复 findings 并记录 review
- [ ] `contract-worktree finish` 合回 + 回填 sprint backlog 行 2

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] 前置门:确认 `codex/chart-parse-contract` 已 ff-merge 进 main(`git merge-base --is-ancestor` 校验),否则停止
- [x] 脚手架:`packages/chart-golden-set` 包骨架 + 依赖安装 + 字体资产(含 OFL LICENSE)
- [x] RED:小样本确定性/truth 一致性/负例结构 vitest 断言(先失败)
- [x] GREEN:prng / synthetic-ohlcv / variant-matrix / render / manifest + CLI generate/validate
- [x] 生成 100 样本 manifest 入 `tests/golden/chart-parse/`;连续两次运行哈希一致 + jq 三断言通过;根 `check:chart-golden-set` script 接入
- [x] `/check` 自审 + Codex 跨模型外审,修复 findings 并记录 review
- [ ] `contract-worktree finish` 合回 + 回填 sprint backlog 行 2
