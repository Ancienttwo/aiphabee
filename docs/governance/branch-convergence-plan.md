# 分支收敛执行清单（Branch Convergence Plan）

> **Status**: 执行就绪（§3 决策已锁定 2026-06-23：A = subscription 上提 `platform.*`；B = 一次性改名 + 上提） · **Date**: 2026-06-23
> **Base**: `main` @ `65f3c21`（research-os-shell 前端 + PR #12 platform umbrella schema）
> **依据**: `docs/AiphaBee_Sprint_Tracker_v1.0.md` §G 分支基线决策（base=`main`）
> **目的**: 收掉 8 个 open 分叉 PR、把可复用 governance 并入 `main`、并把重复的 `core.*` 身份模型收敛到 `platform.*` —— 在**任何 live 数据落地之前**完成（此时迁移几乎零成本）。
> **执行纪律**: 每个 schema/migration/platform 级 PR **必须人工 review 后再 merge**（PR #12 曾被自动 merge，跨产品 RLS 是数据泄漏面）。

---

## 0. 现状（为什么要收敛）

- `main`（`65f3c21`）= **research-os-shell 真前端**（`apps/web/src/lib/api/*` 真 API 层 + 16 嵌套 route）+ **platform umbrella schema**（PR #12：`platform.*` + `platform_audit.*`，面向 AiphaBee/AIMPACT/Salesko 多产品）。
- 还挂着 **8 个 open PR（#4–#9、#11）= 分叉的 codex sprint 栈**：mock 前端（扁平 route + `mock-api.ts`）+ governance 契约，stacked chain。
- 两处重复/冲突：① **两套前端**（main 真前端 vs sprint 栈 mock 前端）；② **两套身份模型**（`core.account/workspace/entitlement` vs PR #12 的 `platform.account/workspace/entitlement`）。
- **关键时间窗**：所有表都是 scaffold、**无 live 数据**。`core.* → platform.*` 的收敛现在做 = 纯 DDL + 代码引用改名，**零数据迁移**；一旦 live 数据落地，成本指数级上升。**现在做。**

---

## 1. PR 裁决（#4–#9、#11）

> 原则：mock 前端被 `main` 真前端取代 → 关；纯 governance → 抽取并入 `main`；混合 → 抽 governance、关 PR、salvage 有用片段。

| PR | head 分支 | 内容 | 裁决 | 动作 |
|---|---|---|---|---|
| **#4** | sprint-2-1-analysis-gate | mock `analysis.tsx` + mock-api + governance(sprint-completion-audit / sprint-exit-gate / current-release-readiness + 5 checkers) + 1 frontend evidence packet | **CLOSE** | 抽取其 governance（§2）；mock UI 弃；核对 main 是否覆盖"分析工作台"特性，缺则记 backlog |
| **#5** | sprint-2-2-research-library | mock `research.tsx` + mock-api + DS Card/ui + governance(audit/exit-gate) + 1 evidence packet | **CLOSE** | 抽 governance；研究库特性映射到 main `library/` `documents/` |
| **#6** | sprint-2-3-developer-console-ui | mock `developer-console.tsx` + mock-api + governance(p0-open-req-transition + audit/exit-gate + 2 checkers) + 1 evidence packet | **CLOSE** | 抽 governance；**核对 main `mcp/index.tsx` 是否等价于"开发者控制台",若缺则 salvage 规格为 backlog**（可能是 main 真前端的缺口） |
| **#7** | sprint-1-3-agent-ask-evidence-ui | mock `ask.tsx` + mock-api + governance(p0-open-req + exit-gate) + 2 evidence packets | **CLOSE** | 抽 governance；main 已有更完整 `ask/index` + `ask/$runId`，mock 弃 |
| **#8** | sprint-3-2-wcag-frontend-audit | mock 前端 a11y + **DS 层 a11y**(ds/ScoreMeter progressbar、ds/styles focus-visible/forced-colors、__root skip-link/aria-current) + governance + wcag evidence packet | **CLOSE + SALVAGE** | **DS/`__root` 的 a11y diff 可直接 salvage 到 main**（main 共用 `apps/web/src/ds/*`）—— WCAG 工作不浪费；其余 mock route a11y 弃；抽 governance |
| **#9** | live-smoke-capture-packet-generator | **纯 governance/scripts**（live-smoke-capture-* + create-live-smoke-capture-packet.mjs），无 apps/web | **EXTRACT** | 干净 cherry-pick 并入 main |
| **#11** | live-smoke-ledger-update-review | **纯 governance/scripts**（live-smoke-evidence-ledger / ledger-update-review / capture-artifacts + current-release-readiness + checkers），无 apps/web | **EXTRACT** | 干净 cherry-pick 并入 main |

> `#10`（fastclaw-premium-tier-eval 文档）与本收敛无关，保留。
> 关 PR 不删分支（branch 仍在，governance 抽取后随时可回看）。

---

## 2. Governance 抽取集（frontend-agnostic → 并入 main）

`main` 现有 97 个 governance 契约；sprint 栈多出约 8 个 + 配套 checker，**这些与前端无关、可复用**。新建**一个**收敛分支 off `main`，把以下并入（cherry-pick 或复制后 `npm run check` 验证）：

**带过来（与前端无关）：**
- `deploy/governance/sprint-completion-audit.contract.json` + `scripts/check-sprint-completion-audit-contract.mjs`
- `deploy/governance/sprint-exit-gate-transition-review.contract.json` + checker + fixtures **（剥离其中的 mock-frontend surface 绑定 —— 见下）**
- `deploy/release-checklists/current-release-readiness.contract.json` + `scripts/check-current-release-readiness-contract.mjs`
- `deploy/governance/p0-open-requirement-transition-review.contract.json` + `scripts/check-p0-open-requirement-transition-review-contract.mjs` + `check-mcp-target-client-live-e2e-transition-review-contract.mjs`
- `deploy/governance/live-smoke-*`（capture-artifacts / evidence-ledger / ledger-update-review / operator-run-plan / capture-templates）+ `scripts/create-live-smoke-capture-packet.mjs` + 全部 `check-live-smoke-*` + fixtures
- `package.json` 对应 `check:*` 脚本入口

**不带过来（验证的是 mock UI，失效）：**
- `deploy/governance/frontend-release-evidence-packets/{comparison_screening_ui, research_library_ui, developer_console_ui, agent_ask_progress_ui, agent_evidence_card_ui, wcag_2_1_aa_audit}.evidence.json` —— 这 6 个 hash-only packet 验证的是 mock 前端，**作废**。
- exit-gate-review 里把 Sprint surface 绑到上述 mock packet 的部分 —— **改写**为指向 main `research-os-shell` 的真实 route，或暂标 `frontend_evidence: pending_recapture_on_main`。

**验收**：并入后 `npm run check` 全绿；`check:database` migrations 计数与 main 一致（含 #12 的 64）。

---

## 3. `core.* → platform.*` 身份模型收敛

PR #12 的 umbrella plan 已定布局：跨产品身份/权益进 `platform.*`，产品业务进 `aiphabee_core/aiphabee_governance/aiphabee_audit`（不再用裸 `core/governance/audit`）。映射:

| 现有 `core.*` / `audit.*` | `platform.*`（PR #12） | 收敛决策 |
|---|---|---|
| `core.account`（+region/timezone/retention/source_record_id） | `platform.account`（auth_user_id/email_hash/display_name/status） | `platform.account` 为跨产品真值；`core.account` 的产品特有列 → `aiphabee_core.account_profile`（按 account_id 关联） |
| `core.workspace` | `platform.workspace`（owner/billing_region/data_region/status） | 形状几乎一致 → 迁到 `platform.workspace` |
| `core.workspace_membership`（role enum 一致） | `platform.workspace_membership` | 一致 → 迁到 `platform` |
| `core.workspace_entitlement` / `core.data_entitlement` | `platform.workspace_entitlement` + `platform.entitlement_policy` | 跨产品 entitlement → `platform`；AiphaBee **字段级** data rights(DAT-05) 属产品特有 → 留 `aiphabee_governance`，外键引用 `platform.workspace` + `platform.product` |
| `core.subscription_plan` / `core.workspace_subscription` | **platform 暂无 subscription 表** ⚠️ | **决策点 A**（见下） |
| `audit.subscription_lifecycle_event` 等产品审计 | `platform_audit.product_access_event`（仅跨产品访问审计） | 跨产品访问审计 → `platform_audit`；产品特有审计 → `aiphabee_audit` |

### ✅ 决策 A（已定 2026-06-23）— subscription 上提 `platform.*`
新建 `platform.subscription_plan` / `platform.workspace_subscription`（跨产品统一计费），`core.subscription_plan` / `core.workspace_subscription` 迁入；`audit.subscription_lifecycle_event` 的外键改指 `platform.*`，事件表本身留 `aiphabee_audit`（产品特有审计）。理由:fastclaw premium、sidecar 新项目都按订阅开通，统一在 platform 计费。

### ✅ 决策 B（已定 2026-06-23）— 一次性改名 + 上提（趁无数据）
一个迁移把现有裸 `core.*` 拆成 **`platform.*`（跨产品身份 / workspace / membership / entitlement / subscription）+ `aiphabee_*`（产品业务：`aiphabee_core` / `aiphabee_governance` / `aiphabee_audit`）**，同步改全部 runtime 引用（`@aiphabee/account-runtime` / `usage-ledger` / `mcp-runtime` 等 + 散落 migration）。**因无 live 数据 = 纯 DDL + 改引用，一步到位、双模型并存期最短。** 这是大范围 schema PR，**必须人审 + RLS 隔离 review 后再 merge**。

---

## 4. 执行顺序（喂给 codex 的"下一刀"）

1. **Salvage #8 的 DS/a11y**：把 `apps/web/src/ds/{ScoreMeter,Card}.tsx`、`ds/styles/aiphabee.css`、`routes/__root.tsx` 的 a11y diff cherry-pick/apply 到 main（共用 DS，WCAG 不浪费）。单独小 PR，人审。
2. **Governance 抽取**（§2）：一个收敛分支 off `main`，并入 frontend-agnostic governance + checkers，剥离 mock-frontend evidence 绑定，`npm run check` 绿。人审后 merge。
3. **EXTRACT #9 / #11**：其 governance 已在第 2 步覆盖；确认无遗漏后 **CLOSE #9、#11**。
4. **CLOSE #4–#8**：每个 PR 留 comment 指向本计划 + 收敛分支；关闭。关前核对 main 真前端是否覆盖各 mock 特性（#6 开发者控制台重点核），缺口记入 `tasks/todos.md`。
5. **core→platform 收敛**（§3，A/B 已定）：一个迁移把 `core.*` 拆成 `platform.*`（身份 + subscription）+ `aiphabee_*`（业务），同步全部 runtime 引用；**人审 + RLS 隔离 review 后**再 merge（趁无 live 数据）。
6. **重抓前端 evidence**：对 main `research-os-shell` 真前端重新生成 frontend-release-evidence-packets，恢复对应 Sprint surface 的 exit-gate 绑定。
7. **回写 tracker**：§0 看板与 §F 同步收敛结果；§G 标记"收敛已执行"。

---

## 5. 守护栏 / 残留风险
- **schema/platform/migration PR 一律人审**（含 RLS 跨产品隔离）后才 merge —— #12 自动 merge 是反面教材。
- **service role 绕过 RLS**：runtime 必须始终传 `product_id` + `workspace_id`/`tenant_id`（plan §P1 已警示）。
- mock 前端特性可能有 main 未覆盖的（尤其 developer console）→ 关 PR 前逐一核对，别丢需求。
- 收敛分支与 codex 仍在跑的活并行 → 全程独立 worktree off `main`，别动主 checkout 脏树。
- 完成后清理这些一次性 worktree（`git worktree remove`）。

---

## 附:本计划基于的实测
- PR 文件清单：`gh pr diff <n> --name-only`（#4–#9、#11，2026-06-23）。
- `platform.*`：`deploy/database/migrations/20260623010000_platform_umbrella_schema_foundation.sql`（product/product_environment/account/workspace/workspace_membership/workspace_product_access/entitlement_policy/workspace_entitlement + platform_audit.product_access_event）。
- `core.*`：`deploy/database/migrations/20260620085000_account_workspace_entitlement_scaffold.sql`（account/workspace/workspace_membership/subscription_plan/…）、`20260621100000_subscription_lifecycle_audit_scaffold.sql`。
- umbrella 布局意图：`docs/supabase-umbrella-schema-plan.md`（AiphaBee/AIMPACT/Salesko 共享 Supabase）。
