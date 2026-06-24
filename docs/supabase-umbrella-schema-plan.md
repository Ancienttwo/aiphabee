# Supabase 伞产品 Schema 方案

> Status: superseded for live topology
> Updated: 2026-06-24
> Superseded By: `docs/governance/aiphabee-independent-supabase-boundary.md`
> Applies to: historical shared-project design context only

## 当前结论

本方案不再作为 AiphaBee 的 live Supabase 部署方向。AiphaBee 采用独立
Supabase organization/project 边界，原因是未来 IPO/F10/证券事实/Serving
Store 数据会有独立迁库、扩容、PITR、read replica 或数据库引擎切换压力。
与 AIMPACT 或 Salesko 混在同一个 Supabase project 会让 AiphaBee 迁库被无关
产品表、RLS、auth、release schedule 和账单状态绑住。

保留本文是为了记录被取代的 shared umbrella 设计，不再用于 live apply 决策。
新的约束见 `docs/governance/aiphabee-independent-supabase-boundary.md`。

## 目标

Historical design goal:

把 `aimpact-new` 的 Supabase 当作伞产品级共享数据库时，schema 必须同时满足三件事：

1. AiphaBee 可以管理账号、workspace、订阅、entitlement、审计和产品开关。
2. AIMPACT、Salesko 等子产品可以保留自己的业务模型，不被伞产品表吞掉。
3. 多产品、多 workspace、多 tenant 的隔离由数据库结构和 RLS 兜底，不能只依赖应用层路由过滤。

本方案只定义 schema 边界和迁移路线，不包含 secret、不创建生产对象、不替代后续 migration review。

## 决策摘要

采用 hybrid umbrella layout：

- `platform` 是伞产品共享 schema，拥有 product registry、workspace、membership、subscription、entitlement、product access、policy version 等跨产品事实。
- 产品业务表进入产品自有 schema，例如 `aiphabee_core`、`aiphabee_governance`、`aiphabee_audit`、`aimpact_core`、`salesko_core`。
- 需要跨产品聚合的审计进入 `platform_audit`；产品内部审计仍留在产品自有 audit schema。
- RLS 的基本边界是 `product_id + workspace_id`。Salesko 现有 `tenant_id` 可以映射为 product-owned tenant/workspace 维度，但跨产品授权仍通过 `platform.workspace_product_access`。
- 不把所有子产品表都塞进 `public` 或裸 `core`。裸 `core/governance/audit` 只适合单产品早期 scaffold；进入共享 Supabase 后必须明确命名空间。

## P1: Architecture Map

Authoritative surfaces:

- AiphaBee 当前迁移使用 `supabase/migrations/*`，主要 schema 是 `core`、`governance`、`audit`。
- AiphaBee 已有账号/workspace/entitlement scaffold：`core.account`、`core.workspace`、`core.workspace_membership`、`core.subscription_plan`、`core.workspace_subscription`、`core.data_entitlement`、`core.workspace_entitlement`。
- Salesko 当前产品边界是 multi-tenant SaaS，业务数据通过 `tenant_id` 和 product-specific Supabase tables 隔离。
- AIMPACT 历史 docs 同时提到 Supabase 和 Cloudflare-native storage；共享 Supabase 只应该承接身份、产品访问、entitlement 和明确选择迁入的 relational state，不应强行替换已有 Cloudflare R2/D1/Vectorize 方案。

Runtime ownership:

- Browser/frontend 只使用 anon/authenticated scope，不持有 service role。
- Cloudflare Workers/API/MCP/agent runtime 可以通过 server-side secret 使用 service role，但必须在代码层继续传入 `product_id`、`workspace_id`/`tenant_id`，因为 service role 会绕过 RLS。
- Migration/ops 脚本拥有 DDL 权限；所有 DDL 必须经过 dry-run、review 和 rollback note。

Out of scope:

- 不在本方案中搬迁 live data。
- 不在本方案中选择 billing provider、auth provider 或 Cloudflare binding 名。
- 不在本方案中把 Salesko `tenant_id` 语义改名；先做映射，再做产品内重构。

## P2: Concrete Trace

以 “AiphaBee 用户进入 Salesko workspace 并读取 Salesko graph frame” 为基准路径：

1. 用户通过 Supabase Auth 登录，应用拿到 `auth.uid()`。
2. API 解析目标产品 `product_code = 'salesko'` 和目标 workspace/tenant。
3. API 查询 `platform.product`，确认 `salesko` 是 active product。
4. API 查询 `platform.workspace_membership`，确认该 user/account 是目标 workspace active member。
5. API 查询 `platform.workspace_product_access`，确认该 workspace 对 `salesko` 有 active access，且 entitlement policy version 可用。
6. API 进入 Salesko 自有 schema，例如 `salesko_core.graph_frames` 或现有 `salesko_graph_frames` 兼容表，查询条件必须包含 product-owned tenant/workspace key。
7. Postgres RLS 再次检查：当前 JWT user 是否属于 workspace，并且 workspace 是否有对应 product access。
8. 返回前，API 仍按产品合同做 role/scope 检查，例如 Salesko `viewer/editor/admin` 和 MCP `graph:read`。

压力点：

- 如果只看 `tenant_id` 而不看 `product_id`，未来跨产品同名 tenant/workspace 会泄露。
- 如果 service role path 不带 workspace/product filter，RLS 无法保护它。
- 如果把 entitlement 放在产品业务 schema，AiphaBee 无法做统一套餐、销售、审计和关停。

## P3: Design Decision

选择 shared `platform` + product-owned schemas，而不是 “每个产品一个 Supabase project” 或 “所有表一个 shared core”。

Tradeoff:

- 单 project 能共享 Auth、billing、workspace、entitlement 和跨产品报表，适合伞产品早期统一运营。
- 分 schema 保留产品自治，避免 AIMPACT、Salesko、AiphaBee 的业务表互相污染。
- 最大风险是 `platform` schema 变成万能垃圾桶；因此 `platform` 只放跨产品事实，业务事件和大对象留在产品 schema 或 Cloudflare storage。

10x scale first failure:

- 最先失败的不是表数量，而是 RLS policy 和 cross-product join 的复杂度。需要从第一天要求 FK index、RLS policy index、service-role path 显式 product/workspace filter。

## Schema Layout

### Shared schema: `platform`

Core tables:

- `platform.product`
  - `product_id text primary key`
  - `product_code text not null unique`
  - `display_name text not null`
  - `status text not null check (status in ('planned', 'active', 'paused', 'retired'))`
  - `default_schema_prefix text not null`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`

- `platform.product_environment`
  - `product_environment_id text primary key`
  - `product_id text not null references platform.product(product_id)`
  - `environment text not null check (environment in ('dev', 'staging', 'prod'))`
  - `runtime_base_url text`
  - `supabase_exposed_schemas text[] not null default '{}'`
  - unique `(product_id, environment)`

- `platform.account`
  - `account_id text primary key`
  - `auth_user_id uuid unique`
  - `email_hash text`
  - `display_name text`
  - `status text not null check (status in ('active', 'suspended', 'closed'))`

- `platform.workspace`
  - `workspace_id text primary key`
  - `owner_account_id text not null references platform.account(account_id)`
  - `display_name text not null`
  - `billing_region text`
  - `data_region text`
  - `status text not null check (status in ('active', 'suspended', 'closed'))`

- `platform.workspace_membership`
  - `membership_id text primary key`
  - `workspace_id text not null references platform.workspace(workspace_id)`
  - `account_id text not null references platform.account(account_id)`
  - `role text not null check (role in ('owner', 'admin', 'member', 'viewer', 'billing'))`
  - `status text not null check (status in ('active', 'suspended', 'removed'))`
  - `valid_from timestamptz not null`
  - `valid_to timestamptz`

- `platform.workspace_product_access`
  - `workspace_product_access_id text primary key`
  - `workspace_id text not null references platform.workspace(workspace_id)`
  - `product_id text not null references platform.product(product_id)`
  - `access_status text not null check (access_status in ('trialing', 'active', 'paused', 'revoked'))`
  - `policy_version text not null`
  - `valid_from timestamptz not null`
  - `valid_to timestamptz`
  - unique `(workspace_id, product_id, valid_from)`

- `platform.subscription_plan`
  - product-aware plan catalog: include `product_id`, `plan_code`, `status`, seat/credit limits, and default entitlement tier.

- `platform.workspace_subscription`
  - workspace/product-aware subscription state: include `workspace_id`, `product_id`, `plan_code`, `billing_state`, seats, validity window.

- `platform.entitlement_policy`
  - product-level entitlement policy versions: include `product_id`, `policy_version`, `status`, `source_ref`, `effective_from`.

- `platform.workspace_entitlement`
  - resolved workspace entitlement grants: include `workspace_id`, `product_id`, `entitlement_key`, `status`, validity window.

Indexes required from day one:

- Every FK column gets an explicit btree index.
- RLS/filter columns get composite indexes:
  - `platform.workspace_membership (account_id, workspace_id, status)`
  - `platform.workspace_product_access (product_id, workspace_id, access_status)`
  - `platform.workspace_subscription (workspace_id, product_id, billing_state)`
  - `platform.workspace_entitlement (workspace_id, product_id, entitlement_key, status)`

### Cross-product audit schema: `platform_audit`

Use this only for cross-product operational facts:

- `platform_audit.product_access_event`
- `platform_audit.entitlement_decision_event`
- `platform_audit.subscription_lifecycle_event`
- `platform_audit.service_role_access_event`

Each row must include:

- `event_id`
- `product_id`
- `workspace_id`
- `actor_account_id` or `actor_service`
- `event_type`
- `event_time`
- `policy_version`
- payload reference or bounded JSON metadata

### Product-owned schemas

Recommended naming:

- AiphaBee:
  - `aiphabee_core`
  - `aiphabee_governance`
  - `aiphabee_audit`
- AIMPACT:
  - `aimpact_core`
  - `aimpact_governance`
  - `aimpact_audit`
- Salesko:
  - `salesko_core`
  - `salesko_governance`
  - `salesko_audit`

Product-owned tables must include the product's local isolation key:

- For AiphaBee: `workspace_id` plus, where needed, `product_id`.
- For Salesko: keep `tenant_id` for existing product semantics; add or map `workspace_id` before cross-product joins.
- For AIMPACT: choose `workspace_id` for umbrella-owned flows; keep existing app-local IDs when data stays outside Supabase.

Do not expose product-owned schemas through Supabase Data API unless there is an explicit API contract and RLS test for that schema.

## RLS Baseline

Enable and force RLS on tenant/workspace data:

```sql
alter table platform.workspace_membership enable row level security;
alter table platform.workspace_membership force row level security;
```

Use helper functions for repeated membership checks:

```sql
create or replace function platform.current_account_id()
returns text
language sql
stable
set search_path = ''
as $$
  select account_id
  from platform.account
  where auth_user_id = (select auth.uid())
  limit 1
$$;
```

For product access checks, wrap function calls in `select` so they are not recomputed per row:

```sql
create policy workspace_product_access_member_read
on platform.workspace_product_access
for select
to authenticated
using ((select platform.is_workspace_member(workspace_id)));
```

Rules:

- RLS is defense-in-depth for authenticated direct reads.
- Server-side service role paths must still filter by product/workspace/tenant in application code.
- `anon` should not get table access to platform or product-owned private schemas.
- Direct authenticated writes should stay denied unless a table has a reviewed write policy and product owner.

## Migration Strategy

Phase 0: inventory

- List current schemas/tables in the shared Supabase project.
- Confirm whether `aimpact-new` already owns Supabase production data or only historical docs/env.
- Confirm Salesko table names, especially `salesko_graph_frames`, read models, tenant membership tables, and RLS guard migrations.
- Decide whether AiphaBee's existing `core/governance/audit` are local-only scaffolds or already applied remotely.

Phase 1: create shared platform schema

- Add `platform` and `platform_audit` only.
- Historical version seeded `platform.product` with `aiphabee`, `aimpact`,
  `salesko`; the current AiphaBee-only live boundary must not seed sibling
  product rows into a dedicated AiphaBee database.
- Add indexes and RLS before exposing any API route.
- No product data move in this phase.

Phase 2: bridge existing product tables

- Add views or mapping tables rather than renaming live product tables first.
- For AiphaBee local scaffold, prefer new migrations targeting `aiphabee_core/governance/audit`; keep old `core/governance/audit` only as compatibility until cutover.
- For Salesko, map `tenant_id` to `platform.workspace_id` through a product-owned or platform bridge table before cross-product reporting.

Phase 3: enforce product access

- Product API routes must resolve `product_id` from `platform.product`.
- All product reads/writes must pass a `workspace_id` or product-owned `tenant_id`.
- Add denied probes: workspace without product access cannot read product rows; product A cannot read product B rows with the same local tenant id.

Phase 4: retire ambiguous names

- Stop creating new shared tables in bare `core`, `governance`, or `audit`.
- Either rename existing AiphaBee scaffold tables into product-prefixed schemas during a maintenance migration or keep read-only compatibility views with clear deprecation docs.

## Naming Rules

- Use lowercase snake_case identifiers only.
- Use stable product codes:
  - `aiphabee`
  - `aimpact`
  - `salesko`
- Use environment values:
  - `dev`
  - `staging`
  - `prod`
- Prefer `text` IDs when compatibility with current scaffolds matters.
- For new high-write internal tables, prefer `bigint generated always as identity`.
- For exposed distributed IDs, prefer UUIDv7/ULID style sortable IDs if the extension/runtime is approved.

## What Not To Do

- Do not put new product domain tables in `public`.
- Do not use one shared `core` schema for all products.
- Do not duplicate `auth.users`; reference it through `platform.account.auth_user_id`.
- Do not rely only on frontend/product route checks for tenant isolation.
- Do not grant Supabase Data API access to product schemas before RLS and denied probes exist.
- Do not move AIMPACT Cloudflare RAG storage into Supabase just because the Supabase project is shared.

## Verification Surface

Before applying this to live Supabase:

1. Run migration dry-run against a disposable database.
2. Run schema lints for lowercase identifiers, FK indexes, and missing RLS on private tables.
3. Run RLS tests with at least:
   - same user, two workspaces;
   - same workspace, two products;
   - same local tenant id across two products;
   - service-role path with missing product/workspace filter.
4. Run product smoke:
   - AiphaBee entitlement read;
   - Salesko tenant graph read denied across tenant;
   - AIMPACT selected shared flow, if any, without touching Cloudflare-native RAG storage.
5. Capture evidence in the owning repo's tracker/governance doc before promoting to staging/prod.

## First Migration Candidate

Repo-local status: implemented in
`supabase/migrations/20260623010000_platform_umbrella_schema_foundation.sql`
and registered in `deploy/database/migrations.contract.json`. It has passed
`npm run check:database`; no remote dry-run or live apply has been executed.

As of 2026-06-24, this migration is constrained to an AiphaBee-local platform
foundation for a dedicated AiphaBee Supabase project. The shared AIMPACT/Salesko
registry seed is no longer part of the live target.

The first concrete migration is limited to:

- `create schema if not exists platform;`
- `create schema if not exists platform_audit;`
- `platform.product`
- `platform.product_environment`
- `platform.account`
- `platform.workspace`
- `platform.workspace_membership`
- `platform.workspace_product_access`
- required FK indexes
- read-only authenticated RLS for membership/product access

That slice is sufficient because it creates the local identity/product boundary
without moving any product-owned data or changing runtime behavior.
