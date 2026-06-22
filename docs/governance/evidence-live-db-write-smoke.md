# Evidence Live DB Write Smoke

> **Status**: Local contract
> **Last Updated**: 2026-06-22 00:00 +08
> **Contract**: `deploy/evidence/live-db-write-smoke.contract.json`
> **Route**: `POST /evidence/records/live-db-smoke`

This slice proves that the Worker can execute a guarded Hyperdrive-backed
Evidence/Lineage write path against `core.evidence_record` and
`core.evidence_source_ref`. It is smoke-only: it inserts deterministic
synthetic rows, reads them back, deletes them in the same transaction, and
returns only hashes and counts.

## P1 Architecture Map

| Surface | Boundary |
|---|---|
| Worker route | Owns `x-aiphabee-smoke=evidence-lineage-live-db-v1` and `AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN` guards |
| Hyperdrive binding | Owns live Postgres connection via `AIPHABEE_HYPERDRIVE` |
| Evidence planner | Owns deterministic evidence/source-ref ids and default-deny metadata |
| Evidence tables | Own smoke insert/read/delete for `core.evidence_record` and `core.evidence_source_ref` |
| Readiness ledger | Consumes this contract to move `live_db_writes` out of blockers |

## P2 Concrete Trace

1. Caller sends `POST /evidence/records/live-db-smoke` with the smoke header and
   bearer token from `AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN`.
2. Worker rejects before DB access when the header, token, or Hyperdrive binding
   is absent.
3. Worker creates a deterministic `get_quote_snapshot` evidence plan with one
   synthetic source record and default-deny rights metadata.
4. Worker opens `AIPHABEE_HYPERDRIVE`, starts a transaction, inserts the evidence
   record and source ref, reads both back, deletes both rows, and commits.
5. Response includes only row counts and hashes for the evidence/source ids.

## P3 Design Decision

This is a guarded smoke route rather than enabling production Evidence service
persistence. The base `deploy/evidence/service.contract.json` remains no-write,
and `partner_source_rows=false` remains a readiness blocker until a data-owner
approved sample manifest exists.

At 10x scale, this surface fails first at deployment configuration: missing
token, missing Hyperdrive binding, or schema drift in the two evidence tables
blocks the smoke before any release transition claim.

## Verification

- `npm run test -- apps/worker/src/evidence-live-db-write-smoke.test.ts`
- `npm run check:evidence-live-db-write-smoke`
- `npm run check:tool-route-replay-readiness`
