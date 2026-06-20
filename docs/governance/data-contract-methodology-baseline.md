# Data Contract & Methodology Baseline

> **Status**: Design baseline complete; partner signature pending
> **Last Updated**: 2026-06-20
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Sprint Task**: `data-contract-methodology-baseline`
> **Baseline Version**: `methodology_version=2026-06-20.phase0.v0`

This document fixes AiphaBee's Phase 0 data contract and methodology baseline
before product code or live data ingestion begins. It is a reviewable design
baseline, not a signed partner data contract.

## Current Decision State

| Area | State | Blocking Gap |
|---|---|---|
| Partner data contract shape | Baseline complete | Partner field inventory and signed SLA still pending |
| Security master model | Baseline complete | Physical schema and migration pending |
| Time/version model | Baseline complete | Source feed timestamps pending |
| Point-in-time rule | Baseline complete | Query engine implementation pending |
| Price adjustment methodology | Baseline complete | Corporate-action golden cases pending |
| Financial fact/restatement model | Baseline complete | Partner statement taxonomy pending |
| Metric definition library v0 | Baseline complete | Full metric catalog pending |
| HK trading calendar model | Baseline complete | Calendar ingestion source and validation pending |
| Data pipeline design | Baseline complete | Raw/standardized/serving implementation pending |

## Partner Data Contract v0

Every partner data set must register a contract record before ingestion.

| Field | Required Rule |
|---|---|
| `dataset_id` | Stable snake_case ID, unique across partners |
| `partner_id` | Stable partner/vendor ID |
| `source_system` | Partner system, HKEX/issuer source, or internal source |
| `rights_policy_version` | Must link to Gate 0 rights policy; missing rights means no serving |
| `schema_version` | Semantic schema version for incoming records |
| `methodology_version` | Methodology version applied during standardization |
| `delivery_mode` | `batch`, `cdc`, or `controlled_api` |
| `delivery_schedule` | Expected cadence and timezone |
| `sla_freshness` | Maximum allowed lag by market status and product tier |
| `sla_completeness` | Required record completeness threshold |
| `correction_policy` | How partner sends deletes, restatements, late updates, and backfills |
| `source_record_id` | Partner/source immutable row ID; required for lineage |
| `source_published_at` | First market/source availability timestamp when available |
| `received_at` | AiphaBee receipt timestamp |

Contract invariants:

- Do not expose partner raw APIs directly to Web Agent or MCP.
- Every record entering Raw/Bronze keeps `source_record_id`, payload hash,
  partner file/API batch ID, and `received_at`.
- Every standardized record carries `data_version`, `methodology_version`,
  `rights_policy_version`, and lineage to raw records.
- Partner contract changes create a new `schema_version`; breaking changes need
  migration notes and replay impact analysis.
- SLA misses must be visible to Serving and Gateway as data-status warnings.

## Canonical Entity Model

### `company`

Represents the legal/business issuer, not a tradable security.

| Field | Rule |
|---|---|
| `company_id` | Internal stable ID |
| `legal_name` | Official legal name |
| `display_name` | User-facing preferred name by locale |
| `incorporation_jurisdiction` | Jurisdiction code when available |
| `industry_classification_id` | Versioned industry classification pointer |
| `valid_from` / `valid_to` | Validity for company identity attributes |

### `instrument`

Represents a financial instrument issued by a company.

| Field | Rule |
|---|---|
| `instrument_id` | Internal stable ID |
| `company_id` | Parent company |
| `instrument_type` | `ordinary_share`, `etf`, `reit`, `preferred_share`, etc. |
| `isin` / `sedol` / `figi` | Optional external identifiers |
| `currency` | Instrument trading or denomination currency |
| `status` | `active`, `suspended`, `delisted`, `pending`, `unknown` |
| `valid_from` / `valid_to` | Validity for instrument identity |

### `listing`

Represents a venue-specific tradable listing.

| Field | Rule |
|---|---|
| `listing_id` | Internal stable ID |
| `instrument_id` | Parent instrument |
| `exchange` | `HKEX` for MVP |
| `board` | `MAIN`, `GEM`, or other official board |
| `ticker` | Current trading code |
| `lot_size` | Board lot when available |
| `trading_currency` | Currency used for trading |
| `listing_date` / `delisting_date` | Venue lifecycle dates |
| `timezone` | `Asia/Hong_Kong` |

### `identifier_history`

Tracks ticker/name/identifier validity over time.

| Field | Rule |
|---|---|
| `identifier_history_id` | Internal stable ID |
| `entity_type` | `company`, `instrument`, or `listing` |
| `entity_id` | Referenced entity |
| `identifier_type` | `ticker`, `short_name`, `legal_name`, `isin`, etc. |
| `identifier_value` | Value valid in interval |
| `valid_from` / `valid_to` | Closed-open validity interval |
| `published_at` | When the market could know this identifier change |

Invariant: never overwrite historical tickers or names. User input resolution
must consider `valid_from`, `valid_to`, and `published_at`.

## Time and Version Model

| Timestamp / Version | Meaning | Required On |
|---|---|---|
| `period_start` / `period_end` | Financial reporting period | financial facts, segment facts |
| `published_at` | First time information was market-knowable | all facts used in historical answers |
| `effective_at` | Economic/legal effect date | corporate actions, rules, identifiers |
| `ingested_at` | AiphaBee received or replayed the record | raw and standardized records |
| `restated_at` | Correction/restatement timestamp | financial facts and corrected records |
| `valid_from` / `valid_to` | Identity/classification validity | company, listing, identifiers, classifications |
| `data_version` | Reproducible data batch or snapshot | every serving row |
| `methodology_version` | Calculation/standardization method | standardized and derived rows |
| `rights_policy_version` | Rights policy applied to serving | every rights-checked response |

Rules:

- Historical answers use `published_at <= user_as_of`.
- Identity resolution uses records whose `published_at <= user_as_of` and whose
  validity interval contains the target date.
- Latest restated values must not replace prior facts; they are additional
  versions with reason and source.
- `data_version` is immutable once exposed in evidence snapshots.

## Point-In-Time Query Rule

Inputs:

- `user_as_of`: timestamp in `Asia/Hong_Kong` unless user specifies otherwise.
- `question_time_range`: date or interval requested by the user.
- `entity_scope`: resolved company/instrument/listing IDs.
- `rights_context`: user, workspace, plan, channel, fields, geography, export.

Algorithm:

1. Resolve entity candidates using only identifiers published by `user_as_of`.
2. Select facts where `published_at <= user_as_of`.
3. Select records whose effective/valid interval overlaps the requested time
   range.
4. If multiple versions exist, select the latest `published_at` and
   `restated_at` visible by `user_as_of`; preserve older versions for lineage.
5. Apply rights policy before returning rows.
6. Return `as_of`, `data_version`, `methodology_version`, and lineage.

Failure modes:

- Unknown identifier: return candidates or `NOT_FOUND`, never guess.
- Future data required: return `POINT_IN_TIME_UNAVAILABLE`.
- Rights denied: return `DATA_NOT_LICENSED`.
- Quality hold: return `DATA_QUALITY_HOLD`.

## Price Adjustment Methodology

Adjustment basis:

| Adjustment | Meaning | Uses |
|---|---|---|
| `raw` | Exchange-reported trade price with no adjustment | audit, execution-like historical display |
| `split_adjusted` | Adjusts share-count events such as split/consolidation/bonus issue | price trend and technical analysis |
| `total_return_adjusted` | Includes cash dividends and reinvestment assumption | return comparison and long-horizon performance |

Required corporate action fields:

- `action_type`: dividend, split, consolidation, rights, placement, buyback,
  spin-off, delisting, other.
- `announcement_date`, `ex_date`, `record_date`, `payable_date`,
  `effective_at`.
- `ratio`, `cash_amount`, `currency`, `withholding_assumption`,
  `reinvestment_price_rule`.
- `source_record_id`, `data_version`, `methodology_version`.

Methodology rules:

- Use closed-open adjustment intervals.
- Keep raw price bars immutable.
- Generate adjusted series as derived rows with separate methodology version.
- Declare whether adjustment is forward-adjusted or backward-adjusted per output.
- For total return, default reinvestment price is ex-date close when available;
  if unavailable, return a warning and avoid silent interpolation.
- Suspended days are calendar sessions with no trading bar, not zero-volume
  synthetic bars unless the exchange/partner explicitly reports them.
- Delisted instruments keep historical bars and terminal status.

## Financial Facts and Restatements

Canonical grain:

`company_id + statement_type + metric_id + period_start + period_end + fiscal_period + currency + unit + accounting_standard + version`

Required fields:

- reported value and standardized value;
- reported currency, standardized currency, unit, scale;
- accounting standard;
- filing/document reference and page/section where available;
- `published_at`, `ingested_at`, `restated_at`;
- restatement reason: issuer restatement, accounting policy change, partner
  correction, AiphaBee normalization fix, late filing, other;
- source lineage and methodology version.

Rules:

- Do not overwrite older financial facts.
- Standardized values are derived facts; keep the reported value unchanged.
- Missing values remain null with a reason; do not fill with zero.
- Currency conversion, if introduced later, must be a derived metric with FX
  source, timestamp, and methodology version.

## Metric Definition Library v0

Every metric definition needs:

| Field | Rule |
|---|---|
| `metric_id` | Stable unique ID, e.g. `revenue`, `gross_margin`, `pe_ttm` |
| `display_name` | zh-Hant, zh-Hans, en labels |
| `formula` | Deterministic expression or source fact reference |
| `dependencies` | Fact IDs, price fields, corporate actions, FX inputs |
| `applicable_industries` | Explicit list or `all` |
| `time_basis` | annual, interim, quarterly, TTM, point-in-time |
| `currency_policy` | native, reporting, trading, converted |
| `unit_policy` | shares, HKD, percent, ratio, count |
| `missing_policy` | null, not applicable, insufficient data |
| `negative_denominator_policy` | allowed, null, warning, not meaningful |
| `methodology_version` | Version and effective date |
| `explanation` | User-readable definition and caveats |

Seed metric groups:

- Financial statement facts: revenue, gross profit, operating profit, net income,
  assets, liabilities, equity, operating cash flow, capex.
- Profitability: gross margin, operating margin, net margin, ROE, ROA.
- Growth: YoY revenue growth, YoY net income growth.
- Valuation: market cap, PE TTM, PB, PS, EV/EBITDA when inputs are licensed.
- Risk/return: daily return, volatility, max drawdown, beta.

## HK Trading Calendar Model

Official baseline checked on 2026-06-20:

- HKEX securities market has full-day and half-day trading session definitions.
- HKEX publishes calendar events and holidays.
- HKEX severe weather trading arrangements have been in effect since 2024, and
  markets continue according to the pre-determined trading calendar during
  severe weather conditions.

Sources:
- HKEX Securities Market trading hours: https://www.hkex.com.hk/Services/Trading-hours-and-Severe-Weather-Arrangements/Trading-Hours/Securities-Market?sc_lang=en
- HKEX Calendar: https://www.hkex.com.hk/News/HKEX-Calendar?sc_lang=en
- HKEX Severe Weather Arrangements overview: https://www.hkex.com.hk/Services/Trading-hours-and-Severe-Weather-Arrangements/Severe-Weather-Arrangements/Overview?sc_lang=en

Calendar entities:

| Entity | Required Fields |
|---|---|
| `market_calendar` | `market`, `date`, `timezone`, `is_trading_day`, `calendar_source_version`, `data_version` |
| `session` | `session_type`, `start_at`, `end_at`, `auction_random_close`, `is_half_day`, `status` |
| `holiday_event` | `event_type`, `description`, `source_url`, `published_at` |
| `weather_arrangement` | `arrangement_version`, `applies_from`, `source_url`, `notes` |

Rules:

- Store times in UTC and render in `Asia/Hong_Kong`.
- Half-day sessions are explicit sessions, not shortened full days.
- Severe weather does not automatically imply market closure; closure/continuity
  must follow current HKEX arrangement source.
- Calendar revisions create new `calendar_source_version`.

## Data Product Pipeline

```text
Partner source / issuer source
  -> Raw immutable snapshot
  -> Standardization
  -> Quality reconciliation
  -> Derived metrics / adjusted series
  -> Serving Store
  -> Data Access Gateway
  -> Web Agent / MCP / internal ops
```

Stage requirements:

| Stage | Contract |
|---|---|
| Raw immutable snapshot | Store exact payload/file/API response, source IDs, hashes, receipt time, partner batch ID |
| Standardization | Map to canonical entities, units, currencies, timestamps, methodology version |
| Quality reconciliation | Validate keys, time, OHLC, company actions, financial identities, partner/source consistency |
| Derived metrics | Compute only deterministic metrics with definition and methodology version |
| Serving Store | Expose only quality-passed, rights-policy-checked, versioned rows |
| Data Access Gateway | Enforce rights, field selection, time limits, row limits, cache key, usage ledger hooks |

Cache key minimum:

`tenant_id + user_plan + channel + rights_policy_version + dataset_id + field_set + entity_scope + time_range + data_version + methodology_version`

## Acceptance Checklist

- [x] Partner data contract baseline includes field dictionary, time semantics,
  SLA, and sync mode.
- [x] Security master separates company, instrument, listing, and identifier
  history.
- [x] Time/version model includes `period_start/end`, `published_at`,
  `effective_at`, `ingested_at`, `restated_at`, `valid_from/to`, and
  `data_version`.
- [x] Point-in-time query rule uses `published_at` and blocks future leakage.
- [x] Adjustment methodology defines `raw`, `split_adjusted`, and
  `total_return_adjusted`.
- [x] Financial fact/restatement model preserves historical versions.
- [x] Metric definition library v0 defines metric metadata and seed groups.
- [x] HK trading calendar model covers timezone, half days, and severe weather
  arrangement versioning.
- [x] Pipeline design covers Raw -> Standardized -> Quality -> Derived ->
  Serving -> Gateway.

## Remaining DoD Gap

Sprint 0.2's design backlog is complete, but the DoD remains open until the
partner data contract is signed and reviewed with actual partner field names,
source IDs, SLAs, and delivery samples.
