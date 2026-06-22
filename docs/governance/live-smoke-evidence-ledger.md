# Live Smoke Evidence Ledger

Status: pending live evidence.

This ledger records the evidence state for Sprint 0.4 live smoke surfaces
without running credentialed smoke commands and without storing raw secrets,
provider outputs, prompts, model outputs, OTLP headers, or API tokens.

Machine-readable check:

```bash
npm run check:live-smoke-evidence-ledger
npm run check:live-smoke-external-env-preflight
npm run check:live-smoke-evidence-ledger-fixtures
```

The external-env preflight is non-networked. It reads the live smoke contracts,
the ledger, package scripts, and non-secret contract defaults, then reports only
environment variable names and their source category (`env`,
`contract_partial_provisioning`, or `missing`).

The fixture check exercises the state transition rules without running live
smoke commands: partial evidence cannot set `release_transition_allowed=true`;
all six surfaces must be `passed`, must carry evidence refs, and must clear
their missing-evidence blockers before the ledger can move to
`ready_for_sprint0_4_live_smoke_decision`.

## Covered Surfaces

| Surface | Command | Current State | Remaining Evidence |
|---|---|---|---|
| Cloudflare resource inventory | `npm run smoke:cloudflare-resources-live` | partial external provisioning observed | Hyperdrive `SELECT 1`, natural Cron evidence |
| Cloudflare functional bindings | `npm run smoke:cloudflare-bindings-wrangler-live` | partial live passed | Hyperdrive `SELECT 1`, natural Cron evidence |
| AI Gateway model execution | `npm run smoke:ai-gateway-live` | partial live passed | logs, cost, rate-limit, cache, fallback evidence |
| AI Gateway observability | `npm run smoke:ai-gateway-observability-live` | permission denied | `AI Gateway Read` and `Account Analytics Read` permissions |
| OTLP + eval-store | `npm run smoke:observability-live` | readiness only | OTLP 2xx export and eval-store write/read/delete evidence |
| Provider secret stores | `npm run smoke:provider-secret-stores-live` | readiness only | set/list/rotate/delete/confirm-absent across Cloudflare, GitHub, and Supabase |

## Evidence Policy

- The checker validates contracts and commands only; it does not run live smoke
  commands.
- Raw secrets, raw provider outputs, raw prompts, raw model outputs, and OTLP
  headers must not be committed.
- Future live evidence must be hash-only or metadata-only.
- Secret-store smoke evidence must include cleanup or confirm-absent proof.
- Account IDs, API tokens, model IDs, OTLP headers, GitHub environment, and
  Supabase project references must come from external env/auth state, not from
  repo defaults.

## Sprint Impact

This closes no Sprint 0.4 live smoke checkbox by itself. It makes the remaining
live smoke blockers explicit and machine-checkable so future live evidence can
be attached without widening the repo's secret surface.
