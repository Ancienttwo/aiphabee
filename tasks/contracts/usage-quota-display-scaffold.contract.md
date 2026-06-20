# Usage Quota Display Scaffold Contract

## Objective

Complete the backend-only Sprint 1.4 ACC-04 scaffold for Web Agent and MCP quota
and usage display.

## Required Surfaces

- Package: `@aiphabee/usage-ledger`
- Runtime route: `GET /usage/runtime`
- Planner route: `POST /usage/quota/plan`
- Contract: `deploy/usage/quota-display.contract.json`
- Checker: `npm run check:usage-quota-display`

## Required Guarantees

- Use standard response envelopes.
- Cover both `web_agent` and `mcp` channels.
- Return display fields for request id, plan code, channel, period, credit
  limit, used credits, pending credits, remaining credits, and freshness target.
- Keep freshness target at 5 minutes to match ACC-04.
- Do not read the live usage ledger.
- Do not write usage rows.
- Do not reconcile billing provider invoices.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves both routes return `200 OK` and no-live flags.
- Sprint tracker row is checked and Sprint 1.4 count is updated.
