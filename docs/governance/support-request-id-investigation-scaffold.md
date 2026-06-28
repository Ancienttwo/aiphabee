# Support Request Id Investigation Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 20:03 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **PRD Source**: `docs/researches/AiphaBee_PRD_v1.0.md` US-O03, 19.5
> **Task Contract**:
> `tasks/contracts/support-request-id-investigation-scaffold.contract.md`

This slice completes the backend-only Sprint 3.2 scaffold for help center topics
and support request id investigation. It makes support investigation metadata
explicit without enabling frontend screens, live log reads, live billing provider
reads, support ticket writes, audit writes, or sensitive content release.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/support-ops` | Owns support runtime, help topic manifest, and request id investigation planner |
| Runtime route | `GET /support/runtime` | Reports support readiness and no-live/no-sensitive-access boundaries |
| Help center route | `GET /support/help-center` | Lists help topics and escalation route |
| Planner route | `POST /support/request-id-investigation/plan` | Plans metadata-only investigation for a target `request_id` |
| Help center draft | `docs/public/help-center.md` | Local publication draft with required support categories |
| Contract | `deploy/support/request-id-investigation.contract.json` | Guards routes, lookup fields, forbidden sensitive fields, required sections, no live reads, no writes, and no SQL |
| Schema scaffold | `aiphabee_core.support_ticket`, `aiphabee_audit.support_investigation_event`, `aiphabee_governance.support_request_id_contract` | Empty future persistence and audit surfaces |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Support agent submits `POST /support/request-id-investigation/plan` with
   `target_request_id`, `support_agent_id`, optional workspace, category, and
   reason.
2. Worker normalizes snake/camel request fields and calls
   `createSupportRequestIdInvestigationPlan()`.
3. The planner validates target request id and support agent context.
4. The planner returns allowed lookup fields, planned sources, request-id-based
   usage/billing trace refs, and an audit event plan.
5. If sensitive content is requested, the plan blocks with
   `blocked_sensitive_content_request` and releases no sensitive content.
6. Worker wraps the plan in the shared standard envelope with zero credits and
   one planned row only when the request is allowed.

## P3 Design Decision

Selected a dedicated `support-ops` package instead of extending public docs,
MCP runtime, usage-ledger, or account runtime.

Reason:

- US-O03 crosses support, privacy, error handling, usage, and billing
  reconciliation boundaries.
- Support should see the minimum metadata required to investigate `request_id`
  issues, not raw user content or credentials.
- The repo already has request id, usage, billing, and error contracts that can
  be referenced without reading live rows.

Tradeoff:

- Support flow semantics are now testable and auditable.
- Live support tickets, live log lookup, sensitive-content approval workflow,
  and frontend help center remain later slices.

## Verification

Passed:

- `npm run typecheck --workspace @aiphabee/support-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:support-ops`
- `npm run check:database`
- `npx vitest run packages/support-ops/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run build --workspace @aiphabee/support-ops`
- `npm run build --workspace @aiphabee/worker`

Observed runtime fields:

```json
{
  "support": {
    "route": "GET /support/runtime",
    "help_center_route": "GET /support/help-center",
    "investigation_route": "POST /support/request-id-investigation/plan",
    "live_log_reads": false,
    "live_billing_provider_reads": false,
    "default_sensitive_content_access": false
  },
  "request_id_investigation": {
    "status": "planned_no_write",
    "request_id_join": true,
    "sensitive_content_released": false
  }
}
```

## Residual Gaps

- No frontend help center.
- No live ticket persistence.
- No live log lookup.
- No live billing provider lookup.
- No sensitive-content escalation/approval workflow.
