# Compliance Ops Release Gate Scaffold Contract

## Task

Complete Sprint 3.3 §19.4 item: `合规边界与营销文案审阅；Kill switch/事件响应/审计导出演练`.

## Authoritative Artifacts

- `packages/public-ops/src/index.ts`
- `apps/worker/src/index.ts`
- `deploy/public-ops/compliance-ops-release-gate.contract.json`
- `scripts/check-compliance-ops-release-gate-contract.mjs`
- `supabase/migrations/20260622001000_compliance_ops_release_gate_scaffold.sql`
- `docs/governance/compliance-ops-release-gate-scaffold.md`

## Contract

The release gate must prove, locally and without live side effects:

- PRD §14.2 Type 4 boundary is represented as research/analysis/data explanation, with written legal/compliance opinion still required.
- Marketing-copy snippets avoid forbidden advice claims such as stock picks, investment advice, buy/sell recommendations, position sizing, suitability conclusions, guaranteed return, or copy trading.
- Kill-switch drill blocks model requests and tool execution while requiring safe user-visible degradation.
- Incident-response drill traces a request_id through support operations and public status components without releasing sensitive content.
- Audit-export drill emits a local `run.audit` event with required fields and no sensitive payload release.
- Public status/docs surfaces are linked and still no-live/no-write.

## Non-Claims

The task does not claim external legal/compliance signoff, live kill-switch flags, live incident feed, live audit export store, frontend release UI, or a public GA launch.

## Verification

- `npm run check:compliance-ops-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/public-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/public-ops/src/index.test.ts apps/worker/src/index.test.ts`
