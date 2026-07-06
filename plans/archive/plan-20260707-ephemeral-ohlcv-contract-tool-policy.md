# Plan Evidence: Ephemeral OHLCV Contract + Tool Policy

> **Status**: Completed
> **Completed**: 2026-07-07 03:19 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **Row**: 1

## Scope

Bound `technical_analysis_ephemeral` across the repo authority surfaces before
provider/cache/runtime implementation:

- `docs/spec.md`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- `.ai/context/context-map.json`
- `packages/tool-registry`
- `packages/agent-runtime`
- `deploy/tools/registry.contract.json`
- `scripts/check-tool-registry-contract.mjs`

## Decision

`analyze_public_technical_signal` is a distinct Research-only skill entrypoint.
`get_price_history` remains a separate price-history scaffold and is not reused
as the public OHLCV technical-analysis skill.

The Row 1 policy allows bounded raw OHLCV to enter LLM context and user display,
but blocks market-database persistence, shared-cache persistence, authorized feed
claims, Generic Agent access, background refresh, full-market scan, and batch
export semantics.

## Verification

```sh
npx vitest run packages/agent-runtime/src packages/tool-registry/src
npm run check:tool-registry
npm run typecheck
git diff --check
rg -n "technical_analysis_ephemeral|analyze_public_technical_signal|public_observation_signal" docs/spec.md .ai/context/capabilities.json .ai/context/capability-source-map.json
rg -n "raw_to_llm_context: true|raw_to_market_database: false|raw_to_shared_cache: false|raw_to_chat_transcript|provider_as_authorized_feed: false|bars\\?|chat_transcript_policy" packages/agent-runtime/src/index.ts
rg -n "USER_INITIATION_REQUIRED|GENERIC_AGENT_TOOL_DENIED|RAW_OHLCV_PERSISTENCE_BLOCKED|RAW_OHLCV_BATCH_EXPORT_BLOCKED" packages/tool-registry/src/index.ts packages/agent-runtime/src/index.ts
rg -n "RAW_OHLCV_OUTPUT_BLOCKED" packages/tool-registry/src packages/agent-runtime/src
node -e 'const fs = require("node:fs"); const source = fs.readFileSync("packages/tool-registry/src/index.ts", "utf8"); const price = source.indexOf("name: \\"get_price_history\\""); const signal = source.indexOf("name: \\"analyze_public_technical_signal\\""); if (price < 0 || signal < 0 || price === signal) process.exit(1); console.log(JSON.stringify({ status: "ok", get_price_history_is_not_skill_entrypoint: true, skill_entrypoint: "analyze_public_technical_signal" }));'
```

Observed:

- Vitest: 10 files passed, 107 tests passed.
- `check:tool-registry`: `status=ok`, `tools=24`.
- `typecheck`: all workspaces passed.
- `git diff --check`: clean.
- `RAW_OHLCV_OUTPUT_BLOCKED` grep exited 1 with no output, as expected.
- `get_price_history_is_not_skill_entrypoint=true`.

## Next Dependency

Row 2 can start from the registry/runtime contract:
`analyze_public_technical_signal` input/output schema ids and
`EPHEMERAL_PUBLIC_OHLCV_TECHNICAL_ANALYSIS_POLICY`.
