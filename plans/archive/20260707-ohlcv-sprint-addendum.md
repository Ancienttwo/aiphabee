下面是一版 **“OHLCV Skill 补充方案 v1”**。定位不是重写 PRD，而是给现有 `ephemeral-ohlcv-skill` sprint 补上 **traceability、runtime contract、验收颗粒度、release evidence** 四个缺口。

---

# OHLCV Skill 补充方案 v1

## 0. 结论与批准口径

建议把当前 sprint 从 `Status: Draft` 调整为：

```md
> Status: Approved
```

但批准说明必须写清楚：

```md
Approval note:
This approves the ordered sprint backlog only. Runtime implementation remains 0/9.
Row 1 must bind docs/spec.md, .ai/context/capabilities.json,
.ai/context/capability-source-map.json, packages/tool-registry,
and packages/agent-runtime policy before provider/cache implementation starts.

Existing get_price_history is a licensed/synthetic price-history scaffold
and must not be treated as the ephemeral public OHLCV technical-analysis skill.
```

原因是：当前 sprint 文件本身仍是 `Status: Draft`，9-row backlog 全部 pending；PRD 已经定义目标、六约束和三存储层，但 runtime contract 还没真正落到能力发现、tool registry、agent-runtime policy 与 market-data 实现里。([GitHub][1])

---

## 1. 补充方案的核心原则

这条 OHLCV 线必须坚持一个铁律：

```txt
Ephemeral OHLCV = 用户发起的临时公开观察信号
≠ 授权行情源
≠ 平台正式行情库
≠ 可批量导出数据 API
≠ 自动 watchlist / cron / 全市场扫描
```

PRD 已明确数据等级是 `public_observation_signal`，不是 `authorized_market_data`、`licensed_evidence` 或 `official_price_feed`；并且允许 bounded raw OHLCV 进入 LLM ephemeral context，也允许展示给用户，但必须满足 `no-persistence`、`bounded-scope`、`user-initiated`、`no-background`、`no-batch`、`no-authorized-claim` 六约束。([GitHub][2])

---

## 2. 当前仓库缺口校准

### 2.1 已有基础

仓库已经有 `packages/market-data`、`packages/tool-registry`、`packages/agent-runtime`、`apps/worker`、`apps/web` 等相关落点；根 `package.json` 是 monorepo，workspaces 覆盖 `apps/*` 与 `packages/*`，并且 `npm run check` 串了非常重的全仓契约检查。([GitHub][3])

### 2.2 关键缺口

`docs/spec.md` 目前仍是模板化 Draft，没有承载 OHLCV/technical-analysis 的稳定产品真值；但 root workflow contract 要求把 `docs/spec.md` 当作 stable product truth，并通过 `.ai/context/context-map.json` 与 `.ai/context/capabilities.json` 发现 functional-block contracts。([GitHub][4])

`.ai/context/capabilities.json` 当前 capabilities 数组为空，`.ai/context/capability-source-map.json` 当前 capabilities 映射也为空；这意味着 OHLCV skill 即使 PRD/sprint 写好了，仍没有进入 repo 的能力发现面。([GitHub][5])

`tool-registry` 现在已有 `get_price_history`，但它是 `status: "scaffold"`，权限是 `prices:read`，retrieval maxLimit 只有 3，语义是 OHLCV/history scaffold；这不等于这次的 `analyze_public_technical_signal`。([GitHub][6])

`tool-registry` 的整体 capability 仍显示 `execution_ready: false`、`registry_status: "registry_scaffold"`、`status: "shared_tool_registry_scaffold"`，所以 OHLCV sprint 不能把 registry 当成已执行就绪。([GitHub][6])

`packages/market-data` 的现有 price history 明确是 synthetic scaffold：`GET_PRICE_HISTORY_DATA_VERSION = "price-history-synthetic-v0"`，`GetPriceHistoryResult.liveDataAccess` 固定为 `false`。([GitHub][7])

---

# 3. 建议新增一段 Sprint Addendum

建议直接追加到 `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md` 的 `### Risks` 后、`## Backlog` 前。

```md
### Approval Addendum: Traceability + Runtime Binding

This sprint is approved as an ordered backlog only. Implementation remains 0/9.

Before Row 2 starts, Row 1 must bind the ephemeral OHLCV capability across:
- `docs/spec.md`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- `packages/tool-registry`
- `packages/agent-runtime`

The runtime skill name is `analyze_public_technical_signal`.
The capability id is `technical_analysis_ephemeral`.
The data classification is `public_observation_signal`.

Existing `get_price_history` is not this skill. It remains a separate price-history scaffold and must not be reused as the public OHLCV technical-analysis entrypoint.

Non-negotiable invariants:
- raw OHLCV may enter bounded LLM context
- raw OHLCV may be displayed to the user
- raw OHLCV must not be written to AiphaBee market database
- raw OHLCV must not be written to shared cache
- transcript policy defaults to `temporary_only`
- provider output must be normalized before use
- Generic Agent must be denied
- Research Agent requires `user_initiated=true`
- no background refresh
- no batch scan
- no full-market scan
- no authorized/verified claim
- no buy/sell/hold/position/stop-loss instruction
- kill switch must fail closed
```

---

# 4. 文件落点补充

## 4.1 `docs/spec.md`

当前 `docs/spec.md` 是空壳，所以 row 1 应补一个最小 spec section，不要把完整 PRD 搬进去，只放稳定产品真值。

建议新增：

```md
## Ephemeral Public OHLCV Technical Analysis

AiphaBee supports user-initiated, bounded, session-scoped public OHLCV technical-analysis observations for Research users.

Data classification:
- `public_observation_signal`

This capability is not:
- authorized market data
- licensed evidence
- official price feed
- persistent market database
- batch export API
- background refresh source

Required guardrails:
- user initiated only
- Research Agent only
- max one symbol per run
- max 500 bars per request/model/display
- raw bars may enter bounded LLM context
- raw bars may be displayed with public-observation labeling
- raw bars must not be persisted to platform market database
- shared cache is forbidden
- user-private session TTL cache max 86400 seconds
- transcript policy defaults to `temporary_only`
- output must not contain trading instructions
```

验收：

```bash
grep -n "Ephemeral Public OHLCV Technical Analysis" docs/spec.md
grep -n "public_observation_signal" docs/spec.md
grep -n "max 500 bars" docs/spec.md
grep -n "temporary_only" docs/spec.md
grep -n "not.*authorized market data" docs/spec.md
```

## 4.2 `.ai/context/capabilities.json`

当前是空数组。建议补一个最小 capability registry entry：

```json
{
  "version": 1,
  "capabilities": [
    {
      "id": "technical_analysis_ephemeral",
      "status": "planned",
      "owner": "packages/agent-runtime",
      "entrypoint": "analyze_public_technical_signal",
      "source_prd": "plans/prds/20260703-2207-ohlcv-skill.prd.md",
      "source_sprint": "plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md",
      "source_spec": "docs/spec.md",
      "data_classification": "public_observation_signal",
      "runtime_layer": "research",
      "user_initiated_required": true,
      "generic_agent_allowed": false,
      "persistent_market_database_allowed": false,
      "shared_cache_allowed": false,
      "ephemeral_cache_ttl_seconds": 86400,
      "max_symbols_per_run": 1,
      "max_bars_per_request": 500,
      "kill_switch_required": true
    }
  ]
}
```

验收：

```bash
node -e "const c=require('./.ai/context/capabilities.json'); if(!c.capabilities.some(x=>x.id==='technical_analysis_ephemeral')) process.exit(1)"
grep -n "technical_analysis_ephemeral" .ai/context/capabilities.json
grep -n "public_observation_signal" .ai/context/capabilities.json
grep -n '"persistent_market_database_allowed": false' .ai/context/capabilities.json
grep -n '"shared_cache_allowed": false' .ai/context/capabilities.json
```

## 4.3 `.ai/context/capability-source-map.json`

当前映射为空。建议补：

```json
{
  "version": 1,
  "capabilities": {
    "technical_analysis_ephemeral": {
      "spec": "docs/spec.md",
      "prd": "plans/prds/20260703-2207-ohlcv-skill.prd.md",
      "sprint": "plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md",
      "owners": [
        "packages/agent-runtime",
        "packages/tool-registry",
        "packages/market-data",
        "apps/worker",
        "apps/web"
      ],
      "verification": [
        "npx vitest run packages/agent-runtime/src",
        "npx vitest run packages/tool-registry/src",
        "npx vitest run packages/market-data/src",
        "npm run check:tool-registry",
        "npm run check:market-data",
        "npm run check:agent-kill-switch"
      ]
    }
  }
}
```

验收：

```bash
node -e "const m=require('./.ai/context/capability-source-map.json'); if(!m.capabilities.technical_analysis_ephemeral) process.exit(1)"
grep -n "packages/tool-registry" .ai/context/capability-source-map.json
grep -n "packages/market-data" .ai/context/capability-source-map.json
grep -n "check:agent-kill-switch" .ai/context/capability-source-map.json
```

---

# 5. Runtime Contract 补充

## 5.1 Tool name 必须新建，不复用 `get_price_history`

新增 tool：

```ts
name: "analyze_public_technical_signal"
capability: "technical_analysis_ephemeral"
data_classification: "public_observation_signal"
```

不要让 LLM 直接调用 raw fetch 工具。内部可以有 provider adapter，但外部 tool 只暴露 `analyze_public_technical_signal`。PRD 里也明确 FastClaw/Research Runner 应通过 Tool Gateway 调 `analyze_public_technical_signal`，不能绕过 Tool Gateway 自行 fetch 或保存 raw bars。([GitHub][2])

## 5.2 Input schema 建议

```ts
export interface PublicTechnicalSignalInput {
  symbol: string;
  market: "US" | "HK" | "CN";
  timeframe: "1d" | "1h" | "30m" | "15m";
  lookback_bars?: number;       // default 250, max 500
  adjust?: "raw" | "split_adjusted";
  detail_level?: "summary" | "derived_values" | "with_bars";
  user_initiated: true;
  run_id: string;
  session_id: string;
  tenant_id: string;
  user_id: string;
}
```

硬限制：

```ts
const EPHEMERAL_OHLCV_LIMITS = {
  maxSymbolsPerRun: 1,
  maxBarsPerRequest: 500,
  maxBarsToModel: 500,
  maxBarsToDisplay: 500,
  defaultBars: 250,
  maxTimeframesPerRun: 2,
  ttlSeconds: 86_400,
  providerTimeoutMs: 8_000,
  maxProviderRetry: 1
} as const;
```

这些数值与 PRD 的 rate limit 建议一致：单次 1 symbol、每次最多 500 bars、默认 250、每小时 20、每日 100、并发 2、provider retry 1 次、timeout 8000ms。([GitHub][2])

## 5.3 Output schema 建议

PRD 已经定义 `PublicTechnicalSignalOutput`，包含 `data_classification`、source、retention、data_quality、signal_summary 等字段；补充方案只建议把字段拆成更易验收的 runtime envelope。([GitHub][2])

```ts
export interface PublicTechnicalSignalOutput {
  status: "ok" | "blocked" | "partial" | "unavailable";

  data_classification: "public_observation_signal";
  capability: "technical_analysis_ephemeral";
  tool_name: "analyze_public_technical_signal";

  source: {
    provider_id: string;
    provider_response_schema_version: string;
    retrieved_at: string;
    delay_notice: string;
    market: "US" | "HK" | "CN";
    symbol: string;
    timeframe: string;
    lookback_bars: number;
    adjust: string;
  };

  retention: {
    raw_bars_returned_to_model: boolean;
    raw_bars_returned_to_user: boolean;
    raw_bars_persisted: false;
    raw_bars_written_to_market_database: false;
    raw_bars_written_to_shared_cache: false;
    ephemeral_cache_ttl_seconds: 86400;
    chat_transcript_policy: "allowed" | "redacted" | "temporary_only";
  };

  data_quality: {
    bars_count: number;
    missing_bars_count: number;
    stale: boolean;
    incomplete_latest_bar: boolean;
    normalized: true;
    warnings: string[];
  };

  signal_summary: {
    trend: "uptrend" | "downtrend" | "sideways" | "unclear";
    momentum: "positive" | "negative" | "neutral" | "extended" | "unclear";
    volatility: "low" | "normal" | "elevated" | "high";
    volume_confirmation: "confirming" | "diverging" | "mixed" | "insufficient";
    overall_observation: "constructive" | "cautious" | "mixed" | "weak" | "insufficient_data";
    signal_engine_version: string;
  };

  bars?: NormalizedEphemeralBar[];

  compliance: {
    evidence_grade: "observation_only";
    authorized_or_verified_claim: false;
    trade_instruction_present: false;
    post_check_passed: boolean;
  };
}
```

## 5.4 Error codes 建议

```ts
export type EphemeralOhlcvErrorCode =
  | "GENERIC_AGENT_TOOL_DENIED"
  | "USER_INITIATED_REQUIRED"
  | "BACKGROUND_REFRESH_BLOCKED"
  | "BATCH_FETCH_NOT_ALLOWED"
  | "FULL_MARKET_SCAN_BLOCKED"
  | "TOO_MANY_SYMBOLS"
  | "TOO_MANY_BARS"
  | "TOO_MANY_TIMEFRAMES"
  | "FREE_TIER_NOT_ENTITLED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "INVALID_PROVIDER_RESPONSE"
  | "INVALID_OHLC_RELATION"
  | "DUPLICATE_TIMESTAMP"
  | "NEGATIVE_VOLUME"
  | "RAW_OHLCV_PERSISTENCE_BLOCKED"
  | "RAW_OHLCV_SHARED_CACHE_BLOCKED"
  | "RAW_OHLCV_BATCH_EXPORT_BLOCKED"
  | "KILL_SWITCH_ACTIVE"
  | "POST_CHECK_TRADE_ADVICE_BLOCKED"
  | "AUTHORIZED_CLAIM_BLOCKED";
```

明确不要有：

```ts
"RAW_OHLCV_OUTPUT_BLOCKED"
```

因为这会误导实现者以为 raw OHLCV 不能给 LLM 或不能展示。PRD 的真实边界是可进 bounded LLM context、可展示，但不能持久化、不能批量、不能后台、不能冒充授权源。([GitHub][2])

---

# 6. Provider + Normalize 补充

## 6.1 Provider adapter 边界

新增内部接口：

```ts
export interface EphemeralPublicOhlcvProvider {
  readonly providerId: string;
  readonly providerResponseSchemaVersion: string;

  fetchBars(input: EphemeralOhlcvProviderInput): Promise<EphemeralOhlcvProviderResult>;
}
```

Provider adapter 的约束：

```txt
只做 fetch，不做 policy 判断
只返回 provider raw response + metadata，不直接喂 LLM
必须走 normalizeEphemeralBars()
必须带 provider_id / schema_version / retrieved_at
timeout 8000ms
最多 retry 1 次
失败 fail closed，不 fabricate
```

## 6.2 Normalize contract

```ts
export interface NormalizedEphemeralBar {
  timestamp: string;        // ISO
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  complete: boolean;
}
```

校验规则：

```txt
timestamp 必须可排序、不可重复
open/high/low/close 必须 finite number
high >= max(open, close, low)
low <= min(open, close, high)
volume 为 null 或 >= 0
latest bar 可标记 incomplete，但不能静默丢弃
bars_count <= 500
输入顺序可以乱，输出必须升序
provider 原始字段不得透传到 LLM output
```

fixture 建议：

```txt
valid.us.daily.250.json
valid.hk.daily.250.json
invalid.high_lt_open.json
invalid.low_gt_close.json
invalid.duplicate_timestamp.json
invalid.negative_volume.json
invalid.nan_price.json
partial.latest_bar_incomplete.json
provider.timeout.json
provider.malformed_response.json
```

验收：

```bash
npx vitest run packages/market-data/src/ephemeral/normalize
npx vitest run packages/market-data/src/ephemeral/provider

grep -R "INVALID_OHLC_RELATION" packages/market-data/src packages/market-data/test
grep -R "DUPLICATE_TIMESTAMP" packages/market-data/src packages/market-data/test
grep -R "providerResponseSchemaVersion" packages/market-data/src
```

---

# 7. Cache 补充

## 7.1 Cache key

建议不要只用 symbol/timeframe/lookback。完整 key：

```ts
export interface EphemeralOhlcvCacheKey {
  tenant_id: string;
  user_id: string;
  session_id: string;
  market: string;
  symbol: string;
  timeframe: string;
  lookback_bars: number;
  adjust: string;
  provider_id: string;
  provider_response_schema_version: string;
  transcript_policy: "allowed" | "redacted" | "temporary_only";
}
```

序列化：

```ts
const cacheKey = sha256(JSON.stringify({
  tenant_id,
  user_id,
  session_id,
  market,
  symbol: canonicalSymbol,
  timeframe,
  lookback_bars,
  adjust,
  provider_id,
  provider_response_schema_version,
  transcript_policy
}));
```

## 7.2 Cache rules

```txt
TTL 最大 86400 秒
同 user + 同 session + 同参数：24h 内可命中
跨 24h 必须 refetch
跨用户不得命中
跨 session 默认不得命中
不得写 shared cache
不得写 market_bars / market database
cache value 存 normalized bars，不存 provider raw response
```

验收：

```bash
npx vitest run packages/market-data/src/ephemeral/cache

grep -R "ttlSeconds.*86400\|86_400" packages/market-data/src
grep -R "raw_bars_written_to_shared_cache: false" packages/market-data/src packages/agent-runtime/src
! grep -R "market_bars" packages/market-data/src/ephemeral
```

---

# 8. Indicators + Signals 补充

## 8.1 指标层必须 deterministic

LLM 只解释，不计算关键指标。指标必须在 deterministic processor 里算：

```txt
SMA / MA
EMA
MACD(12,26,9)
RSI(14)
BOLL(20,2)
ATR(14)
Volume MA
```

PRD 的 Sprint C 也列出了 MA、MACD、RSI、ATR、BOLL、Volume MA、trend/momentum/volatility/volume/data quality signal 与 golden fixtures。([GitHub][2])

## 8.2 Signal output 禁止交易建议字段

允许：

```ts
trend
momentum
volatility
volume_confirmation
overall_observation
data_quality
```

禁止：

```ts
buy_signal
sell_signal
hold_signal
target_price
stop_loss
position_size
entry_price
take_profit
```

验收：

```bash
npx vitest run packages/market-data/src/technical

grep -R "signal_engine_version" packages/market-data/src/technical
! grep -R "buy_signal\|sell_signal\|stop_loss\|target_price\|position_size" packages/market-data/src/technical
```

## 8.3 Golden tolerances

建议补一段统一规则：

```ts
const NUMERIC_TOLERANCE = 1e-8;
const DISPLAY_DECIMALS = 4;
```

验收：

```bash
grep -R "NUMERIC_TOLERANCE" packages/market-data/src/technical packages/market-data/test
grep -R "MACD(12,26,9)\|RSI(14)\|BOLL(20,2)\|ATR(14)" packages/market-data/test
```

---

# 9. Entitlement + Rate Limit 补充

## 9.1 拦截位置

限流和权限必须在 provider 调用前执行：

```txt
Agent request
  ↓
Tool policy
  ↓
Entitlement gate
  ↓
Rate/concurrency gate
  ↓
Batch/full-market/background guard
  ↓
Provider fetch
```

不要先调 provider 再 post-check，否则成本和滥用已经发生。

## 9.2 Rule set

```ts
export const EPHEMERAL_OHLCV_RATE_LIMITS = {
  freeTierAllowed: false,
  researchTierAllowed: true,
  proTierAllowed: true,
  maxFetchesPerUserPerHour: 20,
  maxFetchesPerUserPerDay: 100,
  maxConcurrentFetchesPerUser: 2,
  maxSymbolsPerRun: 1,
  maxTimeframesPerRun: 2,
  maxBarsPerRequest: 500
} as const;
```

PRD 已明确第一版限制：每次 1 个 symbol、每次最多 500 bars、每小时 20、每日 100、并发 2，并禁止全市场扫描、watchlist 自动刷新、后台 cron、无限分页和高频轮询。([GitHub][2])

验收：

```bash
npx vitest run packages/agent-runtime/src/ephemeral-ohlcv-policy
npx vitest run apps/worker/src/tool-gateway/ephemeral-ohlcv

grep -R "BATCH_FETCH_NOT_ALLOWED" packages apps
grep -R "FULL_MARKET_SCAN_BLOCKED" packages apps
grep -R "BACKGROUND_REFRESH_BLOCKED" packages apps
grep -R "FREE_TIER_NOT_ENTITLED" packages apps
```

---

# 10. Agent Integration 补充

## 10.1 Research Agent only

Tool policy 必须表达：

```ts
{
  name: "analyze_public_technical_signal",
  layer: "research",
  capability: "technical_analysis_ephemeral",
  data_classification: "public_observation_signal",
  requires_user_initiated: true,

  raw_to_llm_context: true,
  raw_to_user_display: true,

  raw_to_market_database: false,
  raw_to_shared_cache: false,
  background_refresh: false,
  batch_scan: false,
  provider_as_authorized_feed: false,

  raw_to_chat_transcript: "temporary_only",

  limits: {
    max_symbols_per_run: 1,
    max_bars_to_llm: 500,
    max_bars_to_display: 500,
    ttl_seconds: 86400
  },

  evidence_grade: "observation_only"
}
```

这个结构与 PRD 中 Tool Policy 的定义一致：Research layer、`technical_analysis_ephemeral` capability、`public_observation_signal` classification、要求用户发起、允许 raw 到 LLM/display、禁止 market DB/shared cache/background/batch/authorized-feed claim，并默认 `raw_to_chat_transcript: 'temporary_only'`。([GitHub][2])

## 10.2 Answer template

建议固定模板：

```txt
我基于你本次发起获取的临时公开行情数据，计算了 {symbol} 的技术观察信号。
数据获取时间：{retrieved_at}
数据类型：public_observation_signal
说明：这不是 AiphaBee 授权行情验证，也不构成买入、卖出或持有建议。

趋势：{trend}
动能：{momentum}
波动：{volatility}
成交量确认：{volume_confirmation}

解释：
{llm_explanation}

数据边界：
- 单次请求，最多 {bars_count} 根 K 线
- 临时缓存最多 24 小时
- 不写入 AiphaBee 正式行情库
```

验收：

```bash
npx vitest run packages/agent-runtime/src

grep -R "public_observation_signal" packages/agent-runtime/src
grep -R "retrieved_at" packages/agent-runtime/src
grep -R "不构成买入、卖出或持有建议\|does not constitute" packages/agent-runtime/src
```

---

# 11. Transcript + Post-check 补充

## 11.1 三层存储必须分开测

三层不是同一个问题：

```txt
Layer 1: AiphaBee platform persistence
  raw OHLCV must not be written to market DB

Layer 2: Chat transcript
  default temporary_only
  raw table should not persist in durable chat history under mode B

Layer 3: Model/provider logs
  cannot claim “完全不存”
  only state AiphaBee does not write raw OHLCV to formal market DB
```

sprint 风险里也已经记录：第三方 provider 存储层不可控，不能对外说“完全不存”；transcript 是独立存储层，展示 raw rows 可能进入 chat transcript，默认走模式 B / `temporary_only`。([GitHub][1])

## 11.2 Post-check 规则

必须阻断：

```txt
买入
卖出
持有
建仓
加仓
减仓
仓位
止损
止盈
目标价
保证收益
authorized
verified
official feed
```

但不要误杀：

```txt
趋势偏强
动能放缓
波动升高
成交量背离
观察信号
风险上升
```

验收：

```bash
npx vitest run packages/agent-runtime/src/post-check
npx vitest run packages/agent-runtime/src/transcript

grep -R "POST_CHECK_TRADE_ADVICE_BLOCKED" packages/agent-runtime/src
grep -R "AUTHORIZED_CLAIM_BLOCKED" packages/agent-runtime/src
grep -R "temporary_only" packages/agent-runtime/src apps/worker/src
```

---

# 12. UI/UX 补充

## 12.1 Consent copy

建议文案：

```txt
本功能会为你本次请求临时获取公开行情 K 线并计算技术观察信号。
数据最多临时缓存 24 小时，不写入 AiphaBee 正式行情库。
该结果属于 public_observation_signal，不是授权行情验证，也不构成投资建议。
```

## 12.2 Signal card fields

```txt
Symbol / market / timeframe
Retrieved at
Delay notice
Data classification chip: public_observation_signal
Trend
Momentum
Volatility
Volume confirmation
Data quality warnings
TTL notice
```

## 12.3 Raw bars display

如果 `detail_level=with_bars`：

```txt
显示最多 500 bars
必须有 public_observation_signal 标注
必须有 retrieved_at
必须有 “临时公开数据，非授权行情验证” 提示
不得提供批量导出入口
不得提供常驻下载 API
```

验收：

```bash
npx vitest run apps/web/src

grep -R "public_observation_signal" apps/web/src
grep -R "24 小时\|24 hours" apps/web/src
grep -R "非授权行情验证\|not authorized" apps/web/src
! grep -R "batch export\|批量导出\|download api\|下载 API" apps/web/src
```

---

# 13. Kill Switch + Observability 补充

## 13.1 Kill switch

建议环境变量 / flag：

```txt
AIPHABEE_EPHEMERAL_OHLCV_ENABLED=false
```

行为：

```txt
flag off → 所有 analyze_public_technical_signal 调用返回 KILL_SWITCH_ACTIVE
不能 fallback 到 get_price_history
不能 fallback 到 provider direct fetch
不能让 LLM 自己根据 symbol 猜技术指标
```

验收：

```bash
npx vitest run packages/agent-runtime/src/kill-switch
npx vitest run apps/worker/src/tool-gateway/kill-switch

grep -R "AIPHABEE_EPHEMERAL_OHLCV_ENABLED" .
grep -R "KILL_SWITCH_ACTIVE" packages apps
```

## 13.2 Observability events

建议事件 schema：

```ts
type EphemeralOhlcvEvent =
  | {
      event: "ephemeral_ohlcv.tool_requested";
      user_id_hash: string;
      tenant_id: string;
      session_id_hash: string;
      symbol_hash: string;
      market: string;
      timeframe: string;
      lookback_bars: number;
      user_initiated: boolean;
    }
  | {
      event: "ephemeral_ohlcv.provider_fetch_finished";
      provider_id: string;
      status: "ok" | "timeout" | "unavailable" | "invalid_response";
      latency_ms: number;
      bars_count: number;
      cache_hit: boolean;
    }
  | {
      event: "ephemeral_ohlcv.policy_blocked";
      reason: EphemeralOhlcvErrorCode;
    }
  | {
      event: "ephemeral_ohlcv.post_check_blocked";
      reason: "trade_advice" | "authorized_claim" | "raw_export";
    };
```

注意：observability 不要记录 raw bars，不要记录原始 symbol 明文，建议 hash symbol/user/session。

验收：

```bash
npx vitest run packages/observability/src
grep -R "ephemeral_ohlcv" packages apps
! grep -R "bars:.*ephemeral_ohlcv" packages/observability/src
```

---

# 14. 9-row Backlog 加强版

下面是我建议的 row-by-row 增补，不需要改动 row 顺序，只加强 acceptance。

## Row 1 — Contract + Tool Policy

现有 row 1 要补 traceability 与 registry。

新增 acceptance：

```bash
grep -n "Ephemeral Public OHLCV Technical Analysis" docs/spec.md
grep -n "technical_analysis_ephemeral" .ai/context/capabilities.json
grep -n "technical_analysis_ephemeral" .ai/context/capability-source-map.json
grep -R "analyze_public_technical_signal" packages/tool-registry/src packages/agent-runtime/src
grep -R "raw_to_llm_context.*true" packages/agent-runtime/src
grep -R "raw_to_market_database.*false" packages/agent-runtime/src
grep -R "raw_to_shared_cache.*false" packages/agent-runtime/src
grep -R "provider_as_authorized_feed.*false" packages/agent-runtime/src
grep -R "RAW_OHLCV_OUTPUT_BLOCKED" packages/agent-runtime/src && exit 1 || true

npx vitest run packages/agent-runtime/src
npx vitest run packages/tool-registry/src
npm run check:tool-registry
```

## Row 2 — Provider adapter + normalize

新增 acceptance：

```bash
npx vitest run packages/market-data/src/ephemeral/normalize
npx vitest run packages/market-data/src/ephemeral/provider

grep -R "EphemeralPublicOhlcvProvider" packages/market-data/src
grep -R "normalizeEphemeralBars" packages/market-data/src
grep -R "providerResponseSchemaVersion" packages/market-data/src
grep -R "INVALID_PROVIDER_RESPONSE\|INVALID_OHLC_RELATION\|DUPLICATE_TIMESTAMP\|NEGATIVE_VOLUME" packages/market-data/src
```

## Row 3 — Cache + timeout

新增 acceptance：

```bash
npx vitest run packages/market-data/src/ephemeral/cache

grep -R "ttl.*86400\|86_400" packages/market-data/src/ephemeral
grep -R "tenant_id.*user_id.*session_id" packages/market-data/src/ephemeral
grep -R "PROVIDER_TIMEOUT\|PROVIDER_UNAVAILABLE" packages/market-data/src/ephemeral
! grep -R "market_bars" packages/market-data/src/ephemeral
! grep -R "shared.*cache.*true" packages/market-data/src/ephemeral
```

## Row 4 — Indicators + Signal Engine

新增 acceptance：

```bash
npx vitest run packages/market-data/src/technical

grep -R "signal_engine_version" packages/market-data/src/technical
grep -R "MACD" packages/market-data/src/technical packages/market-data/test
grep -R "RSI" packages/market-data/src/technical packages/market-data/test
grep -R "BOLL" packages/market-data/src/technical packages/market-data/test
grep -R "ATR" packages/market-data/src/technical packages/market-data/test
! grep -R "buy_signal\|sell_signal\|stop_loss\|target_price\|position_size" packages/market-data/src/technical
```

## Row 5 — Entitlement + Rate limit

新增 acceptance：

```bash
npx vitest run packages/agent-runtime/src/entitlement
npx vitest run apps/worker/src/tool-gateway

grep -R "FREE_TIER_NOT_ENTITLED" packages apps
grep -R "PROVIDER_RATE_LIMITED" packages apps
grep -R "BATCH_FETCH_NOT_ALLOWED" packages apps
grep -R "FULL_MARKET_SCAN_BLOCKED" packages apps
grep -R "BACKGROUND_REFRESH_BLOCKED" packages apps
```

## Row 6 — Agent integration + template

新增 acceptance：

```bash
npx vitest run packages/agent-runtime/src

grep -R "analyze_public_technical_signal" packages/agent-runtime/src apps/worker/src
grep -R "tool.started" packages apps
grep -R "tool.finished" packages apps
grep -R "answer.final" packages apps
grep -R "public_observation_signal" packages/agent-runtime/src
grep -R "retrieved_at" packages/agent-runtime/src
```

## Row 7 — Post-check + transcript

新增 acceptance：

```bash
npx vitest run packages/agent-runtime/src/post-check
npx vitest run packages/agent-runtime/src/transcript

grep -R "temporary_only" packages apps
grep -R "POST_CHECK_TRADE_ADVICE_BLOCKED" packages apps
grep -R "AUTHORIZED_CLAIM_BLOCKED" packages apps
! grep -R "raw.*bars.*persist.*true" packages apps
```

## Row 8 — UI consent + signal card

新增 acceptance：

```bash
npx vitest run apps/web/src

grep -R "public_observation_signal" apps/web/src
grep -R "临时公开\|temporary public" apps/web/src
grep -R "24 小时\|24 hours" apps/web/src
grep -R "非授权行情验证\|not authorized" apps/web/src
! grep -R "批量导出\|batch export\|常驻下载\|download api" apps/web/src
```

## Row 9 — Beta guardrails + release gate evidence

新增 acceptance：

```bash
npx vitest run packages/agent-runtime/src/kill-switch
npx vitest run apps/worker/src/tool-gateway
npx vitest run packages/observability/src

grep -R "KILL_SWITCH_ACTIVE" packages apps
grep -R "AIPHABEE_EPHEMERAL_OHLCV_ENABLED" .
grep -R "ephemeral_ohlcv" packages apps
grep -R "Release Gate" plans/archive plans/sprints plans/prds
```

并要求 row 9 产出一份 release evidence：

```txt
plans/archive/20260703-ephemeral-ohlcv-release-gate.evidence.md
```

---

# 15. Release Gate Evidence 模板

建议 row 9 交付时生成：

```md
# Ephemeral OHLCV Skill Release Gate Evidence

Source PRD:
- plans/prds/20260703-2207-ohlcv-skill.prd.md

Source Sprint:
- plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md

Capability:
- technical_analysis_ephemeral

Tool:
- analyze_public_technical_signal

Data classification:
- public_observation_signal

## Gate Matrix

| # | Gate | Evidence | Status |
|---|------|----------|--------|
| 1 | 用户发起条件可验证 | test: USER_INITIATED_REQUIRED | pass |
| 2 | Generic 不能调用 | test: GENERIC_AGENT_TOOL_DENIED | pass |
| 3 | Research 不能后台调用 | test: BACKGROUND_REFRESH_BLOCKED | pass |
| 4 | symbol/timeframe/lookback 上限 | test: TOO_MANY_SYMBOLS / TOO_MANY_BARS | pass |
| 5 | raw OHLCV 不进平台 DB | grep: no market_bars write | pass |
| 6 | OHLCV 可进 LLM、可展示、bounded | fixture: detail_level=with_bars <=500 | pass |
| 7 | 不做常驻 API/批量 export/后台源 | UI + tool policy grep | pass |
| 8 | cache user-private + session scoped + TTL | cache fixture | pass |
| 9 | FastClaw 只能通过 Tool Gateway | integration fixture | pass |
| 10 | 输出 public_observation_signal | schema fixture | pass |
| 11 | 不声称 authorized / verified | post-check fixture | pass |
| 12 | 不含买卖持仓止损 | post-check fixture | pass |
| 13 | 全市场扫描被拒 | abuse fixture | pass |
| 14 | provider 失败优雅降级 | timeout/unavailable fixture | pass |
| 15 | kill switch | KILL_SWITCH_ACTIVE fixture | pass |
| 16 | transcript policy 已选定 | temporary_only fixture | pass |
| 17 | 第三方 provider 保留事实有合规口径 | UI/copy fixture | pass |
```

PRD release gate 正好有 17 条：用户发起、Generic 不可调用、Research 不可后台、请求上限、raw 不进平台 DB、bounded LLM/display、不做常驻 API/批量 export/后台源、cache 私有且 TTL、Tool Gateway、标记 `public_observation_signal`、不声称 authorized/verified、不含交易建议、拒全市场扫描、provider 失败降级、kill switch、transcript 策略、第三方 provider 保留事实披露。([GitHub][2])

---

# 16. 建议最终 sprint 表改法

原 9-row 不需要重排。建议只做两类改动：

第一，把 status 改 Approved，并加 Approval Addendum。

第二，把每行 acceptance 追加“traceability + registry + no fallback”断言。

可以把 row 1 改成这样：

```md
1 [ ] Ephemeral OHLCV Contract + Tool Policy(PRD §8/§13/§16) contract
`npx vitest run packages/agent-runtime/src packages/tool-registry/src` +
`npm run check:tool-registry` 通过:
docs/spec.md、.ai/context/capabilities.json、.ai/context/capability-source-map.json
均命中 `technical_analysis_ephemeral` / `analyze_public_technical_signal` /
`public_observation_signal`;
tool policy 拒 Generic、Research 需 `user_initiated`;
grep 命中 `raw_to_llm_context: true` / `raw_to_market_database: false` /
`raw_to_shared_cache: false` / `raw_to_chat_transcript` /
`provider_as_authorized_feed: false`;
output schema 含 `bars?` 与 `chat_transcript_policy`;
error codes 含 `RAW_OHLCV_PERSISTENCE_BLOCKED` /
`RAW_OHLCV_BATCH_EXPORT_BLOCKED` 且不含 `RAW_OHLCV_OUTPUT_BLOCKED`;
existing `get_price_history` 未被注册为该 skill 的 entrypoint.
(pending)
```

可以把 row 9 改成这样：

```md
9 [ ] Beta Guardrails + kill switch + 监控 + Release Gate Evidence
(PRD §20 Sprint E/§21#15) contract
kill switch fixture: flag off 时 tool 全拒返回 `KILL_SWITCH_ACTIVE`;
abuse 测试套件(后台/批量/全市场/raw 违规导出)全绿;
`grep` 断言 beta flag gate 存在;
监控埋点(rate-limit/violation/cost/provider/cache/post-check)事件 schema 测试通过;
产出 `plans/archive/*ephemeral-ohlcv-release-gate.evidence.md`,
逐条覆盖 PRD §21 17 个 gate.
(pending)
```

---

# 17. 推荐执行顺序

```txt
A. approve sprint only
B. row 1 $think：contract / capability / registry / policy
C. row 1 implementation
D. row 2 provider + normalize
E. row 3 cache + timeout
F. row 4 indicators
G. row 5 entitlement + anti-batch
H. row 6 agent tool integration
I. row 7 post-check + transcript
J. row 8 UI
K. row 9 beta guardrails + release evidence
```

最重要的是：**Row 1 不要太小**。这不是普通 schema task，而是整条能力的“边界锁”。只要 row 1 锁住 `docs/spec`、`.ai/context`、`tool-registry`、`agent-runtime policy`，后面 provider/cache/signal/UI 都不容易跑偏。

---

# 18. 一句话 approve 版本

可以直接给执行代理：

```txt
Approved with addendum.

Approve `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
as an ordered backlog only; implementation remains 0/9.

Before provider work starts, Row 1 must bind the capability across
docs/spec.md, .ai/context/capabilities.json,
.ai/context/capability-source-map.json, packages/tool-registry,
and packages/agent-runtime.

The runtime entrypoint is `analyze_public_technical_signal`;
capability is `technical_analysis_ephemeral`;
data classification is `public_observation_signal`.

Do not reuse `get_price_history` as this skill.
No fallback synthesis is allowed.
Invalid/missing provider-owned values fail closed.
```

这版补充方案的重点是把“PRD 上合理”推进到“代码库可执行、可 grep、可 vitest、可 release gate 对齐”。原 9-row 拆分保留；只补强 row 1 的追溯面和 row 9 的 release evidence，中间每行加 machine-checkable 断言。

[1]: https://github.com/Ancienttwo/aiphabee/blob/main/plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md "aiphabee/plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md at main · Ancienttwo/aiphabee · GitHub"
[2]: https://github.com/Ancienttwo/aiphabee/blob/main/plans/prds/20260703-2207-ohlcv-skill.prd.md "aiphabee/plans/prds/20260703-2207-ohlcv-skill.prd.md at main · Ancienttwo/aiphabee · GitHub"
[3]: https://github.com/Ancienttwo/aiphabee/blob/main/package.json "aiphabee/package.json at main · Ancienttwo/aiphabee · GitHub"
[4]: https://github.com/Ancienttwo/aiphabee/blob/main/AGENTS.md "aiphabee/AGENTS.md at main · Ancienttwo/aiphabee · GitHub"
[5]: https://github.com/Ancienttwo/aiphabee/blob/main/.ai/context/capabilities.json "aiphabee/.ai/context/capabilities.json at main · Ancienttwo/aiphabee · GitHub"
[6]: https://github.com/Ancienttwo/aiphabee/blob/main/packages/tool-registry/src/index.ts "aiphabee/packages/tool-registry/src/index.ts at main · Ancienttwo/aiphabee · GitHub"
[7]: https://github.com/Ancienttwo/aiphabee/blob/main/packages/market-data/src/index.ts "aiphabee/packages/market-data/src/index.ts at main · Ancienttwo/aiphabee · GitHub"
