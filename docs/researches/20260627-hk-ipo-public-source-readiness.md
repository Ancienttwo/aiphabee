# HK IPO Public Source Readiness

Date: 2026-06-27
Scope: public HK IPO webpage sources that can supplement the HKEX News ingest.

## Conclusion

AASTOCKS and VBKR/Huasheng are usable as public observation sources for Hong Kong IPO coverage. They should not replace HKEX as canonical truth, but they can improve coverage for listing timetable, price range, lot size, grey-market, sponsor, and subscription-result signals.

Default crawler set:

- Use: [AASTOCKS IPO Plus](https://www.aastocks.com/en/stocks/market/ipo/mainpage.aspx)
- Use: [VBKR HK IPO](https://www.vbkr.com/ipo/hk/v2/ipo-hk-index)
- Do not default-crawl: ETNet IPO, because its robots.txt excludes IPO paths.
- Do not default-crawl: Futu/Moomoo IPO pages, because public probes returned anti-automation or 403 responses.

The product stance is public-data observation with strict provenance: every third-party field must carry `provider`, `source_url`, `observed_at`, and a raw snapshot reference before it can be reconciled or promoted.

## P1 Map

Authoritative ingest remains:

- HKEX official crawler: `packages/data-ingest/src_py/data_ingest/hkex/spiders/hkex_news.py`
- HKEX runtime contract: `deploy/ingest/hkex-news-ingest.contract.json`
- HKEX verification: `scripts/check-hkex-news-ingest-contract.mjs`
- Crawl QA skill: `skills/hkex-news-crawl-qa/SKILL.md`

New public-source readiness surface:

- Source contract: `deploy/ingest/hk-ipo-public-sources.contract.json`
- Source checker: `scripts/check-hk-ipo-public-sources.mjs`
- Observation adapter: `scripts/extract-hk-ipo-public-observations.mjs`
- Reconciliation dry-run: `scripts/reconcile-hk-ipo-public-observations.mjs`
- Reconciliation packet output: `node scripts/reconcile-hk-ipo-public-observations.mjs --packet`
- Schema preflight contract: `scripts/check-hk-ipo-public-observation-schema.mjs`
- Raw snapshot capture dry-run: `scripts/capture-hk-ipo-public-raw-snapshots.mjs`
- Raw snapshot storage reference plan: `scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs`
- Raw snapshot R2 writer smoke: `scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs`
- Apply planner dry-run: `scripts/plan-hk-ipo-public-observation-apply.mjs`
- Held DB apply packet smoke: `scripts/plan-hk-ipo-public-held-db-apply-packet.mjs`
- Held review packet: `scripts/plan-hk-ipo-public-held-review-packet.mjs`
- Held DB apply/readback smoke contract: `scripts/check-hk-ipo-public-held-db-apply-smoke-contract.mjs`
- Live held DB apply helper: `scripts/apply-hk-ipo-public-held-db-live.mjs`
- Held DB apply/readback Worker routes: `POST /ingest/hk-ipo-public/held-db-apply`, `POST /ingest/hk-ipo-public/held-db-apply-smoke`, `POST /ingest/hk-ipo-public/held-db-readback`
- Observation fixture: `skills/hkex-news-crawl-qa/evals/public-source-observation-fixtures.json`
- Package entrypoint: `npm run check:hk-ipo-public-sources`

Ownership boundary:

- HKEX documents remain canonical official evidence.
- AASTOCKS and VBKR/Huasheng are supplemental public observations.
- ETNet and Futu/Moomoo stay out of default automation until their access surface changes or a partner/browser flow exists.

Out of scope for this slice:

- Promoting third-party source rows into canonical IPO serving facts.
- Promoting third-party observations into IPO serving tables.
- Building browser automation around anti-automation pages.

## P2 Trace

Concrete route for a public source:

1. Checker reads `deploy/ingest/hk-ipo-public-sources.contract.json`.
2. Static mode validates source ids, URL fields, provenance invariants, and package script exposure.
3. Live mode fetches only public HTML/robots endpoints.
4. For AASTOCKS, it checks the IPO Plus page for linked IPO sections and table labels.
5. For VBKR/Huasheng, it checks the SSR Nuxt payload for IPO list arrays and structured field names.
6. The observation adapter parses AASTOCKS table rows and VBKR SSR literals into `third_party_ipo_observation` rows.
7. The reconciliation dry-run groups observations by `security_code`, compares overlap facts, marks conflicts, and records official HKEX URL evidence.
8. The reconciliation packet mode emits raw snapshot requests, reconciliation rows, and supplement candidate rows for a future write path.
9. The schema preflight checker verifies the empty held-layer tables and raw snapshot record kinds that the packet would require.
10. The raw snapshot capture dry-run fetches each public source URL once, computes payload hashes and byte counts, and discards the response body.
11. The raw snapshot storage reference plan maps each capture to a deterministic `AIPHABEE_ARTIFACTS` object key and a redacted payload envelope.
12. The raw snapshot R2 writer smoke validates put/get/delete behavior against that object-key plan; default checks use a mock R2 bucket, while real R2 writes require explicit `--remote`.
13. The apply planner dry-run turns the adapter observations, reconciliation packet, raw snapshot capture hashes, and storage envelopes into held-layer statement descriptors and row hashes.
14. The held DB apply packet smoke seals those statement descriptors into a local apply packet for PlanetScale Postgres, with counts and hashes only.
15. The held DB apply/readback smoke exposes a guarded Worker route that can insert, select, and delete one synthetic held row set through Hyperdrive in a single transaction.
16. The live held DB apply helper writes public-source observations only into held-layer tables through the guarded Worker route, after remote R2 object storage succeeds.
17. The held DB readback route verifies held-layer table counts and remote R2 object existence with hashes and counts only.
18. The held review packet combines the apply packet counts/hashes with explicit manual-review, DB readback, object-store readback, and serving-promotion-blocked gates.
19. The checker emits JSON status only; it does not persist HTML, emit SQL text, write remote R2 objects by default, or write database rows in default verification.

Observation adapter contract:

- Output kind: `third_party_ipo_observation`
- Required provenance: `provider`, `source_url`, `observed_at`, `source_record_id`
- Required promotion guard: `raw_snapshot_required=true`, `raw_snapshot_id=null`, `reconciled_with_hkex=false`
- Execution guard: parse HTML/literals only; do not execute source page scripts.

Reconciliation dry-run contract:

- Compared facts: `lot_size`, `listing_date`, `issue_price_range`
- Statuses: `agreement`, `conflict`, `single_source`
- HKEX evidence: official URLs whose host is `www1.hkexnews.hk`
- Promotion guard: `writes_database=false`, `writes_files=false`, `promotes_facts=false`

Reconciliation packet contract:

- Output kind: `hk_ipo_public_reconciliation_packet`
- Required sections: `raw_snapshot_requests`, `reconciliation_rows`, `supplement_candidate_rows`, `promotion_policy`, `summary`
- Promotion policy: only `agreement` rows can become promotion candidates, and only after raw snapshot capture.
- Storage guard: `writes_database=false`, `writes_files=false`, `stores_raw_html_in_repo=false`, `promotes_facts=false`

Schema preflight contract:

- Migration: `deploy/database/migrations/20260628001000_hk_ipo_public_observation_preflight.sql`
- Persistent tables: `core.hk_ipo_public_source_run`, `core.hk_ipo_public_observation`, `core.hk_ipo_public_reconciliation_row`, `core.hk_ipo_public_supplement_candidate`
- Governance table: `governance.hk_ipo_public_observation_contract`
- Raw snapshot record kinds: `hk_ipo_public_source_record`, `hk_ipo_public_observation`, `hk_ipo_public_reconciliation_packet`
- Guard: no remote apply, no public web data load, no serving table writes, no fact promotion.

Raw snapshot capture dry-run:

- Script: `scripts/capture-hk-ipo-public-raw-snapshots.mjs`
- Package check: `npm run check:hk-ipo-public-raw-snapshot-capture`
- Inputs: reconciliation packet raw snapshot requests and source fixtures/live public HTML.
- Output: request-level payload hash, byte count, HTTP status, content type, and external-store readiness flags.
- Guard: no payload text in JSON output, no file write, no database write, no raw HTML committed to repo.

Raw snapshot storage reference plan:

- Script: `scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs`
- Package check: `npm run check:hk-ipo-public-raw-snapshot-storage`
- Inputs: raw snapshot capture descriptors.
- Target store reference: `AIPHABEE_ARTIFACTS` / `aiphabee-artifacts`.
- Output: object-key plan, payload envelope hash, original payload hash, byte count, content type, source URL, and `ready_for_sql_payload=true`.
- Guard: no R2 write, no payload body in JSON output, no file write, no database write, no raw HTML committed to repo.

Raw snapshot R2 writer smoke:

- Script: `scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs`
- Package check: `npm run check:hk-ipo-public-raw-snapshot-r2-writer`
- Inputs: raw snapshot storage reference plan and either fixtures or live public source payloads.
- Default mode: mock `AIPHABEE_ARTIFACTS` put/get/delete; no remote object-store write.
- Remote mode: `node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --remote --check`, using Wrangler R2 object put/get/delete against `aiphabee-artifacts` under a smoke-prefixed key derived from the planned object key.
- Guard: readback hash must match the capture payload hash; cleanup delete must complete; JSON output contains hashes/counts only, never payload text.

Apply planner dry-run:

- Script: `scripts/plan-hk-ipo-public-observation-apply.mjs`
- Package check: `npm run check:hk-ipo-public-apply-plan`
- Inputs: observation adapter output, reconciliation packet output, raw snapshot capture hashes, storage reference envelopes, and schema preflight status.
- Target tables: `core.raw_source_batch`, `core.data_version_batch`, `core.hk_ipo_public_source_run`, `core.raw_snapshot`, `core.hk_ipo_public_observation`, `core.hk_ipo_public_reconciliation_row`, `core.hk_ipo_public_supplement_candidate`
- Guard: emits parameterized statement descriptors and row hashes only; `core.raw_snapshot.payload` is a redacted external-reference envelope, not raw HTML.

Held DB apply packet smoke:

- Script: `scripts/plan-hk-ipo-public-held-db-apply-packet.mjs`
- Package check: `npm run check:hk-ipo-public-held-db-apply-packet`
- Inputs: apply planner statement descriptors and held row groups.
- Provider boundary: `planetscale_postgres`
- Output: statement packet ids, target tables, row counts, parameter hashes, row-group hashes, and packet hash.
- Guard: no remote apply, no DB write, no SQL text, no raw payload body, no secrets or database URL in output.

Held review packet:

- Script: `scripts/plan-hk-ipo-public-held-review-packet.mjs`
- Package check: `npm run check:hk-ipo-public-held-review-packet`
- Inputs: apply planner summary and held DB apply packet counts/hashes.
- Output: review gates, held table row counts, row-group hashes, blocked serving tables, and packet hash.
- Guard: manual review required, held DB readback required, object-store readback required, no source URL/security code output, no DB/R2 write, no SQL text, no raw payload body, no serving table writes, no fact promotion, no data-version release.

Held DB apply/readback smoke:

- Contract checker: `scripts/check-hk-ipo-public-held-db-apply-smoke-contract.mjs`
- Package check: `npm run check:hk-ipo-public-held-db-apply-smoke`
- Unit check: `npm run test -- apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts`
- Route: `POST /ingest/hk-ipo-public/held-db-apply-smoke`
- Required guard: `x-aiphabee-smoke: hk-ipo-public-held-db-apply-v1` plus `AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN`.
- Target tables: `core.raw_source_batch`, `core.data_version_batch`, `core.raw_snapshot`, `core.hk_ipo_public_source_run`, `core.hk_ipo_public_observation`, `core.hk_ipo_public_reconciliation_row`, `core.hk_ipo_public_supplement_candidate`
- Blocked serving tables: `core.ipo_offering`, `core.ipo_timetable_event`, `core.ipo_narrative`, `core.ipo_cornerstone`
- Guard: synthetic held rows only, single transaction, insert/select/delete cleanup, hash/count-only response, no fact promotion, no data-version release, no serving table writes.

Live held DB apply/readback:

- Script: `scripts/apply-hk-ipo-public-held-db-live.mjs`
- Package check: `npm run check:hk-ipo-public-held-db-apply-live`
- Remote route: `POST /ingest/hk-ipo-public/held-db-apply`
- Readback route: `POST /ingest/hk-ipo-public/held-db-readback`
- Required guard: `x-aiphabee-smoke: hk-ipo-public-held-db-apply-live-v1` plus `AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN`.
- Production evidence on 2026-06-28 HKT: 617 held-layer rows inserted or updated, 2 remote R2 raw snapshot objects written, 2 R2 objects read back, 38 raw snapshot envelope rows, 303 public observation rows, 27 reconciliation rows, 246 supplement candidate rows.
- Hash-only evidence: data version hash `sha256:7c62703a93ac32da46302151a049e1adcdad024ea696d026961436ebd64cb75a`, apply response hash `sha256:b417a079b82431f4af115830e085940ec530c8e34e2d32391a2016f2aff2227a`, readback hash `sha256:6b2346447f4799a9956a4635cfcce7ea19d1d142d5dabd1e9b859afe0f36b9f3`.
- Guard: release state remains `held`; no serving table writes, no fact promotion, no data-version release, no raw payload body in JSON response.

Held promotion preflight:

- Script: `scripts/plan-hk-ipo-public-held-promotion-preflight.mjs`
- Package check: `npm run check:hk-ipo-public-held-promotion-preflight`
- Inputs: the held review packet used for apply plus optional held DB readback JSON from `scripts/check-hk-ipo-public-held-db-readback.mjs --remote`.
- Output: promotion preflight gates, readback verification status, manual-review requirement, blocked serving tables, and hash-only packet evidence.
- Guard: validates row counts, `release_state=held`, zero raw snapshot payload leaks, zero missing R2 objects, and `writes_serving_tables=false`; still keeps `promotion_execution_allowed=false` until manual review acceptance exists.

Future ingest route:

1. Fetch source page.
2. Persist raw snapshot metadata.
3. Extract one observation row per field.
4. Reconcile against HKEX by stock code, listing date, document URL, and issuer name.
5. Mark exact matches as reconciled; preserve conflicts without overwriting HKEX facts.

## P3 Decision

The current HKEX design exists to keep official documents, raw observations, extraction runs, and serving facts separated. That invariant should stay. Third-party public pages are better modeled as observations, not as a second canonical source, because their most useful fields are coverage accelerators and reconciliation hints.

At 10x source count, the first failure mode is not storage volume; it is provenance drift and field conflict. The smallest coherent change is therefore a source contract, a read-only live probe, and a guarded held-layer apply/readback path. It proves which sources are reachable, what fields are visible, which rows were captured, and whether raw snapshot object references can be read back before any serving promotion is allowed.

## Source Matrix

| Source | Default | Observed Strength | Blocker |
| --- | --- | --- | --- |
| AASTOCKS IPO Plus | yes | IPO lists, calendar, grey-market, sponsor-performance, company-summary links | dynamic HTML may require parser drift checks |
| VBKR/Huasheng HK IPO | yes | SSR payload with code, price range, lot size, fees, subscription dates, result date, listing date, prospectus, sponsors | fields come through Nuxt payload and need snapshot-based parser tests |
| ETNet IPO | no | likely rich IPO coverage | robots.txt excludes IPO paths |
| Futu/Moomoo IPO | no | likely rich broker-side coverage | public probes returned anti-automation or 403 responses |

## Verification

Static readiness:

```bash
npm run check:hk-ipo-public-sources
```

Adapter fixture check:

```bash
npm run check:hk-ipo-public-observations
npm run check:hk-ipo-public-reconciliation
npm run check:hk-ipo-public-reconciliation-packet
npm run check:hk-ipo-public-observation-schema
npm run check:hk-ipo-public-raw-snapshot-capture
npm run check:hk-ipo-public-raw-snapshot-storage
npm run check:hk-ipo-public-raw-snapshot-r2-writer
npm run check:hk-ipo-public-apply-plan
npm run check:hk-ipo-public-held-db-apply-packet
npm run check:hk-ipo-public-held-db-apply-live
npm run check:hk-ipo-public-held-db-apply-smoke
npm run check:hk-ipo-public-held-db-readback
npm run check:hk-ipo-public-held-review-packet
npm run check:hk-ipo-public-held-promotion-preflight
npm run test -- apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts
```

Live public probe:

```bash
npm run check:hk-ipo-public-sources -- --live
node scripts/reconcile-hk-ipo-public-observations.mjs --live --packet --check
node scripts/capture-hk-ipo-public-raw-snapshots.mjs --live --check
node scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs --live --check
node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --check
node scripts/plan-hk-ipo-public-observation-apply.mjs --live --check
node scripts/plan-hk-ipo-public-held-db-apply-packet.mjs --live --check
node scripts/plan-hk-ipo-public-held-review-packet.mjs --live --check
node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs --live --check
```

Explicit remote R2 writer smoke:

```bash
node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --remote --check
```

Explicit live held DB apply/readback:

```bash
AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN=<token> \
AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_ENDPOINT=<endpoint> \
node scripts/apply-hk-ipo-public-held-db-live.mjs --remote --check

AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN=<token> \
AIPHABEE_HK_IPO_PUBLIC_HELD_DB_READBACK_ENDPOINT=<endpoint> \
node scripts/check-hk-ipo-public-held-db-readback.mjs --remote

node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs \
  --live \
  --review-file <review_json> \
  --readback-file <readback_json> \
  --check
```

The default live probe is intentionally read-only. It checks page availability and expected fragments, then discards response bodies. The explicit remote R2 writer smoke is a bounded put/get/delete against smoke-prefixed keys only. The explicit live held DB apply writes only held-layer public observation rows and raw snapshot envelopes; it does not release data versions or write serving tables. The promotion preflight only consumes counts and hashes, so a verified readback can unblock the technical readback gate without unblocking manual review or serving promotion.
