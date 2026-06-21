# Engineering Foundation Audit

> **Status**: Audit complete; scaffold implementation pending
> **Last Updated**: 2026-06-20
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Sprint Task**: `engineering-foundation-audit`
> **Audit Version**: `engineering_audit_version=2026-06-20.phase0.v0`

This audit maps the current greenfield repository against PRD §23 and Sprint
0.4. It records what exists, what is missing, and the smallest coherent
engineering scaffold sequence. It does not implement the application runtime.

## Audit Inputs

Commands run from `/Users/chris/Projects/aiphabee`:

```bash
git status --short --branch
find . -maxdepth 2 -type f -not -path './.git/*' -not -path './docs/AiphaBee Design System/*' | sort
rg --files -g 'package.json' -g 'pnpm-lock.yaml' -g 'bun.lockb' -g 'bun.lock' -g 'yarn.lock' -g 'package-lock.json' -g 'vite.config.*' -g 'wrangler.*' -g 'tsconfig.json' -g '.github/**'
find deploy docs/architecture .ai/context .github -maxdepth 3 -type f -o -type d
```

Observed state:

- Branch is local-only ahead of origin and also behind origin: `ahead 4, behind 1`
  at audit start.
- No `package.json`, lockfile, `tsconfig.json`, Vite config, Wrangler config,
  app source, tests, or `.github` CI workflow exists.
- Repo contains root agent contracts, repo-harness helper wrappers, PRD/tracker,
  governance baselines, deployment directories, architecture placeholder
  directories, and `docs/AiphaBee Design System`.
- `.ai/context/capabilities.json` has no registered functional capabilities yet.

## PRD §23 Implementation Check

| # | PRD §23 Check | Current State | Gap | Next Scaffold Entry |
|---|---|---|---|---|
| 1 | Directory, package manager, monorepo, build, deploy topology | Harness directories and docs exist; no app monorepo or package manager | Missing runtime topology | Add package manager and workspace layout |
| 2 | TanStack Start, Vite, Hono, AI SDK, Cloudflare versions | No dependency manifest | Missing version pinning | Create root manifest and runtime decision record |
| 3 | `/`, `/app`, API route, SSR/SPA boundary | No app routes | Missing Web/API boundary | Add app route skeleton and route map |
| 4 | Auth, user, Workspace, subscription, DB schema | Account/workspace entitlement schema scaffold exists; no live auth or billing integration | Missing live domain enforcement | Wire identity, billing, and entitlement execution after Gate 0 |
| 5 | Chat, messages, run, tool call, streaming | No Agent runtime | Missing run/message/tool loop model | Add run schema and worker route after tool registry baseline |
| 6 | Tool definitions, Schema, errors, tests | No tool registry code | Missing shared tool registry | Add `packages/tool-registry` with schemas/errors/tests |
| 7 | Partner adapter, cache, batch, data rights | Governance docs exist; no adapter/runtime | Missing adapter and Gateway enforcement | Add data contracts package and Gateway skeleton |
| 8 | Cloudflare bindings | Deploy dirs exist; no `wrangler` config | Missing bindings and smoke tests | Add `wrangler.toml`/env examples after scaffold |
| 9 | Env, secrets, logs, OpenTelemetry | Deploy README gives tracking rules only | Missing env examples and telemetry setup | Add `deploy/env/.env.example` and logging contract |
| 10 | Security: CORS, Origin, CSRF, rate limit, prompt injection, PII | Governance baselines exist; no middleware | Missing runtime enforcement | Add security middleware and tests after Hono skeleton |
| 11 | MCP implementation, protocol, OAuth, compatibility | No MCP runtime | Missing `/mcp` endpoint, OAuth, compatibility tests | Defer until Gate 0 confirms MCP rights |
| 12 | P0 requirements mapped to issue/owner/test/release gates | Tracker §M maps PRD requirements to sprints; no issues/owners/tests/release gates | Traceability incomplete | Add traceability ledger or issue export |

## Sprint 0.4 State

| Sprint 0.4 Item | Current State | Completion |
|---|---|---|
| Initialize monorepo and package management | Missing | Not complete |
| Agent Runtime skeleton on Cloudflare Workers | Missing | Not complete |
| Cloudflare binding plan and minimum usable bindings | Missing config; binding list known from PRD | Not complete |
| Postgres/Supabase via Hyperdrive and migration tooling | Missing | Not complete |
| CI lint/typecheck/test/golden regression hook | Missing `.github` and package scripts | Not complete |
| OTel, logs, eval store wiring | Missing | Not complete |
| Secrets/env management | Only deploy tracking rules exist | Not complete |
| Reuse `docs/AiphaBee Design System` | Reference assets exist; no app integration | Not complete |
| PRD §23 repo intake audit | This document completes it | Complete |
| P0 requirement -> issue/owner/test/release traceability | Tracker §M partial mapping only | Not complete |

## Recommended Runtime Topology

Start with the smallest monorepo that can host the PRD's two product entrances
without duplicating business logic:

```text
apps/
  web/                 TanStack Start + Vite user-facing research app
  worker/              Hono on Cloudflare Workers: API, Agent routes, MCP later
packages/
  data-contracts/      zod/json-schema contracts, errors, response envelope
  data-methodology/    metric definitions and deterministic calculation helpers
  tool-registry/       shared tool schemas, versions, permission metadata
  rights-policy/       DEFAULT_DENY policy evaluation and fixtures
  ui/                  app wrappers over docs/AiphaBee Design System assets
  config/              shared tsconfig/eslint/test config
tests/
  golden/              future golden fixture manifests and regression runner
deploy/
  env/.env.example
  runbooks/
  release-checklists/
```

Ownership invariant:

- Web Agent and MCP must call the same Tool Registry and Data Access Gateway.
- Financial calculations live in deterministic packages, not inside prompts.
- Rights and quality checks happen before data reaches Web or MCP.
- MCP runtime remains disabled or stubbed until Gate 0 explicitly allows
  machine-readable redistribution.

## First Scaffold Slice

The next implementation slice should be intentionally narrow:

1. Add workspace manifest and package manager lockfile.
2. Add `apps/worker` Hono health route and `apps/web` placeholder route.
3. Add shared TypeScript config and test runner.
4. Add `packages/data-contracts` with the standard response envelope and error
   codes from PRD §9.5/§9.6.
5. Add CI for lint/typecheck/test.
6. Add `deploy/env/.env.example` with names only, no secrets.

Acceptance for that slice:

- `install`, `lint`, `typecheck`, and `test` pass locally.
- Worker health route runs locally.
- CI runs the same commands.
- No market data or MCP redistribution is exposed.

## Cloudflare Binding Plan

| Binding | Phase 0 Purpose | Status |
|---|---|---|
| Workers | Hono API and Agent runtime host | Planned, no config |
| Workflows | Long-running research/report jobs | Planned, no config |
| Queues | Async ingestion/replay/notification fanout | Planned, no config |
| Cron Triggers | Scheduled refresh/evals/watchlist summaries | Planned, no config |
| Durable Objects | Coordination, resumable tasks, rate/concurrency state | Planned, no config |
| R2 | Raw snapshots, evidence artifacts, static reports | Planned, no config |
| KV | Low-risk config/cache flags, not source of truth | Planned, no config |
| AI Gateway | Model logs, cost, caching, fallback governance | Planned, no config |
| Hyperdrive | Postgres connectivity from Workers | Planned, no config |

Binding rule: add local/staging configs before production, and keep secrets out
of repo. `deploy/env/.env.example` should define names only.

## Verification Surface

Current verification is limited to repo-harness:

- `scripts/check-task-workflow.sh --strict`

Runtime verification does not exist yet because no runtime app exists. The first
scaffold slice must add:

- package install command;
- lint command;
- typecheck command;
- unit test command;
- local worker/web run command;
- CI workflow invoking the same commands.

## Residual Risks

- The branch is ahead of local work and behind remote at the same time; push
  requires reconciling remote changes first.
- Gate 0 legal/data-rights approvals are still pending; avoid shipping market
  data surfaces before approval.
- No package/runtime versions are pinned yet, so any implementation slice must
  decide exact versions and lock them.
- Tracker §M maps requirements to sprints but does not yet assign owner, issue,
  test, or release gates.

## Acceptance Checklist

- [x] PRD §23 current-state audit completed.
- [x] Sprint 0.4 implementation gaps are explicitly classified.
- [x] Recommended monorepo/runtime topology is documented.
- [x] Cloudflare binding plan is documented.
- [x] First scaffold slice and verification surface are documented.
- [ ] Runtime scaffold is implemented.
- [ ] CI is implemented and green.
- [ ] Cloudflare/Postgres bindings have smoke tests.
- [ ] P0 traceability has issue/owner/test/release gates.
