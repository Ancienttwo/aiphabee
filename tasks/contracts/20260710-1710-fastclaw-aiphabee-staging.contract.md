# Task Contract: fastclaw-aiphabee-staging

> **Status**: Complete
> **Plan**: `plans/plan-20260710-1710-fastclaw-aiphabee-staging.md`
> **Task Profile**: migration
> **Notes**: `tasks/notes/20260710-1710-fastclaw-aiphabee-staging.notes.md`
> **Review**: `tasks/reviews/20260710-1710-fastclaw-aiphabee-staging.review.md`

## Goal

Operate one durable, private FastClaw staging control service whose relational
and object state survives a Cloudflare Container sleep/restart, while AiphaBee
retains entitlement, lifecycle, audit, and deletion authority.

## Allowed Paths

```yaml
allowed_paths:
  - .ai/harness/active-plan
  - apps/worker/wrangler.jsonc
  - deploy/cloudflare/bindings.contract.json
  - deploy/database/roles/
  - package.json
  - plans/plan-20260710-1710-fastclaw-aiphabee-staging.md
  - plans/sprints/20260710-fastclaw-aiphabee-staging.sprint.md
  - scripts/check-cloudflare-bindings-contract.mjs
  - scripts/check-fastclaw-aiphabee-staging-contract.mjs
  - tasks/contracts/20260710-1710-fastclaw-aiphabee-staging.contract.md
  - tasks/notes/20260710-1710-fastclaw-aiphabee-staging.notes.md
  - tasks/reviews/20260710-1710-fastclaw-aiphabee-staging.review.md
```

## Exit Criteria

- FastClaw targeted/full Go tests and Container route tests pass.
- The PostgreSQL schema-isolation regression passes against the shared staging database.
- Role readback proves pinned search path, no elevated attributes, and no forbidden table writes.
- R2 put/get/delete and Container cold-start persistence readback pass.
- Lifecycle activate/replay/reactivate stays one user/Agent; disable denies; delete reaches remote zero.
- AiphaBee feature flag is off after acceptance; production remains unprovisioned.

## Rollback

Disable lifecycle, remove the AiphaBee staging Service Binding, delete the
Container deployment, revoke the dedicated DB role, and retain schema/R2 data
until evidence review authorizes destructive cleanup.
