# Review: Web i18n + agent-runtime locale-aware public labels

> **Review Rubric Version**: 2
> **Reviewed Subject SHA256**: 2d0d01a04931122d3dc6dca225eb13746885c972d2f4e5b937b529a1e5aebdf1
> **Reviewed Subject Scope**: normalized-final-content
> **Reviewed Target Revision**: 398ffc5d67ef0e3d632481c41f6cc04ab0597842

## Verdict

PASS（gatekeeper，Opus max）。三個目標面全部通過；提交採逐檔白名單。

## Scope

1. Web i18n：新增 `apps/web/src/i18n/`（locale.tsx：zh-Hant 預設 + zh-Hans + en，305 keys 三向精確對齊；LanguageSwitcher + test），全站核心路由/元件抽字串。
2. agent-runtime：tool-loop 步驟 public label 依 `normalizeAgentResponseLocale`（既有契約，預設 zh-Hant）本地化；`createToolLoopSteps` / `createBudgetStoppedSteps` 簽名改動的唯一調用點均已更新；worker/agent-runtime 測試補 `locale:"en"` 錨定。
3. `.claude/agents/{deep-reasoner,fast-worker}.md` 描述去版本 pin。

排除（非本輪）：`apps/web/src/components/workbench/panels.tsx`、`apps/web/src/components/workbench/i18n.ts`（並發任務半成品）、`.claude/worktrees/agent-a6df2b64b45595985/`（worktree 殘留）。

## Findings

- [P1] 並發寫入者於複核期間修改 workbench/*（獨立 i18n 機制、未驗證）— 已以白名單提交規避；該任務歸屬待確認。
- [P3] `Disclaimer.tsx:19-24` en locale 下英文免責聲明重複兩遍（`t("disclaimer")` + 硬編碼英文 tail）。
- [P3] `routes/__root.tsx:23,27` `<title>`/meta description 為 zh-Hans 硬編碼，位於 React tree 外，`useLocale()` 夠不到；不阻斷。

Residual：`routes/ipos/*`、`components/ipo/*`、`routes/dashboard.tsx`、`MarketSentimentPanel.tsx` 尚未 i18n（後續範圍）；workbench 由並發任務處理中。

## Verification (session-run)

- key parity（node 解析）：zh-Hant/zh-Hans/en 各 305 keys，0 dupes，差集空
- `npm run typecheck -w packages/agent-runtime` → 通過
- `npm run typecheck -w apps/web` → 通過
- `npx vitest run`（agent-runtime/index + i18n + PlanView + evidence/render）→ 4 files / 72 passed
- `npx vitest run apps/worker/src/index.test.ts` → 259 passed
- `npm run build -w apps/web` → built in 845ms（locale chunk 46.85 kB）

SSR/hydration：localStorage/document 僅 client-side（useEffect / inline head script with try-catch）；server 與 client 首幀同為 zh-Hant，無 hydration mismatch；非預設 locale 有一次刻意的內容 flash。
