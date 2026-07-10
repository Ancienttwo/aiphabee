# Authenticated Netquity Web Resolver — Staging

## P1 · Architecture map

The staging stock search crosses four authority boundaries: the Web Worker owns
the Better Auth session, the named `AIPHABEE_API` service binding owns the
private Web-to-API hop, PlanetScale platform/governance rows own product and
field rights, and released `aiphabee_core` Serving rows own search results.
Production, raw `nq_*` schemas, API/MCP/export rights, and the public synthetic
resolver are outside this slice.

## P2 · Concrete trace

`resolveAuthenticatedSecurity` accepts only query and optional market. The
TanStack server function reads the incoming Cookie, resolves the database-backed
Better Auth session, derives `better-auth:<uuid>`, and awaits the named Worker
RPC. The API Worker maps that exact subject through a PUBLIC-revoked
security-definer function, sets the request-local RLS account claim, requires
exactly one active membership/subscription/product context, and compiles the 13
explicit Web `security_master` fields through the Data Access Gateway. Only a
full allow reaches the released exact-alias Serving query. Its JSONB alias
containment predicate is backed by the partial
`serving_record_security_aliases_gin_idx`; live `EXPLAIN (ANALYZE)` must show
that index before acceptance closes. Any missing,
ambiguous, blocked, expired, or unavailable authority returns a typed denial.

## P3 · Decision and invariants

The browser never supplies identity, account, workspace, plan, or rights. The
runtime cannot enumerate accounts, mutate platform/governance rows, use Better
Auth tables, or access raw Netquity schemas. Multi-workspace state fails closed;
there is no hidden selector. At 10x load the session read and entitlement join
are the first pressure points, so the path uses one request-scoped connection
and indexed exact lookups instead of per-field queries.

## Apply, deploy, and rollback

Apply in this order: migration, least-privilege role packet, then explicit
staging provisioning packet. Deploy `aiphabee-worker-staging` before
`aiphabee-web-staging`, then explicitly resync `BETTER_AUTH_SECRET` from its
operator-owned secret store and wait for `/api/auth/get-session` to return a
stable `200`. The generic Web deploy artifact does not prove that the deployed
secret value remained aligned. Then run the executable contract, fixture
checker, targeted tests, deployment-artifact check, authenticated browser
search, denial fixtures, and live smoke. Evidence contains only
status/count/hash values.

Rollback restores the preceding staging Web and API versions and deletes only
the fixed provisioning rows. The additive lookup function and indexes may
remain unused. Temporary apply/caller Workers and negative fixture rows must be
deleted, followed by an absence/zero-count readback. Production remains pinned.
