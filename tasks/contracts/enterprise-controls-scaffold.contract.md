# Enterprise Controls Scaffold Contract

## Objective

Complete the Phase 4 backend-only scaffold for Team/Enterprise seats, SSO,
audit, and private data connector planning without enabling live control-plane
execution.

## Required Surfaces

- Package: `@aiphabee/account-runtime`
- Runtime route: `GET /account/runtime`
- Enterprise controls route: `POST /account/enterprise-controls/plan`
- Contract: `deploy/account/enterprise-controls.contract.json`
- Checker: `npm run check:enterprise-controls`
- Migration scaffold: `supabase/migrations/20260622007000_enterprise_controls_scaffold.sql`

## Required Guarantees

- Use standard response envelopes.
- Restrict planning to `team` and `enterprise` plan codes.
- Return `blocked_enterprise_plan_required` for non-enterprise plan codes.
- Return `blocked_unsupported_control` for unknown control requests.
- Include seats, SSO, audit, and private data connector planning sections.
- Require default-deny Data Gateway rights for private connector access.
- Do not store credential material, raw emails, or raw connection strings.
- Do not call identity providers.
- Do not run directory sync.
- Do not test private connectors live.
- Do not write DB rows.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration checker passes.
- Account Runtime and Worker targeted tests pass.
- Account Runtime and Worker typecheck pass.
- Sprint tracker row is checked.
