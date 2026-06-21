# Tool Golden Fixtures Scaffold

> **Status**: Verified synthetic tool golden fixtures
> **Last Updated**: 2026-06-21 02:45 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-tool-golden-fixtures-scaffold.md`
> **Task Contract**:
> `tasks/contracts/tool-golden-fixtures-scaffold.contract.md`

This slice extends the existing golden regression hook with one synthetic
expected-response fixture for each registered Sprint 1.2 tool. It validates
schema IDs, standard envelope fields, provenance, usage, `toolName`, `status`,
and `liveDataAccess=false` without claiming partner-approved production corpus
or live route replay.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Tool golden manifest | `tests/golden/tools/manifest.json` | Lists one synthetic tool sample per registered tool |
| Tool fixtures | `tests/golden/tools/fixtures/*.json` | Store expected request/response envelopes |
| Golden hook | `scripts/check-golden-regression.mjs` | Validates both quality fixtures and tool fixtures |
| Root check | `npm run test:golden` | Runs strict fixture gate as part of `npm run check` |

## P2 Concrete Trace

1. `npm run test:golden` reads `tests/golden/manifest.json` and existing
   quality fixtures.
2. The hook reads `tests/golden/tools/manifest.json`.
3. The hook requires all 9 registered tools to appear exactly through the
   manifest.
4. For each tool fixture, the hook validates schema IDs, request object,
   standard expected response envelope, non-empty provenance, usage object,
   matching `toolName`, expected status, and `liveDataAccess=false`.

## P3 Design Decision

Selected static synthetic expected-response fixtures before live route replay.

Reason:

- Sprint 1.2 needs golden coverage of tool contracts before MCP/runtime replay
  exists.
- Static fixtures are deterministic and cheap enough to run in the existing
  golden hook.
- Live route replay would require a separate server orchestration contract.

Tradeoff:

- Golden tool response shape is now checked in CI.
- The fixtures do not prove live route parity or partner-production correctness.

## Verification

Passed:

- `npm run test:golden`
- `npm run check`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`

Observed golden fields:

```json
{
  "sample_count": 8,
  "tool_sample_count": 9,
  "status": "ok"
}
```

## Residual Gaps

- Partner-approved production golden corpus remains absent.
- Live route replay is absent.
- Full JSON Schema response validation is absent.
- Durable Evidence/Lineage service storage is absent.
