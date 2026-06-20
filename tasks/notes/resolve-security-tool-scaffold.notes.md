# Notes: resolve-security-tool-scaffold

> **Last Updated**: 2026-06-21 00:40 +08
> **Plan**: `plans/plan-resolve-security-tool-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/resolve-security-tool-scaffold.md`

## Decisions

- Added `@aiphabee/security-tools` as the no-live home for security identifier
  tool scaffolds.
- Implemented `resolveSecurity()` with synthetic security master fixtures only.
- Supported code/symbol variants, Chinese name, English name, and historical
  name lookup.
- Returned `ambiguous` with candidates and no selected instrument for ambiguous
  lookups.
- Added `POST /tools/resolve-security` with standard success/error envelopes.
- Marked `resolve_security` as scaffold-ready in the registry; later
  `get_security_profile` is also scaffold-ready.
- Kept live DB reads, arbitrary SQL/URL, partner rows, MCP endpoints, and
  frontend out of scope.

## Verification

- Passed: `npm run test -- packages/security-tools/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check:security-tools`
- Passed: `npm run check:tool-registry`
- Passed: `npm run typecheck`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/tools/resolve-security` and `/tools/runtime`.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Live security master reads are absent.
- Partner-approved security master rows are absent.
- MCP endpoint and protocol tool call integration are absent.
- Other Sprint 1.2 tool handlers are absent.
- Evidence/Lineage service is absent.
