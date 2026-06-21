# Always-on Controls Closeout

Status: local controls closeout for repo-verifiable Sprint invariants.

## Scope

This closeout covers Always-on tracker items that can be proven from current
repo contracts, golden fixtures, and CI configuration without live services or
frontend work.

## Proven Controls

- Registered P0 tools use the standard response envelope fields
  `ok/request_id/as_of/market_status/provenance/usage`.
- Golden tool fixtures include non-empty provenance and usage metadata.
- Agent answer planning requires fact/calculation/inference/unknown labels and
  categorical evidence strength values.
- Gateway channels remain default-deny while rights are unconfirmed.
- Web display rights do not imply MCP/API redistribution rights.
- Agent tool enforcement requires registered, versioned, schema-bound,
  permission-aware tools and rejects arbitrary SQL/URL tool probes.
- Eval v1 covers fact accuracy, calculation accuracy, citation accuracy, and
  correct-refusal rate.
- CI runs the golden regression hook.
- Single-run budget policy covers steps, credits, rows, tokens, and wall-clock
  time with graceful-stop semantics.

## Not Claimed

This does not claim live partner rights activation, live rate limiter windows,
post-generation evidence binding on actual model output, live AI Gateway logs,
tool-call audit sink completeness, or live unsourced numeric sampling metrics.
