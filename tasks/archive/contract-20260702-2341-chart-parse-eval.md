> **Archived**: 2026-07-02 23:41
> **Related Plan**: plans/archive/plan-20260702-2305-chart-parse-eval.md
> **Outcome**: Completed
> **Lifecycle**: contract
> **Parent Run ID**: run-20260702-2341

# Task Contract: chart-parse-eval

> **Status**: Fulfilled
> **Plan**: plans/plan-20260702-2305-chart-parse-eval.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-02 23:10
> **Review File**: `tasks/reviews/20260702-2305-chart-parse-eval.review.md`
> **Notes File**: `tasks/notes/20260702-2305-chart-parse-eval.notes.md`

## Goal

交付 sprint 行 3(评测 runner + 校准 CLI,PRD Module 3):新包 `packages/chart-parse-eval` 提供 `run`(评测)与 `calibrate`(校准)两个 CLI 子命令;runner JSON 输出含 `schema_compliance`/`field_matrix`/`null_negative` 三键并经 EvalSink 写入 `eval_runs`+`eval_sample_results`(fixture 断言逐样本可回放);样本不足 fixture 下 calibrate 输出 `insufficient` 且不产 thresholds;产出的 calibration run 含 schema/prompt/model 三版本与 sample_count;三表迁移 SQL 落 `deploy/database/migrations/` 并登记 `migrations.contract.json`。

## Scope

- In scope: `packages/chart-parse-eval/` 整包(src/bin/scripts/tsconfig/package.json);迁移 `20260703001000_chart_parse_eval_foundation.sql` 与 contract 登记;根 `package.json` 新增 `check:chart-parse-eval` script 与 lockfile;plan Task Breakdown 与 tasks 三件套回填。
- Out of scope: 真 vision provider 调用与选型(Module 4)、`golden_set_samples` 表、R2 上传、promptfoo/OpenAI Evals、逐字段 isotonic、FR-01 路由消费(Module 5)、CI 接线新 check script、远端数据库 apply。

## Workflow Inventory

- Source plan: `plans/plan-20260702-2305-chart-parse-eval.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260702-2305-chart-parse-eval.review.md`
- Notes file: `tasks/notes/20260702-2305-chart-parse-eval.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - packages/chart-parse-eval/
  - deploy/database/migrations/
  - deploy/database/migrations.contract.json
  - package.json
  - package-lock.json
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260702-2305-chart-parse-eval.contract.md
  - tasks/reviews/20260702-2305-chart-parse-eval.review.md
  - tasks/notes/20260702-2305-chart-parse-eval.notes.md
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
    - packages/chart-parse-eval/src/cli.ts
    - packages/chart-parse-eval/bin/chart-parse-eval.mjs
    - packages/chart-parse-eval/scripts/check-eval.sh
    - deploy/database/migrations/20260703001000_chart_parse_eval_foundation.sql
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260702-2305-chart-parse-eval.notes.md
  commands_succeed:
    - npx vitest run packages/chart-parse-eval
    - npm run check:chart-parse-eval
    - npm run check:database
    - npm run typecheck
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: `run --fixture` 对 manifest 全样本回放出三键指标与逐样本行;双跑产物字节一致(工件 sha256 相等);fixture 声明的 schema/prompt 版本与 CHART_PARSE_CONTRACT 漂移 → exit 40;fixture 样本覆盖缺口 → exit 60。`calibrate --run-artifact` 样本不足 → `insufficient` 无 thresholds;充足 → calibration run 含三版本+sample_count,thresholds 全部数据导出。
- Edge cases: error_code 样本计入 schema_compliance 分母;非负例样本 `null_negative_pass=null`;tier 目标不可达 → status=draft 且 thresholds=null(自动路由保持阻断);anchor 容差旗标化(默认 0.05)并回写工件。
- Regression risks: 迁移 SQL 触发 `check:database` 禁词/登记校验(裸 token/secret/password 禁词,`token_cost` 列名安全);根 check script 不进 CI(与 check:chart-golden-set 先例一致);评测测试不得依赖磁盘图像字节(CI 无 runtime/ 图像)。

## Rollback Point

- Commit / checkpoint: 分支 `codex/chart-parse-eval` 基点 `402e547`(PR #19 merge 后的 main)。
- Revert strategy: 纯新增包 + 未应用迁移 SQL 与登记条目 + 根 package.json 一行 script + lockfile;revert 提交(或弃分支)即完全回滚,无已部署数据面(迁移账本 status=local_contract)。
