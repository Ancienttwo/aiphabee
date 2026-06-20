# Task Contract: financial-restatement-golden-engine-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-financial-restatement-golden-engine-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-financial-restatement-engine-golden
> **Last Updated**: 2026-06-20 17:02 +08
> **Notes File**:
> `tasks/notes/financial-restatement-golden-engine-scaffold.notes.md`

## Goal

Create a deterministic financial restatement engine scaffold with synthetic
golden cases, without enabling live partner data reads or Serving Gateway
responses.

## Scope

- In scope:
  - `@aiphabee/financial-facts` package;
  - restatement timeline construction;
  - point-in-time statement selection by publication timestamp;
  - restatement delta generation;
  - balance sheet identity guard;
  - synthetic golden cases and package tests;
  - Worker `/data/runtime` capability update;
  - tracker/governance updates.
- Out of scope:
  - partner statement taxonomy and source samples;
  - live financial fact reads;
  - Serving Gateway reads;
  - financial ratio engine;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/financial-facts-restatement-scaffold.md
  - docs/governance/financial-restatement-golden-engine-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - packages/financial-facts/**
  - package-lock.json
  - plans/plan-financial-restatement-golden-engine-scaffold.md
  - tasks/contracts/financial-restatement-golden-engine-scaffold.contract.md
  - tasks/notes/financial-facts-restatement-scaffold.notes.md
  - tasks/notes/financial-restatement-golden-engine-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Package preserves original and restated statement versions"
    - "Point-in-time selection uses publishedAt and does not leak future restatements"
    - "Restatement deltas explain changed financial facts"
    - "Identity-breaking balance sheets are rejected"
    - "Runtime reports live_partner_data=false"
  commands_succeed:
    - npm run test -- packages/financial-facts/src/index.test.ts
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns financial_facts.engine.status=engine_scaffold"
```

## Acceptance Notes

- This task completes a deterministic synthetic engine scaffold.
- Partner-backed financial facts and Serving responses remain future work.

## Rollback Point

- Revert the commit that adds `@aiphabee/financial-facts` and runtime updates.
