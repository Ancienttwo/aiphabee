# Implementation Notes: truth-convergence-fastclaw-planning

> **Status**: Complete
> **Plan**: plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md
> **Contract**: tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md
> **Review**: tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md
> **Last Updated**: 2026-07-10 17:49
> **Lifecycle**: notes

## Design Decisions

- Raw GPT documents are retained only under ignored
  `_ref/gpt-planning-pack-20260710/`. The tracked research memo stores the master
  and raw-chat hashes, so execution never depends on the local cache.
- `docs/spec.md` contains stable product invariants only. Current implementation
  state lives in `.ai/context/capabilities.json`; traceability lives in the
  capability source map.
- Product routing uses `selected_runner_family = edge | fastclaw`, while the
  concrete runtime representation remains a future runner-dispatch decision.
  Workflow/service are explicitly outside the runner family.
- The raw v3 conversation was replaced by a timestamped, repository-format Draft
  PRD. The future Sprint remains Draft and is not persistently activated.
- The Sprint preserves ten independent capability/release surfaces. Its final row
  fails closed when credentialed live evidence is unavailable.

## Deviations From Plan Or Spec

- Added `.ai/context/capability-source-map.json` to the approved scope after the
  repository root contract showed that new capability registry entries require
  explicit authority/test bindings. Plan and contract were updated before edit.
- Renamed the PRD and Sprint to timestamped filenames after the packaged strict
  workflow check rejected the original non-timestamped PRD filename.
- Replaced the planned global `check-task-workflow --strict` pass criterion with
  targeted PRD/Sprint parsing. The global check reports pre-existing deploy-SQL
  placement findings and an older malformed PRD; it emitted no finding for the
  new artifacts but cannot serve as a clean task-specific gate.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Commit the raw 489 KB pack under `docs/researches/` | Reject | Direct retrieval of inner files would retain a parallel truth system and consume context. |
| Keep raw material in `_ref/` plus one tracked distillation | Use | Matches repository policy and preserves provenance without granting authority. |
| Add a strict `selected_runner` code enum now | Reject | Current runtime already has `AgentRunMode` and free-form `runner_id`; dispatch does not exist yet. |
| Preserve ten Sprint rows | Use | Keeps identity, lifecycle, security, artifacts, billing/admin, and live acceptance independently reviewable. |

## Open Questions

- No question blocks this truth-convergence slice. Runner representation,
  provisioning API, persistence schema, packaging, and live workload economics
  are owned by named future Sprint rows and remain explicit PRD unknowns.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Raw source master SHA-256:
  `772a7a13b22a3288e893d2e61903f70909a0ad59a001c2ed8ee1fb662cc6eb3c`.
- Raw v3 chat SHA-256:
  `ac5d2a18eb0ff290bb18aa44e0bbcb610570ba151537a6ccbb13ffa15174d91b`.
- `repo-harness run check-context-files`: `SAFE`.
- Targeted Agent Runtime + Worker Vitest: `303/303` passed after linking the
  worktree to the primary worktree's existing `node_modules`; no dependency was
  installed or changed.
- `npm run check:answer-evidence-contract`: `status=ok`.
- Temporary worktree-local Sprint marker: `sprint-backlog next` parsed row 1 as
  `runner-selection-contract`; marker removed immediately after verification.
- Root-authority files changed by this slice total 11,947 bytes across
  `docs/spec.md`, capability registry, and capability source map;
  `check-context-files` reports `SAFE`. This does not reinterpret the 12,000
  setting as a per-file allowance.
- `git diff --check`: clean.
- Waza `/check`: deep semantic review, on target, zero remaining hard stops;
  conditional security/architecture specialists were not activated because the
  diff changes documentation and capability metadata only. The adversarial pass
  found no path that could activate a Draft Sprint, create runtime authority, or
  convert fixture evidence into live acceptance.
- Claude cross-review (2026-07-10 17:28–17:30 +0800) found one P1 vocabulary
  split and five P2 items. The in-scope P1 and four in-scope P2 items were closed:
  `cannot_determine` became runtime-authoritative `unknown`; the Sprint marker
  guard gained `set -euo pipefail`; duplicate Task Breakdown semantics were
  removed; planned FastClaw acceptance arrays were emptied; and the temporary
  `node_modules` symlink was removed. Two code/test P2 advisories came from the
  pre-existing branch range against stale `origin/main` and are outside this
  docs-only contract. A final Claude rerun was attempted at 17:45 but the vendor
  session limit stopped it before a verdict, so the review records a concrete
  manual override rather than fabricating peer acceptance for the final hash.
- The first strict contract run executed every command successfully but marked
  three prose-only manual checks `unsupported`, producing `Partial`. Those checks
  were converted into fail-closed shell assertions for Draft Sprint inactivity
  and row-10 live-evidence blocking; only the supported evaluator-review manual
  check remains. The final strict rerun passed `26/26` and marked the contract
  `Fulfilled`.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- The raw-pack disposition and contract reconciliation are promoted in
  `docs/researches/20260710-gpt-planning-pack-distillation.md` because they are
  durable decision evidence.
- No harness rule or `tasks/lessons.md` change is warranted from this one task.
