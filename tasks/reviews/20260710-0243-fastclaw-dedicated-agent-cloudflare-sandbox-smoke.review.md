# Task Review: fastclaw-dedicated-agent-cloudflare-sandbox-smoke

> **Status**: Reviewed
> **Plan**: plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md
> **Contract**: tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md
> **Notes File**: tasks/notes/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-10 04:14
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:afa315f8130316b1bae3c78b3066d103bd1eb7e74b8d623a176d310278263399
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS for deterministic staging/smoke scope; no production/live claim.
- Change type: code-change
- Intended files changed: AiphaBee Bridge/auth/runner/scripts/runbook/research/sprint/contract artifacts plus linked FastClaw Executor/config/API/lifecycle/docs.
- Actual files changed: 32 AiphaBee paths (review included; 31 fingerprinted implementation/contract paths) and 15 FastClaw paths. All AiphaBee paths map to contract `allowed_paths`; FastClaw is isolated in its linked branch.
- Commands passed: AiphaBee full Vitest/typecheck + targeted 15 tests + contract check + Worker dry-run; FastClaw targeted Go test/vet + focused race + diff/base checks.
- External acceptance: manual_override — two read-only Claude reviews reached the 330s limit without a final verdict; Codex architecture findings were fixed and the final independent security recheck had no P1/P2 blockers.
- Residual risks: no Docker/provider credentials, so no container build/deploy or Cloudflare live readback; FastClaw baseline full suite has unrelated setup/agentcli failures.
- Reviewer action required: none for this deterministic contract; live promotion remains gated by the runbook.
- Rollback: drop/revert the two additive branches. No production DB migration, data write, runner cutover, or deployed Worker exists.

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
- Manual checks: FastClaw base is exact `dev@c4c4194`; SalesKo-only commits absent; deterministic model emits exec then terminal marker; production runner remains disabled; missing live credentials/Docker are explicit.
- Supporting artifacts: runbook, research cost model, task notes, `.ai/harness/checks/latest.json`.
- Implementation notes reviewed: yes.
- Run snapshot: current worktree command outputs; live provider snapshot intentionally absent.

## External Acceptance Advice

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

- Full container dry-run/deploy is blocked by Docker daemon absence. Worker bundle and bindings are verified with `--containers-rollout=none`.
- Five required live inputs are absent; live state is `not_run_missing_credentials`.
- FastClaw `go test ./...` baseline failures: missing generated `internal/setup/web` embed assets and existing `internal/agentcli` SQLite `agent_id` failure. Changed/relevant packages pass.
- Current cost scenarios exclude Worker/DO/log/egress/FastClaw/LLM/tool costs and must not be presented as total unit economics.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Contract behavior and negative paths are machine-tested; live provider is explicitly outside current available environment. |
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

PASS. The two isolated branches implement a fail-closed deterministic proof of
the dedicated FastClaw Agent → Cloudflare sandbox path without changing the
public event authority or enabling production. Independent review blockers on
evidence authority, cleanup TTL, global create serialization and stale
lifecycle state were fixed and regression-tested. Live deployment and actual
cost metering remain truthfully unclaimed because Docker and credentials are
absent.
