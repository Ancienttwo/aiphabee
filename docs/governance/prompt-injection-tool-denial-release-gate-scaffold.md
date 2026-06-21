# Prompt Injection Tool Denial Release Gate Scaffold

Version: `2026-06-21.phase3.prompt-injection-tool-denial-release-gate-scaffold.v0`

This scaffold closes the local contract for PRD §19.4 prompt-injection and arbitrary tool denial readiness without claiming live red-team validation or live tool execution.

## Covered Gate

- Route: `POST /agent/release-gates/prompt-injection/plan`
- Runtime: `GET /agent/runtime`
- Document sanitizer: `POST /documents/get-announcement`
- Tool loop planner: `POST /agent/runs/plan`
- Checker: `npm run check:prompt-injection-tool-denial-release-gate`

## Local Evidence

- Uses the existing malicious announcement fixture `doc_ann_00700_20260103_dividend` / `dividend_timetable`.
- Verifies document content is marked untrusted data and prompt injection is isolated.
- Verifies script, hidden text, and document-origin tool instructions are removed before Agent planning evidence.
- Probes `sql.query`, `http.fetch`, and `admin.override` through the real Agent planner guard and expects pre-execution `UNREGISTERED_TOOL` / `SCOPE_DENIED` denial.
- Verifies baseline registered tools remain registered, versioned, schema-bound, rights-aware, read-only, and no-SQL/no-URL.

## Explicit Non-Claims

- No live prompt-injection red-team harness has passed.
- No live document fetch is enabled.
- No live tool execution, database writes, model calls, or SQL emission are enabled.
- No frontend untrusted-content rendering release UI is implemented.

## Blockers Before GA

- `live_prompt_injection_red_team_harness_missing`
- `live_tool_execution_proxy_enforcement_missing`
- `frontend_untrusted_content_rendering_release_ui_missing`
