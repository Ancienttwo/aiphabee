# GPT Planning Pack Distillation

> **Created**: 2026-07-10
> **Source type**: GPT-generated planning material
> **Disposition**: reference input only; not product or execution authority
> **Raw cache**: `_ref/gpt-planning-pack-20260710/` (ignored, never committed)
> **Feeds**: `docs/spec.md`, `plans/prds/20260710-1702-dual-agent-v3.prd.md`, and `plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md`

## Purpose

This memo records what the 2026-07-10 GPT planning bundle contributed, which
parts were rejected, and how accepted ideas were reconciled with the repository's
existing authorities. The raw bundle deliberately stays outside tracked product
paths so its internal precedence, status claims, and sprint checklists cannot be
mistaken for repository truth.

## Source Integrity

The local reference cache contains thirteen Markdown files in the document pack,
including a concatenated read-only master, plus the raw dual-agent v3 chat dump.
The two hashes below bind the complete concatenated pack and the separate chat
output:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `document-pack/AiphaBee_Planning_Master_v1.0.md` | 245,960 | `772a7a13b22a3288e893d2e61903f70909a0ad59a001c2ed8ee1fb662cc6eb3c` |
| `raw-dual-agent-v3-chat-output.md` | 52,456 | `ac5d2a18eb0ff290bb18aa44e0bbcb610570ba151537a6ccbb13ffa15174d91b` |

The master declares the twelve component documents it concatenates. Individual
source hashes remain available from the local cache when forensic comparison is
needed. No execution step depends on the cache being present.

## Verified Repository Baseline

The useful architecture claims were checked against current repository contracts:

- `packages/agent-runtime` defines `AgentLayer`, `AgentRunMode`,
  `AgentExecutionRequest`, `AgentExecutionEvent`, `AgentRunner`, route decision,
  and layer tool policy.
- Worker `/agent/*` validates requested layer and mode and imports runtime-owned
  policy. It currently executes only `dry_run`; remote runner dispatch is not
  implemented.
- Generic requests cannot use Research-only tools under the runtime policy.
- MCP has schema, envelope, lifecycle, pagination, auth/limit, and error-code
  contracts, but its runtime capability still reports no live tool execution.
- Existing response, evidence, and error authorities already exist in
  `packages/data-contracts`, `packages/agent-runtime`, and
  `packages/mcp-runtime`.

These facts explain why the bundle is useful as a design input but unsafe as a
replacement architecture.

## Accepted Decisions and Their Home

| Decision | Accepted content | Repository home |
|---|---|---|
| Capability and execution are orthogonal | `generic|research` controls permission; `edge|fastclaw` describes product execution family | Stable invariant in `docs/spec.md`; product acceptance in the v3 PRD |
| FastClaw authority boundary | FastClaw is an internal runner and cannot own identity authority, rights, tool definitions, billing, evidence, or final semantics | `docs/spec.md`, v3 PRD, future Sprint |
| Dedicated identity, ephemeral compute | One entitled user has one durable profile; each active run/session gets a temporary sandbox | `docs/spec.md`, v3 PRD, future Sprint |
| Evidence-first output | Claims expose time, source, method, limitations, contradictory evidence, and qualitative strength; no invented percentages | Stable product boundary in `docs/spec.md`; runtime deltas require separate reconciliation |
| Data rights default deny | Storage and ingestion do not imply channel rights; every unresolved dimension is denied | `docs/spec.md`; detailed field/channel matrix remains future data-rights work |
| Failure-path acceptance | Provisioning idempotency, terminal cleanup, egress deny, kill switch, isolation, and measured live evidence are mandatory | Ten-row future Sprint |

## Runner Vocabulary Decision

The bundle contains four incompatible vocabularies:

- `edge | fastclaw` in the README, PRD, routing spec, and programme plan;
- `edge | fastclaw | workflow` in output contracts;
- `execution_requirement = edge | workflow | fastclaw` in the skills document;
- `edge | workflow | service | fastclaw` in the release-gate document.

Repository interpretation is narrower:

```text
selected_layer         = generic | research
selected_runner_family = edge | fastclaw
workflow/queue/cron    = trigger or orchestration
service/platform       = deterministic tool or shared-job executor
```

This is a product model, not a new code enum. Current code already distinguishes
run mode from `AgentRunner.runner_id`; the future dispatch slice must decide the
smallest strict representation without creating a third overlapping axis.

## Contract Reconciliation Required

### Output and Evidence

The pack proposes twelve named business cards plus a common response header and
evidence reference. Existing Agent Runtime evidence cards and standard response
envelopes are lower-level runtime authorities. Business cards may compose those
contracts, but they must not replace or duplicate them.

### Error Codes

The pack proposes seventeen core errors. The existing global data contract has
fifteen codes and MCP exposes an eleven-code public subset. The sets overlap but
are not identical: the pack adds Agent/sandbox-specific codes while omitting
existing ambiguity, point-in-time, not-found, and provider-configuration cases.
No code is adopted until a future gap matrix assigns ownership, public exposure,
retry semantics, and versioning.

### Netquity Rights

The pack's rights template contains seventeen required entries, not an eleven-
dimension runtime contract. It is a useful review checklist for dataset/field,
source owner, ingestion, derivation, Web, MCP/API, export, cache, persistence,
history, delay, user/geography, attribution, audit, expiry, approval, and status.
It does not prove redistribution rights and does not make the raw Netquity mirror
available through tools or product channels.

## Rejected Material

- The pack's self-declared document precedence. Repository policy keeps
  `docs/spec.md` as stable product truth and routes PRD/Sprint/status separately.
- The 156-cell RACI, thirteen synthetic roles, recurring meeting structure,
  seven release gates, and large checkbox bureaucracy.
- The duplicate programme plans and overlapping FastClaw Sprint definitions.
- Any claim that planned runner dispatch, live MCP tool execution, or Netquity
  product wiring already exists.
- Raw adoption of the pack's card schemas, error-code list, rights template, or
  data-tool catalogue.
- Committing the concatenated master merely to delete it in a later commit.

## Execution Boundary

This memo authorises no runtime, database, credential, deployment, or external
service change. Execution begins only through the repository-format v3 PRD, its
Draft Sprint, and a separately approved `$think` plan/contract for each backlog
row. Missing live credentials remain an external-acceptance blocker rather than
a fixture-only pass.
