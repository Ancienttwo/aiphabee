# Support Request Id Investigation Scaffold Contract

## Objective

Complete the backend-only Sprint 3.2 scaffold for help center topics and support
request id investigation.

## Required Surfaces

- Package: `@aiphabee/support-ops`
- Runtime route: `GET /support/runtime`
- Help center route: `GET /support/help-center`
- Investigation route: `POST /support/request-id-investigation/plan`
- Contract: `deploy/support/request-id-investigation.contract.json`
- Checker: `npm run check:support-ops`
- Help center draft: `docs/public/help-center.md`
- Schema scaffolds:
  - `aiphabee_core.support_ticket`
  - `aiphabee_audit.support_investigation_event`
  - `aiphabee_governance.support_request_id_contract`

## Required Guarantees

- Use standard response envelopes.
- Require a target `request_id` for investigation planning.
- Require a support agent identifier for investigation planning.
- Expose help topics for account/billing, MCP connection, data quality, usage
  quota, privacy/account, and incident status.
- Allow support lookup only for metadata fields such as route, tool, data
  version, methodology version, error code, usage rows/credits, usage event,
  ledger entry, invoice line, status component, and `as_of`.
- Block default access to raw prompt, generated answer, raw email, credentials,
  payment method, portfolio holdings, document body, and personal contact
  details.
- Link request id investigation to usage/billing reconciliation by request id.
- Do not read live logs.
- Do not read a live billing provider.
- Do not emit SQL.
- Do not write support ticket or audit rows.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes the support tables.
- Package and Worker targeted tests pass.
- Support Ops package and Worker typecheck/build pass.
- Sprint tracker row is checked and Sprint 3.2 count is updated.
