> **Archived**: 2026-07-03 02:40
> **Related Plan**: plans/archive/plan-20260703-0134-chart-upload-routing.md
> **Outcome**: Completed
> **Lifecycle**: notes
> **Parent Run ID**: run-20260703-0240

# Implementation Notes: chart-upload-routing

> **Status**: Implemented
> **Plan**: plans/plan-20260703-0134-chart-upload-routing.md
> **Contract**: tasks/contracts/20260703-0134-chart-upload-routing.contract.md
> **Review**: tasks/reviews/20260703-0134-chart-upload-routing.review.md
> **Last Updated**: 2026-07-03 02:36
> **Lifecycle**: notes

## Design Decisions

- P1 map: `packages/agent-runtime/src/parse-chart-image/` owns the reusable
  chart image metadata contract, tenant-owned fetch adapter, parse executor,
  and FR-01 routing decision. `apps/worker/src/index.ts` owns the token-gated
  smoke/upload HTTP surface plus R2/Hyperdrive adapters. `deploy/database/`
  owns the additive `aiphabee_core.chart_images` metadata table.
- P2 trace: `POST /agent/chart-images` accepts raw image bytes, reads
  `content-type` plus smoke-only server context headers, writes `charts/{tenant_id}/{id}`
  to `AIPHABEE_ARTIFACTS`, and persists metadata. Later
  `parse_chart_image` calls `fetchImage(imageRef, { tenant_id })`; the adapter
  first requires an active `chart_images` row and matching key prefix before
  reading R2. Cross-tenant or removed refs return `null`, so the existing
  executor records `image_not_found` without model calls.
- P3 rationale: auth remains fixture-level because this repo has no production
  auth/session path for worker routes yet. Routing reads calibration artifacts
  only through `CalibrationLookup`; no default PRD threshold is hard-coded into
  auto-match.
- The upload protocol is raw binary rather than multipart because worker has no
  multipart precedent and row 5 acceptance does not require browser form
  compatibility.
- `chart_images.deleted_at` is a soft metadata state; R2 object removal is still
  executed by the route/service before the metadata row is marked inactive.
- Stored-image live smoke now requires `x-aiphabee-tenant-id` plus an active
  `chart_images` row; body-only tenant context is accepted only for inline
  smoke fixtures.

## Deviations From Plan Or Spec

- Contract cleanup: removed the self-referential
  `repo-harness run verify-contract` command from `commands_succeed` after it
  caused recursive verification. The command remains the external workflow gate.
- Contract cleanup: moved acceptance fixtures out of `manual_checks` because
  strict `verify-contract` treats that field as unsupported. The same checks are
  recorded in the review card and covered by tests.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Full production auth | Deferred | Current worker routes are token-gated smoke surfaces; adding auth would widen the slice beyond PRD Module 5. |
| Multipart upload | Rejected | Raw binary keeps parser surface small and matches the acceptance fixtures. |
| Server-side resize / Photon | Deferred | No dependency or precedent exists; 5 MiB max-byte validation is enough for this slice. |
| Hard-coded 0.85/0.60 thresholds | Rejected | Auto-match requires ready calibration with exact schema/prompt/model and sample-count gate. |

## Open Questions

- Production user/session authority remains out of scope for this slice.
- Productionization must replace or remove smoke header tenant context before
  exposing upload/delete/parse stored-image routes.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Review fingerprint:
  `sha256:c177767a6f2f9a0091f36ad06afa2615989a0f363203aab5260e61d7ac527dc4`
- Verification:
  - `npm run check:database`
  - `npx vitest run packages/agent-runtime/src/parse-chart-image`
  - `npx vitest run apps/worker/src/index.test.ts`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` (`909 passed / 1 skipped`)
  - `npm run test:golden`
  - `claude-review` final acceptance: `P1 blockers: none`

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
