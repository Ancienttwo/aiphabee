# Engineering Runtime Scaffold

> **Status**: Verified non-frontend slice
> **Last Updated**: 2026-06-20 15:20 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Source Closeout**: `docs/governance/phase0-traceability-closeout.md`
> **Plan**: `plans/plan-engineering-runtime-scaffold.md`
> **Task Contract**: `tasks/contracts/engineering-runtime-scaffold.contract.md`

This artifact records the first executable engineering foundation slice after
the Phase 0 traceability closeout.

Per user direction on 2026-06-20, frontend work is not included in this slice.
`apps/web`, TanStack Start, Vite, and design-system integration are left for a
Claude-owned frontend follow-up.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Root workspace | Added `package.json`, `package-lock.json`, `tsconfig.base.json`, `vitest.config.ts` | npm workspaces for `apps/*` and `packages/*`; no frontend workspace currently exists |
| Worker runtime | Added `apps/worker` with Hono, Wrangler config, `/health`, and root envelope route | Local Cloudflare Worker scaffold only; no production deployment |
| Shared contracts | Added `packages/data-contracts` | Response envelope, provenance metadata, usage summary, and default-deny error codes |
| CI | Added `.github/workflows/ci.yml` | `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` |
| Env template | Added `deploy/env/.env.example` | Names only; no secrets or provider state |
| Frontend | Deferred | No `apps/web`, no TanStack Start/Vite implementation in this slice |
| Market data / MCP | Absent by design | No market-data route, no MCP redistribution endpoint, no live data connector |

## P2 Concrete Trace

Input source of truth:

- `apps/worker/wrangler.jsonc` provides local `APP_ENV` and `APP_VERSION`.
- `apps/worker/src/index.ts` owns the Hono route behavior.
- `packages/data-contracts/src/index.ts` owns the shared response envelope.

Runtime path:

1. `npx wrangler dev --config wrangler.jsonc --port 8787` starts the Worker in
   `apps/worker`.
2. `GET /health` enters the Hono app in `apps/worker/src/index.ts`.
3. The route sets `Cache-Control: no-store`.
4. The route returns service metadata and explicit scaffold boundaries:
   `market_data_surfaces:false` and `mcp_redistribution_surfaces:false`.
5. Local verification returned `HTTP/1.1 200 OK` with the expected body.

Root route path:

1. `GET /` enters the same Hono app.
2. The route creates a shared success envelope with `createSuccessEnvelope`.
3. The envelope includes `as_of`, `provenance`, `request_id`, and zero-credit
   usage metadata.

## P3 Design Decision

The scaffold deliberately implements the smallest backend/runtime surface that
can be installed, tested, built, and run locally.

Tradeoff:

- Selected: root npm workspace + Worker + shared contracts + CI/env.
- Deferred: frontend app, AI SDK agent loop, full Cloudflare bindings,
  live Postgres/Hyperdrive smoke, persistent observability/eval store, live
  provider secret-store smoke, and P0 issue/owner/test/release traceability.

Reason:

- Gate 0 still blocks market-data and MCP redistribution surfaces.
- Frontend is explicitly delegated outside this slice.
- A small Worker/data-contracts foundation gives later slices a stable runtime
  and contract package without creating product surface area.

First failure at 10x scale:

- The single Worker has no binding abstraction, no persistence, no persistent
  observability/eval store, and no request budget ledger. Those are the correct
  next shared runtime bottlenecks before Phase 1 data or agent features.

## File Inventory

| File | Purpose |
|---|---|
| `package.json` | Root npm workspace and shared commands |
| `package-lock.json` | Locked dependency graph |
| `tsconfig.base.json` | Shared strict TypeScript baseline |
| `vitest.config.ts` | Test discovery across apps and packages |
| `.github/workflows/ci.yml` | CI command parity with local checks |
| `apps/worker/package.json` | Worker workspace dependencies and scripts |
| `apps/worker/src/index.ts` | Hono health/root routes |
| `apps/worker/src/index.test.ts` | Worker route tests |
| `apps/worker/wrangler.jsonc` | Local Worker config |
| `packages/data-contracts/src/index.ts` | Shared envelope/error contracts |
| `packages/data-contracts/src/index.test.ts` | Contract tests |
| `deploy/env/.env.example` | Names-only environment template |

## Verification

Passed:

- `npm install`
- `npm run check`
- `npm run lint`
- `npm run typecheck`
- `npm run test` (`2` test files, `5` tests)
- `npm run build`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `curl -i http://localhost:8787/health`

Observed `/health` response:

```json
{
  "environment": "local",
  "market_data_surfaces": false,
  "mcp_redistribution_surfaces": false,
  "service": "aiphabee-worker",
  "status": "ok",
  "version": "0.0.0"
}
```

## Residual Gaps

- Frontend scaffold is intentionally absent and delegated to Claude.
- AI SDK v7 dry-run Agent Runtime skeleton now exists in
  `docs/governance/agent-runtime-scaffold.md`; real model provider execution
  remains unimplemented.
- Cloudflare binding contract now exists in
  `docs/governance/cloudflare-bindings-contract.md`; real resources and smoke
  tests remain unimplemented.
- Postgres/Supabase/Hyperdrive migration tooling now exists in
  `docs/governance/postgres-hyperdrive-migration-scaffold.md`; live Hyperdrive
  binding and `SELECT 1` smoke remain unimplemented.
- Local observability/eval event wiring now exists in
  `docs/governance/observability-eval-scaffold.md`; real OTLP destination and
  persistent eval store remain unimplemented.
- Env contract and dev/staging/prod names-only validation now exist in
  `docs/governance/env-secrets-contract.md`; provider secret-store contracts and
  runbooks now exist in `docs/governance/provider-secret-stores-contract.md`,
  while live provisioning and rotation smoke remain unimplemented.
- Golden sample regression is not executable in CI.
- External tracker sync for P0 traceability remains optional until a tracker is
  selected; repo-local traceability now exists in
  `docs/governance/p0-traceability-ledger.md`.
