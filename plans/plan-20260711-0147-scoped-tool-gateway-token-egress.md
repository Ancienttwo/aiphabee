# Plan: Scoped Tool Gateway Token and Egress

> **Status**: Complete
> **Created**: 20260711-0147
> **Slug**: scoped-tool-gateway-token-egress
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#scoped-tool-gateway-token-egress
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Tenant/run/lease/tool scoped token, exact synthetic-host egress, private named Tool Gateway, forbidden-secret absence, pre-execution denial, dry-run build, strict review and Sprint verification.
> **Rollback Surface**: Revert the Row-4 stacked commit; no deploy, secret value, database write, migration, or live resource is created.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md`
> **Task Review**: `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md`
> **Implementation Notes**: `tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#scoped-tool-gateway-token-egress
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md`
- Sprint contract: `tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md`
- Sprint review: `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md`
- Implementation notes: `tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md`.

## Approach
### Strategy
Use the captured planning output below as the execution source of truth.

### Trade-offs
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Captured plan | Preserves the approved Codex Plan or Waza think decision | Requires the captured text to be concrete enough to execute | Use |

## Detailed Design
### File Changes
| File | Action | Description |
|------|--------|-------------|
| See captured planning output | Follow | Implement only the approved scope named below |

### Code Snippets
See captured planning output.

### Data Flow
See captured planning output.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Captured plan lacks enough detail | Medium | Execution may need clarification | Stop before implementation if the captured output contradicts repo rules or lacks concrete file targets |

## Task Contracts
- Contract file: `tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md`
- Review file: `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md`
- Implementation notes file: `tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the Row-4 stacked commit; no deploy, secret value, database write, migration, or live resource is created.
- **Verification boundary**: Tenant/run/lease/tool scoped token, exact synthetic-host egress, private named Tool Gateway, forbidden-secret absence, pre-execution denial, dry-run build, strict review and Sprint verification.
- **Review/acceptance boundary**: `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md`, `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md`, and `tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the Row-4 stacked commit; no deploy, secret value, database write, migration, or live resource is created.

## Captured Planning Output

# Scoped Tool Gateway Token and Egress

## Approved Design Summary

Implement Sprint Row 4 as a narrow security layer across the existing Agent Runtime, Cloudflare sandbox bridge, and AiphaBee Worker. A trusted AiphaBee caller issues a short-lived HMAC job token bound to one tenant, user, run, lease, and registered tool. The token never enters sandbox env, argv, stdin, filesystem, or output: the Row-3 adapter installs it as trusted `setOutboundByHost()` parameters on the Sandbox Durable Object, and the outbound proxy strips sandbox-supplied authority before injecting the trusted token into a private Worker service-binding request.

Cloudflare egress is fixed to the exact installed pair `@cloudflare/sandbox@0.12.3` and `@cloudflare/containers@0.3.7`. `AiphaBeeSandbox` keeps `enableInternet=false`, explicitly sets `interceptHttps=true`, installs only the synthetic host `tool-gateway.internal` through runtime `outboundByHost`, and uses a static catch-all 403 handler. `allowedHosts` is deliberately left undefined: the pinned Containers implementation can otherwise permit direct Internet fallback after a host match, and its empty-array behavior disagrees with its README.

The programme backlog and the user's `go on` approve this bounded Row-4 slice. No runtime dispatch or FastClaw activation is enabled.

## Not Building

- No public Tool Gateway route. The target is a named Worker entrypoint reachable only through a Cloudflare service binding.
- No sandbox access to App DB, Hyperdrive/Netquity, broker, payment, model/provider, Cloudflare, storage, or other long-lived credentials.
- No arbitrary URL, host allowlist, proxy target, package-install egress, generic fetch forwarder, or compatibility path.
- No replay ledger, billing, semantic runner integration, backend registration, production token mint, deploy, or live-complete claim. Row 7 owns activation/integration; Row 9 owns usage/accounting; Row 10 owns credentialed live evidence.
- No new service or auth framework. Extend the existing shared auth package and current Worker/bridge surfaces.

## P1: Architecture Map

```text
future Agent Runtime / FastClaw runner (off in Row 4)
  issues tenant+user+run+lease+tool+expiry job token
                         |
                         v
CloudflareSandboxBackend.execute(tool_gateway_access)
  setOutboundByHost(exact synthetic host, trusted token params)
  starts process with URL only; no token or long-lived secret
                         |
                         v
AiphaBeeSandbox / ContainerProxy
  exact host -> strip sandbox auth/cookie/forwarding headers
  catch-all -> 403
  inject trusted short token -> private service binding
                         |
                         v
Worker named SandboxToolGateway entrypoint
  verify signature/audience/expiry/tenant/run/lease/tool
  require Tool Registry execution readiness before route execution
                         |
                         v
existing Worker route map (present but disabled in Row 4)
```

Authorities and dependencies:

1. Agent Runtime remains the run/tool policy authority and gains only a discriminated `deny_all | tool_gateway` egress contract on `SandboxExecuteInput`.
2. `@aiphabee/sandbox-run-auth` owns canonical WebCrypto token issue/verify mechanics; it does not decide whether a tool is registered or executable.
3. Sandbox bridge owns provider egress translation only. The bridge has a service binding and a short token in DO configuration, but no App DB or provider secret.
4. The Worker named entrypoint owns token verification and references the existing Worker tool-route map, but the existing Tool Registry `execution_ready=false` authority denies all real route execution in Row 4. It does not expose a default/public route or define a second Tool Registry.
5. Tool Registry, Data Access Gateway, existing tool handlers, response envelopes, and evidence policy remain downstream authorities.

This slice intentionally touches more than eight files because the shared port, token contract, provider egress, private gateway, secret-name governance, tests, capability truth, Sprint truth, and mandatory workflow artifacts cross four security boundaries. It adds no new service and only promotes the already-installed transitive `@cloudflare/containers@0.3.7` to an exact direct pin because its egress precedence is now a security contract.

## P2: Concrete Trace

1. A trusted future caller issues a canonical token with exact claims: version, audience, issued/expiry times, token ID, tenant ID, user ID, run ID, lease ID, and one tool name. TTL is at most the 600-second sandbox hard cap.
2. `SandboxExecuteInput` accepts either `deny_all` or `tool_gateway` with the fixed synthetic URL and opaque token. Runtime-invalid URLs/tokens fail before any provider call.
3. The adapter authorizes the full Row-3 lease, configures `tool-gateway.internal -> toolGateway` with the token in trusted outbound-handler params, and starts the process with only `AIPHABEE_TOOL_GATEWAY_URL`; token and long-lived credentials are absent from process env.
4. Sandbox code sends JSON tool input to the fixed HTTPS URL. The outbound handler rejects wrong scheme, host, port, method, path, query, body size, or content type; strips Authorization, Cookie, CF and forwarding headers; injects the trusted token; and calls only `env.TOOL_GATEWAY.fetch()`.
5. The Worker named entrypoint rejects missing signing secret, malformed body, invalid signature, wrong audience, expired/not-yet-valid token, cross-tool request, or unregistered/unmapped tool before the executor callback runs.
6. The pure gateway contract derives tenant/user/run/lease/tool identity only from verified claims and can call an injected authorized executor in tests. The real named entrypoint additionally reads Tool Registry capability truth; because `execution_ready=false`, every real tool request is currently denied before the existing route map, including sensitive IPO arguments.
7. On every terminal adapter path, the exact outbound host mapping is removed. Any unconfirmed set, cleanup, or process-start state keeps the durable lease process slot poisoned so later `deny_all` or Tool Gateway execution cannot start; provider destroy is the recovery boundary.

Error/async boundaries: token verification and request validation are synchronous/Promise preconditions; service binding and tool execution are async; provider host configuration is completed before process start; provider configuration failure starts no process; gateway rejection invokes no tool; token/cleanup errors are never converted into fabricated tool output.

## P3: Decision Rationale

- Use runtime `setOutboundByHost()` parameters so the short token stays outside the sandbox. Passing the token through env or Authorization supplied by sandbox code would unnecessarily expose a bearer credential.
- Leave `allowedHosts` undefined. In pinned Containers 0.3.7, non-empty matches can fall through to direct Internet even with `enableInternet=false`, while `[]` is truthy in implementation and denies everything despite README wording. Exact outbound mapping plus catch-all deny is the stable fail-closed composition.
- Use a named Worker entrypoint and service binding instead of a public Hono route. This preserves the product rule that FastClaw/Tool Gateway is not a public API.
- Reuse the existing Worker execution map but keep it behind Tool Registry's existing global `execution_ready=false` authority. Row 7 may activate only after downstream rights and Data Access Gateway enforcement are real; Row 4 adds no tool denylist or parameter rewrite.
- Use HMAC WebCrypto in the existing auth package; no JWT library or new runtime dependency is justified. The Worker holds the long-lived signing key; bridge receives only a short job token; sandbox receives neither.
- Scope one token to one tool. Stateless reuse within the short TTL is acceptable for the transport contract while real route execution is disabled; write-capable tools require a separate replay/call-budget contract before admission.

At 10x, stateless token verification is not the first bottleneck; Worker tool providers, container quota, and downstream rights/data reads are. Rollback is one stacked commit with no external state. The most fragile premise is that Containers 0.3.7 keeps the verified interception precedence; exact dependency pinning, source-level contract assertions, and Row-10 live probes protect that premise.

Cloudflare may still perform DNS resolution through its resolver when Internet is disabled. Row-4 acceptance therefore means arbitrary DNS hostnames/IPs/URLs cannot reach Tool Gateway or execute a tool; it does not claim zero resolver lookups. If zero DNS resolution is required, this provider is unsuitable and Row 10 must block release.

## Public Contract and Configuration Changes

- Agent Runtime: fixed Tool Gateway endpoint constant and `deny_all | tool_gateway` sandbox egress access shape; no arbitrary target string.
- Auth package: issue/verify one canonical tool token family with exact claims and max 600-second TTL.
- Worker: `SandboxToolGateway` named entrypoint; optional `AIPHABEE_SANDBOX_TOOL_GATEWAY_HMAC_KEY` secret binding, fail-closed when absent.
- Sandbox bridge: `TOOL_GATEWAY` service binding to `aiphabee-worker-staging#SandboxToolGateway`; exact `@cloudflare/containers@0.3.7`; HTTPS interception; runtime exact-host install/remove; catch-all deny.
- Secret governance: names-only schema/templates/store contract update. No value is written.

## Expected File Surface

Product/config/tests:

- `packages/agent-runtime/src/index.ts`
- `packages/agent-runtime/src/index.test.ts`
- `packages/sandbox-run-auth/src/index.ts`
- `packages/sandbox-run-auth/src/index.test.ts`
- `apps/worker/src/index.ts`
- `apps/worker/src/sandbox-tool-gateway.ts`
- `apps/worker/src/sandbox-tool-gateway.test.ts`
- `apps/worker/package.json`
- `apps/worker/wrangler.jsonc`
- `tests/shims/cloudflare-workers.ts`
- `apps/sandbox-bridge/src/tool-gateway-egress.ts`
- `apps/sandbox-bridge/src/tool-gateway-egress.test.ts`
- `apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts`
- `apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts`
- `apps/sandbox-bridge/src/index.ts`
- `apps/sandbox-bridge/src/index.test.ts`
- `apps/sandbox-bridge/package.json`
- `apps/sandbox-bridge/wrangler.jsonc`
- `package-lock.json`
- `deploy/env/{.env.example,dev.env.example,staging.env.example,prod.env.example,env.schema.json}`
- `deploy/secrets/stores.contract.json`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- active Sprint and Row-4 plan/contract/notes/review artifacts.

`apps/worker/wrangler.jsonc` should need no service declaration for its exported named entrypoint; it is listed only if Wrangler requires explicit metadata after dry-run validation. Do not touch it otherwise.

## Test Matrix

- Token: canonical issue/verify, exact audience and shape, tenant/run/lease/tool binding, max TTL, expiry, future token, tamper, weak secret, wrong tool, malformed identities.
- Gateway pre-execution: missing secret/token, wrong/expired/cross-tool/unregistered token, malformed/oversize body, wrong method/path all leave executor call count zero.
- Gateway contract success: verified claims are the sole tenant/user/run/lease/tool identity for an injected authorized executor; the real named entrypoint stays 403 while Tool Registry reports `execution_ready=false`.
- Egress: exact HTTPS synthetic URL succeeds through service binding; arbitrary DNS name, IPv4/IPv6 literal, URL, port, query, method, path, redirect target and missing binding return deny without external fetch.
- Header boundary: sandbox Authorization/Cookie/CF/X-Forwarded values are absent; only the trusted short token and bounded request metadata are forwarded.
- Adapter: `setOutboundByHost` completes before process start; token is absent from env/argv/files/output; env has URL only; unconfirmed configuration/cleanup/start poisons lease reuse until destroy; no access means deny-only and still pre-clears the exact host.
- Provider config: `enableInternet=false`, `interceptHttps=true`, `allowedHosts===undefined`, static catch-all deny, specialized `ContainerProxy` export, exact Sandbox/Containers pins, named service binding.
- Secret scan: forbidden credential names/values are absent from process options and bridge environment; signing key exists only on Worker binding surfaces.
- Regression: targeted Vitest, package/root typecheck and lint, env/secrets checks, full test suite, Wrangler dry-runs for Worker and bridge, contract/context checks, `git diff --check`, independent security/architecture review, fingerprint, strict Sprint verification.

## Dependency, Rollback, and Live Boundary

- Dependency failure: missing service binding/signing key, provider host-config error, or gateway failure returns explicit deny/failure; no direct fetch fallback.
- Scale explosion: token verification is stateless; downstream tool/provider/container quotas fail first and remain Row-10 evidence.
- Rollback: revert the Row-4 stacked commit. No deploy, secret write, migration, database write, or external resource mutation occurs.
- Local evidence proves code-level routing and pre-execution denial. Real HTTPS interception, CA behavior, redirect/port/IP/DNS destination denial, named service binding, `/proc`/env/filesystem absence, and zero live tool side effects remain Row-10 credentialed acceptance.

## Task Breakdown

- [x] Capture the approved Row-4 plan and strict contract in a stacked isolated worktree.
- [x] Add failing token, gateway, egress, adapter, provider-config, and secret-boundary tests.
- [x] Implement the exact token contract and private named Worker Tool Gateway.
- [x] Implement exact-host outbound interception and adapter install/remove without exposing the token to the process.
- [x] Pin Containers egress semantics and update names-only secret/capability truth without activation or deploy.
- [x] Run targeted/full/type/lint/env/secret/Wrangler/contract verification and Deep architecture/security review.
- [x] Backfill Sprint row 4, verify the exact diff fingerprint, and commit one reviewable stacked slice.

## Unknowns

- Credentialed ContainerProxy HTTPS/CA/DNS-destination behavior is explicitly deferred to Sprint Row 10 and cannot be promoted by fixture tests.
- Final replay/call-budget enforcement is deferred until a write-capable tool is proposed. Current Row-4 named gateway admits no real route because Tool Registry execution readiness is false.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Capture the approved Row-4 plan and strict contract in a stacked isolated worktree.
- [x] Add failing token, gateway, egress, adapter, provider-config, and secret-boundary tests.
- [x] Implement the exact token contract and private named Worker Tool Gateway.
- [x] Implement exact-host outbound interception and adapter install/remove without exposing the token to the process.
- [x] Pin Containers egress semantics and update names-only secret/capability truth without activation or deploy.
- [x] Run targeted/full/type/lint/env/secret/Wrangler/contract verification and Deep architecture/security review.
- [x] Backfill Sprint row 4, verify the exact diff fingerprint, and commit one reviewable stacked slice.
