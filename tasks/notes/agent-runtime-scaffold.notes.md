# Notes: agent-runtime-scaffold

> **Last Updated**: 2026-06-21 00:30 +08
> **Plan**: `plans/plan-agent-runtime-scaffold.md`
> **Runtime Evidence**: `docs/governance/agent-runtime-scaffold.md`

## Decisions

- Used `ai@7.0.0-beta.182` because npm `latest` is v6 while PRD asks for v7.
- Implemented dry-run routes instead of real model calls.
- Kept registered tools as policy entries only; no market data execution.
- Migrated registered tool metadata to the shared Tool Registry scaffold.
- Added PRD §9.6 error codes needed for runtime validation.

## Verification

- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /agent/runtime`.
- Passed: Wrangler smoke for `POST /agent/runs/dry-run`.
- Passed: Wrangler smoke for unregistered tool denial.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Model provider binding is absent.
- Streaming `streamText` / non-streaming `generateText` execution is absent.
- Run persistence, budget ledger, OTel spans, and Workflow handoff are absent.
- Individual tool handlers and golden fixtures are absent.
