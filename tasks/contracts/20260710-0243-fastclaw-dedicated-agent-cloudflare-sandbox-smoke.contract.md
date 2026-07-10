# Task Contract: fastclaw-dedicated-agent-cloudflare-sandbox-smoke

> **Status**: Fulfilled
> **Plan**: plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-10 04:14
> **Review File**: `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md`
> **Notes File**: `tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

付费用户专属 FastClaw Agent 只有在实际 tool execution 经过隔离 sandbox、授权不泄漏、sandbox 必然销毁且成本可估算时才具备可部署性。若跳过该 slice，现有设计只能证明 Agent control-plane contract，不能证明 FastClaw 的真实工具路径受 Cloudflare Sandbox 约束；若实现错误，最坏结果是跨用户执行、credential 泄漏或 orphan sandbox 持续计费。

## Goal

交付一个 fail-closed 的 staging/smoke 闭环：AiphaBee provision FastClaw app user 与专属 agent，签发 identity-bound run-scoped HMAC token，FastClaw 经既有 `sandbox.Executor` seam 调用独立 Cloudflare Sandbox Bridge 完成 artifact write/read/hash；AiphaBee 以结构化 exec receipt + 直接 artifact readback 为 authority evidence，并作为唯一 cleanup owner 在 finally 销毁；deterministic tests 全通过，live credentials 不存在时明确记录未运行而不是伪造成功。

## Scope

- In scope: `apps/sandbox-bridge` Worker、run token/RunGuard、AiphaBee smoke orchestrator、FastClaw `dev@c4c4194` 上的 Cloudflare Executor、deterministic integration、cost/readback 文档与 operator runbook。
- Out of scope: production `runner_remote`、production DB migration、billing/UI、真实 LLM provider、Sandbank/Boxlite fallback、公开 Agent event schema 变更。
- Taste constraints: provider failure fail closed；secret 仅存在于 request header/context；证据只记录 hash/metadata；外部 FastClaw 分支独立 review/rollback。

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.

## Falsifier

若官方 Cloudflare Bridge/Sandbox API 无法以现有 FastClaw `Executor` 的 `Exec/ReadFile/WriteFile/ListDir` 语义实现，或者必须把 credential 注入 LLM-visible params 才能工作，则该方向失效。最便宜的 proof point 是 FastClaw Cloudflare executor 对 fake Bridge 的 contract tests；失败时保持 production runner disabled，不增加 provider fallback。

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md`
- Notes file: `tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - apps/sandbox-bridge/
  - packages/sandbox-run-auth/
  - packages/agent-runtime/src/fastclaw-sandbox-smoke.ts
  - packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts
  - packages/agent-runtime/package.json
  - scripts/smoke-fastclaw-cloudflare-sandbox.ts
  - scripts/serve-fastclaw-smoke-model.mjs
  - scripts/check-fastclaw-cloudflare-sandbox-smoke-contract.mjs
  - deploy/runbooks/fastclaw-cloudflare-sandbox-smoke.md
  - docs/researches/20260709-fastclaw-sandbox-backend-selection.md
  - plans/sprints/20260703-agent-control-plane-convergence.sprint.md
  - plans/sprints/20260703-dual-agent-v2.sprint.md
  - plans/sprints/20260703-dual-agent.sprint.md
  - package.json
  - package-lock.json
  - plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md
  - tasks/todos.md
  - tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md
  - tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md
  - tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md
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
  runner:
    preferred:
      - subagent
      - codex-exec
      - main-thread
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - apps/sandbox-bridge/src/index.ts
    - apps/sandbox-bridge/src/token.ts
    - packages/agent-runtime/src/fastclaw-sandbox-smoke.ts
    - deploy/runbooks/fastclaw-cloudflare-sandbox-smoke.md
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md
  tests_pass:
    - path: apps/sandbox-bridge/src/index.test.ts
    - path: packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts
  commands_succeed:
    - npm --workspace @aiphabee/sandbox-bridge run typecheck
    - npm run check:fastclaw-cloudflare-sandbox-smoke
    - test "$(git -C /Users/ancienttwo/Projects/fastclaw-wt-aiphabee-cloudflare-sandbox merge-base c4c4194 HEAD)" = "c4c4194e58ba2343d93e938a735e699e68d0d2fa"
    - cd /Users/ancienttwo/Projects/fastclaw-wt-aiphabee-cloudflare-sandbox && go test ./internal/sandbox/... ./internal/api/... ./internal/gateway/...
  qa_scores:
    - dimension: functionality
      min: 8
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: deterministic path provisions a dedicated agent identity, emits existing run events, verifies Bridge exec receipt and direct artifact hash, destroys sandbox, and labels cost as estimate.
- Edge cases: token tamper/expiry/scope/max-calls/cross-identity run-id reuse, model-only echo, missing token, bridge timeout, destroy failure, malformed SSE, missing live credentials。
- Regression risks: FastClaw request context accidentally becomes prompt/session data；FastClaw and AiphaBee both attempt cleanup；Bridge ID can be caller-controlled；run budget consumes token cleanup window。

## Rollback Point

- Commit / checkpoint: AiphaBee branch `codex/fastclaw-dedicated-agent-cloudflare-sandbox-smoke` and FastClaw branch `codex/aiphabee-cloudflare-sandbox` before any deployment。
- Revert strategy: revert additive Bridge/smoke files and FastClaw Cloudflare backend branch; remove staging Worker/config. No production DB or data rollback exists。
