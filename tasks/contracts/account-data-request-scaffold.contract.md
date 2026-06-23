# Account Data Request Scaffold Contract

## Scope

Complete the Sprint 3.2 ACC-05 backend scaffold for account data download and
delete requests.

## Required Surfaces

- `@aiphabee/account-runtime` exposes account data request capabilities.
- `GET /account/runtime` reports nested `data_requests` readiness.
- `POST /account/data-requests/plan` returns deterministic no-write request
  plans.
- Local contract checker: `npm run check:account-data-request`.
- Empty schema scaffold:
  - `aiphabee_core.account_data_request`
  - `aiphabee_core.account_data_request_item`
  - `aiphabee_audit.account_data_request_event`
  - `aiphabee_governance.account_data_request_contract`

## Behavioral Contract

- Supported actions are `download` and `delete`.
- Supported scopes are account profile, workspace membership, subscription and
  billing, MCP credential metadata, authorized memory, saved research, usage
  ledger, and audit logs.
- Download requests require secure delivery and never include raw credential or
  prompt material.
- Delete requests must respect retention holds for subscription billing, usage
  ledger, and audit logs.
- Unsupported scopes block before planned writes.
- Audit metadata must include request id, account, workspace, verified-by state,
  and retention policy version.

## Non-Goals

- No live data export.
- No live erasure.
- No persistent DB writes.
- No SQL execution.
- No email or R2 delivery.
- No frontend account privacy UI.
