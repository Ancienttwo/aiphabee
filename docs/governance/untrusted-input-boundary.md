# Untrusted Input Boundary

Status: local Always-on A3 boundary closeout.

## Scope

This closes the repo-verifiable portion of the A3 invariant that announcement
documents, webpage/user-provided URL attempts, user prompt tool requests, and
MCP origins cannot become system or developer instructions.

## Evidence

- Document search/get/diff contracts mark document content as untrusted data.
- The document sanitizer removes scripts, hidden text, and document-origin tool
  instructions, and returns sanitized excerpts only.
- The Agent prompt-injection gate treats document content as data, keeps system
  instructions runtime-only, and denies arbitrary SQL, arbitrary URL, and
  unregistered tool probes before execution.
- Tool enforcement forbids `http.fetch`, raw URL arguments, and arbitrary SQL.
- MCP protocol release gate requires Origin validation and maps untrusted
  origins to `ORIGIN_NOT_ALLOWED`.

## Not Claimed

This does not claim live red-team validation, live tool execution proxy
enforcement, frontend untrusted-content release UI, live webpage fetch
sanitization, or model-output red-team scoring.
