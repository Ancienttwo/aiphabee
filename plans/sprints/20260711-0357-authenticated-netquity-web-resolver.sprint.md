# Sprint: Authenticated Netquity Web Resolver

> **Status**: Done
> **Approved**: user `同意`, 2026-07-11
> **Slug**: authenticated-netquity-web-resolver
> **Created**: 2026-07-11 03:57
> **Updated**: 2026-07-11 07:17
> **Source PRD**: none; user-approved brownfield design following the Netquity staging resolver sprint
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: incremental

Program-level sprint container. The Source PRD summary and ordered backlog
decompose product intent into ordered rows. Contract rows become task-contract
slices after `$think` expansion; inline rows stay in the sprint backlog or
active plan Task Breakdown.
`tasks/todos.md` stays the deferred-goal ledger and never carries this backlog.

## PRD

Turn the released Netquity staging security snapshot into an authenticated Web
product path without treating the current mock session or a public request
header as identity authority. Establish a durable session authority first, then
cross the Web-to-API boundary only through a private Cloudflare RPC entrypoint.

### Problem

- `apps/web` still uses a hard-coded mock session and its API client sends no
  authenticated credential.
- Public `POST /tools/resolve-security` remains synthetic and unauthenticated;
  the only live Netquity path is an operator-token staging smoke route.
- Account/workspace/entitlement schemas and the pure Gateway evaluator exist,
  but no runtime trace binds a verified product session to those rows.

### Users

- Invited AiphaBee staging users who need live security-name/code resolution.
- Operators who must prove session, workspace, entitlement, and data boundaries
  before any production or public API activation.

### Success Criteria

- A Better Auth session backed by a dedicated PlanetScale auth schema can log
  in, read back, log out, and revoke without granting auth runtime access to
  product or Netquity tables.
- An authenticated TanStack server function calls a named Worker RPC entrypoint;
  the API Worker derives account, workspace, plan, and rights from authoritative
  database rows instead of caller-provided identity fields.
- Exact code and multilingual-name resolution returns the released Netquity
  snapshot only for an active Web entitlement; every absent, expired, blocked,
  malformed, or unavailable authority fails closed with no synthetic fallback.
- Staging is activated and read back while the production Worker and public
  HTTP resolver remain unchanged.

### Acceptance Scenarios

- Given an authenticated but unprovisioned Better Auth user, the Web resolver
  returns `403` before reading Serving tables.
- Given a mapped account with no active membership, subscription, or Web field
  entitlement, the same request returns `403` with no caller-selected workspace.
- Given an active invited workspace and the exact Netquity Web entitlement, code,
  English, Traditional Chinese, and Simplified Chinese queries each return one
  live candidate and Netquity-bound provenance.
- Given an unauthenticated browser, the TanStack server function returns `401`
  before invoking Worker RPC.
- Given any direct public HTTP request, no private RPC identity can be forged and
  the existing public resolver does not gain live data access.

### Non-goals

- Production deployment or public API/MCP/export activation.
- Fuzzy/semantic matching, profile/history, prices, financials, or bulk export.
- Automatic account/workspace provisioning, billing-provider integration, or
  email/passwordless delivery; the first staging user is explicitly invited and
  mapped after GitHub OAuth establishes its stable Better Auth user id.
- Using Cloudflare Access, a static bearer token, email, or caller-provided
  workspace fields as the product identity authority.

## Architecture Notes

### Capabilities Touched

- `apps/web`: Better Auth server/client integration, GitHub OAuth, authenticated
  server function, and `AIPHABEE_API` service binding.
- `apps/worker`: named `WorkerEntrypoint`, authoritative account/workspace/rights
  loader, and reuse of the existing live Netquity query/mapper.
- `aiphabee_auth`: isolated Better Auth user/session/account/verification tables
  with a dedicated write role and Hyperdrive binding.
- `platform` plus `aiphabee_governance`: stable `auth_subject`, active membership
  and subscription, Web-only field entitlements, and default-deny evaluation.
- `aiphabee_core.serving_*`: unchanged released snapshot authority and narrow
  read-only runtime role.

### Dependency Order

1. Converge the identity schema, install Better Auth, and prove session lifecycle
   through a dedicated auth role without product-table privilege.
2. Add the private RPC entrypoint and live entitlement loader, then switch the
   Web security search to the authenticated server function.
3. Deploy only staging, provision one invited identity/workspace entitlement,
   run live success/failure acceptance, and verify production is unchanged.

### Risks

- Identity spoofing: RPC is a named service-binding entrypoint and never trusts
  public identity headers or request-body workspace ids.
- Schema drift: `platform.account.auth_subject` becomes the sole runtime identity
  mapping; legacy `auth_user_id` is migration input only and is never a runtime
  fallback.
- Rights overreach: only `channel=web`, `dataset=security_master`, and the fields
  returned by `ResolveSecurityCandidate` may be approved; API/MCP/export remain
  default-deny.
- Credential dependency: live GitHub login requires staging OAuth client id and
  secret plus `BETTER_AUTH_SECRET`; absence stops deployment acceptance rather
  than enabling a mock or password fallback.
- Scale: indexed session, auth-subject, membership, subscription, and entitlement
  lookups plus Hyperdrive pooling bound request fan-out; DB context lookup is the
  first expected 10x pressure point.

## Backlog

Ordered execution queue; keep rows in dependency order. Mode `contract` runs
the full plan -> contract -> worktree flow; `inline` allows primary-tree
execution for small tasks. Every row needs a concrete acceptance line.

| # | Status | Task | Mode | Acceptance | Plan |
|---|--------|------|------|------------|------|
| 1 | [x] | Establish Better Auth identity authority on staging | contract | `npm run check:authenticated-web-identity`, targeted Web/Worker auth tests, and staging login/session/logout/revoke readback pass; the auth role has no product/Serving/raw privileges; production remains unchanged | `plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md` |
| 2 | [x] | Activate entitlement-gated Netquity resolution through private Web RPC | contract | `npm run check:authenticated-netquity-web-resolver`, targeted Web/Worker/Gateway/security-tools tests, and staging live code + multilingual success plus unauthenticated/unmapped/no-rights/expired/binding failure paths pass with no synthetic fallback; public HTTP and production remain unchanged | `plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md` |

## Execution Log

Keep this section last; `repo-harness run sprint-backlog complete-task` appends rows here.

| When | Task | Plan | Result |
|------|------|------|--------|
| 2026-07-11 05:32 | Establish Better Auth identity authority on staging | `plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md` | done |
| 2026-07-11 07:17 | Activate entitlement-gated Netquity resolution through private Web RPC | `plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md` | done |
