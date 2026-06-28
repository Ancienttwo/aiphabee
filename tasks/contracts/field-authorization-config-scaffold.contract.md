# Field Authorization Config Scaffold Contract

## Objective

Complete the backend-only Sprint 3.2 US-O01 scaffold for operationally
configurable field authorization with approval, version, and effective time.

## Required Surfaces

- Package: `@aiphabee/data-access-gateway`
- Runtime route: `GET /gateway/runtime`
- Planner route: `POST /gateway/field-authorizations/changes/plan`
- Contract: `deploy/gateway/field-authorization-config.contract.json`
- Checker: `npm run check:field-authorization-config`
- Change table scaffold: `aiphabee_core.field_authorization_change`
- Approval audit table scaffold: `aiphabee_audit.field_authorization_approval`
- Governance table scaffold: `aiphabee_governance.field_authorization_config_contract`

## Required Guarantees

- Use standard response envelopes.
- Preserve default deny until approved/effective policy rows exist.
- Require approval status.
- Require policy version.
- Require effective time.
- Support target statuses `approved`, `blocked`, and `default_deny`.
- Plan future `aiphabee_governance.data_entitlement` and optional
  `aiphabee_governance.workspace_entitlement` row effects.
- Keep cache-key versioning tied to `rights_policy_version`.
- Do not read live entitlement rows.
- Do not write policy rows.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes change, approval, and governance tables.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves runtime and planner routes return `200 OK` and
  no-live flags.
- Sprint tracker row is checked and Sprint 3.2 count is updated.
