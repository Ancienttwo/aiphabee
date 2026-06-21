# Task Contract: Untrusted Input Boundary

## Objective

Close the repo-verifiable Always-on A3 requirement that announcements,
webpage/user URL attempts, and user prompt tool requests are treated as
untrusted data and isolated from system instructions.

## Acceptance

- Add `deploy/governance/untrusted-input-boundary.contract.json`.
- Add `npm run check:untrusted-input-boundary`.
- Validate document routes mark content as untrusted data.
- Validate sanitizer removes script/hidden/tool-instruction content and returns
  sanitized excerpts only.
- Validate Agent prompt-injection gate keeps system instructions runtime-only
  and denies arbitrary SQL/URL/unregistered tool probes before execution.
- Validate Tool Enforcement forbids arbitrary URL and raw URL input properties.
- Validate MCP protocol rejects untrusted origins.
- Update only the A3 untrusted input tracker checkbox.

## Out Of Scope

- Live prompt-injection red-team harness.
- Live tool execution proxy enforcement.
- Frontend untrusted-content rendering release UI.
- Live webpage fetch sanitizer.
- Model-output red-team scoring.
