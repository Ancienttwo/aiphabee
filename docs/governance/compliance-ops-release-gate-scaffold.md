# Compliance Ops Release Gate Scaffold

## Scope

This scaffold covers the Sprint 3.3 §19.4 release gate for compliance boundary and marketing-copy review, plus kill-switch, incident-response, and audit-export drills.

It composes existing local planners instead of introducing live operational control:

- `@aiphabee/public-ops` public docs/status manifests for visible release surfaces and request ID disclosure.
- `@aiphabee/agent-runtime` `createAgentKillSwitchPlan()` for model/tool blocking and safe degradation.
- `@aiphabee/support-ops` `createSupportRequestIdInvestigationPlan()` for request_id incident trace planning without sensitive content release.
- `@aiphabee/observability` `createAgentDryRunTelemetry()` for a local `run.audit` export drill with required fields.

## Runtime Surface

- Runtime: `GET /public/runtime`
- Release gate route: `POST /public/release-gates/compliance-ops/plan`
- Linked routes:
  - `GET /public/docs`
  - `GET /public/status`
  - `POST /agent/kill-switch/plan`
  - `POST /support/request-id-investigation/plan`

The release gate response uses the standard response envelope and returns:

- `compliance_boundary`
- `kill_switch_drill`
- `incident_response_drill`
- `audit_export_drill`
- `release_checks`
- `release_gate`
- `validation`

## Release Checks

- `type4_research_boundary_copy_reviewed`
- `marketing_copy_forbidden_advice_claims_absent`
- `kill_switch_safe_degradation_drill_planned`
- `incident_response_request_id_trace_drill_planned`
- `audit_export_contains_required_fields_and_excludes_sensitive_payloads`
- `public_status_incident_disclosure_surface_present`

## Non-Claims

This scaffold does not enable external compliance/legal signoff, live kill-switch flag reads, live incident feed, live audit export store, frontend release UI, model/tool execution, DB writes, or a public launch claim.

`release_gate.gate_status` remains `blocked_live_compliance_ops_validation` until legal/compliance signoff, live flag source, incident feed, audit export store, frontend UI, and ops signoff evidence exist.

## Verification

- `npm run check:compliance-ops-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/public-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/public-ops/src/index.test.ts apps/worker/src/index.test.ts`
