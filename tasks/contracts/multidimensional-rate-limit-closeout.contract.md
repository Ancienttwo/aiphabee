# Task Contract: Multidimensional Rate Limit Closeout

## Objective

Close the local A3 requirement that MCP/tool rate limiting is scoped by user,
Workspace, client, tool, dataset, and IP risk.

## Acceptance

- Add `deploy/governance/multidimensional-rate-limit.contract.json`.
- Add `npm run check:multidimensional-rate-limit`.
- Extend `McpToolLimitsPlan` with a `scope` object covering user, workspace,
  client, tool, dataset, and IP risk.
- Ensure limiter key material includes rate, concurrency, and budget keys.
- Ensure high-cost durable queue idempotency includes scoped limiter material.
- Ensure `GET /mcp/runtime` exposes limiter dimensions and no raw IP storage.
- Ensure `POST /mcp` forwards IP presence and IP risk input without storing raw
  IP in responses.
- Update only the A3 multidimensional rate-limit checkbox; keep the broader
  batch-scraping risk row unchecked.

## Out Of Scope

- Live limiter window reads.
- Live concurrency state reads.
- Live usage-ledger debit/refund writes.
- Raw IP storage.
- Live IP reputation lookup.
- Anomaly detection model.
- Enterprise bulk plan.
