# Codex Handoff — 执行分支收敛（Branch Convergence）

> **Date**: 2026-06-23 · **For**: Codex（执行者）· **By**: Planner
> **真值文档**: `docs/governance/branch-convergence-plan.md`（PR #13）。先完整读它；本 handoff 只做编排与守则。
> **决策记录**: Sprint Tracker §G（base=`main`）。

## 你的任务
把分叉的 codex sprint 栈收敛到 `main`，并为 `core→platform` schema 收敛做准备。

## 当前事实（执行前用 gh/git 自行核实，勿信记忆）
- 基线已定 = `main`。`main` = research-os-shell 真前端（`apps/web/src/lib/api/*` 真 API 层 + 16 嵌套 route）+ PR #12 `platform.*` umbrella schema（已 merge）。
- 仍 open 的分叉栈：PR #4–#9、#11（mock 前端 + governance，stacked）。#10=fastclaw 文档（无关，勿动）。#13=收敛计划。
- 两套重复身份模型：`core.account/workspace/entitlement/subscription` vs `platform.*`。当前**无 live 数据**——收敛是纯 DDL + 改引用。

## 硬性守则（违反即停）
1. **每个任务用独立 worktree off `origin/main`**：`git worktree add -b <branch> <path> origin/main`。**绝不动主 checkout 的脏树或其它 codex 分支工作区。**
2. **一个任务一个小而单一职责的 PR。**
3. **任何 PR 都不许自动 merge；schema/platform/migration 类 PR 必须等人工 review。**（PR #12 曾被自动 merge——不要重演。）
4. **不要把 mock 前端合进 `main`**：#4–#8 是 **CLOSE**，不是 merge。
5. **所有新工作基于 `main`**，不要再延长分叉的 sprint 栈。
6. **回报必须反映真实 gh 状态**（`gh pr view/list` 的 state/mergeable/open 列表），不许报 stale 的 OPEN/MERGED。
7. 遇歧义或需决策 → **停下回报**，不要自己选方向或开新 scaffold。

## 执行顺序

### 步骤 1 — Salvage #8 的 DS a11y 到 main（小 PR）
- 从 `codex/sprint-3-2-wcag-frontend-audit`(#8) **只**取与 main 共用 DS 相关的 a11y diff：`apps/web/src/ds/ScoreMeter.tsx`（progressbar 语义）、`apps/web/src/ds/styles/aiphabee.css`（focus-visible / forced-colors）、`apps/web/src/routes/__root.tsx`（skip-link / aria-current）、必要时 `ds/Card.tsx`。
- **不要**带 mock route（`analysis.tsx` 等）。
- 验收：`npm run typecheck --workspace @aiphabee/web`、web 测试、`npm run build --workspace @aiphabee/web` 全过。开 PR，等人审。

### 步骤 2 — 抽取 frontend-agnostic governance 并入 main（一个 PR）
- 新分支 off main。把 main 缺、且与前端无关的 governance + checker 带过来：`sprint-completion-audit`、`sprint-exit-gate-transition-review`(+fixtures)、`current-release-readiness`、`p0-open-requirement-transition-review`、`mcp-target-client-live-e2e-transition-review`、`live-smoke-*`（capture-artifacts / evidence-ledger / ledger-update-review / operator-run-plan / capture-templates）、`scripts/create-live-smoke-capture-packet.mjs`、全部 `scripts/check-live-smoke-*` 与 fixtures、`package.json` 的 `check:*` 入口。
- **不要带** `deploy/governance/frontend-release-evidence-packets/*` 的 6 个 packet（验证的是 mock UI，作废）。把 exit-gate-review 里绑定这些 mock surface 的部分改写为 `frontend_evidence: pending_recapture_on_main`。
- 验收：`npm run check` 全绿、`npm run check:database` migrations 计数不变。开 PR，等人审。

### 步骤 3 — 关闭 #9、#11
- 确认步骤 2 已覆盖它们的 governance（无遗漏），然后 close #9、#11，comment 指向 PR #13 与步骤 2 的抽取 PR。

### 步骤 4 — 关闭 #4–#8（mock 前端被取代）
- 关每个 PR 前，**先核对 main 真前端是否覆盖该特性**：analysis→`compare`/`screen`/`stock`；research→`library`/`documents`；developer-console→`mcp`（**重点核：main 可能没有完整开发者控制台，是真缺口**）；ask→`ask/`。
- 若某特性 main 确实缺（尤其开发者控制台）→ 把规格/意图记进 `tasks/todos.md`（带 PRD 需求 ID），**别丢需求**；再 close PR，comment 指向 PR #13。

### 步骤 5 — 仅准备，不合并：`core→platform` 收敛（DRAFT PR）
- 按计划 §3 已锁决策起草一个迁移：
  - **A**：新建 `platform.subscription_plan` / `platform.workspace_subscription`，`core.subscription_*` 迁入；`audit.subscription_lifecycle_event` 外键改指 `platform.*`，事件表移到 `aiphabee_audit`。
  - **B**：一次性把 `core.*` 拆成 `platform.*`（身份+订阅）+ `aiphabee_*`（`aiphabee_core` / `aiphabee_governance` / `aiphabee_audit`），同步改全部 runtime 引用（`@aiphabee/account-runtime` / `usage-ledger` / `mcp-runtime` 等 + 散落 migration）。
- `npm run check` / `check:database` 自检通过后，**开 DRAFT PR 并停下**。明确写："等人工 review + RLS 跨产品隔离 review，不可自动 merge"。

## 验收（每步）
`npm run check`、`npm run check:database`、`gh pr checks <n>`；触前端的步骤额外跑 web typecheck/test/build。

## 回报格式（每步完成后）
- 做了什么 + PR 链接 + **真实 gh 状态**（state / mergeable / CI）。
- 哪些被 close、哪些等人审。
- 记进 todos 的特性缺口（若有）。
- 建议的下一刀。

## 明确不做
- 不动 PR #10（fastclaw）/ sidecar 新项目（`aimpact-new` / `salesko-new`）。
- 不做合规/基线决策（已定，见 §G）。
- 不开新 scaffold/feature 方向。
- 步骤 5 的 schema PR 不许自合。
