# Task Review: sandbox-terminal-lifecycle

> **Status**: Reviewed
> **Plan**: plans/plan-20260711-0346-sandbox-terminal-lifecycle.md
> **Contract**: tasks/contracts/20260711-0346-sandbox-terminal-lifecycle.contract.md
> **Notes File**: tasks/notes/20260711-0346-sandbox-terminal-lifecycle.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 04:25
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:13aadc0ea5b99d08f2416692d3148b9365a7600d80c1b88ff0a1e846d4b12097
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS; no remaining architecture or security hard stop.
- Change type: code-change
- Intended files changed: Agent Runtime lifecycle/port, concrete adapter timeout
  and completion behavior, focused tests, capability truth and Row-5 workflow
  artifacts.
- Actual files changed: 12 fingerprinted Row-5 implementation/workflow paths
  plus this excluded review artifact; all are contract-allowed. No dependency,
  route, service, DB surface, config variable, credential, backend registration,
  runner activation, deploy or live state was added.
- Commands passed: targeted 105/105; full 1077 passed and 3 skipped;
  all-workspace typecheck/lint; answer-evidence guard; source/context assertions;
  bridge Wrangler dry-run; `git diff --check`.
- External acceptance: manual override. Independent Codex architecture and
  security specialists each performed a Deep current-diff review and returned
  PASS after all verified findings were fixed. No finding is waived; only the
  unavailable Claude evaluator identity is overridden.
- Residual risks: durable ownership for late background reconciliation is a
  Row-7 activation prerequisite; persistent terminal/audit/usage sink remains
  Rows 7/9; provider resource/cost and live residual evidence remains Row 10.
- Reviewer action required: none for Row 5.
- Rollback: revert the single stacked Row-5 commit; no external state exists.

## Mode Evidence

- Selected route: Waza `/check` Deep review with architecture and security
  specialists plus main-thread adversarial state/race review.
- P1/P2/P3 evidence: P1 keeps terminal policy in Agent Runtime and provider
  mechanics in the adapter. P2 traces run-owned grant through bounded create,
  stream/control arbitration, kill, destroy, producer/consumer settlement and
  one terminal callback. P3 adds only the timeout/completion seams needed to
  make cleanup and observed usage truthful.
- Root cause or plan evidence: approved Sprint row 5 and captured think plan;
  this is not a bugfix.

## Verification Evidence

- Waza `/check` run: PASS after two architecture HIGH and two security findings
  were fixed with deterministic regressions.
- Commands run:
  - `npx vitest run packages/agent-runtime/src/sandbox-terminal-lifecycle.test.ts packages/agent-runtime/src/index.test.ts apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts` -> 3 files, 105 tests passed.
  - `npx vitest run` -> 89 files passed, 2 skipped; 1077 tests passed, 3 skipped.
  - `npm run typecheck && npm run lint` -> all workspaces passed.
  - `npm run check:answer-evidence-contract` -> `status=ok`.
  - observed-only source assertion, capability JSON parse and
    `git diff --check` -> passed.
  - `npx wrangler deploy --dry-run --config apps/sandbox-bridge/wrangler.jsonc`
    -> passed; existing container, lease registry and private Tool Gateway
    bindings were read back without deploy.
- Manual checks: run/grant ownership, pre-abort, bounded/late create, success,
  non-zero/typed failure, stream end/reject, client/tenant/global/kill-switch,
  soft/hard timeout, output-byte accounting, destroy failure, nonclosing
  producer, recorder failure, residual file denial and repeated destroy.
- Supporting artifacts: Sprint, plan, contract, notes, capability context and
  focused lifecycle/provider tests.
- Implementation notes reviewed: yes.
- Run snapshot: `.ai/harness/runs/run-20260711T042842-80715-20260711-0346-sandbox-terminal-lifecycle.json`
  (strict post-review pass with Row-4 base override).

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Codex architecture and security specialists
> **External Source**: specialist-review
> **External Started**: 2026-07-11T04:01:00+0800
> **External Completed**: 2026-07-11T04:20:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:13aadc0ea5b99d08f2416692d3148b9365a7600d80c1b88ff0a1e846d4b12097
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: no Claude evaluator is available in this runtime. The
  architecture specialist verified create and producer/consumer completion
  contracts; the security specialist verified run ownership, late-create
  tombstone reconciliation and non-release-safe uncertainty. Both returned
  final PASS on the current diff.
- P1 blockers: none remaining. Unbounded create, mismatched run identity,
  consumer settlement and orphan late-provider-success findings are closed.
- P2 advisories: Row 7 must attach late reconciliation to `waitUntil` or an
  equivalent durable owner before activation. Rows 7/9 must persist the
  required terminal callback. Row 10 owns live provider/resource evidence.
- Acceptance checklist: one semantic terminal callback, bounded create/kill/
  destroy, producer+consumer quiescence, idempotent cleanup, no residual file
  access, observed-only usage, disabled runtime readback and full regression
  all pass.

## Behavior Diff Notes

- Agent Runtime now owns one provider-neutral terminal lifecycle and requires a
  run-owned grant matching `run_id`.
- Sandbox port v2 declares 30-second create timeout, 15-second termination
  grace and an execution handle whose `closed` Promise represents producer
  completion.
- Control during create is bounded. A late lifecycle success is destroyed; a
  timed-out Cloudflare provider create retains its tombstone and is destroyed
  again before authority removal if it later succeeds.
- Terminal records separate semantic cause from destroy and execution-close
  truth. Usage contains observed durations, UTF-8 bytes/events and exit code,
  never output content or estimated provider cost.
- Backend registration, terminal sink, runner dispatch and live execution stay
  false.

## Residual Risks / Follow-ups

- Row 7: durable background ownership plus atomic runner/backend/grant activation.
- Rows 7/9: bind the required terminal callback to existing audit/usage owners.
- Row 10: credentialed residual-resource, CPU/memory/disk/network and cost evidence.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Full local lifecycle matrix, concrete adapter integration and fail-closed uncertainty pass; live remains intentionally off. |
| Product depth | 9/10 | Run ownership, control reasons, actual usage and activation boundary are explicit. |
| Design quality | 9/10 | One authority per boundary, no compatibility path or second framework. |
| Code quality | 9/10 | Focused state machine, explicit records and adversarial race tests. |

## Failing Items

- None blocking.

## Retest Steps

- Re-run targeted/full Vitest, all-workspace typecheck/lint, answer/source/context
  checks, bridge Wrangler dry-run, strict contract and `verify-sprint`.
- Re-check fingerprint after every implementation or workflow edit. This review
  artifact is intentionally excluded from the fingerprint.

## Summary

- PASS. Row 5 now provides bounded create-to-terminal orchestration, truthful
  cleanup/producer/consumer state and observed-only usage while leaving all
  persistence, activation, deploy and live evidence off.
