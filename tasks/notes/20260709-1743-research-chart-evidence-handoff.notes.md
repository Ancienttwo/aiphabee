# Implementation Notes: research-chart-evidence-handoff

> **Status**: Active
> **Plan**: plans/plan-20260709-1743-research-chart-evidence-handoff.md
> **Contract**: tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md
> **Review**: tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md
> **Last Updated**: 2026-07-09 17:45
> **Lifecycle**: notes

## Design Decisions

- Handoff types (`ChartEvidenceDataStatus`, `ChartEvidenceStrength`, `ChartEvidenceClaimLabel`, `ChartEvidenceCalibrationStatus`, `ChartEvidenceDataPoints`, `ChartEvidenceCandidate`, `ChartEvidenceHandoff`) live in `types.ts` per the plan's file table; `evidence.ts` only holds the `deriveChartEvidenceHandoff` function, the exported `CHART_EVIDENCE_STRENGTH_BY_ROUTE_DECISION` mapping const, and a private (non-exported) `DATA_STATUS_BY_ROUTE_DECISION` mapping const — the plan only asked the strength table to be the single exported compliance-sensitive const.
- Fail-closed gate in `deriveChartEvidenceHandoff`: `unavailable` (candidate `null`) whenever `routing === null || record.status === "parse_failed" || record.result_json === null`. The third clause (`result_json === null`) is not reachable from the current executor (result_json is only null exactly when status is parse_failed/routing is null already), but it is added defensively so the pure function cannot be made to synthesize a candidate from an inconsistent record+routing pairing supplied by a future caller.
- `retrieved_at` reuses the executor's existing second `now()` call: the prior code computed `latencyMs = Math.max(0, now() - startedAt)` inline; this now reads `const completedAt = now(); const latencyMs = Math.max(0, completedAt - startedAt);` and passes `completedAt` as `retrieved_at`. Total `now()` call count in the executor is unchanged (still exactly 2), so existing latency-timing assertions in executor.test.ts needed no changes.
- `data_points` built via a generic `stripConfidence(<T extends { confidence: number }>)` helper applied to each `indicators`/`drawn_lines`/`patterns` array item, plus direct `.value` extraction for the five scalar `confidentNullable` fields (`chart_type`, `symbol`, `exchange`, `timeframe`, `end_time`). `ChartEvidenceDataPoints` types are indexed off `ChartParseResult` (e.g. `ChartParseResult["indicators"][number]`) rather than re-declaring the schema shape, so a future schema change surfaces as a type error here instead of silent drift.
- `warnings` are pushed in the plan's own listed order: `"degraded"` (record.status === "degraded"), `"repair_applied"` (repair_applied === true), the literal `routing.reason` (only when `routing.decision !== "auto_match"` — this is the "route-reason-derived" category, distinct from the `route_reason` field which always carries the reason verbatim regardless of warnings), then `"chart_time_unverified"` unconditionally whenever a candidate exists (as_of is the retrieval timestamp, never a verified chart-native timestamp).
- Confirmed `tool.ts` needs no code change: wrote the pass-through assertions in `tool.test.ts` first (TDD), ran them against the untouched `tool.ts`, and they passed because `tool.ts`'s `execute` returns the executor outcome unmodified. Left `tool.ts` untouched per the plan's conditional instruction.

## Deviations From Plan Or Spec

- One addition beyond the plan's literal decisions 1-5: the defensive `record.result_json === null` fail-closed clause described above. This is additive safety, not a semantic change to any of the five locked decisions, and does not change behavior for any path reachable through the current executor.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Duplicate `route_reason` into `warnings` for every non-auto-match decision vs. only for "operational calibration failure" reasons (calibration_lookup_failed, no_ready_calibration, etc.) | Push the reason for every `decision !== "auto_match"` | `route_reason` is already a first-class candidate field; mirroring it into `warnings` for all non-auto cases is a total, branch-free rule (no risk of miscategorizing a reason) and keeps the "why not auto_match" signal in one machine-readable place the answer layer can render without a lookup table |
| Add a third `now()` call for `retrieved_at` vs. reuse the existing latency-timing call | Reuse (`completedAt`) | Zero timing-behavior drift for the mock-clock-based tests already asserting on `latency_ms`, and `retrieved_at` is semantically "when the parse completed," which `completedAt` already represents |
| Central shared `ChartParseResultRecord` test fixture in `test-util.ts` vs. a local `BASE_RECORD` in `evidence.test.ts` | Local fixture in `evidence.test.ts` | `test-util.ts` was not named in the plan's File Changes table; building the record fixture locally keeps the diff scoped to the named files |

## Post-Acceptance Addendum (2026-07-09, cross-model review follow-up)

- Codex external acceptance (codex-review, read-only) raised one P1 and two P2. Orchestrator adjudication: the P1 ("data:image ref could reach evidence_candidate") is unreachable through production wiring — `createStoredChartImageFetchImage` whitelists `charts/<tenant>/` prefixes, so a hostile ref fetches null → `unavailable` → candidate is `null`; adding a local ref-format validator to evidence.ts would duplicate the image-store's authority (repo no-fallback rule), so no product code was added. Its regression-test ask was accepted.
- Test reinforcement landed in `executor.test.ts`: a new describe wires the REAL `createStoredChartImageFetchImage` (in-memory metadata/object stores, `uploadChartImage` fixture) into the executor and pins three end-to-end cases — wrong-tenant ref, hostile `data:image/...` ref (plus serialization assertion that the candidate surface carries no `data:image`), and removed/inactive ref — each asserting `unavailable` + `evidence_candidate: null` + `model_call_count === 0` + zero `doGenerateCalls`. This welds the previously separate halves (executor mock-null tests × image-store tenant tests) into one chain and closes Codex's P2 test-coverage finding.
- Codex's P2 on warnings vocabulary ("route-reason-derived" as a literal category) was not adopted: the answer renderer and warning vocabulary are explicitly out of scope (cutover sprint); gatekeeper had independently rated the same point P3-manual. Recorded in the review file.
- Runner-availability fallback (policy `delegation.runner_rule`): the fast-worker subagent hit the account session limit mid-follow-up, so this bounded test-only addendum was executed on the main thread (orchestrator) on the SAME contract — recorded here as required; not a product-semantics fallback. Verification after the addendum: `npx vitest run packages/agent-runtime/src/parse-chart-image` → 7 files, 48 tests passed; `npm run check:answer-evidence-contract` → ok; `npm run typecheck` → clean, exit 0.

## Open Questions

- None.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
