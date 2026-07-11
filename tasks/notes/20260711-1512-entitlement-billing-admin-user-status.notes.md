# Implementation Notes: entitlement-billing-admin-user-status

> **Status**: Complete
> **Plan**: plans/plan-20260711-1512-entitlement-billing-admin-user-status.md
> **Contract**: tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md
> **Review**: tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md
> **Last Updated**: 2026-07-11 15:36
> **Lifecycle**: notes

## Design Decisions

- Product control is a private Worker service. It resolves one Better Auth
  subject and exact workspace through current account, membership,
  subscription, product access, entitlement and profile authority in one SQL
  snapshot; it does not add a public route or second runner selector.
- Five user states are projected only from temporal authority plus an existing
  profile. Paid/entitled state reports availability, while Agent Runtime keeps
  `selection_owner`, Edge stays the default, and selected runner remains null.
- Per-run model, tool, sandbox and storage measurements accept only exact
  observed data and a Row-5 terminal state. Completed runs bind generic usage
  quality `PASS`; failed/cancelled/killed runs bind `HOLD` without losing their
  actual resource consumption.
- The detail row, generic `usage_event` and zero-credit preview ledger entry are
  inserted transactionally. Exact replay is accepted; any changed replay or
  concurrent mismatch fails closed.
- Admin retry/disable/delete/kill requires current owner/admin authority and an
  exact tenant target. Lifecycle operations reuse Row 6; kill uses an injected
  tenant/user/run/request keyed idempotent port. Audit records contain stable
  product identifiers and normalized error codes only.

## Deviations From Plan Or Spec

- Preview credit is fixed to zero until Row 10 produces live cost evidence;
  Row 9 does not invent a pricing formula from resource estimates.
- Main-thread adversarial review added exact target validation, PG numeric/time
  replay normalization, stable field-order comparison and terminal-state-aware
  usage quality after the initial implementation.
- Claude CLI read-only review was attempted but returned no assistant output or
  usable transcript result. No external PASS is fabricated; the task review
  records a manual override backed by deterministic and main-thread review.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Paid plan selects FastClaw | Reject | Entitlement is availability authority, not runner-selection authority. |
| Estimate credit before live cost evidence | Reject | Row 10 owns current prices and live measurements; zero-credit preview is truthful. |
| Ignore failed-run usage | Reject | Resource consumption exists even when terminal quality is HOLD. |
| Reimplement lifecycle or kill | Reject | Reuse request-idempotent authorities and keep one state machine. |
| Expose raw provider IDs/errors for admin convenience | Reject | Product/audit records must not leak remote control-plane references. |

## Open Questions

- Row 10 must wire live kill dispatch and terminal usage sinks, apply/read back
  the staging migration, and calibrate cost before posted billing can exist.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Machine contract: `deploy/fastclaw/research-agent-product-control.contract.json`

## Verification

- Focused product-control suite: 21/21 passed.
- Broader lifecycle/runner/handoff suite: 4 files passed, 1 skipped; 56 passed,
  5 skipped.
- Full `npm test`: 99 files passed, 2 skipped; 1204 tests passed, 6 skipped.
- All-workspace `npm run typecheck` and `npm run lint`, database/env/machine
  contract/JSON/diff checks: PASS.
- No Cloudflare deployment/resource, provider billing call, live Agent run or
  staging PostgreSQL mutation occurred.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- None; keep the Row-9-specific preview billing and terminal-state decisions in
  this task until live Row-10 evidence proves a reusable rule.
