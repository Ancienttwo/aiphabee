# Implementation Notes: fastclaw-agent-runner-adapter

> **Status**: Complete
> **Plan**: plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md
> **Contract**: tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md
> **Review**: tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md
> **Last Updated**: 2026-07-11 13:38
> **Lifecycle**: notes

## Design Decisions

- Registry enablement and execution authorization remain separate. Remote
  selection requires the activated runner ID; the public Worker planning route
  cannot supply it. The only grant mint lives in a non-package-exported module,
  checks an authentic WeakSet-held activation, and deeply freezes the grant and
  run ownership.
- `AgentExecutionRequest` now carries the real prompt and a minimal abort signal.
  The activated runner owns one wall-clock controller across PostgreSQL
  authority, token mint, transport and post-check; cancellation/timeout wins
  late remote completion and closes callbacks before terminal emission.
- Dedicated identity and temporal entitlement are read in one PostgreSQL
  statement using the existing lifecycle authority SQL. Exact tenant/user,
  active desired/current state and non-empty protected FastClaw references are
  revalidated before grant mint.
- Every transport tool call must cross a callback before execution. Call IDs,
  allowlist, step count and parallelism are checked; callback denial/failure is
  sticky even if a non-compliant transport catches it and tries to complete.
- Upstream progress is reduced to fixed hidden phases. Raw answer, private
  reasoning, protected IDs, sandbox authorization, tool input/output and raw
  errors never enter events. Only the AiphaBee post-check replacement answer
  can appear in the single terminal completion.
- The concrete Worker composition mints a bounded run-owned HMAC sandbox token
  from the branded grant. No public run route, deploy binding, resource, secret,
  migration or database write was added.

## P1 / P2 / P3 Readback

- P1: Agent Runtime still owns mode, selection, event and runner contracts;
  Row-6 PostgreSQL owns identity/entitlement; sandbox-run-auth owns the token;
  injected AiphaBee policy/post-check dependencies own tools/final semantics.
- P2: private activation -> exact authority snapshot -> frozen run grant ->
  bounded sandbox token -> callback transport -> AiphaBee tool policy ->
  AiphaBee post-check -> monotonic hidden phases -> exactly one terminal event.
- P3: opaque FastClaw SSE is explicitly non-compliant because it hides tool
  calls. The smallest safe Row-7 implementation is a callback transport port
  plus private composition; live protocol/version proof stays in Row 10.

## Deviations From Plan Or Spec

- The captured plan initially named an injected sandbox authorization issuer;
  implementation tightened this by adding the concrete Worker HMAC issuer so
  the activation path is executable without adding a route or deploy secret.
- Main-thread adversarial review found and fixed a swallowable tool-callback
  denial: failure is now sticky, callback volume/parallelism is bounded, and
  late callbacks cannot execute after terminal cancellation.
- Claude CLI produced no usable output and the first isolated Codex review was
  blocked by MCP auth. A clean-home isolated Codex inspection was attempted but
  exhausted its turn in reads; no external PASS is fabricated. The review file
  records a manual override backed by the current deterministic suite and the
  main-thread verified fixes.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Enable registry as authorization | Reject | A config flip must never mint compute authority. |
| Adapt opaque FastClaw SSE directly | Reject | Hidden tool calls cannot re-enter AiphaBee policy. |
| Prompt/regex tool denial | Reject | It is not an enforceable provider boundary. |
| Separate authority/profile queries | Reject | One PostgreSQL snapshot avoids cross-query drift. |
| Add public remote-run route now | Reject | Auth, durable state, billing/admin and live acceptance belong to later rows. |

## Open Questions

- Live FastClaw must expose the callback-before-execution contract (or an
  equivalently reviewed protocol) before production transport can be wired.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Contract: `deploy/fastclaw/fastclaw-agent-runner.contract.json`

## Verification

- `npm run check:fastclaw-agent-runner` -> adapter true, live transport false,
  callback-before-execution, status ok.
- Targeted runner/selection/Worker suite -> 5 files, 336 tests passed.
- Full `npm test` -> 96 files passed, 2 skipped; 1169 tests passed, 6 skipped.
- All-workspace `npm run typecheck` and `npm run lint`, database/env checks,
  capability/contract JSON parse and `git diff --check` -> PASS.
- No staging PostgreSQL or Cloudflare mutation occurred; Row 10 remains the
  credentialed security/load/cost/live gate.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- None. The callback-boundary decision is specific to this unfinished FastClaw
  integration and is already captured by the machine contract/capability truth.
