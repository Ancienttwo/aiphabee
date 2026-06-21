# Performance Availability Release Gate Scaffold

This scaffold covers the Sprint 3.3 release gate item for core API availability, MCP tool P95 latency, Web first-token latency, simple research completion latency, and MCP tool success rate.

## Scope

- Runtime package: `@aiphabee/observability`
- Runtime route: `GET /observability/runtime`
- Gate route: `POST /observability/release-gates/performance-availability/plan`
- Contract: `deploy/observability/performance-availability-release-gate.contract.json`
- Migration: `supabase/migrations/20260622005000_performance_availability_release_gate_scaffold.sql`
- Checker: `npm run check:performance-availability-release-gate`

## What This Proves

- Core API availability target is encoded as monthly `9990bps` from PRD §12.1.
- MCP hot-path P95 target is `800ms`; cold/complex MCP P95 target is `2500ms`.
- Web first-token P95 target is `2500ms`.
- Simple research completion P95 target is `15000ms`.
- MCP tool success-rate target is `9950bps`, excluding user-input and authorization-denied failures.
- The SLO report includes route coverage for `/health`, `/mcp`, `/agent/runs/stream`, and `/agent/runs/plan`.
- Live APM/provider reads, probe scheduling, SLO-store writes, SQL, and persistent writes remain disabled.

## Deliberate Blockers

- `live_apm_provider_missing`
- `live_probe_scheduler_missing`
- `slo_metric_store_missing`
- `load_test_run_artifact_missing`
- `frontend_first_token_live_measurement_missing`
- `ops_sre_signoff_missing`
