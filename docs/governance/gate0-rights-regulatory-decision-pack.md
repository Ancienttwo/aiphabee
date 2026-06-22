# Gate 0 Rights & Regulatory Decision Pack

> **Status**: Evidence collection ready; external approvals pending
> **Last Updated**: 2026-06-22
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Sprint Task**: `gate0-rights-regulatory-decision-pack`
> **Runtime Default**: `DEFAULT_DENY` for any unconfirmed field, channel, user type, geography, export, cache, or derived-data use
> **Intake Check**: `npm run check:gate0-external-evidence-intake`
> **Signed Evidence Check**: `npm run check:gate0-signed-evidence-manifest`

This packet records the Gate 0 decision surface for AiphaBee. It is not legal
advice and does not grant product launch approval. Its purpose is to make the
rights, regulatory, privacy, commercial, and signature gaps explicit before any
large-scale Web Agent, Data Gateway, or MCP implementation begins.

The executable intake contract is
`deploy/governance/gate0-external-evidence-intake.contract.json`. It keeps all
external approval flags false until signed evidence references are supplied.
The signed evidence manifest is
`deploy/governance/gate0-signed-evidence-manifest.contract.json`; it records
only redacted locators, SHA-256 hashes, approver metadata, signed dates, and
acceptance status, and currently keeps all six required packets `missing`.

## Decision State

| Gate | State | Blocking Reason | Required Evidence |
|---|---|---|---|
| Field-level data rights | Blocked | No signed field-level partner/HKEX rights matrix is present in repo | Signed matrix covering the 11 PRD §14.1 dimensions |
| MCP/API machine-readable redistribution | Blocked | Web display rights cannot be inferred as MCP/API rights | Contract clause explicitly allowing machine-readable redistribution |
| HKEX / vendor licensing | Blocked | Current partner licence and AiphaBee redistribution role are unverified | Written confirmation of End-user vs Market Data Vendor obligations, subscriber reporting, non-display use, and fee treatment |
| Type 4 / research-tool classification | Blocked | No Hong Kong legal/compliance written opinion for actual product pages, prompts, pricing, and interaction model | Counsel/compliance memo with allowed/disallowed feature list |
| MVP boundary copy | Ready for review | Draft copy is available but not approved by counsel/compliance | Signed-off product, prompt, and marketing copy |
| PCPD / PDPO privacy path | Ready for review | Governance path is drafted; DPIA/PIA and vendor controls are not complete | Privacy impact assessment, retention rules, vendor/model risk review |
| Commercial settlement | Blocked | Data partner charging basis is not selected | Signed settlement schedule by dataset, channel, client type, geography, and usage metric |
| Gate 0 decision signatures | Blocked | No signature record exists | CEO, Business, Data, Compliance, Engineering sign-off |

## Official Boundary Checks

Verified on 2026-06-20 against official/public primary sources:

| Boundary | Source | Product Implication |
|---|---|---|
| HKEX internal use vs redistribution | HKEX Market Data FAQ says internal use maps to End-user Licence, while redistribution to customers requires a Market Data Vendor Licence. | AiphaBee must not treat partner/internal use as customer redistribution permission. |
| HKEX fee/non-display categories | HKEX Market Data Vendors fee page lists redistribution fees, delayed data fees, subscriber fees, and non-display usage categories. | MCP/API, caching, derived-data, and automated processing need explicit fee/right treatment. |
| SFC Type 4 / advisory risk | SFC licensing guidance lists Type 4 as advising on securities and notes that analytical tools identifying investment possibilities or recommendations can fall within advising risk. | Interactive, personalized, recommendation-like Agent features need written classification before launch. |
| PCPD AI personal-data governance | PCPD AI Model Framework targets organisations procuring, implementing, and using AI systems involving personal data and maps to PDPO DPPs. | Account, workspace, prompt, run, usage, and vendor/model logs require privacy-by-design controls. |

Sources:
- HKEX Market Data FAQ: https://www.hkex.com.hk/Global/Exchange/FAQ/Market-Data?sc_lang=en
- HKEX Market Data Vendors fees: https://www.hkex.com.hk/Services/Rules-and-Forms-and-Fees/Fees/Securities-%28Hong-Kong%29/Market-Data/Market-Data-Vendors?sc_lang=en
- SFC licensing guidance: https://www.sfc.hk/en/Regulatory-functions/Intermediaries/Licensing/Do-you-need-a-licence-or-registration
- PCPD AI Model Framework: https://www.pcpd.org.hk/english/resources_centre/publications/files/ai_protection_framework.pdf

## Field-Level Rights Matrix v0

Legend:
- `ALLOW`: explicit written permission exists.
- `DENY`: explicit written prohibition exists.
- `UNCONFIRMED`: no written evidence in repo.
- Runtime rule for `UNCONFIRMED`: `DEFAULT_DENY`.

| Data Class | Likely Source / Owner | Web Display | MCP/API | Export | Derived Data | Time Range / Delay | Cache / Retention | User / Geography | Reporting | Audit / Termination | Commercial Basis | Runtime Default | Evidence State |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Security identity and listing reference data | Partner, HKEX, issuer documents | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Missing signed rights matrix |
| EOD / delayed quote snapshot | Partner / HKEX market data | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Missing HKEX/vendor status |
| Historical OHLCV and volume | Partner / HKEX market data | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Missing 30-year history rights |
| Corporate actions | Partner, HKEX, issuer documents | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Missing source-specific rights |
| Financial facts and restatements | Issuer documents, partner standardization | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Missing raw vs standardized rights |
| Announcement metadata and excerpts | HKEX/issuer documents, partner index | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Missing excerpt/citation rights |
| Deterministic ratios and returns | AiphaBee derived from licensed inputs | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Input rights and derived rights unresolved |
| Evidence / lineage metadata | AiphaBee, partner source IDs | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Needs contract allowance for exposing source IDs |
| Account, workspace, run, usage logs | AiphaBee personal / operational data | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | UNCONFIRMED | DEFAULT_DENY | Needs privacy retention and vendor review |

## Runtime Enforcement Requirements

These requirements are binding for later Data Gateway and Tool Registry work:

- Rights evaluation must use `channel x plan x field x time_range x geography x export x cache x derived_use`.
- Missing policy rows fail closed with `DATA_NOT_LICENSED`.
- Web display permission does not imply MCP/API permission.
- MCP/API permission does not imply export, caching, bulk retrieval, or commercial redistribution.
- Derived metrics must inherit the strictest unresolved input restriction until partner/HKEX terms say otherwise.
- Responses must include visible data status: `as_of`, `market_status`, delay label, `data_version`, `methodology_version`, and provenance when licensed.
- Internal usage logs containing user/run/prompt/payment data must be governed separately from market-data licensing.

## HKEX / Vendor Licensing Questions

These questions must be answered in writing:

1. Is the data partner already a Market Data Vendor for the relevant HKEX feeds and product classes?
2. If yes, does that licence permit AiphaBee to redistribute to AiphaBee end users and external MCP clients?
3. Is AiphaBee itself a vendor, sub-vendor, application provider, end-user, or customer-facing redistributor?
4. Which data classes are real-time, delayed by at least 15 minutes, EOD, or non-HKEX/issuer-derived?
5. Are MCP/API responses treated as redistribution, non-display usage, derived-data usage, subscriber access, or another fee class?
6. Are users, devices, workspaces, API keys, or AI clients reportable subscribers?
7. What are the deletion, cache purge, audit, and service-stop obligations after contract termination?

## Type 4 / Product Boundary Review

### Features Requiring Written Opinion

| Feature | Risk Level | Required Classification |
|---|---|---|
| "Should I buy/sell/hold?" style prompts | High | Must refuse direct advice or route to evidence-only research unless licensed route exists |
| Ranking, score, or top-pick outputs | High | Must confirm whether they identify investment possibilities/recommendations |
| Natural-language screener | Medium-High | Must show editable criteria and avoid personalized suitability conclusions |
| Evidence-grounded company research | Medium | Must keep research/data explanation boundary and disclaim unavailable facts |
| Deterministic historical calculations | Medium | Must avoid converting analysis into recommendation |
| Watchlist alerts | Medium | Must notify factual changes only, not trading instructions |

### Draft MVP Boundary Copy

Use this copy as the review baseline:

> AiphaBee provides research, analysis, and data interpretation tools for Hong
> Kong market information. It does not provide personalized investment advice,
> buy/sell/hold recommendations, target portfolio weights, suitability
> assessments, order execution, or guaranteed outcomes. Users remain responsible
> for their own investment decisions.

Prompt behavior baseline:

- If asked for a buy/sell decision, answer with evidence categories, risks,
  unknowns, and user-controlled next steps instead of a recommendation.
- Do not collect risk tolerance for suitability decisions in the MVP.
- Do not output target weight, stop-loss, take-profit, or auto-rebalance
  instructions.
- Do not rank by commercial relationship, broker commission, or sponsorship.

## PCPD / Privacy Path

Minimum privacy-by-design controls before alpha:

- Data inventory for account, workspace, prompt, uploaded document, run, tool-call, billing, usage, and support data.
- Purpose limitation for model/tool logs; no reuse for unrelated training or marketing without explicit basis.
- Retention schedule for prompts, runs, evidence snapshots, API logs, and billing records.
- Vendor/model risk review for AI providers, observability systems, and data processors.
- User access/export/delete path for account data where applicable.
- PII minimization in prompts, tool calls, telemetry, support exports, and partner settlement reports.
- Incident response path for prompt leakage, unauthorized data access, and vendor breach.

## Commercial Settlement Dimensions

The partner settlement schedule must choose explicit treatment for:

- Data set and data class.
- Channel: Web, MCP/API, export, static report, internal ops.
- Client type: Free, Plus, Pro, Developer, Team, Enterprise, internal staff.
- Geography and investor category if contractually relevant.
- Usage metric: subscriber, device, workspace, API key, request, row, field,
  token, report, cache, or revenue share.
- Delay level: real-time, 15-minute delayed, EOD, historical batch.
- Derived-data treatment: raw field, simple calculation, benchmarked metric,
  AI-generated explanation, static report.
- Audit/reporting cadence and required identifiers.
- Minimum guarantee, overage, termination, and data deletion economics.

## Signature Register

| Owner | Required Decision | State | Evidence Pointer |
|---|---|---|---|
| CEO | Approve Gate 0 go/no-go and fallback if MCP rights fail | Pending | TBD |
| Business / Partnerships | Confirm partner rights, commercial terms, reporting, termination | Pending | TBD |
| Data Owner | Confirm field inventory, source lineage, data versioning obligations | Pending | TBD |
| Compliance / Counsel | Confirm Type 4/product boundary and marketing/prompt copy | Pending | TBD |
| Privacy Owner | Confirm PDPO/PCPD path, vendor controls, retention | Pending | TBD |
| Engineering | Confirm runtime default-deny enforcement design | Pending | TBD |

## Go / No-Go Rule

Gate 0 is not green until:

1. Every P0 field has an explicit `ALLOW` or `DENY` state for every relevant channel and use.
2. MCP/API redistribution is explicitly allowed or the MCP product line is formally paused.
3. Type 4/product-boundary opinion is signed for actual UX, prompts, marketing, and pricing.
4. Privacy path and commercial settlement dimensions are approved.
5. The signature register is complete.

Until then, Phase 1 implementation may only build neutral scaffolding or internal-only
fixtures that cannot expose unlicensed market data.
