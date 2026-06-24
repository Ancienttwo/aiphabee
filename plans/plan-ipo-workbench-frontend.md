# Plan — IPO Workbench 前端实现（apps/web）

> Status: design plan, not implemented
> Updated: 2026-06-24
> Track: **Frontend（本计划）**。Backend（schema / ETL / serving / 工具 / 治理）由 Codex 负责，
> 见配套 schema 方案（raw→serving 双层、`core.hk_ipo_*`、字段权限、provenance）。
> 分工：前端把已迁移的设计原型落成 `apps/web` 真实实现并接后端 API；后端供数。

## Context（为什么做）

设计原型已迁移进仓库：`docs/AiphaBee Design System/apps/ipo-workbench/`（8 文件，Babel-in-browser +
CDN React 的独立 handoff 原型，mock 数据）。它是**视觉 / 交互 / 状态 / 文案的基准**，但**不是**
产品实现——`apps/web` 是 Vite + TanStack Router/Start + React 19 + 自研 DS（`apps/web/src/ds/*`）+
`apiCall→ResponseEnvelope` 的真实应用，现有 `apps/web/src/routes/ipos/*` 还是旧 mock。

本计划把原型移植成 `apps/web` 的真实 React 实现，接 Codex 的后端路由；并**保留原型已确立的产品
语义**：事实层/分析层分离（provenance）、字段默认拒绝门控、研究信号≠投资建议（Gate-0）、中英双标签、
每张数字卡带 `as_of`/`data_version`。

非目标：不重做后端 schema/ETL（Codex track）；不引入完整 i18n 切换器（沿用中英双标签）；不把原型的
Babel/CDN 运行方式带进 `apps/web`（改写为 TS + DS 组件 + 构建期）。

## 源 → 目标 映射

| 原型（docs/.../ipo-workbench/） | apps/web 目标 | 说明 |
|---|---|---|
| `shell.jsx` `App`/`NavBar`/视图路由 | TanStack 文件路由 `apps/web/src/routes/ipos/*` | 用 router 取代手写 view switch |
| `shell.jsx` `PlanCtx` + `LockedValue` | `apps/web/src/lib/context/` 复用 `SessionContext` + 新 `EntitlementContext` | 门控从 mock plan 改为真实 entitlement（来自 envelope/account） |
| `shell.jsx` `EvidenceChip`/`SubPill`/`Mono`/`Eyebrow`/`Module` | `apps/web/src/components/ipo/*` 新建 | 原型私有 helper，DS 里没有 → 移植 |
| `detail.jsx` `Provenance`/`DETAIL_TABS`/`DetailView` | `routes/ipos/$ipoId.tsx`（分 Tab 工作台） | 对标现有 `routes/stock/$instrumentId.tsx` 的 Tab 模式 |
| `detail-parts.jsx` `Timeline`/`TermsGrid`/`PoolClawback`/`Allotment`/`Cornerstones`/`Lockup`/`ProfileTabs`/`Proceeds`/`CompanyTable`/`AppTiers` | `apps/web/src/components/ipo/panels/*` | 各分区渲染器逐个移植为 TS 组件 |
| `pipeline.jsx` `StageRail`/`FilterBar`/`IpoRow`/`PipelineView` | `routes/ipos/index.tsx`（生命周期列表/筛选） | |
| `calendar.jsx` `CalendarView` | `routes/ipos/calendar.tsx`（新增） | |
| `compare.jsx` `METRICS`/`CompareView` | `routes/ipos/compare.tsx`（新增） | |
| `data.jsx` `IPOS`/`STAGES`/`REC_CFG`/`SENTIMENT_*`/`LISTING_TYPE` | `apps/web/src/data/ipos.ts`（重构为类型+lookup）+ `mock-api` | mock 数据 → 类型契约 + API client |
| `DS = window.AiphaBeeDesignSystem_599c13` 基础组件 | `apps/web/src/ds/*`（Card/Badge/ScoreMeter/RatingStars/BeeNote/MascotState/Icon/Button） | 已存在，直接用 |

## 前端 ↔ 后端 接口契约（与 Codex 对齐的关键面）

前端按原型 `data.jsx` 的记录形状消费；Codex 后端按此供数，全部包在现有
`ResponseEnvelope<T>`（`ok/data/as_of/data_version/methodology_version/provenance/request_id/usage`）。

**IPO 记录（detail snapshot 的核心 data）**——一级字段（来自原型实证）：
```
id, exchange, stage(processing|subscribing|grey_market|listed|allotted|withdrawn),
live(bool), tierLabel, desc, subPeriod, pricingDate,
sentiment, score, confidence,                 // 分析层(aiphabee_research)
signal/recommendation,                          // 研究信号(描述性, REC_CFG 重构, 非 buy/sell/hold)
terms{...}, timetable[ {event,date,...} ],
pools[], clawback[], allotment{...}|null,       // null=未公布分配 → UI 显示 pending 不报错
cornerstones[ {name,amount,pct,lockup} ],       // amount=敏感(enterprise 门控)
lockup[], sponsors[], applicationTiers[],        // applicationTiers 各档申请数=敏感(premium 门控)
profile{ ..., risks[] }, riskSummary, aiNote,    // aiNote=研究信号叙述
evidence{ asOf, dataVersion, methodology, source } // → EvidenceChip / Provenance
```

**字段层级与门控**（前端按 envelope 的 entitlement 渲染，后端在 gateway 过滤）：
- 供应商事实 → 标 `provenance · netquity_hk_ipo`。
- 分析层（score/signal/aiNote）→ 标 `aiphabee_research · <methodology>`，描述性 + Gate-0 免责。
- 敏感字段（`cornerstones[].amount`、`applicationTiers[].applied`、頂頭槌等）→ 未授权时
  `LockedValue` 显示「Premium/Enterprise 解锁」，不渲染真实值。

**Worker 路由（Codex 提供，前端 `endpoints.ts` 调用）**：
- `POST /workbench/ipo/snapshot` → 上表（detail 聚合）
- `POST /analytics/screen-ipos` → 列表/筛选（含 stage、sector、sort、q、范围筛选）
- `POST /analytics/compare-ipos` → 2–5 标的对比（METRICS 列）
- `GET|POST /ipos/calendar` → 跨标的时间表事件（agenda）

> 解耦保证：前端经 `apiCall` 层消费，后端未就绪前用 `mock-api`（同 envelope）兜底，前端各 Phase
> **不阻塞** Codex；后端路由上线后切 `apiCall` 即可，UI 不改。

## 实现阶段（每阶段可独立合并；mock-first）

| Phase | 交付 | 合并后状态 |
|---|---|---|
| **FP1 基座** | `apps/web/src/lib/api/ipo-types.ts`（IpoRecord 等类型契约）+ `endpoints.ts` 增 ipo 端点 + `mock-api` ipo 兜底 + `EntitlementContext` + 移植 DS 原语到 `components/ipo/*`（EvidenceChip/LockedValue/SubPill/Mono/Eyebrow/Module/Provenance） | 类型+组件+API 通道就位（mock 数据），可独立合并 |
| **FP2 Pipeline 列表** | `routes/ipos/index.tsx` → 5 阶段 `StageRail` + `FilterBar` + `IpoRow`，接 `screen-ipos`（mock 兜底） | `/ipos` 用新设计渲染，可点进详情/加入对比 |
| **FP3 Detail 工作台** | `routes/ipos/$ipoId.tsx` → 8 Tab（概览/时间表/发售详情/认购回拨/配售结果/基石/公司资料/解禁）+ 顶部 KPI + 右栏(AI 洞察/风险/保荐人/证据数据版本) + 门控 + Provenance + Gate-0 免责，接 `ipo/snapshot` | 详情页完整工作台，事实/分析分离可见 |
| **FP4 日历 + 对比** | `routes/ipos/calendar.tsx` + `routes/ipos/compare.tsx`，接 `ipos/calendar` / `compare-ipos` | 浏览/发现/对比闭环 |

红旗自检：无独立"调研 Phase"；各 Phase 用 mock 即可跑通、可独立合并；FP1 先落类型契约让 FP2–4 与
Codex 并行。

## 关键约束（从原型继承，不可丢）

- **研究信号≠投资建议**：`REC_CFG`/`aiNote` 用「需求强劲/稳健/中性/疲弱」描述性措辞 + Gate-0
  「描述性信号，非投资建议」免责（`apps/web/src/components/Disclaimer.tsx` 已存在，复用）。对比页裁决同。
- **中英双标签**：区块标题/字段标签中英混排（`发售价 Offer Price`、`牛市 Bullish`），数据值默认繁中。
- **数字呈现**：mono / tabular，沿用 `apps/web/src/lib/num.ts`（locale-free，避免 SSR hydration 漂移）
  与 `lib/format.ts`（formatHKD/formatMultiple/demandColor）。
- **状态覆盖**：招股中（实时认购倍数 SubPill）、已公布分配（中签率/回拨）、By Introduction（无
  Pool/无 Clawback → 分区显示"不适用"非空报错）、撤回/失效、`allotment:null`→pending。
- **空/错/载入**：复用 `apps/web/src/ds/MascotState`（empty/error/loading pose）。
- **证据前置**：每张数字卡可达 `as_of`/`data_version`（`EvidenceChip`）。

## 关键文件

**新建**
- `apps/web/src/routes/ipos/calendar.tsx`、`apps/web/src/routes/ipos/compare.tsx`
- `apps/web/src/components/ipo/`：`EvidenceChip.tsx`、`LockedValue.tsx`、`SubPill.tsx`、
  `Provenance.tsx`、`StageRail.tsx`、`FilterBar.tsx`、`IpoRow.tsx`、`panels/`（Timeline/Terms/
  PoolClawback/Allotment/Cornerstones/Lockup/Profile/Proceeds/CompanyTable/AppTiers）
- `apps/web/src/lib/api/ipo-types.ts`、`apps/web/src/lib/context/EntitlementContext.tsx`

**修改**
- `apps/web/src/routes/ipos/index.tsx`（→ 生命周期列表）、`routes/ipos/$ipoId.tsx`（→ 8 Tab 工作台）
- `apps/web/src/data/ipos.ts`（mock → 类型+lookup，扩到原型字段）
- `apps/web/src/lib/api/endpoints.ts`、`apps/web/src/lib/mock-api.ts`、`apps/web/src/components/NavBar.tsx`（IPO 入口/日历）

**参考**
- 原型源：`docs/AiphaBee Design System/apps/ipo-workbench/*.jsx`（视觉/交互/状态基准）
- 现有模式：`apps/web/src/routes/stock/$instrumentId.tsx`（分 Tab 工作台）、`routes/compare/index.tsx`
  （多标的对比）、`routes/screen/index.tsx`（筛选面板）
- DS：`apps/web/src/ds/index.ts`；契约：`packages/data-contracts/src/index.ts`

## 验证

- `apps/web` typecheck + lint。
- dev server 逐路由实渲：`/ipos`（5 阶段+筛选）、`/ipos/$id`（8 Tab + 右证据栏 + 门控）、
  `/ipos/calendar`、`/ipos/compare`。
- 与原型**逐屏比对**（基准：`docs/AiphaBee Design System/screenshots/detail.png`、`compare.png` +
  本地起原型 `python3 -m http.server` 对照）。
- 门控两态：entitlement free → 敏感字段显示锁；premium/enterprise → 揭示真实值。
- 状态矩阵：招股中 / 已分配 / By Introduction / 撤回 / `allotment:null` pending。
- envelope 错误路径：`ok:false` → `presentError`；空 → MascotState。
- 解耦验证：mock-api 与 Codex live 路由切换，UI 无需改。

## 残留风险 / Unknowns

- **接口契约需与 Codex 锁定**：本计划据原型 `data.jsx` 形状推导后端供数 shape；字段命名/层级须与
  Codex 的 serving 字段目录对齐一次（owner：双方，入口=本文「接口契约」节 + Codex serving 表）。
- **entitlement 真实来源**：原型用 mock plan 切换；真实门控依赖 envelope/account 的 entitlement
  字段，FP1 先以 mock entitlement 占位，待 account/billing 面就绪再接。
- **分析层 methodology**：score/signal 的真实算法属研究侧，未定；FP3 先消费后端给的描述性 signal +
  provenance，不在前端造数。
