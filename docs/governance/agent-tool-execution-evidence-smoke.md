# Agent Tool Execution Evidence Smoke

> **Status**: Verified guarded backend smoke
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/agent-tool-execution-evidence-smoke.contract.md`

This slice adds a guarded Agent backend smoke route that executes the registered
`get_quote_snapshot` Worker tool route, hashes the tool result, binds the route
provenance to an evidence card, and runs the existing post-generation evidence
validator against both sourced and unsourced numeric probes.

It does not enable live model execution, live token streaming, live evidence
writes, usage-ledger writes, durable Agent run persistence, production sampling,
or frontend Ask/evidence-card rendering.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Worker smoke route | `POST /agent/runs/tool-execution-evidence-smoke` | Guarded by `x-aiphabee-smoke` plus `AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN` |
| Registered tool route | `POST /tools/get-quote-snapshot` | Executed through `MCP_TOOL_EXECUTION_ROUTE_MAP` and `app.request()` |
| Agent validator | `validatePostGenerationEvidenceBinding()` | Local deterministic numeric evidence binding; no live writes |
| Contract | `deploy/agent/tool-execution-evidence-smoke.contract.json` | Freezes route, token, hash-only response, and out-of-scope claims |
| Frontend | Out of scope | No `apps/web` changes |

## P2 Concrete Trace

1. Operator calls the smoke route with the fixed header and bearer token.
2. Worker rejects missing header, missing token env, or wrong bearer token before
   executing any tool route.
3. Authorized route executes fixed `get_quote_snapshot` sample args against the
   real Worker tool route.
4. Worker selects the returned provenance source record, hashes the source
   record id and full tool result payload, and builds a local evidence card.
5. The sourced numeric claim passes `validatePostGenerationEvidenceBinding()`.
6. The unsourced numeric probe is blocked with `UNSOURCED_NUMERIC_CLAIM`.
7. Response returns only hashes, counts, routes, request ids, and validator
   summaries.

## P3 Design Decision

Selected a guarded backend smoke instead of changing the core validator to claim
live evidence binding.

Reason:

- The existing validator correctly reports no live writes or model calls.
- Sprint 1.3 needs proof that the Agent path can execute a registered backend
  tool and hand its provenance to the answer validator.
- A fixed sample tool avoids creating a generic unaudited execution proxy.

Tradeoff:

- The backend can now prove actual Worker route execution plus deterministic
  evidence binding in one guarded smoke.
- Live model output, production sampling, persistent evidence records, and
  frontend cards remain separate work.

## Verification

Required:

- `npm run test -- apps/worker/src/agent-tool-execution-evidence-smoke.test.ts`
- `npm run check:agent-tool-execution-evidence-smoke`
- `npm run typecheck --workspace @aiphabee/worker`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Live model generation and token streaming are disabled.
- Live evidence record writes and usage-ledger writes are disabled.
- Production/live unsourced numeric sampling remains incomplete.
- Frontend Ask and evidence-card rendering remain delegated.
