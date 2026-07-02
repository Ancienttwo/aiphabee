> **Archived**: 2026-07-02 22:08
> **Related Plan**: plans/archive/plan-20260702-2047-chart-golden-set.md
> **Outcome**: Completed
> **Lifecycle**: contract
> **Parent Run ID**: run-20260702-2208

# Task Contract: chart-golden-set

> **Status**: Fulfilled
> **Plan**: plans/plan-20260702-2047-chart-golden-set.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-02 21:09
> **Review File**: `tasks/reviews/20260702-2047-chart-golden-set.review.md`
> **Notes File**: `tasks/notes/20260702-2047-chart-golden-set.notes.md`

## Goal

新建工程面 CLI `packages/chart-golden-set`(PRD Module 2 / sprint 任务 2):确定性生成 100 张 K 线截图变体 + 逐样本真值 manifest(渲染参数即 ground truth)。ECharts 6.1 SSR(SVG)+ @resvg/resvg-js 转 PNG + @napi-rs/canvas 降质变体;OHLCV 由 seeded synthetic 合成器生成;truth labels 必须 import `@aiphabee/agent-runtime/chart-parse` 枚举(禁复制);图像写 gitignored `runtime/chart-golden-set/`,manifest(含每样本 image_sha256)提交 `tests/golden/chart-parse/`。验收:生成命令连续两次运行 manifest 内容哈希一致且退出码 0;jq 断言样本数=100、七类变体维度覆盖、含 ≥1 张带 end_time/RSI(14)/MACD(12,26,9)/画线锚点真值的回归样本。

## Scope

- In scope: `packages/chart-golden-set/` 全部新文件(bin CLI + src 模块 + vitest 测试 + assets/fonts 字体资产含 OFL LICENSE + 包内验收脚本);`tests/golden/chart-parse/manifest.json` 生成产物;根 `package.json` 新增 `check:chart-golden-set` script;`package-lock.json` 刷新;`.gitignore` 新增 `/runtime/` 规则(图像产物不入 git,worktree 基点的 .gitignore 尚无此规则);sprint backlog 行 2 回填。
- Out of scope: golden_set_samples DB 迁移、R2 上传、评测 runner(任务 3)、tool 运行时(任务 4)、mplfinance 第二引擎、真实行情 snapshot 源(仅留接口)、`packages/agent-runtime` 一概不动。

## Workflow Inventory

- Source plan: `plans/plan-20260702-2047-chart-golden-set.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260702-2047-chart-golden-set.review.md`
- Notes file: `tasks/notes/20260702-2047-chart-golden-set.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260702-2047-chart-golden-set.contract.md
  - tasks/reviews/20260702-2047-chart-golden-set.review.md
  - tasks/notes/20260702-2047-chart-golden-set.notes.md
  - packages/chart-golden-set/
  - tests/golden/chart-parse/
  - package.json
  - package-lock.json
  - .gitignore
```

## Delegation Contract

```yaml
delegation:
  budget:
    tokens: null
    tool_calls: null
    wall_time_minutes: null
  permission_scope:
    mode: inherit_allowed_paths
    writable_paths: []
    network: inherited
  roles:
    parent:
      mode: narrate_and_gatekeep
      purpose: approval_checkpoint_owner
    explorer:
      mode: read_only
      purpose: codebase_research
    worker:
      mode: edit_within_allowed_paths
      purpose: implementation
    verifier:
      mode: read_only
      purpose: exit_criteria_review
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - packages/chart-golden-set/package.json
    - packages/chart-golden-set/bin/chart-golden-set.mjs
    - packages/chart-golden-set/src/prng.ts
    - packages/chart-golden-set/src/synthetic-ohlcv.ts
    - packages/chart-golden-set/src/variant-matrix.ts
    - packages/chart-golden-set/src/render.ts
    - packages/chart-golden-set/src/manifest.ts
    - packages/chart-golden-set/assets/fonts/LICENSE
    - tests/golden/chart-parse/manifest.json
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260702-2047-chart-golden-set.notes.md
  commands_succeed:
    - npx vitest run packages/chart-golden-set
    - npm run typecheck --workspace @aiphabee/chart-golden-set
    - npm run check:chart-golden-set
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: `chart-golden-set generate` 两次运行产出字节一致 manifest;`validate` 对既有产物重算哈希与参数-标签一致性,违背 → exit 60。
- Edge cases: `info_missing≠none` 样本对应 truth 字段为 null(任务 3 null-over-guess 负例);degradation 变体不改 truth,只改图像;字体 pin 消除跨机文本差异。
- Regression risks: 纯新增包,零存量代码改动;echarts/resvg 版本升级会破坏哈希 → manifest 记引擎版本,升级 = set_version bump + 全量重生成。

## Rollback Point

- Commit / checkpoint: worktree 基点 `a83d0df`(PR #18 merge commit)。
- Revert strategy: 纯新增 `packages/chart-golden-set` 包 + `tests/golden/chart-parse/` + 根 package.json 一行 script 及 lockfile;revert 提交即完全回滚,无数据/部署面。
