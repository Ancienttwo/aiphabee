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
| Executable golden samples and quality-rule CI | Current quality/commercial baseline is design-only; runtime test runner now exists but no sample fixture corpus or golden runner is wired | `DATA_QUALITY_HOLD` behavior is specified but not runnable | Golden fixtures are committed and a CI regression command is added |
| Frontend runtime scaffold: TanStack Start + Vite + design-system baseline | User delegated frontend follow-up to Claude during `engineering-runtime-scaffold` | Sprint 0.4 frontend and design-system leaves remain open; current Codex scaffold intentionally has no `apps/web` | Claude delivers frontend scaffold or asks Codex to integrate it |
| Engineering runtime remaining surfaces: AI SDK Agent Runtime, full Cloudflare bindings, Postgres/Hyperdrive, OTel/eval logs, secrets per environment | Non-frontend scaffold now covers npm workspaces, Hono Worker health, shared data contracts, CI, and env names only | Phase 0 can run a Worker locally but cannot claim staging deployability, data access, observability, or agent execution | Start a focused backend/runtime slice after frontend ownership is settled |
| P0 owner/issue/test/release traceability | Tracker §M maps requirement to sprint only | Release governance cannot prove owner, test, or gate coverage per P0 item | Issue tracker or repo ledger is selected and populated |
| Remote branch reconciliation before push | Local `main` is ahead and behind origin | Push may fail or conflict | Fetch/rebase/merge remote commit before pushing local commits |
