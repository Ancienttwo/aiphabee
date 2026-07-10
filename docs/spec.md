# Product Spec: AiphaBee

> **Status**: Draft
> **Last Updated**: 2026-07-10 17:02 +0800
> **Owner**: Product and Platform

## Product Outcome

AiphaBee turns permitted Hong Kong equity and user-provided data into
explainable, reproducible research without personalised trading instructions or
trade execution. Results expose time, source, method, limitations,
contradictory evidence, and material unknowns.

## Success Criteria

- Ordinary and specialised research share one product authority and return
  structured, evidence-bound results.
- Capability permission and execution location are independent; an execution
  backend never upgrades the tools or data a request may use.
- Financial facts have direct evidence or a deterministic calculation whose
  inputs are evidenced.
- Unresolved rights, quality, identity, or tenant ownership is denied or
  reported unavailable, never silently substituted.

## Product and Compliance Boundary

AiphaBee is `research_only` by default. Output must not provide personalised
buy/sell/hold instructions, target weights or prices, stop-loss/take-profit,
automatic rebalancing, or broker execution. Provider output must not be called
authorised, verified, real-time, complete, or redistributable without an
approved contract.

Evidence strength is qualitative (`strong`, `medium`, `weak`, or `unknown`)
unless a separately approved calibration exists. The product
must not display invented precision such as arbitrary confidence percentages.

## Agent Control Plane

AiphaBee has one Agent Control Plane for public run semantics, identity/tenant,
entitlement, budget, routing, tool policy, audit, evidence, usage, and final
state.

```text
selected_layer         = generic | research
selected_runner_family = edge | fastclaw
```

- Layer controls capability and tool policy; runner family controls execution.
- Workflow, queue, and cron are triggers/orchestration, not runner families.
- Platform services own deterministic tools and shared jobs; `service` is not a
  runner family.
- Product runner-family vocabulary does not create a second enum beside runtime
  run-mode and runner-registration contracts.
- Generic cannot call Research-only tools. FastClaw cannot upgrade Generic to
  Research, and Research uses FastClaw only when separately required by personal
  state, custom code, long execution, or a personal schedule.

## FastClaw Personal Runner Boundary

FastClaw is an internal `AgentRunner` behind AiphaBee authority, not a public API
or second control plane.

- One entitled paid user maps to one durable FastClaw identity/profile.
- Durable identity is not a continuously running sandbox.
- Each active run/session gets one ephemeral sandbox; every terminal path
  destroys it.
- AiphaBee owns mapping, entitlement, billing, lifecycle, durable records, and
  final evidence validation.
- FastClaw owns no data rights, tool definitions, financial calculations,
  evidence policy, or final product semantics.
- Sandbox credentials are short-lived and job scoped; App DB, Netquity, broker,
  payment, and other long-lived secrets are absent.
- Egress is deny-by-default and limited to approved gateways.
- Provisioning/sandbox failure is retryable or blocked and fails closed; no
  shared identity fallback or fabricated output exists.
- Live release requires measured isolation, lifecycle, latency, resource, and
  cost evidence. Fixtures alone are not live acceptance.

## Data, Tool, and Evidence Authority

Web, Agents, FastClaw, workflows, and MCP consume the same registered tools and
rights decisions. They do not define parallel metrics or access raw provider
credentials.

- Raw storage does not grant display, MCP/API, export, derivation, cache, or
  model-use rights; every unresolved rights dimension is denied.
- Data Access Gateway and Tool Registry own live access and deterministic
  calculation.
- Existing response-envelope, evidence, and error contracts remain runtime
  authorities; product cards require reconciliation before implementation.
- MCP is a Tool Registry channel, not a separate data, calculation, or
  entitlement stack.

## Ephemeral Public OHLCV Technical Analysis

`technical_analysis_ephemeral` is a Research-only, user-initiated public OHLCV
capability. Its entrypoint is `analyze_public_technical_signal`, its data class is
`public_observation_signal`, and `get_price_history` is a separate scaffold.

Each run is limited to one requested symbol and 500 bars. Raw OHLCV may enter
bounded LLM context and user display, but not AiphaBee market storage or shared
cache; transcript policy defaults to `temporary_only`. Generic is denied,
Research requires `user_initiated=true`, and provider output must be normalised
without claiming it is an authorised feed.

## Acceptance Scenarios

- Paid ordinary profile request may remain `generic + edge`; payment alone does
  not force FastClaw.
- Generic use of a Research-only tool is denied under either runner family.
- Permitted personal custom-code research may use `research + fastclaw` without
  bypassing Tool Registry, evidence, budget, or post-check policy.
- Provisioning failure returns retryable/blocked state with no shared identity.
- Every terminal path requires sandbox destruction and audit evidence; unresolved
  channel rights deny Web, MCP, export, cache, derivation, and model use.
