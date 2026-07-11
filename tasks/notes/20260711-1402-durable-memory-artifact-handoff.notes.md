# Implementation Notes: durable-memory-artifact-handoff

> **Status**: Complete
> **Plan**: plans/plan-20260711-1402-durable-memory-artifact-handoff.md
> **Contract**: tasks/contracts/20260711-1402-durable-memory-artifact-handoff.contract.md
> **Review**: tasks/reviews/20260711-1402-durable-memory-artifact-handoff.review.md
> **Last Updated**: 2026-07-11 14:19
> **Lifecycle**: notes

## Design Decisions

- AiphaBee approval happens before SandboxBackend.readFile. Rejected candidates
  are never read, scanned or stored; the sandbox cannot approve its own output.
- Scanner authority is injected. Only exact `clean` plus matching classification,
  engine/version/time persists; unsafe/error/thrown/mismatched scans fail closed.
- Memory is capped at 64 KiB, artifacts at 10 MiB and one handoff at 16
  candidates. Bytes are SHA-256 bound and stored under a tenant/user/run key in
  the existing AIPHABEE_ARTIFACTS R2 binding.
- PostgreSQL owns complete tenant/owner/run/lease, approval, classification,
  size, retention/expiry, scan, provenance and evidence metadata. Reads query an
  active tenant record before checking the tenant key prefix and touching R2.
- Object-first persistence compensates on R2/metadata failure. If PostgreSQL
  returns an ambiguous error, an exact tenant/id readback distinguishes a
  committed record from a failed insert; uncertain readback leaves the unique
  object for reconciliation and returns `cleanup_required` instead of deleting
  an object that may have a committed record.
- Handoff owns idempotent sandbox destroy after validation, approval and item
  processing. Destroy failure is explicit and never release-safe; fixture
  readback proves the lease files disappear after success.

## P1 / P2 / P3 Readback

- P1: Agent Runtime owns the provider-neutral approval/scan/storage/cleanup
  contract; SandboxBackend owns ephemeral files; Worker PostgreSQL/R2 adapters
  own concrete AiphaBee persistence; no public route or second control plane was
  added.
- P2: run-owned lease -> metadata-only approval -> approved sandbox read ->
  limit/hash -> authoritative scan -> R2 put -> PostgreSQL insert/readback ->
  tenant-scoped read -> mandatory destroy.
- P3: R2 bytes plus PostgreSQL metadata is the smallest concrete durable path.
  Object keys are partition hints, not authorization; fixture heuristics never
  substitute for scanner authority; live migration/scanner/deploy stays closed.

## Deviations From Plan Or Spec

- Main-thread adversarial review tightened ambiguous PostgreSQL commit handling:
  metadata errors now perform an exact readback before compensation, preventing
  a transport error after commit from deleting the referenced R2 object.
- R2 put errors also attempt idempotent delete; failed compensation becomes
  `cleanup_required` rather than a false no-write claim.
- External Codex review was attempted twice. The default model required a newer
  CLI and the fallback model was unsupported by the ChatGPT account, so no
  external PASS is fabricated; the review records a manual override.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Sandbox-authored manifest approval | Reject | Generated output cannot grant itself persistence authority. |
| Local MIME/extension/regex safety | Reject | It would fabricate scan authority. |
| PostgreSQL-only byte storage | Reject | Existing R2 is the bounded object authority; PG owns queryable metadata/RLS. |
| Metadata-first persistence | Reject | It can expose a record for an absent object. |
| Delete object on every metadata error | Reject | Ambiguous post-commit transport errors could create a record pointing to a missing object. |
| Add public read route now | Reject | Auth, user/admin state and billing belong to Row 9. |

## Open Questions

- Row 10 must select and credential a real scanner and apply/read back the
  migration/R2 path before any production-complete claim.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Machine contract: `deploy/fastclaw/durable-memory-artifact-handoff.contract.json`

## Verification

- Machine contract -> approval-before-read true, R2+PostgreSQL, tenant-scoped
  read, live scanner false, status ok.
- Focused Row-8 suite -> 2 files, 14 tests passed; broader runner/lifecycle
  targeted suite -> 5 files, 60 tests passed before the ambiguity fix.
- Full `npm test` -> 98 files passed, 2 skipped; 1183 tests passed, 6 skipped.
- All-workspace `npm run typecheck` and `npm run lint`, database/env/JSON/diff
  checks -> PASS.
- No Cloudflare deployment/resource, scanner credential, live Agent run or
  staging PostgreSQL mutation occurred.

## Promotion Filter

Promote only after a repeated cross-task correction. The compensation/readback
rule is captured in this task contract and machine fixtures; no global lesson is
promoted yet.

## Promotion Candidates

- None.
