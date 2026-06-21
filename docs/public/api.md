# AiphaBee API Reference

Status: local publication draft.

## Authentication

Public metadata routes such as `/health`, `/public/runtime`, `/public/status`,
and `/public/docs` do not require account authentication. Product data and
account routes require the account, workspace, scope, and entitlement contracts
described in the runtime manifests.

## Standard Response Envelope

API responses use the shared envelope shape:

- `ok`
- `data` or `error`
- `request_id`
- `as_of`
- `methodology_version`
- `usage`

Every supportable API response must keep `request_id` visible so support can
investigate a specific call without broad access to unrelated user data.

## Errors

Errors use stable product codes such as `DATA_NOT_LICENSED`, `SCOPE_DENIED`,
`DATA_QUALITY_HOLD`, `TOO_MANY_ROWS`, `OUT_OF_RANGE`, `AUTH_REQUIRED`, and
`INTERNAL_ERROR`.

`INTERNAL_ERROR` responses should direct users to contact support with the
visible `request_id`.

## Usage And Request Id

Routes that consume quota include `usage.credits`, `usage.rows`, and cache
metadata. System retries must not double charge users. Billing and usage
reconciliation use `request_id` as the investigation join key.

## Current Publication Limits

This draft describes local runtime contracts. It does not prove live deployment,
partner data access, final pricing, or production support coverage.
