> **Archived**: 2026-07-03 00:51
> **Related Plan**: plans/archive/plan-20260703-0018-chart-parse-tool.md
> **Outcome**: Completed
> **Lifecycle**: contract
> **Parent Run ID**: run-20260703-0051

# Task Contract: chart-parse-tool

> **Status**: Fulfilled
> **Plan**: plans/plan-20260703-0018-chart-parse-tool.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-03 00:18
> **Review File**: `tasks/reviews/20260703-0018-chart-parse-tool.review.md`
> **Notes File**: `tasks/notes/20260703-0018-chart-parse-tool.notes.md`

## Goal

交付 sprint 行 4(parse_chart_image tool 运行时,PRD Module 4):`@aiphabee/agent-runtime` 新增 `parse-chart-image` 子路径,提供依赖注入 executor(imageRef → 字节 → generateObject(vision) → zod 二次校验 → sink 落 `chart_parse_results` 行)、AI Gateway openai-compatible provider 装配(显式 `supportsStructuredOutputs: true`)、jsonrepair 修复 + 模型重调 ≤1 的降级状态机(仍失败 → status=parse_failed 不返回半成品)、AI SDK v7 `tool()` 包装;apps/worker 增 token 门 live-smoke 路由完成装配;`chart_parse_results` 表迁移落 `deploy/database/migrations/` 并登记。清晰样本 fixture 返回过 zod 校验的 ChartParseResult 且行仅存 imageRef 无图像字节;坏 JSON fixture 断言模型重调 ≤1 次后 parse_failed。

## Scope

- In scope: `packages/agent-runtime/src/parse-chart-image/`(新目录)与 `packages/agent-runtime/package.json`(exports 子路径 + jsonrepair 依赖);`apps/worker/src/index.ts`(binding token + R2 字节读取扩展 + live-smoke 路由)与 `apps/worker/src/index.test.ts`;迁移 `20260703003000_parse_chart_image_runtime.sql` 与 contract 登记;根 lockfile;plan Task Breakdown 与 tasks 三件套回填。
- Out of scope: tool-registry 登记、主 agent loop(DeepSeek)集成、上传路由与 `chart_images` 表、FR-01 路由消费(Module 5)、预缩放实现、Hyperdrive/pg 生产写入 wire、真模型 fixture 录制脚本、既有 release-gate scaffold 标记翻转、远端数据库 apply。

## Workflow Inventory

- Source plan: `plans/plan-20260703-0018-chart-parse-tool.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260703-0018-chart-parse-tool.review.md`
- Notes file: `tasks/notes/20260703-0018-chart-parse-tool.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - packages/agent-runtime/
  - apps/worker/
  - deploy/database/migrations/
  - deploy/database/migrations.contract.json
  - package.json
  - package-lock.json
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260703-0018-chart-parse-tool.contract.md
  - tasks/reviews/20260703-0018-chart-parse-tool.review.md
  - tasks/notes/20260703-0018-chart-parse-tool.notes.md
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
    - packages/agent-runtime/src/parse-chart-image/executor.ts
    - packages/agent-runtime/src/parse-chart-image/provider.ts
    - packages/agent-runtime/src/parse-chart-image/tool.ts
    - deploy/database/migrations/20260703003000_parse_chart_image_runtime.sql
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260703-0018-chart-parse-tool.notes.md
  commands_succeed:
    - npx vitest run packages/agent-runtime apps/worker
    - grep -rn "supportsStructuredOutputs: true" packages/agent-runtime/src
    - npm run check:database
    - npm run typecheck
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: executor 对清晰样本 fixture(mock model 返回合法输出)产出过 `safeParseChartParseResult` 的 ChartParseResult,sink 行含 image_ref 字符串与契约冻结三版本、`calibration_run_id=null`、无任何图像字节字段;坏 JSON fixture 断言模型调用数 === 2(初次 + 重调 1)且最终 status=parse_failed、result 为 null;可修复坏 JSON(jsonrepair 命中)断言调用数 === 1 且 status=ready(修复先于重调);fetchImage 返回 null 时不调模型直接 parse_failed(error_code=image_not_found)。
- Edge cases: generateObject 成功对象仍需过 zod 二次校验(不信 provider 宽松);NoObjectGeneratedError 携带的 raw text 进 jsonrepair;usage 缺省时 token_cost 记 0 不 NaN;smoke 路由未授权 401、缺 env 4xx JSON、响应不含图像字节。
- Regression risks: 迁移 SQL 过 `check:database` 禁词/登记校验(注释避裸词,字面 default_deny);`RuntimeR2Bucket` 扩展必须向后兼容(可选方法,既有调用零改动);agent-runtime 既有 scaffold 测试(index.test.ts)与 worker 既有路由测试不得受新导出影响;新依赖 jsonrepair 纯 JS 无 native 绑定。
- Semantics: "重试 ≤1" 读作模型重调 ≤1(共 ≤2 次调用),jsonrepair + zod 是每回合本地修复兜底;`degraded` 枚举建在表 check 但 v1 executor 不产出(plan P3-D2 记录该决策)。

## Rollback Point

- Commit / checkpoint: 分支 `codex/chart-parse-tool` 基点 `1412927`(PR #20 merge 后的 main)。
- Revert strategy: agent-runtime 一个新目录 + exports/依赖各一行 + worker 一路由一 binding + 未应用的迁移 SQL 与登记条目 + lockfile;revert 提交(或弃分支)即完全回滚,无已部署数据面(迁移账本 status=local_contract)。
