# Prompt Injection Tool Denial Release Gate Scaffold Notes

Date: 2026-06-21

## Result

Added the local no-write release gate scaffold for PRD §19.4 prompt-injection testing and arbitrary SQL/URL/unregistered tool denial readiness.

## Artifacts

- `packages/agent-runtime/src/index.ts`
- `apps/worker/src/index.ts`
- `deploy/agent/prompt-injection-tool-denial-release-gate.contract.json`
- `scripts/check-prompt-injection-tool-denial-release-gate-contract.mjs`
- `deploy/database/migrations/20260621138000_prompt_injection_tool_denial_release_gate_scaffold.sql`
- `docs/governance/prompt-injection-tool-denial-release-gate-scaffold.md`
- `tasks/contracts/prompt-injection-tool-denial-release-gate-scaffold.contract.md`

## Boundary

The release gate proves the local contract only. It reuses the deterministic malicious announcement fixture and existing Agent planner guard. It does not claim live red-team validation, live document fetch, live tool execution, frontend rendering, database writes, model calls, or SQL emission.

## Remaining Blockers

- `live_prompt_injection_red_team_harness_missing`
- `live_tool_execution_proxy_enforcement_missing`
- `frontend_untrusted_content_rendering_release_ui_missing`
