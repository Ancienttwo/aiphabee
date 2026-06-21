# Performance Availability Release Gate Scaffold Contract

## Objective

Close the Sprint 3.3 backend/contract scaffold for core API availability, MCP tool P95 latency, Web first-token P95 latency, simple research completion P95 latency, and MCP tool success-rate targets.

## Runtime Surface

- Package: `@aiphabee/observability`
- Capability: `performance_availability_release_gate`
- Route: `POST /observability/release-gates/performance-availability/plan`
- Runtime exposure: `GET /observability/runtime`
- Contract checker: `npm run check:performance-availability-release-gate`

## Required Checks

- `core_api_availability_target_met`
- `mcp_tool_p95_targets_met`
- `web_first_token_p95_target_met`
- `simple_research_completion_p95_target_met`
- `tool_success_rate_target_met`
- `slo_report_request_id_and_route_coverage_present`
- `live_apm_and_probe_writes_blocked`

## Evidence

- SLO target values come from PRD §12.1.
- Route coverage links the local scaffold to `/health`, `/mcp`, `/agent/runs/stream`, and `/agent/runs/plan`.
- Synthetic release-gate observations prove the local checker and planner enforce the thresholds.

## Non-Goals

- No live APM provider read.
- No live probe scheduler.
- No SLO metric store writes.
- No load-test run artifact.
- No frontend first-token live measurement.
- No ops/SRE signoff claim.
