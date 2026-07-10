# Task Review: establish-better-auth-identity-authority-on-staging

> **Status**: Passed
> **Plan**: plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md
> **Contract**: tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md
> **Notes File**: tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-11 05:26
> **Recommendation**: pass
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:9f62998f8bd41d365ef55dd1047416423e74a1cee36767a54001215485f234ec
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: pass
- Change type: code-change + migration
- Intended files changed: 36 allowed-path files spanning Web auth/UI, explicit
  schema/role packets, executable contracts, tests, deploy config, and evidence.
- Actual files changed: 36; no path outside the contract allowlist.
- Commands passed: identity/secret/database/env checks, 271 targeted Web/Worker
  tests, root typecheck, staging Web build + artifact gate, live preflight, and
  `git diff --check`.
- External acceptance: manual_override — Claude review was invoked but the local
  Claude session limit had been reached; two independent read-only specialist
  closure reviews passed after all findings were fixed.
- Residual risks: no product resolver or entitlement path exists in this row by
  design; that is Row 2, not an identity fallback.
- Reviewer action required: none for Row 1.
- Rollback: deploy the prior staging Web version and revoke the dedicated auth
  login/secrets; leave the non-destructive schema/subject column unused.

## Mode Evidence

- Selected route: approved sprint contract -> worktree implementation -> staged
  deployment -> independent security and architecture closure review.
- P1: Browser/TanStack Web/Better Auth/dedicated Hyperdrive/PlanetScale auth
  schema are the complete Row 1 boundary. Product and Netquity data remain out.
- P2: GitHub -> `/api/auth/callback/github` -> Better Auth -> request-scoped
  pool -> `aiphabee_auth.*`; browser receives a database-backed secure session.
  Product mapping is only the canonical `better-auth:<uuid>` subject.
- P3: dedicated role/schema and cache-disabled auth reads preserve current
  revocation authority. At 10x, DB session/rate-limit writes fail first; no
  privilege or compatibility path was widened to hide that pressure.
- Root cause or plan evidence: the prior Web session claim was hard-coded and
  therefore could not authorize Row 2 safely.

## Verification Evidence

- Waza `/check` run: independent security closure PASS, 0 findings; independent
  architecture closure PASS, 0 findings.
- Commands run: `npm run check:authenticated-web-identity`, `npm run
  check:secrets`, `npm run check:database`, `npm run check:env`, targeted
  Vitest, Web and root typecheck, staging build/artifact gate, preflight smoke,
  `git diff --check`, and secret-pattern scan all passed.
- Manual checks: GitHub login, stable UUID session readback, logout, login again,
  revoke-all, invalid session denial, OAuth redirect host/callback, staging
  secret names, role packet apply/readback, staging/production deployments.
- Supporting artifacts: identity contract and implementation notes.
- Implementation notes reviewed: yes.
- Run snapshot: `.ai/harness/checks/latest.json` after strict verification.

## External Acceptance Advice

> **External Acceptance**: unavailable
> **External Reviewer**: Claude
> **External Source**: claude-review
> **External Started**: 2026-07-11 04:50
> **External Completed**: 2026-07-11 05:26

- P1 blockers: none after verified-email gate, exact origin pinning, peer-session
  revoke proof, production Web absence, and exact Worker version pinning fixes.
- P2 advisories: none after staging artifact gate, secret ownership split, and
  per-privilege role readback fixes.
- Acceptance checklist: all Row 1 contract checks and live surfaces passed.
- Claude external review was attempted but unavailable because the local Claude
  session limit resets at 07:00 Asia/Hong_Kong; the two independent specialist
  closures provide the external review evidence for this row.
- Manual Override: accept Row 1 because Claude review was attempted and returned
  `You've hit your session limit`; independent read-only security and
  architecture closure reviews both passed with zero findings after remediation,
  strict contract verification passed, staging live acceptance passed, and
  production Web/Worker isolation was read back exactly.

## Behavior Diff Notes

- Removed the mock Web session authority and replaced it with real Better Auth
  session state. No product-data read path was added.
- Added a staging-only OAuth start route that fixes callback/error destinations
  server-side and accepts redirects only to HTTPS `github.com`.

## Residual Risks / Follow-ups

- Local Vite's historical `/api/*` proxy shape is unchanged and is not the
  deployed staging route. Row 2 must choose its authenticated server-function
  path explicitly rather than adding a local compatibility bypass.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 10/10 | Live login/session/logout/revoke and fail-closed paths passed. |
| Product depth | 9/10 | Complete identity authority; product resolver intentionally deferred. |
| Design quality | 10/10 | Dedicated authority, least privilege, exact deploy gate. |
| Code quality | 9/10 | Tests/checkers cover contracts; generated bindings add expected volume. |

## Failing Items

- None.

## Retest Steps

- Re-run: `npm run check:authenticated-web-identity && npm run
  smoke:authenticated-web-identity -- --preflight-only`.
- Re-check: Cloudflare staging/production deployment ids and the auth role
  privilege packet.

## Summary

- PASS. Row 1 establishes one verified, revocable staging identity authority
  without granting product or raw-data access and without changing production.
