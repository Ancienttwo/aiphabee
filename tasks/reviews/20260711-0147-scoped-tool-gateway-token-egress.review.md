# Task Review: scoped-tool-gateway-token-egress

> **Status**: Reviewed
> **Plan**: plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md
> **Contract**: tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md
> **Notes File**: tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 03:21
> **Recommendation**: pass
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:dba2075181826d7d4200ba72a62ee5867712ea8c9a6146770cd4f25775b4f1f5
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: PASS; no remaining architecture or security hard stop.
- Change type: code-change
- Intended files changed: Agent Runtime egress contract, canonical tool token,
  private Worker named entrypoint, sandbox proxy/adapter egress, exact provider
  pin/binding, names-only secret governance, tests, capability and Sprint truth.
- Actual files changed: 31 fingerprinted implementation/config/workflow paths
  plus this excluded review artifact; every path is contract-allowed. No public
  route, production token mint, backend registration, runner activation,
  deploy, database write, migration or secret value was added.
- Commands passed: targeted 92/92; full 1044 passed and 3 skipped; all-workspace
  typecheck/lint; env/secrets/answer guards; exact pin/source assertions; Worker
  and bridge Wrangler dry-runs with final-bundle readback; `git diff --check`.
- External acceptance: manual override. Architecture specialist returned a
  clean Deep verdict after exact bundle and capability-truth review. Security
  specialist verified stale-token, late-RPC and start-timeout remediations and
  found no new token/header/SSRF/public-entrypoint issue. The available
  specialist runtime was Codex, not the harness-required Claude evaluator, so
  this is recorded honestly rather than relabeling the reviewer.
- Residual risks: live HTTPS interception, CA/DNS behavior, deployed service
  binding and cross-tenant behavior remain Row 10; uncertain provider lifecycle
  reconciliation remains Row 5; real tool-route rights/activation remains Row 7.
- Reviewer action required: none for Row 4.
- Rollback: revert the single stacked Row-4 commit; no external state exists.

## Mode Evidence

- Selected route: Waza `/check` Deep review with architecture and security
  specialists plus main-thread adversarial source/bundle review.
- P1/P2/P3 evidence: P1 keeps Agent Runtime, auth mechanics, provider bridge,
  named Worker and Tool Registry as separate authorities. P2 traces exact lease
  mapping through the specialized proxy/service binding and verified claims to
  the disabled registry gate. P3 uses the smallest provider-specific seam and
  poisons uncertainty rather than inventing cleanup success.
- Root cause or plan evidence: approved Sprint row 4 and captured think plan;
  this is not a bugfix.

## Verification Evidence

- Waza `/check` run: PASS after all verified CRITICAL/HIGH/MEDIUM findings were
  fixed and deterministic regressions added.
- Commands run:
  - `npx vitest run packages/sandbox-run-auth/src/index.test.ts packages/agent-runtime/src/index.test.ts apps/worker/src/sandbox-tool-gateway.test.ts apps/sandbox-bridge/src/tool-gateway-egress.test.ts apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts apps/sandbox-bridge/src/index.test.ts` -> 6 files, 92 tests passed.
  - `npx vitest run` -> 88 files passed, 2 skipped; 1044 tests passed, 3 skipped.
  - `npm run typecheck` and `npm run lint` -> all workspaces passed.
  - `npm run check:env`, `npm run check:secrets`, and
    `npm run check:answer-evidence-contract` -> `status=ok`.
  - exact Sandbox/Containers pin plus source-level specialized-proxy/static-setter
    assertions -> passed.
  - Worker and bridge `wrangler deploy --dry-run` -> passed; bridge bundle
    contains specialized exact-host dispatch, top-level setter registration,
    no Internet, HTTPS interception and named service binding.
  - `git diff --check` -> passed.
- Manual checks: canonical token shape/audience, bounded bodies, trusted header
  reconstruction, no global fetch, private/public route split, proxy-isolate
  dispatch, partial/late provider mutation, poisoned lease reuse, no token in
  process state, and Tool Registry `execution_ready=false` denial.
- Supporting artifacts: Sprint, plan, contract, notes, capability context,
  pinned provider source and focused adversarial tests.
- Implementation notes reviewed: yes.
- Run snapshot: `.ai/harness/runs/run-20260711T032033-46774-20260711-0147-scoped-tool-gateway-token-egress.json` (post-commit `verify-sprint` pass with Row-3 base override).

## External Acceptance Advice

> **External Acceptance**: manual_override
> **External Reviewer**: Codex architecture and security specialists
> **External Source**: specialist-review
> **External Started**: 2026-07-11T02:00:00+0800
> **External Completed**: 2026-07-11T03:02:00+0800
> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:dba2075181826d7d4200ba72a62ee5867712ea8c9a6146770cd4f25775b4f1f5
> **Reviewed Scope**: branch+staged+unstaged+untracked

- Manual Override: no Claude evaluator is available in this runtime. Two
  independent Codex specialists performed architecture and security review;
  the architecture reviewer returned a clean current-diff verdict and the
  security reviewer confirmed every verified trigger closed. The main Deep
  review independently re-read the exact pinned provider source and final
  bundle. No finding is waived; only evaluator identity is overridden.
- P1 blockers: none remaining. The proxy-isolate dispatch, static setter
  shadowing, sensitive IPO route admission and stale-token reuse findings are
  closed in the current fingerprint.
- P2 advisories: Row 5 owns automatic terminal reconciliation; Row 7 must not
  set Tool Registry execution ready before downstream rights enforcement; Row
  10 owns credentialed provider/network evidence.
- Acceptance checklist: exact claims/TTL, private named entrypoint, exact-host
  proxy dispatch, no direct Internet fallback, forbidden-secret absence,
  bounded bodies/provider calls, poisoned unknown state, no real route
  activation, full regression and dry-run bundle readback all pass.

## Behavior Diff Notes

- Agent Runtime now requires explicit `deny_all` or fixed Tool Gateway access on
  every execute; arbitrary targets and arbitrary process env are unrepresentable.
- The adapter pre-clears the exact host, stores the short token only in trusted
  outbound params, bounds provider calls and never reopens an uncertain lease.
- The specialized proxy directly dispatches only the exact Tool Gateway override
  across the WorkerEntrypoint isolate; all other requests use SDK fallback.
- The named Worker verifies token and trusted lease/run/tenant/user binding, but
  real routes remain 403 while Tool Registry execution readiness is false.

## Residual Risks / Follow-ups

- Row 5: cleanup/reconciliation for poisoned provider start/configuration state.
- Row 7: downstream rights enforcement plus atomic Tool Registry/runner activation.
- Row 10: credentialed HTTPS, DNS/IP/redirect, service-binding, secret-absence,
  cross-tenant, resource and cost evidence.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Exact local transport/token/denial behavior and provider dry-runs pass; live execution stays intentionally off. |
| Product depth | 9/10 | Tenant/user/run/lease/tool authority is explicit without activating unsafe downstream routes. |
| Design quality | 9/10 | One authority per boundary, exact proxy seam, no generic egress or compatibility fallback. |
| Code quality | 9/10 | Canonical crypto, bounded streams/RPCs, typed denial and adversarial late-completion tests. |

## Failing Items

- None blocking.

## Retest Steps

- Re-run targeted/full Vitest, all-workspace typecheck/lint, env/secrets/answer
  guards, pin/source assertions, both Wrangler dry-runs, strict contract and
  `repo-harness run verify-sprint`.
- Re-check fingerprint after every implementation/config/workflow edit. This
  review artifact is intentionally excluded from the fingerprint calculation.

## Summary

- PASS. Row 4 implements the scoped token and exact private egress boundary,
  closes all verified provider races, and deliberately leaves actual tool
  execution, runner activation, deployment and live acceptance off.
