# Notes: get-security-profile-tool-scaffold

> **Last Updated**: 2026-06-21 01:05 +08
> **Plan**: `plans/plan-get-security-profile-tool-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/get-security-profile-tool-scaffold.md`

## Decisions

- Reused `@aiphabee/security-tools` as the no-live home for security profile
  tool scaffolds.
- Implemented `getSecurityProfile()` with synthetic profile fixtures only.
- Covered listed, suspended, and delisted listing states.
- Returned company/security profile, lifecycle, currency, industry, and
  coverage metadata.
- Added `POST /tools/get-security-profile` with standard success/error
  envelopes.
- Marked `get_security_profile` as scaffold-ready in the shared registry.
- Kept live DB reads, arbitrary SQL/URL, partner rows, MCP endpoints, Evidence
  service, and frontend out of scope.

## Verification

- Passed: `npm run test -- packages/security-tools/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check`
- Passed: `npm run check:security-tools`
- Passed: `npm run check:tool-registry`
- Passed: `git diff --check`
- Passed: secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`.
- Passed: `scripts/check-task-workflow.sh --strict`.
- Passed: Wrangler smoke for `/tools/get-security-profile` and `/tools/runtime`.

## Residual Blockers

- Live security master reads are absent.
- Partner-approved security master rows are absent.
- MCP endpoint and protocol tool call integration are absent.
- Quote, price, action, facts, lineage, and entitlement handlers are absent.
- Evidence/Lineage service is absent.
