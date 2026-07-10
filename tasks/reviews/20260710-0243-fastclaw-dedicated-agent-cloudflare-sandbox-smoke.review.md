# Task Review: fastclaw-dedicated-agent-cloudflare-sandbox-smoke

> **Status**: Reviewed
> **Plan**: plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md
> **Contract**: tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md
> **Notes File**: tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-10 05:15
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Pre-Live Reviewed Diff Fingerprint**: sha256:afa315f8130316b1bae3c78b3066d103bd1eb7e74b8d623a176d310278263399
> **Live Acceptance Implementation Fingerprint**: sha256:d66725319449efd5f7ea5f3eee75d277f94451c47d661dbb9a5d6ff306783d4e
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS for deterministic and live staging/smoke scope; no production claim.
- Change type: code-change
- Intended files changed: AiphaBee Bridge/auth/runner/scripts/runbook/research/sprint/contract artifacts plus linked FastClaw Executor/config/API/lifecycle/docs.
- Actual files changed: 32 AiphaBee paths (review included; 31 fingerprinted implementation/contract paths) and 15 FastClaw paths. All AiphaBee paths map to contract `allowed_paths`; FastClaw is isolated in its linked branch.
- Commands passed: AiphaBee full Vitest/typecheck + targeted 15 tests + contract check + Worker dry-run; FastClaw targeted Go test/vet + focused race + diff/base checks.
- External acceptance: manual_override — two read-only Claude reviews reached the 330s limit without a final verdict; Codex architecture findings were fixed and the final independent security recheck had no P1/P2 blockers.
- Residual risks: cost is a live wall-clock list-price bound rather than actual invoice data; FastClaw baseline full suite has unrelated setup/agentcli failures.
- Reviewer action required: none for this staging contract; production promotion remains a separate product slice.
- Rollback: drop/revert the two additive branches. The staging Worker and its Container application were deleted after live acceptance. No production DB migration, data write, or runner cutover exists.

## Mode Evidence

- Selected route: deep cross-repo `/check` with architecture and security specialist passes.
- P1/P2/P3 evidence: P1 — AiphaBee `AgentRunner` → FastClaw tool loop → internal Bridge Worker → Cloudflare Sandbox, with Durable Object RunGuard and one AiphaBee cleanup owner. P2 — provision user/Agent → context-only token → exec → argv/stdout receipt → direct artifact read → destroy → terminal readback. P3 — provider/LLM output is not promoted without independent Bridge facts; production runner and durable product lifecycle remain outside this branch.
- Root cause or plan evidence: approved captured plan `plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md`; architecture review exposed four concrete lifecycle/authority/concurrency defects and final diff closes each.

## Verification Evidence

- Waza `/check` run: deep mode; architecture + security personas; adversarial authority, identity collision, timeout, cleanup-race, output/path-bound and credential-leak checks.
- Commands run:
  - `npm test` => 82 passed files, 1 skipped; 983 passed tests, 1 skipped.
  - `npm run typecheck` => all workspaces passed.
  - targeted Vitest auth/Bridge/runner => 3 files, 15 tests passed.
  - `npm run check:fastclaw-cloudflare-sandbox-smoke` => 12/12 invariants true; live `not_run_missing_credentials`.
  - `npx wrangler deploy --dry-run --containers-rollout=none --cwd apps/sandbox-bridge` => bundle/bindings/container declaration PASS.
  - FastClaw `go test` + `go vet` for config/sandbox/api/gateway => PASS.
  - `go test -race ./internal/sandbox -run 'TestCloudflare|TestLifecycle_ForgetsExternallyManaged'` => PASS.
  - both worktrees `git diff --check`; FastClaw merge-base/no-extra-commit assertions => PASS.
  - live full image build/deploy => PASS; serial 1/1 and final concurrency 10/10 => PASS; explicit Worker + Container application rollback => PASS.
- Manual checks: FastClaw base is exact `dev@c4c4194`; SalesKo-only commits absent; deterministic model emits exec then terminal marker; production runner remains disabled; ephemeral credentials were not persisted.
- Supporting artifacts: runbook, research cost model, task notes, `.ai/harness/checks/latest.json`.
- Implementation notes reviewed: yes.
- Live run snapshot: serial 1/1 and final concurrency 10/10 completed with
  distinct Agent/sandbox identities, receipt + direct artifact proof,
  `sandbox_destroyed=true`, terminal readback, and explicit
  `actual_bill=false` cost bounds. Rollback returned Worker HTTP 404 and no
  exact-name Container application.

## External Acceptance Advice

This block is the historical pre-live external-review record. Its live-provider
availability advisory is superseded by the live acceptance supplement above;
the architecture/security findings remain applicable.

> **External Acceptance**: unavailable
> **External Reviewer**: Claude
> **External Source**: claude-review
> **External Started**: 2026-07-10T04:19:00+08:00
> **External Completed**: 2026-07-10T04:32:00+08:00
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:afa315f8130316b1bae3c78b3066d103bd1eb7e74b8d623a176d310278263399
> **Reviewed Scope**: branch+staged+unstaged+untracked

- P1 blockers: none after adjudication and fixes.
- P2 advisories: live Cloudflare deployment/cost meter unavailable; FastClaw full-suite baseline failures are outside changed packages.
- Acceptance checklist: identity-bound token/ID/DO; exact argv + stdout receipt; direct artifact hash; single cleanup owner; 540s + 60s reserve; concurrent distinct-scope create; token scrub; fail-closed async; no prompt/log/persistence secret sink; explicit missing-credential state — all PASS.
- Manual Override: Claude read-only review was attempted twice (broad cross-repo and narrowed core diff) and timed out without a final finding list; accept this deterministic contract based on fixed architecture findings, final security PASS, full AiphaBee suite, targeted Go test/vet/race, strict contract verification, and no live/provider claim.

Claude transcript output, verbatim (no final verdict was produced):

> 我先核對幾個關鍵接縫的實際程式碼（FastClaw tool loop 的 context threading、exec timeout、AiphaBee event contract、`@cloudflare/sandbox` 實際 export），再回報 findings。

> 我先做兩三個定點驗證（bridge 的 token 模組、`@cloudflare/sandbox/bridge` 匯出是否存在、FastClaw `bindSession` 的 pool key），再回報 findings。

### Architecture findings and adjudication

1. Model hash/marker could pass without Bridge execution — fixed with RunGuard
   `argv_sha256 + exit_code + stdout_sha256` and direct artifact readback; a
   model-only-echo regression test now fails closed.
2. 600s run budget could consume the 600s token lifetime before cleanup —
   active cap reduced to 540s with a 60s reserve; cleanup itself is bounded to
   20s.
3. Gateway-wide pool mutex covered remote create — replaced by per-scope
   in-flight coalescing; a race-enabled test proves two distinct scopes create
   concurrently and same-scope requests coalesce.
4. AiphaBee destroy left a stale FastClaw lifecycle entry whose token would
   expire before idle eviction — FastClaw now forgets/scrubs at turn end and
   AiphaBee is the only provider cleanup owner; async external runs reject.

Final security recheck independently verified the corrected diff and reported
no P1/P2 finding. The focused race detector passed; the all-package race run's
existing fake-pool map race is not in this slice.

## Behavior Diff Notes

- Adds a Worker-only authenticated Cloudflare Sandbox provider boundary; public AiphaBee event contract is unchanged.
- Adds a staging-only `FastClawSandboxSmokeRunner`; production executable modes remain unchanged.
- Adds FastClaw `cloudflare` as an existing `ExecutorPool` backend and context-only credential threading.
- A dedicated Agent is provisioned in a disposable FastClaw DB for each smoke. Durable paid-user mapping/product lifecycle is not claimed.
- Cost output is explicitly an estimate with raw list-price low/high bounds; no actual-bill field can become true.

## Residual Risks / Follow-ups

- Live deployment, full Container image build/push, serial run and final
  concurrency 10 run passed. The initial live run found and fixed UTC date,
  workspace path and create-readiness defects before the final pass.
- FastClaw `go test ./...` baseline failures: missing generated `internal/setup/web` embed assets and existing `internal/agentcli` SQLite `agent_id` failure. Changed/relevant packages pass.
- Live cost bounds exclude included usage, Worker/DO/log/egress/FastClaw/LLM/tool costs and must not be presented as actual bill or total unit economics.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Contract/negative paths and live serial/concurrency provider paths passed; production runner remains intentionally disabled. |
| Product depth | 8/10 | Dedicated identity + ephemeral execution boundary is coherent; durable mapping/billing/lifecycle is intentionally next product slice. |
| Design quality | 9/10 | One public authority, one provider seam, identity-bound auth, structured evidence, one cleanup owner, no fallback. |
| Code quality | 9/10 | Bounded inputs/outputs/timeouts, concurrent-pool tests, race check, full TS suite and targeted Go vet pass. |

## Failing Items

- None blocking for deterministic staging/smoke scope.

## Retest Steps

- Re-run: `npm test && npm run typecheck && npm run check:fastclaw-cloudflare-sandbox-smoke`.
- Re-run linked FastClaw: `go test ./internal/config ./internal/sandbox ./internal/api ./internal/gateway && go vet ./internal/config ./internal/sandbox ./internal/api ./internal/gateway`.
- Re-check live only through `deploy/runbooks/fastclaw-cloudflare-sandbox-smoke.md`; require provider receipt/artifact/destroy evidence, not only a successful deploy command.

## Summary

PASS. The two isolated branches implement a fail-closed deterministic and live
staging proof of the dedicated FastClaw Agent → Cloudflare sandbox path without
changing the public event authority or enabling production. Independent review
blockers on evidence authority, cleanup TTL, global create serialization and
stale lifecycle state were fixed and regression-tested. Final live acceptance
passed 1/1 and 10/10, then the Worker and Container application were explicitly
deleted. Cost evidence remains truthfully labelled as a raw wall-clock
list-price bound, not an actual Cloudflare bill.
