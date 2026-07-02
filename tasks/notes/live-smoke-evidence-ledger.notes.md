# Live Smoke Evidence Ledger Notes

Date: 2026-06-22

## Completed

- Added `deploy/governance/live-smoke-evidence-ledger.contract.json`.
- Added `scripts/check-live-smoke-evidence-ledger-contract.mjs`.
- Added `docs/governance/live-smoke-evidence-ledger.md`.
- Added `npm run check:live-smoke-evidence-ledger` and wired it into full
  `npm run check`.

## Current Live Smoke State

- Cloudflare resource inventory: partial external provisioning observed.
- Cloudflare functional bindings: partial live passed.
- AI Gateway model execution: CLI and deployed Worker model smoke evidence
  exists as hash-only metadata.
- AI Gateway observability: current probe is permission denied.
- OTLP + eval-store: readiness exists, live smoke not run.
- Provider secret stores: readiness exists, live rotation smoke not run.

## Remaining Blockers

- Hyperdrive live `SELECT 1`.
- Natural Cron trigger evidence.
- AI Gateway logs/cost/rate-limit/cache/fallback evidence with required read
  permissions.
- OTLP export + eval-store write/read/delete live evidence.
- Cloudflare/GitHub provider-secret set/list/rotate/delete smoke.

No Sprint 0.4 live smoke checkbox was marked complete.
