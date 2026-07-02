# White-Label Embeds Scaffold Contract

## Objective

Complete the Phase 4 backend-only scaffold for B2B white-label programs and
embedded research components without enabling frontend embeds, live API
execution, or external redistribution.

## Required Surfaces

- Package: `@aiphabee/partner-runtime`
- Runtime route: `GET /partner/runtime`
- White-label embed route: `POST /partner/white-label-embeds/plan`
- Contract: `deploy/partner/white-label-embeds.contract.json`
- Checker: `npm run check:white-label-embeds`
- Migration scaffold: `deploy/database/migrations/20260622008000_partner_white_label_embed_scaffold.sql`

## Required Guarantees

- Use standard response envelopes.
- Support brokerage, media, wealth platform, and data company partner types.
- Support research widget, report viewer, watchlist widget, MCP API, and data
  API planning surfaces.
- Require HTTPS origin allowlists for embedded component surfaces.
- Return `blocked_invalid_origin` when an embed surface lacks a valid HTTPS
  origin.
- Return `blocked_missing_context`, `blocked_unsupported_partner_type`,
  `blocked_unsupported_commercial_model`, or `blocked_unsupported_surface` for
  invalid planning context.
- Require a signed contract, tenant isolation, field authorization, and a
  partner rights matrix before external distribution.
- Keep external redistribution default-deny until signed rights are present.
- Link settlement to `POST /usage/partner-reconciliation/plan`.
- Link data delivery to `POST /gateway/exports/plan`.
- Link MCP planning to the existing MCP endpoint, OAuth, and key lifecycle
  planner routes.
- Do not generate embed scripts.
- Do not render frontend components.
- Do not run live API execution.
- Do not store credential material, personal contact payloads, or raw prompts.
- Do not write DB rows.
- Do not emit SQL.

## Acceptance

- Contract checker passes.
- Database migration checker passes.
- Partner Runtime and Worker targeted tests pass.
- Partner Runtime and Worker typecheck pass.
- Sprint tracker row is checked.
