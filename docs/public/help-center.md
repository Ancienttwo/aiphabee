# AiphaBee Help Center

Status: local publication draft.

## Account And Billing

For account, package, credit, refund, or overage questions, include the visible
`request_id` from the affected API, MCP, or UI response when available. Support
uses the request id to inspect metadata such as route, usage, error code, and
billing trace references.

## MCP Connection

For MCP connection issues, provide the client name, approximate time, endpoint,
method, and visible `request_id`. Support investigation should use MCP error
details, OAuth/API key status metadata, scope metadata, and compatibility status
without exposing raw key material.

## Data Quality

For data-quality issues, provide the security, date range, tool name, and
visible `request_id`. Support should inspect data version, methodology version,
quality state, source record references, and correction status before escalating
to data operations.

## Usage And Quota

For quota questions, provide the visible `request_id`, plan, tool, and time
window. Support should inspect usage summary, usage event references, ledger
entry references, invoice line references, and reconciliation status.

## Privacy And Account

For privacy or account data questions, support should use minimum necessary
metadata. Raw prompts, generated answers, credentials, payment instruments,
portfolio holdings, and personal contact details are not exposed by the default
request id investigation flow.

## Incident Status

For service interruptions, check the public status surface first. If contacting
support, include the visible `request_id`, route, and approximate time so the
incident can be linked to the relevant status component.

## Current Publication Limits

This draft does not enable live chat, ticket persistence, live log reads, or a
frontend help center. It defines the support flow contract and minimum metadata
needed for future implementation.
