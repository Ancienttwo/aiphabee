# Partner Support Release Gate Scaffold Contract

## Objective

Prove the Sprint 3.3 §19.5 partner/support release gate without claiming live partner settlement or live support tooling.

## Required Artifacts

- `deploy/usage/partner-support-release-gate.contract.json`
- `scripts/check-partner-support-release-gate-contract.mjs`
- `deploy/database/migrations/20260622003000_partner_support_release_gate_scaffold.sql`
- `docs/governance/partner-support-release-gate-scaffold.md`
- Worker route `POST /usage/release-gates/partner-support/plan`
- Usage runtime readiness under `GET /usage/runtime`

## Acceptance

- Partner report rows group by dataset, channel, package, and user.
- A target `request_id` is present in partner report rows and linked to a `usage_event_id`.
- SLA counters include data delay, missing rows, error count, and backfill count.
- Support investigation uses metadata-only sources and keeps live log/provider reads disabled.
- Raw prompt, generated answer, raw email, credentials, payment identifiers, document body, and personal contact fields remain excluded.
- The contract checker is part of root `npm run check`.

## Blockers Kept Open

- Live usage-ledger reads
- Live partner report artifact store
- Partner portal delivery
- Live support log reads
- Frontend ops UI
- Final partner settlement approval
