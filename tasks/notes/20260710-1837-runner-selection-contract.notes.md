# Implementation Notes: runner-selection-contract

> **Status**: Complete
> **Plan**: plans/plan-20260710-1837-runner-selection-contract.md
> **Contract**: tasks/contracts/20260710-1837-runner-selection-contract.contract.md
> **Review**: tasks/reviews/20260710-1837-runner-selection-contract.review.md
> **Last Updated**: 2026-07-10 19:08
> **Lifecycle**: notes

## Design Decisions

- Runner family is a static Agent Runtime-owned selection axis with exactly
  `edge|fastclaw`; `AgentRunMode` remains independent and unchanged.
- `edge.worker-v0` is enabled for selection and registers `dry_run` plus
  `guarded_live`; only `dry_run` remains globally executable, so guarded live
  preserves the existing `runner_required` result.
- `fastclaw.personal-v0` registers only `runner_remote` and remains disabled.
  Registration/readback does not imply dispatch or live execution.
- Selection precedence is invalid family → mode incompatibility → disabled
  runner → globally non-executable mode. Every explicit invalid/unavailable
  request fails before tool policy or planning; only an omitted family uses the
  documented `edge` default.
- Worker contains no runner registry. It passes the raw optional family value to
  `selectAgentRunner()` and only adapts the discriminated result into HTTP
  readback/error surfaces.
- Architecture review found that independently typed `family`, `runner_id`, and
  `supported_modes` still admitted contradictory combinations. `AgentRunner` is
  now a registry-derived discriminated union, including the exact registered
  mode tuple, and a `@ts-expect-error` guard proves an edge/FastClaw mixed
  identity cannot compile. The exported family list is also derived from the
  registry so the registry remains the single authority.

## Deviations From Plan Or Spec

- Harness refused to nest a worktree because the parent was already a linked
  isolated worktree. The task therefore switched that same isolated directory
  from the clean approval commit onto stacked branch
  `codex/runner-selection-contract`; primary `main` remained untouched.
- Reusing the primary worktree's `node_modules` symlink made Worker resolve the
  primary checkout's stale `@aiphabee/agent-runtime`. The first post-fix run was
  correctly classified as environment contamination. A local `npm install
  --ignore-scripts --no-audit --no-fund` created current-worktree workspace
  links; the same targeted suite then passed 308/308. No manifest or lockfile
  changed; local ignored `node_modules` remains worktree-only and is not staged.
- Generic Prettier defaults would reformat these legacy large files. The
  mechanical formatting diff was fully reversed before semantic patches were
  replayed; no repository-wide formatting change remains.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| New third execution enum | Reject | Duplicates `AgentRunMode` and creates split authority. |
| Worker-owned registry | Reject | Public adapter must consume, not own, routing semantics. |
| Dynamic config/database registry | Reject | Two static entries do not justify invalidation and rollout complexity. |
| Pure static registry + selector | Use | Smallest total, testable, fail-closed contract that leaves dispatch disabled. |

## Open Questions

- No question blocks Row 1. Enabling FastClaw, adding `runner_remote` to
  executable modes, and dynamic operational disable state belong to later named
  Sprint rows.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Test-first baseline: 9 targeted failures before implementation (2 Agent
  Runtime assertions and 7 Worker assertions).
- Clean-resolution targeted suite: 2 files, 308 tests passed.
- `npm run typecheck`: all workspaces passed.
- `npm run test`: 79 files passed, 1 skipped; 973 tests passed, 1 skipped.
- `npm run lint`: all workspaces passed TypeScript lint.
- `npm run check:answer-evidence-contract`: `status=ok`.
- `repo-harness run check-context-files`: `SAFE`.
- Security specialist: no finding. Architecture specialist: one registry/runner
  type-authority finding fixed, then no finding on re-review.
- Claude review: unavailable because the vendor session limit resets at 21:00;
  recorded as a manual override rather than a peer pass.
- Strict contract: 18/18 passed, status `Fulfilled`.
- Sprint verification: PASS with run snapshot
  `.ai/harness/runs/run-20260710T190733-26303-20260710-1837-runner-selection-contract.json`.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- No promotion: the workspace-link and formatting recovery are task-local
  execution notes, not stable product or harness rules.
