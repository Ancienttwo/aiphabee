# Implementation Notes: Error Taxonomy Reconciliation

> **Status**: Completed and independently reviewed
> **Plan**: `plans/plan-20260713-0329-error-taxonomy-reconciliation.md`
> **Contract**: `tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md`
> **Review**: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md`
> **Last Updated**: 2026-07-13
> **Lifecycle**: notes

## Design Decisions

- Added a Data Contracts-owned reconciliation-only matrix with 80 exact codes from eight selected source sets.
- Preserved owner-local types and the 11-code MCP public subset; no runtime enum or behavior changed.
- Completed deployed MCP private mapping parity from 12/36 to 36/36 using the exact source mapping.
- Used TypeScript compiler AST and JSON selectors; no regex, HTTP status, name, message, or locale inference.
- Recorded five owner-specific sets as explicitly out of scope, including open `parse_chart_image` error strings, rather than inventing semantics.

## Deviations From Plan Or Spec

- The package test uses JSON imports and pure mutation validation so `@aiphabee/data-contracts` retains its existing `vitest`-only TypeScript environment. The standalone checker performs authoritative source/deployed parity.
- No product scope deviation.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Global runtime enum | Rejected | Would publish private Agent/FastClaw semantics and collapse owners |
| Heuristic mapping | Rejected | Violates exact, fail-closed semantics |
| Reconciliation ledger | Selected | Detects drift while owner-local contracts remain authoritative |

## Verification Evidence

```text
npm run check:error-taxonomy-reconciliation
status=ok entries=80 source_sets=8 mcp_private_mappings=36

npm run check:mcp-error-codes
status=ok error_code_count=11

npm run check:tool-registry
status=ok tools=24

npx vitest run packages/data-contracts/src packages/mcp-runtime/src packages/agent-runtime/src packages/tool-registry/src
19 files passed; 245 tests passed

npm run typecheck --workspace @aiphabee/data-contracts
npm run typecheck --workspace @aiphabee/mcp-runtime
npm run typecheck --workspace @aiphabee/agent-runtime
npm run typecheck --workspace @aiphabee/tool-registry
all exited 0
```

## Baseline and Attribution

Before implementation, the existing MCP/Tool Registry checks passed and targeted packages had 17 files / 238 tests passing. Row 1 adds two test files to the selected path set, resulting in 19 files / 245 tests. No Agent Runtime, Tool Registry, Worker, Web, rights, evidence, or FastClaw implementation file changed.

## Rollback

Remove the matrix, checker, tests, and package script; restore `deploy/mcp/error-codes.contract.json` to the pre-row 12-entry declaration. Apply as one atomic diff. No database, external service, live state, or persistent data rollback is required.

## Open Questions

- None for Row 1. Rows 2–3 remain unstarted.

## Promotion Candidates

- None. Keep this task-specific evidence in the notes file.
