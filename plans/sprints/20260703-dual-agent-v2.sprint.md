# Sprint Redirect: dual-agent-v2

> **Status**: Archived
> **Slug**: dual-agent-v2
> **Created**: 2026-07-03
> **Updated**: 2026-07-03 20:42 +0800
> **Superseded By**: `plans/prds/20260703-2042-agent-control-plane-convergence.prd.md`, `plans/sprints/20260703-agent-control-plane-convergence.sprint.md`

This file originally mixed a review memo, architecture recommendation, multi-phase plan, and sprint tracker. It is intentionally no longer the executable sprint artifact.

Use the replacement documents instead:

- PRD: `plans/prds/20260703-2042-agent-control-plane-convergence.prd.md`
- Sprint: `plans/sprints/20260703-agent-control-plane-convergence.sprint.md`

Decision carried forward:

- Do not create `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.
- Keep `@aiphabee/agent-runtime` as the single Agent Control Plane authority.
- Keep Worker `/agent/*` as the public API owner.
- Treat `parse_chart_image` as a Research-only technical-analysis tool, never a Generic tool.
- Treat FastClaw as a future `AgentRunner` implementation behind AiphaBee authority.

Next executable slice:

```text
Sprint: agent-control-plane-convergence
Task 1: Agent layer + runner contract convergence
Entry: plans/sprints/20260703-agent-control-plane-convergence.sprint.md
```
