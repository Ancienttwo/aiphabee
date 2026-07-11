# Implementation Notes: dedicated-agent-provisioning

> **Status**: Complete
> **Plan**: plans/plan-20260711-1045-dedicated-agent-provisioning.md
> **Contract**: tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md
> **Review**: tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md
> **Last Updated**: 2026-07-11 11:08
> **Lifecycle**: notes

## Design Decisions

- Kept the existing lifecycle and schema. Row 6 changes only the missing
  concurrent-attempt truth: a failed lease claim returns the authoritative
  profile and records a conflict audit without upstream work.
- One `request_id` is one immutable idempotent attempt. Conflict and retryable
  upstream results replay for that ID; the response now explicitly sets
  `retry_with_new_request_id=true` so a new attempt cannot be confused with a
  replay. This closes the first Claude review's P1 poisoned-retry finding.
- A concurrent duplicate of the current lease owner's request ID returns
  transient `LIFECYCLE_REQUEST_IN_PROGRESS` with same-ID retry and writes no
  competing event. The owner alone writes the eventual success/failure audit,
  so duplicate delivery cannot poison its idempotency record.
- A deleted profile is not a lease conflict. Activate/disable now audit
  `RESEARCH_AGENT_PROFILE_DELETED` as non-retryable; delete itself remains an
  idempotent terminal replay.
- A CAS loser re-reads the profile. If the winner reached the requested terminal
  state during that race, the loser converges through terminal replay instead
  of recording a stale conflict.
- `expiry` remains two authoritative clocks: entitlement `valid_to` denies new
  activation, while `lease_expires_at` permits operation reclaim. No public
  expire intent or status was added.
- Pinned the accepted private control-plane contract to FastClaw
  `dev@35cd5ad006d991713c91a1fc641bcf01dbaf3a8b`; the current sibling repo read
  back that exact commit and the five-route allowlist hash
  `5bf40f01839f3d7bd252d638393637bdbf949b62354e0ab3e2641462687de7d6`.

## P1 / P2 / P3 Readback

- P1: AiphaBee PostgreSQL owns `(workspace_id, account_id)`, leases and audit;
  FastClaw owns owner-scoped remote idempotency; dispatch and live execution are
  still false.
- P2: two real clients hit one profile; the winner alone crosses the remote
  boundary, the loser writes one retryable attempt audit, same-ID replay is
  stable, and a new-ID retry converges on the winner without a second remote
  call. Partial user success is retained and reused before the missing Agent is
  provisioned.
- P3: no migration/queue/new intent was justified. At 10x, remote latency and
  lease contention fail first; Row 10 must measure that before an outbox or
  queue is introduced.

## Deviations From Plan Or Spec

- Added `retry_with_new_request_id` and a deleted-profile terminal denial after
  Claude's independent review found that a persisted conflict plus an
  unspecified retry contract could mislead clients into replaying a permanently
  frozen attempt. This is a contract clarification, not a compatibility path.
- The first Claude review also flagged the PostgreSQL 16 role-membership syntax;
  the fixture now rejects older servers explicitly and restores the caller's
  prior role `SET` option after the suite. The verified local target is
  PostgreSQL 17.4.
- The second Claude re-review could not run because its session quota resets at
  12:10 HKT. No finding was waived: the original P1 has direct unit and real
  PostgreSQL regressions; remaining P2 items were either fixed or verified
  against current contract state.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Mutate a conflict audit row into later success | Reject | Would erase append-only attempt truth. |
| Retry the same request ID | Reject | The existing audit/replay model defines one ID as one attempt, including retryable upstream failures. |
| Add a separate attempt table/migration | Reject | Explicit new-ID retry closes the contract without a second audit authority. |
| Add `expire` intent/status | Reject | Entitlement and lease clocks already own the two required expiry semantics. |
| Add queue/outbox | Reject | Fixtures prove the current CAS/idempotency boundary; Row 10 owns scale evidence. |

## Verification

- Contract checker: `status=ok`, FastClaw commit exact, 5 private routes,
  dispatch/live acceptance false.
- Targeted lifecycle/client/Worker suite: 3 files, 280 tests passed.
- Disposable PostgreSQL 17 integration at database
  `aiphabee_lifecycle_test_row6`: 5 tests passed, including two-client
  concurrency, partial retry, lease expiry and temporal entitlement expiry.
- Full regression: 94 files passed, 2 skipped; 1153 tests passed, 6 skipped.
- All-workspace `npm run typecheck` and `npm run lint`: PASS.
- `npm run check:database`, `npm run check:env`, capability/contract JSON parse
  and `git diff --check`: PASS.
- Strict contract pre-review: 23/25 passed; only the intentionally pending
  review score/recommendation remained before this note/review closeout.
- No deploy, migration, secret change, shared staging DB write or FastClaw
  checkout mutation occurred. The disposable database was dropped (readback
  count `0`) and the pre-test role membership `set_option=false` was restored.

## Open Questions

- Row 7 must re-check current entitlement before every runner dispatch and bind
  provisioning to grant mint/activation atomically.
- Row 10 owns credentialed load, latency, residual-resource and cost evidence.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Upstream contract: `deploy/fastclaw/dedicated-agent-provisioning.contract.json`

## Promotion Filter

No durable lesson promotion: this slice applies existing request-attempt and
authority-first rules rather than introducing a new cross-project pattern.
