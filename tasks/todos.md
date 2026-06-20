# Deferred Goal Ledger

> **Status**: Backlog
> **Updated**: (migration)
> **Scope**: Medium/long-term goals deferred from active plan execution

Current plan tasks live in the active plan's `## Task Breakdown`.
Do not duplicate that execution checklist here. Record only work intentionally deferred beyond this slice, with the tradeoff and revisit trigger.

## Deferred Goals

| Goal | Why Deferred | Tradeoff | Revisit Trigger |
|------|--------------|----------|-----------------|
| External Gate 0 approvals: rights matrix, HKEX/vendor role, Type 4 written opinion, commercial terms, signatures | Requires data partner, legal/compliance, business, and executive evidence outside this repo | Phase 1 market-data and MCP surfaces remain blocked; docs-only packet uses `DEFAULT_DENY` | Signed Gate 0 evidence arrives or leadership records a signed waiver/fallback |
| Partner-signed data contract and real source samples | Current data methodology is a baseline, not a signed contract | Physical schema and ingestion must avoid assuming partner field names/SLAs | Partner provides signed contract, field dictionary, source IDs, delivery samples, and SLA |
| Executable golden samples and quality-rule CI | Current quality/commercial baseline is design-only | `DATA_QUALITY_HOLD` behavior is specified but not runnable | Engineering scaffold exists with test runner and sample fixture storage |
| Engineering runtime scaffold | Current repo has no package manager, runtime app, CI, Wrangler config, or env examples | Product code cannot run locally or deploy to staging | Start `engineering-runtime-scaffold` and verify install/lint/typecheck/test + worker health |
| P0 owner/issue/test/release traceability | Tracker §M maps requirement to sprint only | Release governance cannot prove owner, test, or gate coverage per P0 item | Issue tracker or repo ledger is selected and populated |
| Remote branch reconciliation before push | Local `main` is ahead and behind origin | Push may fail or conflict | Fetch/rebase/merge remote commit before pushing local commits |
