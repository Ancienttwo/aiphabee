# Ephemeral OHLCV Release Gate Evidence

> **Status**: Completed
> **Completed**: 2026-07-07 03:50 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **PRD**: `plans/prds/20260703-2207-ohlcv-skill.prd.md`

## Verification Commands

```sh
npx vitest run packages/agent-runtime/src packages/tool-registry/src
npx vitest run packages/market-data/src
npx vitest run apps/web/src/components/technical
npm run check:tool-registry
npm run typecheck
git diff --check
```

## PRD §21 Gate Coverage

1. 用户发起条件可验证。
   - Covered by `evaluateAgentLayerToolPolicy()` and
     `evaluateEphemeralTechnicalAnalysisGuardrails()` requiring
     `userInitiated=true`.

2. Generic 不能调用。
   - Covered by `evaluateAgentLayerToolPolicy()` and
     `createEphemeralTechnicalAnalysisAgentPlan()` Generic denial tests.

3. Research 不能后台调用。
   - Covered by `evaluateEphemeralTechnicalAnalysisBetaGuardrails()` returning
     `BACKGROUND_REFRESH_BLOCKED`.

4. 单次请求有 symbol/timeframe/lookback 上限。
   - Covered by Row 1 policy `max_symbols_per_run=1`, Row 2/3
     `MAX_EPHEMERAL_OHLCV_BARS=500`, and provider/cache tests.

5. raw OHLCV 不进入平台持久层 DB。
   - Covered by negative grep for `market_bars` in `packages/market-data/src`
     and transcript mode tests keeping raw bars out of persistent history by
     default.

6. OHLCV 可进 LLM、可展示，但只在当次会话内 bounded 使用。
   - Covered by Row 1 `raw_to_llm_context: true`, Row 6 `with_bars` LLM
     context, Row 8 display component, and 500-bar bound tests.

7. OHLCV 不做成常驻 API / 批量 export / 后台数据源。
   - Covered by `BATCH_FETCH_NOT_ALLOWED`,
     `RAW_OHLCV_BATCH_EXPORT_BLOCKED`, `BACKGROUND_REFRESH_BLOCKED`, and UI
     tests asserting no batch export or standing download API affordance.

8. cache 是 user-private + session scoped + TTL。
   - Covered by `InMemoryEphemeralOhlcvCache` key scope
     `tenant_id:user_id:session_id`, 24h TTL tests, and cross-user isolation
     tests.

9. FastClaw 只能通过 Tool Gateway 调用。
   - Covered at contract level by exposing `analyze_public_technical_signal` as
     the tool-registry entrypoint and not exposing raw provider fetch as an
     agent/tool entrypoint.

10. 输出标记 public_observation_signal。
    - Covered by Row 1 runtime policy, Row 6 answer template, and Row 8 UI
      component tests.

11. 输出不声称 authorized / verified。
    - Covered by `validateEphemeralTechnicalAnalysisAnswer()` returning
      `AUTHORIZED_CLAIM_BLOCKED`.

12. 输出不包含买入/卖出/持有/仓位/止损。
    - Covered by `validateEphemeralTechnicalAnalysisAnswer()` returning
      `POST_CHECK_TRADE_ADVICE_BLOCKED`.

13. 全市场扫描被拒绝。
    - Covered by `evaluateEphemeralTechnicalAnalysisGuardrails()` and
      `evaluateEphemeralTechnicalAnalysisBetaGuardrails()` returning
      `BATCH_FETCH_NOT_ALLOWED` for `*`.

14. provider 失败时可优雅降级。
    - Covered by provider timeout/unavailable tests returning
      `PROVIDER_UNAVAILABLE` with no fabricated bars.

15. 有 kill switch。
    - Covered by `evaluateEphemeralTechnicalAnalysisBetaGuardrails()` returning
      `KILL_SWITCH_ACTIVE` when beta is disabled or kill switch is active.

16. transcript 存储层策略已选定（模式 A/B），对外话术不说「完全不存」。
    - Covered by Row 1 `raw_to_chat_transcript: "temporary_only"` default and
      Row 7 transcript tests.

17. 第三方 provider 数据保留事实已在合规口径中标注（见 6.3 层 3）。
    - Covered by sprint Risk notes and Row 1 docs/spec capability wording:
      AiphaBee storage claims are scoped to platform persistence, not third
      party provider retention.

## Row Evidence Index

- Row 1: `plans/archive/plan-20260707-ephemeral-ohlcv-contract-tool-policy.md`
- Row 2: `plans/archive/plan-20260707-ephemeral-ohlcv-provider-normalize.md`
- Row 3: `plans/archive/plan-20260707-ephemeral-ohlcv-cache-timeout.md`
- Row 4: `plans/archive/plan-20260707-ephemeral-ohlcv-indicators-signals.md`
- Row 5: `plans/archive/plan-20260707-ephemeral-ohlcv-entitlement-rate-limit.md`
- Row 6: `plans/archive/plan-20260707-ephemeral-ohlcv-agent-template.md`
- Row 7: `plans/archive/plan-20260707-ephemeral-ohlcv-post-check-transcript.md`
- Row 8: `plans/archive/plan-20260707-ephemeral-ohlcv-ui-display.md`
