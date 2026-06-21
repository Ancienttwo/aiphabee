# Partner Reconciliation Report Scaffold Contract

## Objective

Complete the backend-only Sprint 3.2 US-O06 / DAT-10 scaffold for partner
reconciliation reports grouped by dataset, channel, package, user, and usage.

## Required Surfaces

- Package: `@aiphabee/usage-ledger`
- Runtime route: `GET /usage/runtime`
- Planner route: `POST /usage/partner-reconciliation/plan`
- Contract: `deploy/usage/partner-reconciliation-report.contract.json`
- Checker: `npm run check:partner-reconciliation-report`
- Report table scaffold: `core.partner_reconciliation_report`
- Report-line table scaffold: `core.partner_reconciliation_report_line`
- Audit table scaffold: `audit.partner_reconciliation_event`
- Governance table scaffold: `governance.partner_reconciliation_contract`

## Required Guarantees

- Use standard response envelopes.
- Keep `request_id` visible.
- Group report rows by:
  - `dataset`
  - `channel`
  - `package_code`
  - `user_id`
- Include usage measures:
  - `usage_count`
  - `credits`
  - `metered_rows`
- Preserve trace fields:
  - `request_id`
  - `usage_event_id`
  - `dataset`
  - `channel`
  - `package_code`
  - `user_id`
- Include DAT-10 SLA fields:
  - `data_delay_minutes`
  - `missing_rows`
  - `error_count`
  - `backfill_count`
- Support daily and weekly report cadences.
- Support CSV and JSON export planning.
- Exclude raw email, personal contact, payment identifiers, credentials, raw
  prompts, and generated answers.
- Do not read the live usage ledger.
- Do not write report rows.
- Do not call billing providers.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes all partner reconciliation tables.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves runtime and planner routes return `200 OK` and
  no-live flags.
- Sprint tracker row is checked and Sprint 3.2 count is updated.
