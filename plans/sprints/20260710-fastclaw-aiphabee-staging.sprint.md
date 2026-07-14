# Sprint: fastclaw-aiphabee staging persistence

> **Status**: Done
> **Approved**: user `开干`, 2026-07-10

## Goal

Turn the proven disposable lifecycle smoke into one durable, private staging
control service named `fastclaw-aiphabee-staging`.

> **2026-07-12 supersession readback**: the persistent Cloudflare Worker,
> Container application and all seven registry image tags were deleted after
> the control plane moved to the dedicated VPS. This Sprint remains historical
> evidence; it is not the current deployment topology.

## Backlog

| # | Status | Task | Acceptance | Plan |
|---|--------|------|------------|------|
| 1 | [x] | Persistent FastClaw staging control service | shared PlanetScale is schema/role-isolated; R2 and SQL survive cold start; full dedicated-Agent lifecycle passes; feature returns off | `plans/plan-20260710-1710-fastclaw-aiphabee-staging.md` |
