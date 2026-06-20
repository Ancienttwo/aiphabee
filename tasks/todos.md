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
| Executable golden samples and quality-rule CI | Golden regression hook now runs in CI, but no sample fixture corpus or quality-rule engine is wired | `DATA_QUALITY_HOLD` behavior is specified but not runnable | Golden fixtures are committed and `npm run test:golden -- --require-fixtures` can pass |
| Frontend runtime scaffold: TanStack Start + Vite + design-system baseline | User delegated frontend follow-up to Claude during `engineering-runtime-scaffold` | Sprint 0.4 frontend and design-system leaves remain open; current Codex scaffold intentionally has no `apps/web` | Claude delivers frontend scaffold or asks Codex to integrate it |
| Engineering runtime remaining surfaces: model provider/streaming execution, Cloudflare resource provisioning/smoke, live Hyperdrive `SELECT 1`, OTLP destination + persistent eval store, provider secret store provisioning/rotation smoke | Non-frontend scaffold now covers npm workspaces, Hono Worker health, shared data contracts, CI, env contract, env validation, Cloudflare binding contract, AI SDK dry-run Agent Runtime skeleton, local run.audit/run.eval telemetry events, Supabase-compatible migration tooling, and provider secret-store contracts/runbooks | Phase 0 can run a Worker locally and validate dry-run agent policy, local telemetry, DB migration contracts, and secret-store contracts, but cannot claim staging deployability, live data access, real model execution, persistent observability, or managed secret operations | Start a focused backend/runtime slice after frontend ownership is settled |
| External tracker sync for P0 traceability | Repo-local `AIP-P0-*` issue refs now exist, but no external tracker has been selected | Release governance can use the repo ledger, but GitHub/Jira/Linear dashboards will not show the work automatically | External tracker is selected or the team requests import/sync |
| Remote branch reconciliation before push | Local `main` is ahead and behind origin | Push may fail or conflict | Fetch/rebase/merge remote commit before pushing local commits |
