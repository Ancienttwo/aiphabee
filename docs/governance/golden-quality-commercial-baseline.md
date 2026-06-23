# Golden Samples, Quality Rules & Commercial Baseline

> **Status**: Design baseline complete; executable fixtures and commercial sign-off pending
> **Last Updated**: 2026-06-20
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Sprint Task**: `golden-quality-commercial-baseline`
> **Baseline Version**: `quality_commercial_version=2026-06-20.phase0.v0`

This document defines AiphaBee's Phase 0 golden sample plan, data quality rule
baseline, quality-hold/correction workflow, package entitlement matrix, weighted
credits model, unit economics model, and Free-tier abuse limits.

It is a reviewable baseline. It does not claim that golden sample fixtures,
quality-rule code, billing code, or partner-commercial approvals already exist.

## Execution Update - 2026-06-20 14:45 +08

`docs/governance/golden-regression-hook.md` installs the CI mount point for
future golden sample regression:

- `npm run test:golden`
- `scripts/check-golden-regression.mjs`
- `.github/workflows/ci.yml` `Golden Regression Hook`
- `tests/golden/README.md`

At the time of this hook-only slice, no real fixture manifest existed yet. The
hook reported `not_configured` until `tests/golden/manifest.json` was committed.
The later 15:45 update below supersedes that state with strict executable
fixtures.

## Execution Update - 2026-06-20 15:45 +08

`docs/governance/golden-quality-rule-fixtures.md` adds an executable synthetic
v0 fixture corpus and deterministic quality-rule gate:

- `tests/golden/manifest.json`;
- 8 synthetic fixture samples under `tests/golden/fixtures`;
- 12 deterministic quality rules in `scripts/check-golden-regression.mjs`;
- strict `npm run test:golden` with 5 pass / 1 warn / 2 hold;
- `DATA_QUALITY_HOLD` assertions for held records.

This is not a partner-approved production golden corpus and does not satisfy
the PRD §10.7 target volume. Commercial cost review remains pending.

## Current Decision State

| Area | State | Remaining Gate |
|---|---|---|
| Golden sample categories | Baseline complete | Actual security/case IDs and fixture data pending |
| Golden regression hook | CI hook complete and strict fixture gate active | Production partner corpus pending |
| Quality rule catalog | Baseline complete; 12-rule synthetic executable gate active | Serving/Gateway runtime quality-hold implementation pending |
| Quality hold workflow | Baseline complete | Runtime Serving/Gateway implementation pending |
| Data correction workflow | Baseline complete | Impact graph and notification implementation pending |
| Package entitlement matrix | Baseline complete | Rights-cost validation and pricing approval pending |
| Weighted credits model | Baseline complete | Billing/usage ledger implementation pending |
| Unit economics model | Baseline complete | Data cost, LLM cost, and conversion assumptions pending |
| Free abuse limits | Baseline complete | Runtime rate limit and anomaly detection pending |

## Golden Sample Registry v0

Golden samples must be stored as immutable fixture manifests before Phase 1
tool implementation. Each sample needs a stable ID, source references, expected
canonical IDs, expected method versions, and acceptance checks.

### Sample Manifest Shape

| Field | Rule |
|---|---|
| `sample_id` | Stable ID, e.g. `hk_equity_delisted_001` |
| `sample_type` | `security`, `corporate_action`, `financial_restatement`, `identifier_change`, `multi_currency_dual_listing`, `index_constituent` |
| `instrument_scope` | company/instrument/listing IDs or pending external IDs |
| `source_records` | raw source IDs, filing URLs, partner record IDs, hashes |
| `event_dates` | published/effective/ex/payable/restated/valid intervals as relevant |
| `expected_outputs` | canonical entities, adjusted prices, restated facts, metric values, lineage |
| `rights_policy_version` | rights context used during fixture validation |
| `methodology_version` | expected method version |
| `quality_expectation` | pass, warn, hold, or manually reviewed |
| `review_owner` | data owner responsible for sign-off |

### Required Counts

| Category | Minimum | Coverage Requirements |
|---|---:|---|
| Cross-industry securities | 50-100 | Main Board, GEM, finance, property, consumer, tech, healthcare, industrials, utilities, energy, ETF/REIT where licensed |
| Complex corporate actions | 20 | Dividends, splits/consolidations, rights issues, placements, buybacks, spin-offs, delistings |
| Financial restatements | 20 | Issuer restatement, accounting policy change, partner correction, currency/unit correction |
| Code/name changes | 10 | Ticker reuse risk, issuer rename, listing transfer, historical Chinese/English name changes |
| Multi-currency / dual listing | 10 | HKD/RMB/multi-counter, dual-primary/secondary listing, FX-sensitive comparison |
| Index / benchmark history | Minimum representative set | Historical constituents, industry classification changes, benchmark membership dates |

### Acceptance Checks

- Entity resolution returns the expected candidates and never silently picks an
  ambiguous historical ticker.
- `published_at` point-in-time query excludes future records.
- Adjusted series reproduce expected raw, split-adjusted, and total-return
  values within declared tolerance.
- Financial restatements preserve prior versions and select the correct visible
  version for `user_as_of`.
- Rights policy blocks unlicensed fields and surfaces `DATA_NOT_LICENSED`.
- Quality-hold fixtures return `DATA_QUALITY_HOLD` instead of serving bad data.

## Quality Rule Catalog v0

Rule output states:

- `PASS`: row can continue.
- `WARN`: row can serve with visible warning.
- `HOLD`: row cannot enter Serving Store.
- `REJECT_RAW`: raw record is malformed and needs partner/source remediation.

| Rule ID | Area | Severity | Check | Failure State |
|---|---|---|---|---|
| `QK-001` | Primary key | Critical | Required natural keys and internal IDs are present and unique in version scope | HOLD |
| `QT-001` | Time | Critical | `published_at <= ingested_at`; validity intervals are not inverted | HOLD |
| `QT-002` | Point-in-time | Critical | Serving query cannot select records published after `user_as_of` | HOLD |
| `QU-001` | Currency/unit | Critical | Currency, unit, scale, and accounting standard present for financial facts | HOLD |
| `QP-001` | OHLC | Critical | `low <= open/close/high`, `low <= high`, negative price disallowed | HOLD |
| `QP-002` | Volume | Major | Volume and turnover are non-negative; zero-volume bars match exchange status | WARN/HOLD |
| `QP-003` | Duplicate bars | Major | No duplicate listing/date/session/adjustment records per version | HOLD |
| `QA-001` | Corporate action | Critical | Split/consolidation factor reconciles price and share-count change | HOLD |
| `QA-002` | Dividend | Major | Ex-date, record date, payable date, currency, and amount are coherent | WARN/HOLD |
| `QF-001` | Financial identity | Critical | Balance sheet equation and cash-flow identities reconcile within tolerance | HOLD |
| `QF-002` | Restatement | Major | Restated facts link to prior version and restatement reason | HOLD |
| `QF-003` | YoY anomaly | Major | Material YoY or scale/currency changes are flagged for review | WARN |
| `QD-001` | Filing dates | Critical | Filing `published_at` is not before period end unless explicitly allowed | HOLD |
| `QS-001` | Cross-source | Major | Partner/source totals reconcile within tolerance or produce exception record | WARN/HOLD |
| `QE-001` | Lifecycle | Critical | Delisted/suspended/code-change records keep historical validity intervals | HOLD |
| `QE-002` | Dual listing | Major | Currency, venue, identifier, and benchmark mapping are explicit | WARN/HOLD |
| `QR-001` | Rights | Critical | Serving row has active rights policy for requested channel/field/use | HOLD |
| `QL-001` | Lineage | Critical | Serving row traces to raw source and data/methodology version | HOLD |

## Quality Hold Workflow

```text
Raw/standardized row
  -> quality rule run
  -> PASS/WARN -> Serving candidate
  -> HOLD/REJECT_RAW -> quarantine
  -> triage owner review
  -> fix source or method
  -> replay affected versions
  -> release or keep held
```

Required state fields:

| Field | Rule |
|---|---|
| `quality_state` | `PASS`, `WARN`, `HOLD`, `REJECT_RAW`, `RELEASED` |
| `quality_run_id` | Rule-run identifier |
| `failed_rule_ids` | Array of failed rules |
| `hold_reason` | Human-readable reason |
| `severity` | critical, major, minor |
| `affected_entity_scope` | company/instrument/listing/metric/date range |
| `review_owner` | Data owner or rule owner |
| `released_at` | Required when a hold is released |

Gateway behavior:

- `HOLD` data does not enter normal Serving Store.
- Requests that would depend on held data return `DATA_QUALITY_HOLD` with
  affected scope and last known good `as_of` when available.
- `WARN` data may serve only with visible warnings and evidence metadata.
- Holds are counted separately from rights denials and tool failures.

## Data Correction Workflow

Correction states:

1. `DETECTED`: issue reported by rule, user, partner, or staff.
2. `SCOPED`: affected records, metrics, reports, and users are identified.
3. `ISOLATED`: affected serving rows are held or withdrawn.
4. `CORRECTED`: source/methodology/data fix is applied.
5. `REPLAYED`: derived metrics and evidence snapshots are recalculated.
6. `NOTIFIED`: impacted saved reports/users are notified when material.
7. `CLOSED`: audit record completed.

Correction record minimum:

- old value, new value, reason, source, reporter, approver;
- affected raw IDs, serving IDs, evidence snapshot IDs, report IDs;
- data version before/after;
- methodology version before/after if calculation changed;
- user notification level: none, in-product, email, support escalation;
- rollback plan and retained audit log.

## Package Entitlement Matrix v0

All entitlements remain subordinate to Gate 0 rights. A plan cannot grant a
field/channel/use that rights policy denies.

| Plan | Web Entitlements | MCP/API Entitlements | Export | Historical Range | Concurrency | Intended Boundary |
|---|---|---|---|---|---|---|
| Free | Basic Q&A, limited security profile, limited recent data, few saved items | Very small light-tool quota | None | Short trial window | Low | Value discovery, no bulk or commercial reuse |
| Plus | More Web Q&A, watchlist, longer history, basic comparisons | One connection, basic data quota | Limited UI export if rights allow | Medium range | Low-medium | Individual retail research |
| Pro | Full licensed Web P0 workflow, compare/screen, reports, alerts | Higher quota, all licensed P0 tools | Limited export/report with watermark if rights allow | Up to licensed 30-year range | Medium | Advanced individual research |
| Developer | Pro Web plus developer console | Multiple connections/API keys, pagination, overage billing | Machine-readable export only where explicitly licensed | Tiered by dataset | Medium-high | AI power user/internal app development |
| Team | Shared research library, workspace admin, seats | Workspace keys, audit logs, higher quota | Team exports where licensed | Licensed range | Higher | Small research teams |
| Enterprise | SSO, SLA, custom workflows, private data connectors | Custom tools/scopes, commercial authorization if contracted | Custom contract | Custom contract | Contracted | B2B/white-label/commercial use |

## Weighted Credits Model v0

Credit weights are provisional and must be recalibrated with real cost data.

| Operation | Weight | Cost Driver | Notes |
|---|---:|---|---|
| `resolve_security` | 1 | Low DB lookup | Ambiguity candidates included |
| `get_security_profile` | 1 | Low DB lookup | Includes profile and coverage metadata |
| `get_quote_snapshot` | 1-2 | Market data rights and freshness | Real-time, if licensed, costs more |
| `get_price_history` 1 year | 2 | Rows and cache | Single security |
| `get_price_history` 10 years | 5 | Rows and transfer | Single security |
| `get_price_history` 30 years | 10 | Rows, cache, partner terms | Single security, licensed only |
| `get_financial_facts` single company | 3-8 | Statement depth and restatement versions | More periods cost more |
| `compare_securities` 2-5 names | 5-15 | Tool fanout and derived metrics | Requires unified currency/unit warnings |
| `screen_securities` | 8-20 | Universe size and filter complexity | Needs pre-estimate and confirmation |
| `run_event_study` | 20-50 | Window size, benchmark, computation | P1/GA path |
| Deep research report | Estimated | Data tools + LLM + citation validation | Pre-authorize budget |

Charging rules:

- Pre-estimate high-cost tasks before execution.
- Reserve credits for long tasks; release unused reserved credits.
- System retries and partial recovery are not double-charged.
- Rights-denied and quality-hold responses can charge zero or a nominal lookup
  fee, but must not charge full data cost.
- Every debit links to `request_id`, `tool_name`, `tool_version`,
  `data_version`, `methodology_version`, and output hash.

## Unit Economics Model v0

Monthly contribution margin:

```text
subscription_revenue
+ overage_revenue
- allocated_fixed_data_license
- variable_data_fees
- llm_token_cost
- cloudflare_workers_db_search_storage
- payment_processing
- direct_support_cost
- partner_revenue_share
= contribution_margin
```

Targets:

| Segment | Target | Guardrail |
|---|---:|---|
| B2C paid | >70% long-term contribution margin | High-cost research budgets and cache/precompute |
| Developer/MCP | >60% contribution margin | Pagination, row caps, overage, anomaly detection |
| Team/Enterprise | Positive after implementation/support | Contracted minimums and custom SLA pricing |
| Free | Negative allowed only as acquisition cost | Strict quota, low concurrency, no bulk/export |

Review inputs required before price approval:

- partner fixed and variable data fees;
- real LLM cost by task class;
- storage/search/egress cost by historical range;
- support cost by segment;
- conversion and retention assumptions;
- abuse/fraud loss allowance.

## Free Tier Abuse Limits

Free exists for value discovery and onboarding.

Default limits until measured:

| Limit | Baseline |
|---|---|
| Account creation | Email/domain/device/IP risk throttles |
| Concurrent runs | 1 active run |
| Tool calls | Small daily/monthly budget |
| Historical data | Short range only; no 30-year history |
| MCP/API | Light tools only; no bulk pagination |
| Export/cache | Disabled |
| Reports | Limited saved items |
| Commercial reuse | Prohibited |

Abuse signals:

- high-volume sequential ticker sweeps;
- repeated pagination near max limits;
- multiple accounts sharing device/IP/payment patterns;
- tool calls with no Web engagement and high export intent;
- unusual user-agent/client churn;
- repeated rights-denied probing.

Mitigations:

- CAPTCHA or verification step-up;
- lower concurrency and row caps;
- temporary MCP disablement;
- force upgrade path for commercial/bulk use;
- audit event for support/compliance review.

## Acceptance Checklist

- [x] Golden sample categories and manifest shape are documented.
- [x] Required complex corporate action, restatement, identifier, dual-listing,
  and index sample categories are documented.
- [x] Automatic quality rules cover key/time/currency/OHLC/corporate-action/
  financial/announcement/cross-source/lifecycle cases.
- [x] Quality hold workflow returns `DATA_QUALITY_HOLD` before Serving.
- [x] Data correction workflow preserves old/new values, impact, replay,
  notification, and aiphabee_audit.
- [x] Package entitlement matrix separates Web and MCP/API entitlements.
- [x] Weighted credits model covers light tools through event study/deep reports.
- [x] Unit economics formula and margin targets are documented.
- [x] Free abuse limits are documented.

## Remaining DoD Gap

Sprint 0.3's design backlog is complete, but the DoD remains open until golden
sample fixtures and quality rules are executable in CI and the package/credits/
unit-economics model is reviewed against real partner and infrastructure costs.
