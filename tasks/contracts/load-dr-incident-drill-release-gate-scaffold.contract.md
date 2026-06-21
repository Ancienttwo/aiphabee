# Load / DR / Incident Drill Release Gate Scaffold Contract

## Intent

Close the Sprint 3.3 load/disaster-recovery/incident-drill tracker item with a no-live release gate scaffold grounded in PRD §12.1 and §19.5 readiness expectations.

## Required Artifacts

- `@aiphabee/observability` exports `getLoadDrIncidentDrillReleaseGateCapabilities()`.
- `@aiphabee/observability` exports `createLoadDrIncidentDrillReleaseGatePlan()`.
- Worker exposes `GET /observability/runtime` readiness under `load_dr_incident_drill_release_gate`.
- Worker exposes `POST /observability/release-gates/load-dr-incident-drill/plan`.
- Contract checker: `npm run check:load-dr-incident-drill-release-gate`.
- DB contract includes `supabase/migrations/20260622006000_load_dr_incident_drill_release_gate_scaffold.sql`.

## Required Checks

- `load_test_artifact_present`
- `load_test_targets_met`
- `dr_restore_rto_target_met`
- `dr_restore_rpo_target_met`
- `incident_drill_completed`
- `failover_rollback_plan_present`
- `communications_and_status_page_drill_present`
- `live_execution_and_persistent_writes_blocked`

## Release Boundary

This scaffold must not claim a live release. The release gate stays blocked until live load-test artifacts, DR restore evidence, failover execution evidence, incident drill evidence, status-page drill evidence, and ops/SRE/product signoff are attached.
