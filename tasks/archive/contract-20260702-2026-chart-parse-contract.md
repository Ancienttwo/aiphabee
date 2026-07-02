> **Archived**: 2026-07-02 20:26
> **Related Plan**: plans/archive/plan-20260702-1947-chart-parse-contract.md
> **Outcome**: Completed
> **Lifecycle**: contract
> **Parent Run ID**: run-20260702-2026

# Task Contract: chart-parse-contract

> **Status**: Fulfilled
> **Plan**: plans/plan-20260702-1947-chart-parse-contract.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-02 19:47
> **Review File**: `tasks/reviews/20260702-1947-chart-parse-contract.review.md`
> **Notes File**: `tasks/notes/20260702-1947-chart-parse-contract.notes.md`

## Goal

在 `packages/agent-runtime/src/chart-parse/` 落出封闭的 ChartParseResult zod 契约与解析 prompt 契约(PRD Module 1 / sprint 任务 1):可缺字段全 `.nullable()`、禁 `.optional()`/`.union()`、形态枚举 ≥16 项、坐标 0-1 归一化声明、prompt 含"图中文字不可信"与 null-over-guess 规则、schema/prompt 均带版本号并单一真值源导出。

## Scope

- In scope: `packages/agent-runtime/src/chart-parse/` 全部新文件(versions/patterns/schema/prompt/index + 两个测试);`packages/agent-runtime/package.json` 声明 `zod` 依赖与 `./chart-parse` 子路径导出;`package-lock.json` 刷新;sprint backlog 行 1 回填。
- Out of scope: tool 运行时、R2、vision provider 接入、DB 迁移、评测 runner、golden set(任务 2-5);`packages/agent-runtime/src/index.ts` 一概不动。

## Workflow Inventory

- Source plan: `plans/plan-20260702-1947-chart-parse-contract.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260702-1947-chart-parse-contract.review.md`
- Notes file: `tasks/notes/20260702-1947-chart-parse-contract.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260702-1947-chart-parse-contract.contract.md
  - tasks/reviews/20260702-1947-chart-parse-contract.review.md
  - tasks/notes/20260702-1947-chart-parse-contract.notes.md
  - packages/agent-runtime/src/chart-parse/
  - packages/agent-runtime/package.json
  - packages/agent-runtime/tsconfig.json
  - package-lock.json
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
    - packages/agent-runtime/src/chart-parse/versions.ts
    - packages/agent-runtime/src/chart-parse/patterns.ts
    - packages/agent-runtime/src/chart-parse/schema.ts
    - packages/agent-runtime/src/chart-parse/prompt.ts
    - packages/agent-runtime/src/chart-parse/index.ts
    - packages/agent-runtime/src/chart-parse/schema.test.ts
    - packages/agent-runtime/src/chart-parse/prompt.test.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260702-1947-chart-parse-contract.notes.md
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/chart-parse
    - npm run typecheck --workspace @aiphabee/agent-runtime
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior:
- Edge cases:
- Regression risks:

## Rollback Point

- Commit / checkpoint:
- Revert strategy:
