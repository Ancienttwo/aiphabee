# Task Review: promote-and-prove-guarded-netquity-security-resolution-on-staging

> **Status**: Pass
> **Plan**: plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md
> **Contract**: tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md
> **Notes File**: tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 03:26
> **Recommendation**: pass
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:31d75416ea7533272bf5eeee3a20121437b8425113de4b3d920c82d842d369a9
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: pass
- Change type: migration + guarded staging runtime
- Intended files changed: approved plan/Sprint/workflow artifacts, staging
  promotion/index/role contract, security-tools mapper/tests, Worker route/tests,
  env/secret name contracts, and one static checker.
- Actual files changed: 21 intended repository paths; no dependency or lockfile
  change; ignored `_ops` apply/readback helpers excluded from commit.
- Commands passed: contract/env/database checks, all-workspace typecheck,
  290-test Worker/security-tools suite, local PostgreSQL two-pass apply,
  staging admin/runtime readback, staging live HTTP acceptance, diff check.
- External acceptance: unavailable from the required Claude channel; concrete
  manual override is backed by Deep `$check`, Gemini cross-vendor fallback, and
  live staging evidence.
- Residual risks: public resolver/auth/rights cutover and incremental promotion
  remain separate work; production deliberately has no new deployment.
- Reviewer action required: none for this staging implementation unit.
- Rollback: withdraw the data version, revoke five SELECT grants, delete the
  staging smoke secret, and redeploy staging without the route; preserve raw.

## Mode Evidence

- Selected route: approved contract plan in an isolated worktree, then Deep
  `$check`, cross-vendor review, commit/merge follow-through.
- P1/P2/P3 evidence: notes map raw/admin/runtime/Worker boundaries, trace an
  exact request end-to-end, and record the Serving snapshot decision plus 10x
  promotion/index failure boundary.
- Root cause or plan evidence: not a bugfix; approved Sprint Goal/Scope and the
  active plan's promotion gate are authoritative.

## Verification Evidence

- Waza `/check` run: Deep review, on-target scope, auth/data mutation
  adversarial pass. One environment-isolation hard stop found and fixed; one
  input-bound hard stop from cross-model review found and fixed.
- Commands run: `npm run check:netquity-security-resolution-staging`, targeted
  Vitest + full Worker route surface (`290/290`), `npm run check:database`,
  `npm run check:env`, `npm run typecheck`, and `git diff --check`.
- Manual checks: local two-pass SQL idempotency, remote fixed preflight,
  foundation/promotion/index/role packet apply, admin/runtime privilege
  readback, secret name readback, multilingual live requests, failure requests,
  staging version readback, and production deployment comparison.
- Supporting artifacts: plan, Sprint, contract, implementation notes, this
  review, `.ai/harness/checks/latest.json`, and ignored `_ops` scratch only.
- Implementation notes reviewed: yes; no vendor row values or secret values are
  committed.
- Run snapshot: refreshed by strict contract/Sprint verification before merge.

## External Acceptance Advice

> **External Acceptance**: unavailable (Manual Override)
> **External Reviewer**: Claude CLI unavailable; Gemini CLI fallback passed
> **External Source**: claude-review session quota; Gemini sandbox fallback
> **External Started**: 2026-07-11 03:10 HKT
> **External Completed**: 2026-07-11 03:25 HKT
> **Reviewed Diff Fingerprint**: sha256:31d75416ea7533272bf5eeee3a20121437b8425113de4b3d920c82d842d369a9
> **Reviewed Scope**: branch+staged+unstaged+untracked

- P1 blockers: none after remediation/adjudication. First pass found missing
  bearer/query bounds; both are now capped at 512 bytes and tested before
  binding access. The route-registration claim was adjudicated as non-live:
  this repository has one environment-neutral entrypoint, and non-staging now
  returns a generic 404 before auth/binding with a direct production-env test.
- P2 advisories: hardcoded as-of date is intentional one-shot authority; no
  reusable migration abstraction was added. The `client.end()` finding was a
  read error (`await` was already present), and malformed released rows map to
  the contractually required 502 readback failure.
- Acceptance checklist: final cross-model re-review output was exactly
  `NO_FINDINGS`; local/remote/live evidence all post-date the fixes.
- Manual Override: required Claude CLI returned session limit with no verdict;
  Deep `$check` fixed its environment-isolation hard stop, Gemini's first pass
  fixed the 512-byte input-bound hard stop, Gemini's final full-diff pass
  returned `NO_FINDINGS`, strict contract is 19/19, local PostgreSQL apply is
  idempotent, remote admin/runtime privilege readback is exact, staging live
  acceptance passes, and the production deployment version is unchanged.

## Behavior Diff Notes

- Added one released `security_master` snapshot containing 18,036 opaque HKEX
  security records and exact aliases. Raw Netquity schemas remain upstream and
  invisible to the runtime login.
- Added only five runtime SELECT grants plus core USAGE; readback proves no
  write, CREATE, ownership, superuser, BYPASSRLS, or raw-schema authority.
- Added an `APP_ENV=staging` + dual-header/token guarded route with constant-time
  bounded bearer comparison, bounded exact input, latest-release gate, overflow
  sentinel, fixed failure statuses, and no call to the synthetic resolver.
- Public `/tools/resolve-security` remains synthetic and unchanged. Staging is
  deployed; production version remains unchanged.

## Residual Risks / Follow-ups

- The guarded route is an operator acceptance surface, not product auth. Public
  cutover waits for the separately owned session/rights contract.
- Daily/incremental promotion and profile/history joins are intentionally not
  implemented. Re-running this exact one-shot packet is idempotent and verified.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Local, remote, runtime-role, and deployed HTTP paths pass. |
| Product depth | 8/10 | Exact security resolution is real; public auth/UI are intentionally gated. |
| Design quality | 9/10 | Release authority and raw/runtime boundaries stay explicit and fail closed. |
| Code quality | 9/10 | Pure mapper, bounded auth/query, typed errors, static contract, 290 tests. |

## Failing Items

- None.

## Retest Steps

- Re-run: contract `commands_succeed`, local two-pass promotion/role/index apply,
  and credentialed staging live packet recorded in implementation notes.
- Re-check: confirm staging Worker version and production non-change before any
  later public/production promotion.

## Summary

- PASS for the staging data/runtime implementation. This is not authorization
  for public resolver or production cutover.
