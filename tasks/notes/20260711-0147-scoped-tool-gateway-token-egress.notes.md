# Implementation Notes: scoped-tool-gateway-token-egress

> **Status**: Complete
> **Plan**: plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md
> **Contract**: tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md
> **Review**: tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md
> **Last Updated**: 2026-07-11 03:02
> **Lifecycle**: notes

## Design Decisions

- P1 map: Agent Runtime owns the fixed `deny_all | tool_gateway` port and run
  policy; `sandbox-run-auth` owns only canonical HMAC mechanics; sandbox bridge
  owns exact provider translation; the private Worker entrypoint owns token
  verification and remains behind Tool Registry capability truth.
- P2 trace: execute pre-clears `tool-gateway.internal`, installs a short token
  only in trusted Durable Object outbound params, starts the process with the
  fixed URL only, and routes the exact HTTPS request through a specialized
  proxy to the named Worker service binding. The proxy strips sandbox authority
  headers and injects trusted lease/run/tenant/user/token binding.
- P3 invariant: no long-lived secret enters bridge process configuration or the
  sandbox. Exact HMAC claims bind tenant, user, run, lease and one tool for at
  most 600 seconds. Arbitrary hostname/IP/URL, method, path, query, port and
  oversized streaming bodies deny before service binding or tool execution.
- `@cloudflare/containers@0.3.7` is an exact direct pin because its
  interception precedence is now a security contract. `allowedHosts` remains
  undefined; `enableInternet=false`, `interceptHttps=true`, exact runtime host
  mapping and catch-all deny are the verified composition.
- The SDK stock `ContainerProxy` only directly dispatches its own R2/S3 mounts
  across the proxy isolate. AiphaBee therefore exports a specialized subclass
  that directly dispatches only the exact `toolGateway` override and delegates
  every other request to the SDK proxy. `AiphaBeeSandbox.outbound` and
  `.outboundHandlers` are assigned after class definition so inherited static
  setters register them instead of class fields shadowing the setters.
- Provider configuration, cleanup and process start are bounded to 15 seconds.
  A timeout does not cancel the underlying RPC, so an unconfirmed set, removal
  or start keeps the durable process slot occupied. Later execute calls fail
  before provider access; destroy is the explicit recovery boundary.
- The existing Tool Registry reports `execution_ready=false`. The real named
  entrypoint therefore returns 403 for every valid token, including
  `get_ipo_profile` with sensitive-field arguments. The pure handler has a
  dependency-injected success test, but Row 4 does not claim actual tool-route
  activation. Row 7 may change this only after downstream rights enforcement.

## Deviations From Plan Or Spec

- The initial captured trace described immediate mapped-route execution. Deep
  review proved existing mapped routes do not uniformly enforce the token
  tenant/user rights and Tool Registry still declares execution not ready. The
  final implementation keeps transport/token/gateway mechanics complete while
  denying every real route until the existing registry authority is activated.
- The initial cleanup design relied on short token expiry after removal failure.
  Review proved late provider RPC completion could reinstall a stale token
  mapping. The final adapter poisons lease reuse on every unconfirmed provider
  mutation or start instead of relying on expiry.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Put bearer token in sandbox env | Reject | It would expose capability authority to untrusted process state. |
| Stock SDK `ContainerProxy` export | Reject | Its proxy isolate cannot see the application handler registry. |
| `allowedHosts` allowlist | Reject | Pinned provider precedence can permit direct Internet fallback after a match. |
| Clear the lease after cleanup timeout | Reject | A late set RPC can reinstall the old token mapping after a successful remove. |
| Activate mapped read-only routes | Reject | Registry execution readiness and downstream field authorization are not yet true. |

## Open Questions

- None.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Sandbox SDK proxy source:
  <https://github.com/cloudflare/sandbox-sdk/blob/696388b24c1c59a19b484a9e8066dc431addf617/src/sandbox.ts>
- Containers egress implementation:
  <https://github.com/cloudflare/containers/blob/298169f4aaba82e7b712458b7c6b14fc3e40ad78/src/lib/container.ts>
- Containers egress guide:
  <https://github.com/cloudflare/containers/blob/298169f4aaba82e7b712458b7c6b14fc3e40ad78/docs/egress.md>
- Cloudflare service bindings:
  <https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/>

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
