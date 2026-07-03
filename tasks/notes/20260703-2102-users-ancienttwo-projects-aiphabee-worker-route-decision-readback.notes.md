# Implementation Notes: users-ancienttwo-projects-aiphabee-worker-route-decision-readback

> **Status**: Complete
> **Plan**: plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md
> **Contract**: tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md
> **Review**: tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md
> **Last Updated**: 2026-07-03 21:11
> **Lifecycle**: notes

## Design Decisions

- Added a Worker-only readback adapter for `/agent/runs/dry-run` and `/agent/runs/plan`.
- The adapter reads `getAgentRuntimeCapabilities().control_plane` from `@aiphabee/agent-runtime`; Worker does not define its own layer or mode enum.
- Success responses now include top-level `requested_layer`, `selected_layer`, `requested_mode`, `selected_mode`, `route_reason`, `route_decision_owner`, `control_plane_contract_version`, `worker_route_family`, plus nested `route_readback`.
- Missing layer/mode defaults to `generic` and `dry_run`.
- Explicit unsupported layer/mode fails before planning. A supported but non-executable mode such as `guarded_live` returns `SCOPE_DENIED` with `x-aiphabee-route-reason: runner_required`.

## Deviations From Plan Or Spec

- None. The implementation does not add FastClaw, Generic live execution, Generic chart parsing, production auth/session changes, or new package/app roots.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Add Worker-local enums | Rejected | Would create a second Agent route authority. |
| Infer Research layer from `parse_chart_image` or prompt text | Rejected | That would be heuristic semantic routing; explicit layer only. |
| Silently coerce `guarded_live` to dry-run | Rejected | Fail-closed preserves the executable-mode invariant. |
| Put readback only under nested `route_readback` | Rejected | Acceptance asked for visible `requested_layer`, `selected_layer`, and `route_reason`; both top-level and nested fields are provided. |

## Open Questions

- Production entitlement names and Research chart tool policy are still separate from this Worker readback slice.

## Verification

- `npx vitest run apps/worker/src/index.test.ts`: pass, 238 tests.
- `npx vitest run packages/agent-runtime/src/index.test.ts`: pass, 39 tests.
- `npm run typecheck --workspace @aiphabee/worker`: pass.
- `npm run typecheck --workspace @aiphabee/agent-runtime`: pass.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Review: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md`

## Promotion Candidates

- If later route slices repeat this pattern, promote the route readback shape into a dedicated runtime contract helper.
