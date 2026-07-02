# Plan: chart image upload + FR-01 routing integration

> **Status**: Archived
> **Created**: 20260703-0134
> **Slug**: chart-upload-routing
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#上传链路 + FR-01 路由集成(PRD Module 5,Script #4/#6)
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-0134-chart-upload-routing.contract.md --strict`.
> **Rollback Surface**: Before execution remove `plans/plan-20260703-0134-chart-upload-routing.md`; after execution revert branch `codex/chart-upload-routing` or the explicitly reviewed diff.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260703-0134-chart-upload-routing.contract.md`
> **Task Review**: `tasks/reviews/20260703-0134-chart-upload-routing.review.md`
> **Implementation Notes**: `tasks/notes/20260703-0134-chart-upload-routing.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#上传链路 + FR-01 路由集成(PRD Module 5,Script #4/#6)
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260703-0134-chart-upload-routing.md`
- Sprint contract: `tasks/contracts/20260703-0134-chart-upload-routing.contract.md`
- Sprint review: `tasks/reviews/20260703-0134-chart-upload-routing.review.md`
- Implementation notes: `tasks/notes/20260703-0134-chart-upload-routing.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260703-0134-chart-upload-routing.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260703-0134-chart-upload-routing.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260703-0134-chart-upload-routing.md`.

## Approach
### Strategy
Use the captured planning output below as the execution source of truth.

### Trade-offs
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Captured plan | Preserves the approved Codex Plan or Waza think decision | Requires the captured text to be concrete enough to execute | Use |

## Detailed Design
### File Changes
| File | Action | Description |
|------|--------|-------------|
| See captured planning output | Follow | Implement only the approved scope named below |

### Code Snippets
See captured planning output.

### Data Flow
See captured planning output.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Captured plan lacks enough detail | Medium | Execution may need clarification | Stop before implementation if the captured output contradicts repo rules or lacks concrete file targets |

## Task Contracts
- Contract file: `tasks/contracts/20260703-0134-chart-upload-routing.contract.md`
- Review file: `tasks/reviews/20260703-0134-chart-upload-routing.review.md`
- Implementation notes file: `tasks/notes/20260703-0134-chart-upload-routing.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260703-0134-chart-upload-routing.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260703-0134-chart-upload-routing.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Before execution remove `plans/plan-20260703-0134-chart-upload-routing.md`; after execution revert branch `codex/chart-upload-routing` or the explicitly reviewed diff.
- **Verification boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-0134-chart-upload-routing.contract.md --strict`.
- **Review/acceptance boundary**: `tasks/reviews/20260703-0134-chart-upload-routing.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260703-0134-chart-upload-routing.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260703-0134-chart-upload-routing.contract.md`, `tasks/reviews/20260703-0134-chart-upload-routing.review.md`, and `tasks/notes/20260703-0134-chart-upload-routing.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260703-0134-chart-upload-routing.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Before execution remove `plans/plan-20260703-0134-chart-upload-routing.md`; after execution revert branch `codex/chart-upload-routing` or the explicitly reviewed diff.

## Captured Planning Output

# Plan: chart image upload + FR-01 routing integration

> **Status**: Approved
> **Source**: sprint `plans/sprints/20260702-1905-parse-chart-image.sprint.md` row 5
> **Scope**: parse_chart_image Module 5 upload/R2/imageRef chain, tenant ownership guard, deletion semantics, and FR-01 calibration routing.

## Goal

Finish the final sprint row for `parse_chart_image`: accept PNG/JPEG/WEBP chart screenshots into R2, persist image metadata in `chart_images`, make `parse_chart_image` resolve images through tenant-owned metadata, and route parsed results through calibration-aware FR-01 decisions without hard-coded 0.85/0.60 thresholds.

## Non-goals

- Do not introduce production Better Auth/session middleware in this slice. The repo currently only has token-gated worker smoke routes; this slice keeps auth fixture-level and leaves production auth for the existing Cloudflare-first Worker/service-layer boundary.
- Do not add `@cf-wasm/photon` or server-side resizing. This slice validates MIME and byte size only; client-side resize or Images/Photon can be added after a UI upload surface exists.
- Do not apply migrations to live PlanetScale or run credentialed live DB smoke.
- Do not dedupe uploads by hash or share R2 objects across tenants.
- Do not create real calibration data. Fixture tests cover the three non-auto-match acceptance cases without requiring live ready calibration rows.

## Architecture Map

- `packages/agent-runtime/src/parse-chart-image/`: owns parse executor, tool context, result sink, and the new routing/image metadata contracts.
- `apps/worker/src/index.ts`: owns token-gated upload/delete/smoke routes, R2 assembly, temporary server context headers, and Hyperdrive-backed lookup adapters.
- `deploy/database/migrations/`: owns additive `chart_images` migration and migrations contract registration.
- `plans/sprints/` and `tasks/notes/`: own sprint row 5 and sprint closeout evidence.

Main boundary: raw image bytes only enter `AIPHABEE_ARTIFACTS`; model/tool/results only carry `imageRef` and metadata.

## Concrete Flow

1. `POST /agent/chart-images` receives a raw binary body and headers:
   - `content-type: image/png | image/jpeg | image/webp`
   - `x-aiphabee-tenant-id`
   - `x-aiphabee-user-id`
   - token-gated smoke/fixture auth matching existing worker route conventions.
2. Worker rejects unsupported MIME or oversized bodies before R2 write.
3. Worker computes `content_hash_sha256`, generates `image_id`, writes R2 key `charts/{tenant_id}/{image_id}`, and persists `chart_images`.
4. `parse_chart_image` uses server-owned `tenant_id`; `fetchImage` checks an active `chart_images` row and `charts/{tenant_id}/` prefix before reading R2. Cross-tenant, missing, or removed images return `null`, causing the existing executor to record `image_not_found`.
5. A `CalibrationLookup` finds a ready calibration with exact schema/prompt/model match, non-null thresholds, and sample count meeting the same default gate as the eval CLI. Missing, superseded, mismatched, or insufficient calibration forces non-`auto_match`.
6. The parse result row stores the routing `calibration_run_id` only when a matching ready calibration was actually used.
7. `DELETE /agent/chart-images/:image_id` is tenant-scoped and idempotent: remove the R2 object, mark `chart_images.deleted_at`, and make later fetches return `null`.

## Design Decisions

1. **Upload shape: raw binary body.** Hono and Workers support `arrayBuffer()` and `formData()`, but this repo has no multipart precedent and row 5 acceptance does not require a browser form protocol. Raw binary is the smallest testable interface and avoids a new parser surface.
2. **Auth shape: token-gated fixture surface.** Full production auth is out of scope. The temporary route context comes from server-side headers in tests/smoke and must not be model-controlled.
3. **Ownership guard: DB row plus key prefix.** The DB row is the authority, and the R2 key prefix is a defense-in-depth invariant. Returning `null` preserves the executor's existing resource-not-found audit behavior.
4. **Routing location: agent-runtime.** Routing consumes `ChartParseResult`, chart-parse versions, and the parse executor's record shape. Keeping it in the same package avoids coupling production runtime to the eval CLI package.
5. **Threshold source: calibration artifact only.** PRD 0.85/0.60 are reference initials. Code must read active `calibration_runs.thresholds`; without one, route to confirmation/visual-only.
6. **Removal semantics: R2 object removal plus soft metadata row.** `deleted_at` preserves audit metadata while making fetch resolve as absent. SQL comments must avoid forbidden bare migration words noted in the handoff.

## Public Interfaces

- New worker route: `POST /agent/chart-images`
  - Request: raw image bytes, content type header, temporary tenant/user headers for fixture context.
  - Response: `{ image_ref, image_id, content_type, byte_size, content_hash_sha256, retention_policy }`, no bytes.
- New worker route: `DELETE /agent/chart-images/:image_id`
  - Response: hash-only/idempotent status and R2 removal evidence.
- New DB table: `aiphabee_core.chart_images`
  - Fields: `id`, `tenant_id`, `user_id`, `r2_key`, `content_type`, `byte_size`, `content_hash_sha256`, `retention_policy`, `deleted_at`, `created_at`.
- New agent-runtime types/functions:
  - `ChartImageRecord`
  - `CalibrationLookup`
  - `routeChartParseResult`
  - fetch/image adapters that can deny cross-tenant access by returning `null`.

## Implementation Steps

1. Add RED tests in `packages/agent-runtime/src/parse-chart-image` for routing:
   - empty calibration -> not `auto_match`
   - `status=superseded` -> not `auto_match`
   - schema/prompt/model mismatch -> not `auto_match`
   - ready matching calibration can produce `auto_match` and returns the calibration id
   - executor stores `calibration_run_id` when lookup is used
2. Implement routing contracts and executor wiring in agent-runtime without importing `@aiphabee/chart-parse-eval`.
3. Add migration `20260703005000_chart_image_uploads.sql` and register it in `deploy/database/migrations.contract.json`.
4. Add Worker upload/delete and metadata lookup helpers:
   - MIME allowlist
   - 5 MiB max bytes
   - SHA-256 metadata
   - `charts/{tenant_id}/{image_id}` key generation
   - R2 cleanup on DB persistence failure
   - delete idempotency
5. Wire `createParseChartImageSmokeFetchImage`/production fetch assembly to check `chart_images` before R2.
6. Add worker tests for:
   - unsupported MIME / too large rejects before R2 write
   - upload writes R2 + metadata response only
   - tenant B parsing tenant A image returns `image_not_found`
   - delete removes R2 object and later fetch returns absent
7. Run contract verification and close sprint row 5 after `/check` and Codex review.

## Verification

Minimum local verification:

```bash
npm run check:database
npx vitest run packages/agent-runtime/src/parse-chart-image apps/worker/src/index.test.ts
npm run typecheck
npm run lint
npm run test
npm run test:golden
```

Workflow verification:

```bash
LC_ALL=C repo-harness run verify-contract --strict
repo-harness-hook review-fingerprint --base main --format json
```

Acceptance proof:

- Route fixtures for empty calibration, superseded calibration, and version mismatch all return non-`auto_match`.
- Cross-tenant fixture makes tenant B parse tenant A `imageRef` as resource-not-found and records audit row through `chart_parse_results`.
- Removed imageRef cannot be fetched and fake R2 bucket records object removal.

## Rollback

The slice is additive. If the route is wrong, remove the new worker routes and routing wiring while leaving the additive table unused. No live migration apply is part of this work, so external rollback is not required in this implementation session.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Execute captured plan: chart image upload + FR-01 routing integration
