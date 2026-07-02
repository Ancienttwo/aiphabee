> **Archived**: 2026-07-03 02:40
> **Related Plan**: plans/archive/plan-20260703-0134-chart-upload-routing.md
> **Outcome**: Completed
> **Lifecycle**: review
> **Parent Run ID**: run-20260703-0240

# Task Review: chart-upload-routing

> **Status**: Accepted
> **Plan**: plans/plan-20260703-0134-chart-upload-routing.md
> **Contract**: tasks/contracts/20260703-0134-chart-upload-routing.contract.md
> **Notes File**: tasks/notes/20260703-0134-chart-upload-routing.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-03 02:36
> **Recommendation**: pass
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:c177767a6f2f9a0091f36ad06afa2615989a0f363203aab5260e61d7ac527dc4
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: pass
- Change type: code-change + migration + ledger-closeout
- Intended files changed: agent-runtime parse-chart-image, worker route/tests,
  database migration/contract, plan/contract/notes/review ledger.
- Actual files changed: 17 files in review fingerprint scope, excluding this
  review file by design.
- Commands passed: `npm run check:database`;
  `npx vitest run packages/agent-runtime/src/parse-chart-image apps/worker/src/index.test.ts`;
  `npm run typecheck`; `npm run lint`; `npm run test`;
  `npm run test:golden`.
- External acceptance: pass from Claude via claude-review.
- Residual risks: production auth/session remains out of scope; smoke-token
  routes use header fixture context and must not be exposed as production auth;
  no live PlanetScale apply was performed; server-side resizing is deferred.
- Reviewer action required: inspect PR diff and verify deployment notes mention
  the new Hyperdrive-backed metadata prerequisite for stored-image live smoke.
- Rollback: revert final branch commit; no live migration apply was executed.

## Mode Evidence

- Selected route: contract worktree, plan
  `plans/plan-20260703-0134-chart-upload-routing.md`.
- P1 map: `packages/agent-runtime/src/parse-chart-image/` owns reusable
  routing/image metadata contracts; `apps/worker/src/index.ts` owns HTTP,
  R2, Hyperdrive, and smoke auth adapters; `deploy/database/` owns additive
  schema.
- P2 trace: upload writes R2 + `chart_images`; parse fetch checks active
  metadata and tenant key prefix before R2; removed/cross-tenant refs become
  `image_not_found` before any model call.
- P3 rationale: auth remains fixture-level; calibration thresholds only come
  from ready matching calibration artifacts; stored-image live smoke now
  requires server-owned tenant header plus metadata row.
- Root cause or plan evidence: sprint row 5 required upload chain, tenant
  ownership guard, removal semantics, and FR-01 routing integration.

## Verification Evidence

- Waza `/check` run: not run; external Claude review plus full local
  verification used for acceptance.
- Commands run:
  - PASS `npm run check:database` (`migrations: 70`, `status: ok`)
  - PASS `npx vitest run packages/agent-runtime/src/parse-chart-image` (`6 files / 30 tests`)
  - PASS `npx vitest run apps/worker/src/index.test.ts` (`1 file / 248 tests`)
  - PASS `npm run typecheck`
  - PASS `npm run lint`
  - PASS `npm run test` (`73 files passed / 909 tests`, `1 skipped`)
  - PASS `npm run test:golden` (`status: ok`)
- Manual checks:
  - Routing fixtures for empty, superseded, and version-mismatched calibration
    are non-`auto_match`: covered by `routing.test.ts`.
  - Tenant B parsing tenant A imageRef records resource-not-found before model
    call: covered by `apps/worker/src/index.test.ts`.
  - Tenant B removing tenant A image id returns `not_found` and does not remove
    R2: covered by `apps/worker/src/index.test.ts`.
  - Removed imageRef cannot resolve and fake R2 records object removal: covered
    by `image-store.test.ts` and worker route tests.
- Supporting artifacts: review fingerprint
  `sha256:c177767a6f2f9a0091f36ad06afa2615989a0f363203aab5260e61d7ac527dc4`.
- Implementation notes reviewed:
  `tasks/notes/20260703-0134-chart-upload-routing.notes.md`.
- Run snapshot: `.ai/harness/checks/latest.json` exists; no separate run
  snapshot generated in this session.

## External Acceptance Advice

> **External Acceptance**: pass
> **External Reviewer**: Claude
> **External Source**: claude-review
> **External Started**: 2026-07-03T02:31:00+08:00
> **External Completed**: 2026-07-03T02:35:00+08:00

- P1 blockers: none
- P2 advisories:
  - A single shared smoke token still carries all route access in this slice;
    production auth must remove or replace header-context routes before
    exposure.
  - Deletion is tenant-scoped, not user-owned; user ownership belongs in the
    later production auth slice.
  - TypeScript allows single-argument `fetchImage` implementations to satisfy
    the two-argument interface; production wiring should use the provided
    tenant-aware adapter.
- P3 notes:
  - Upload compensation cleanup can still leave an orphan R2 object if both
    metadata insert and cleanup removal fail.
  - Stored-image live smoke is intentionally stricter than the old pure-R2
    fixture path and now requires migration + metadata row.
- Acceptance checklist: pass for row 5 local scope.

## Behavior Diff Notes

- New `POST /agent/chart-images` accepts raw PNG/JPEG/WEBP bytes, stores R2
  object + `chart_images` metadata, and returns metadata only.
- New `DELETE /agent/chart-images/:image_id` is tenant-scoped and idempotent.
- `parse_chart_image` fetch receives tenant context and denies missing,
  cross-tenant, inactive, or body-only stored-image refs before the vision
  model.
- FR-01 routing now returns `auto_match`, `user_confirm`, or `visual_only`;
  `calibration_run_id` is recorded only when a ready matching calibration is
  actually used.

## Residual Risks / Follow-ups

- No live PlanetScale migration apply was performed.
- No production auth was introduced; smoke headers are fixture context only and
  must be replaced or removed before production exposure.
- No server-side image resizing was introduced.
- Stored-image live smoke requires Hyperdrive metadata and seeded metadata rows;
  older pure-R2 fixture scripts need migration.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 8/10 | Row 5 acceptance fixtures pass locally; live DB apply remains out of scope. |
| Product depth | 8/10 | Preserves pixel isolation, tenant ownership, and calibration-gated auto-match. |
| Design quality | 8/10 | Shared image/routing contracts stay in agent-runtime; worker only adapts HTTP/R2/Hyperdrive. |
| Code quality | 8/10 | Full typecheck/lint/test/golden green; large worker file remains the main review risk. |

## Failing Items

- None.

## Retest Steps

- Re-run: `npm run check:database && npx vitest run packages/agent-runtime/src/parse-chart-image apps/worker/src/index.test.ts && npm run typecheck && npm run lint && npm run test && npm run test:golden`
- Re-check: `LC_ALL=C repo-harness run verify-contract --contract tasks/contracts/20260703-0134-chart-upload-routing.contract.md --strict`

## Summary

- Accepted for PR submission.
