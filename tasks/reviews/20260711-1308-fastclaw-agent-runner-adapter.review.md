# Task Review: fastclaw-agent-runner-adapter

> **Status**: Reviewed
> **Plan**: plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md
> **Contract**: tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md
> **Notes File**: tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 13:39
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:6d71e978b5f424511e1c09dcd867bd5968c3f3471968e876d8c8b619a95abd5e
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS for the Row-7 deterministic adapter boundary. No public/live
  FastClaw transport claim is made.
- Change type: code-change
- Intended files changed: Agent Runtime selection/request/grant/runner,
  Worker profile authority/token composition, focused tests, machine contract,
  capability truth and workflow artifacts.
- Actual files changed: 22 fingerprinted contract-allowed paths plus this
  excluded review artifact. No dependency, migration, public route, binding,
  deploy, resource, staging DB write or FastClaw checkout change.
- Commands passed: targeted 336; full 1169 with 6 skipped; all-workspace
  typecheck/lint; database/env/contract/JSON/diff checks.
- External acceptance: manual override. Claude CLI produced no usable output;
  the first isolated Codex review failed at MCP auth; a clean-home Codex review
  performed substantial reads but exhausted the turn before a conclusion. No
  external PASS was fabricated.
- Residual risks: live FastClaw currently exposes opaque SSE and is explicitly
  non-compliant with callback-before-execution; Row 10 owns credentialed
  protocol, cleanup, isolation, load and cost readback.
- Reviewer action required: none for the deterministic Row-7 slice.
- Rollback: revert the single stacked Row-7 commit; no external cleanup.

## Mode Evidence

- Selected route: captured Waza think work package, read-only Row-7 gap study,
  isolated implementation and main-thread adversarial security review.
- P1/P2/P3 evidence: P1 preserves Agent Runtime/PostgreSQL/sandbox-auth/tool
  policy/post-check ownership. P2 traces private activation through one
  authority snapshot, frozen grant, token, callback transport and one terminal.
  P3 rejects opaque SSE and public route expansion as unproved authority.
- Root cause or plan evidence: approved Sprint row 7; not a bugfix profile.

## Verification Evidence

- Waza `/check` run: main-thread equivalent PASS after adversarial fixes;
  external reviewer automation limitations are recorded below.
- Commands run:
  - `npm run check:fastclaw-agent-runner` -> adapter true, live transport false,
    callback-before-execution, status ok.
  - Targeted runner/selection/Worker suite -> 5 files, 336 passed.
  - `npm run typecheck`, `npm run lint`, `npm run check:database`,
    `npm run check:env`, JSON parse and `git diff --check` -> PASS.
  - `npm test` -> 96 files passed, 2 skipped; 1169 tests passed, 6 skipped.
- Manual checks: package exports omit grant mint; registry enablement without
  activated runner ID blocks; Worker public planning route cannot activate;
  PostgreSQL entitlement/profile share one statement snapshot; denial remains
  sticky if transport catches it; late callbacks cannot execute after terminal;
  events contain no protected/raw material.
- Supporting artifacts: plan, contract, notes, active Sprint, machine contract,
  capability registry and focused fixtures.
- Implementation notes reviewed: yes.
- Run snapshot: strict snapshot is recorded after this review is bound.

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Claude CLI and isolated Codex CLI attempted; deterministic closure by main thread
> **External Source**: read-only local review attempts
> **External Started**: 2026-07-11T13:26:00+0800
> **External Completed**: 2026-07-11T13:39:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:6d71e978b5f424511e1c09dcd867bd5968c3f3471968e876d8c8b619a95abd5e
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: three Claude CLI invocations returned no review text. The
  first isolated Codex review terminated on an MCP authorization error. A
  clean-home Codex invocation read the requested code, diff, routes and
  capability surfaces but used its turn on inspection without a final finding
  list. These are tool failures, not evidence of a clean diff, so no external
  PASS is claimed.
- P1 blockers: none after direct adversarial review. The main thread found that
  a transport could catch a rejected tool callback and attempt to complete;
  callback failure is now sticky, call IDs/volume/parallelism are bounded, and
  a regression proves swallowed denial remains terminal.
- P2 advisories: capability status and source-map wording were corrected to
  distinguish private adapter execution from public/live dispatch; the contract
  checker now matches the exact FastClaw registry block and activation guard
  instead of any `enabled: true` string.
- Acceptance checklist: authentic frozen grant; exact current identity;
  callback-only tools; one wall-clock abort; monotonic/unique terminal events;
  post-check-only final; no raw/secret leakage; public route blocked; live
  transport false; full regression green.

## Behavior Diff Notes

- `runner_remote` is contract-executable and FastClaw is registered enabled,
  but selection requires `activatedRunnerId=fastclaw.personal-v0`; existing
  public planning cannot provide it.
- The grant brand and mint moved to an internal non-exported module. A WeakSet
  authenticates activation and the grant/owner are frozen.
- Worker authority reads entitlement and active profile together, then checks
  exact tenant/user and protected remote references before grant mint.
- The concrete issuer converts the branded run grant into a <=600-second HMAC
  token with exact sandbox scopes.
- Transport callbacks are the only tool path; raw progress/final/reasoning,
  IDs/token/tool data/errors never become Agent events. The AiphaBee post-check
  replacement is the sole final answer.

## Residual Risks / Follow-ups

- Row 8: persist only approved memory/artifacts and prove sandbox residual state
  absent after handoff.
- Row 10: implement/verify a real callback-capable FastClaw transport or keep
  activation blocked; record cleanup, isolation, load, latency and cost.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Deterministic adapter matrix passes; live transport intentionally absent. |
| Product depth | 8/10 | Identity, grant, token, tool and final authorities converge without a route. |
| Design quality | 9/10 | Routing and authorization are separate; opaque protocol fails closed. |
| Code quality | 9/10 | Focused modules, stable codes and adversarial race/leakage fixtures. |

## Failing Items

- None blocking Row 7. Live credentialed acceptance remains intentionally
  unavailable and cannot be overridden into production readiness.

## Retest Steps

- Re-run contract checker, targeted 336, full Vitest, all-workspace
  typecheck/lint, DB/env/JSON/diff checks, review fingerprint, strict contract
  and Sprint verification against base `7b7e2dc`.

## Summary

- PASS. Row 7 adds an executable private FastClaw AgentRunner adapter and
  authentic run grant while keeping public/live transport fail-closed.
