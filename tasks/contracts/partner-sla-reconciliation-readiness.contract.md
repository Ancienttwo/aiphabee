# Partner SLA Reconciliation Readiness Contract

## Objective

Prove DAT-10 local backend readiness for partner SLA and reconciliation reports without claiming live settlement, partner portal delivery, or live ledger reads.

## Required Artifacts

- `deploy/usage/partner-sla-reconciliation-readiness.contract.json`
- `scripts/check-partner-sla-reconciliation-readiness-contract.mjs`
- `docs/governance/partner-sla-reconciliation-readiness.md`
- Usage runtime readiness under `GET /usage/runtime`
- Worker route `GET /usage/partner-sla/reconciliation-readiness`

## Acceptance

- Daily and weekly partner reconciliation plans are generated from the same fixture rows.
- SLA counters include data delay, missing rows, error count, and backfill count.
- Every fixture row has request_id and usage_event_id traceability.
- Partner support release gate passes metadata-only support drill requirements.
- Live ledger reads, artifact writes, partner portal delivery, support log reads, SQL emission, and persistent writes remain disabled.
- Raw prompts, generated answers, raw email/contact data, credentials, payment identifiers, and document bodies remain excluded.
- The contract checker is part of root `npm run check`.

## Blockers Kept Open

- Live usage-ledger reads
- Live partner report artifact store
- Partner portal delivery
- Final partner settlement approval
