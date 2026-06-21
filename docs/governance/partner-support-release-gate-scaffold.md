# Partner Support Release Gate Scaffold

## Scope

This scaffold covers Sprint 3.3 / PRD §19.5: partner reconciliation can be generated, and support can investigate a customer-visible `request_id`.

The release gate composes two existing no-live planners:

- `createPartnerReconciliationReportPlan()` in `@aiphabee/usage-ledger`
- `createSupportRequestIdInvestigationPlan()` in `@aiphabee/support-ops`

## Runtime Surface

- Runtime readiness: `GET /usage/runtime`
- Gate route: `POST /usage/release-gates/partner-support/plan`
- Partner report route: `POST /usage/partner-reconciliation/plan`
- Support route: `POST /support/request-id-investigation/plan`

The plan proves one target `request_id` appears in the partner report rows and can be used by support to inspect metadata-only sources.

## Release Checks

- `partner_report_generated`
- `partner_report_trace_links_request_id_and_usage_event`
- `partner_report_sla_counters_present`
- `support_request_id_investigation_metadata_only`
- `sensitive_payloads_excluded`
- `live_artifact_and_log_reads_blocked`

## Explicit Non-Claims

The scaffold does not enable live usage-ledger reads, live partner report artifact writes, partner portal delivery, live support log reads, live billing provider reads, persistent writes, or frontend operations UI.

The gate remains blocked as `blocked_live_partner_support_validation` until data partner, support, billing, ops, and compliance sign off with live evidence.

## Verification

- `npm run check:partner-support-release-gate`
- `npm run check:database`
- `npm run check:secrets`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
