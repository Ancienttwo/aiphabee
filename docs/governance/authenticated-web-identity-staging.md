# Authenticated Web identity on staging

## Boundary

The staging Web Worker is the only public entrypoint in this slice. GitHub proves
the upstream identity, Better Auth owns OAuth state and sessions, and PlanetScale
stores those rows in `aiphabee_auth`. The runtime login is intentionally unable
to use `platform`, `aiphabee_core`, governance, audit, or any `nq_*` schema.

Production is out of scope. With `APP_ENV=prod`, `/api/auth/*` returns `404` and
the auth database binding and secrets are not configured.

## Concrete trace

1. The browser starts GitHub OAuth at `/api/auth/sign-in/social`.
2. GitHub returns to `/api/auth/callback/github` on
   `aiphabee-web-staging.metalabs.workers.dev`.
3. Better Auth validates state and the exact trusted origin. Its user-create hook
   permits the first GitHub signup only when the normalized email hash is in the
   staging invite set.
4. Better Auth writes its user, account, session, verification, and rate-limit
   rows through `AIPHABEE_AUTH_HYPERDRIVE`. The database role is
   `aiphabee_auth_staging`; PlanetScale exposes it to the connection as the
   branch-qualified username `aiphabee_auth_staging.v20dtpdoz3ik`.
5. Product code may later derive only `better-auth:<Better Auth UUID>`. Email,
   request headers, and caller-supplied workspace values are not identity keys.
6. This slice stops before any lookup in `platform.account` or Netquity read.

## Secrets and evidence

The following values belong only in Cloudflare staging secrets and operator
secret storage: `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_SECRET`,
`AIPHABEE_AUTH_INVITED_EMAIL_SHA256`, and the local auth-Hyperdrive connection
string. `GITHUB_CLIENT_ID` is a staging Worker variable, not a credential. Raw
secret values, cookies, OAuth tokens, user email, and provider payloads must not
enter Git, terminal evidence, or task notes.

Evidence contains status, counts, version ids, and SHA-256 hashes only. The live
smoke consumes three separately issued session cookies for the same invited user
through process environment variables. It signs out the first, then revokes all
from the second and proves both remaining cookies invalid without printing any
cookie:

```sh
AIPHABEE_AUTH_STAGING_SESSION_COOKIE='<redacted>' \
AIPHABEE_AUTH_STAGING_REVOKE_SESSION_COOKIE='<redacted>' \
AIPHABEE_AUTH_STAGING_REVOKE_PEER_SESSION_COOKIE='<redacted>' \
npm run smoke:authenticated-web-identity
```

The non-authenticated route isolation can be checked independently:

```sh
npm run smoke:authenticated-web-identity -- --preflight-only
```

## Apply and readback

The reviewed migration is
`deploy/database/migrations/20260711041000_authenticated_web_identity.sql`; the
runtime privilege packet is
`deploy/database/roles/authenticated-web-identity-staging.sql`. Apply them only
after reading back the shared staging database and its elevated apply identity.
After apply, verify auth-table DML is true while schema create, database create,
role create, bypass-RLS, every product schema privilege, and every `nq_*`
privilege are false.

The Cloudflare Vite plugin selects the named environment at build time. Deploy
only the staging output with:

```sh
npm run check:authenticated-web-identity
npm run deploy:authenticated-web-identity:staging
```

`AIPHABEE_AUTH_HYPERDRIVE` must have query caching disabled because session and
revocation reads are authorization state. The Web handler creates a `pg.Pool`
with `max: 1` for each request and closes it after the Better Auth handler
settles; no database client or pool is reused across Worker requests.

Rollback deploys the prior staging Web version and revokes the dedicated auth
login and OAuth secret. The non-destructive schema and canonical
`platform.account.auth_subject` column remain unused; the mock session must not
be restored as an authenticated claim.

## Scale and decision rationale

At 10x session traffic, the first pressure is the database-backed session and
rate-limit write load. The dedicated Hyperdrive and schema keep that pressure
observable and movable without widening product-data privileges. Avoiding a
cookie cache is an intentional staging security tradeoff: revocation is
authoritative immediately, at the cost of an extra database read.
