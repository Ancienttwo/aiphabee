# Implementation Notes: establish-better-auth-identity-authority-on-staging

> **Status**: Complete
> **Plan**: plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md
> **Contract**: tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md
> **Review**: tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md
> **Last Updated**: 2026-07-11 04:00
> **Lifecycle**: notes

## Design Decisions

- Better Auth is the sole Web session authority. GitHub proves upstream identity;
  `better-auth:<user.id>` is the only future product mapping key. Email remains
  invite/contact metadata and the create hook requires GitHub-verified email.
- Auth persistence uses a request-scoped `pg.Pool` (`max: 1`) through the
  cache-disabled dedicated Hyperdrive and closes after every handler. The role
  owns no product, Serving, governance, audit, or `nq_*` privilege.
- Build-time environment selection is part of the deploy contract. The staging
  deploy command builds with `CLOUDFLARE_ENV=staging`, validates the generated
  Wrangler artifact, then deploys that exact artifact.
- Runtime Web secrets are exactly Better Auth secret, GitHub client secret, and
  invited-email hash. GitHub client id is a non-secret variable; the local
  Hyperdrive connection string is operator-only.

## Deviations From Plan Or Spec

- The original plan named an isolated local PostgreSQL proof. The final proof
  used the shared staging database after target/user readback because that is
  the actual acceptance authority. A temporary authenticated apply Worker ran
  the reviewed convergent role packet and its embedded positive/negative
  readback, then was deleted and confirmed absent.
- The live OAuth start is server-side so the redirect target can be restricted
  to HTTPS `github.com`; the browser never supplies callback or error URLs.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Reuse the product runtime role | Rejected | Auth writes must not gain product or raw-data authority. |
| Cache Hyperdrive auth reads | Rejected | Revocation/session reads are authorization state and must be current. |
| Email as product identity | Rejected | Mutable email cannot be the durable account mapping key. |

## Open Questions

- None.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Staging Web deployment: deployment `e31fbda5-cbcb-464a-b9c9-3a9e0a4b2d53`,
  version `1c9dfc94-2aab-4f8b-936c-080da4ae7fd0`, 100%.
- Production Worker readback: deployment
  `3921afaa-fa64-439f-9a49-af891264947d`, version
  `0ab3f7d0-517e-4fa3-91b7-1ccc92e90a88`, 100%, unchanged.
- Staging secret-name readback contained exactly the three contract names; no
  secret values were captured.
- Manual browser acceptance completed GitHub login, stable UUID session
  readback, logout, second login, and revoke-all. Final deployed build re-proved
  invalid-session denial, exact GitHub OAuth redirect, and production isolation.
- Staging role packet completed `applied_and_read_back`; the temporary apply
  Worker was deleted and Cloudflare returned Worker-not-found on readback.
- Closure correction removed the accidentally applied shared
  `platform_account_auth_subject_shape_check`, confirmed zero
  `legacy-auth-user:%` rows, and added/read back `rateLimit_lastRequest_idx`.
- During closure, an operator invoked the generic workspace deploy command with
  `--env staging`; TanStack's redirected config dropped the environment and
  briefly created `aiphabee-web`. It was immediately deleted, its URL returned
  404, Cloudflare returned Worker-not-found, and the contract-owned
  `deploy:authenticated-web-identity:staging` command then deployed only the
  staging build. The production API Worker version never changed.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
