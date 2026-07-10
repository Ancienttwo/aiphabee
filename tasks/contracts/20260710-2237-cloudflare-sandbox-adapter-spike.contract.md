# Task Contract: cloudflare-sandbox-adapter-spike

> **Status**: Fulfilled
> **Plan**: plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: fastclaw_personal_runner
> **Last Updated**: 2026-07-11 00:56
> **Review File**: `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md`
> **Notes File**: `tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md`

## Why

The provider-neutral port is sealed and current main already contains a proven
Cloudflare bridge, exact SDK/image pin and staging smoke. Row 3 must converge
those truths without making the bridge a second Agent authority, duplicating a
provider service, accepting naked lease IDs, or mistaking buffered/aborted work
for streamed/killed provider execution.

## Goal

`apps/sandbox-bridge` exposes one tested `CloudflareSandboxBackend` conforming
to the Agent Runtime port. Every operation carries an opaque lease, a private
Durable Object registry binds it to tenant/user/owner/provider/process state,
and mismatches fail before Cloudflare calls. SDK and matching image digest are
pinned; RPC, no default session and no Internet are fixed. Adapter capability is
true while registration, runner dispatch, grant minting and live execution stay
false.

## Scope

- In scope:
  - Refine Agent Runtime operation inputs from naked `lease_id` to
    `SandboxLease` and update conformance tests.
  - Cloudflare adapter, private lease registry, process streaming/kill, binary
    file mapping, provider failures and idempotent destroy.
  - Reuse the landed bridge/SDK configuration; pin image digest and version
    drift assertions; update capability/Sprint truth.
- Out of scope:
  - No FastClaw enablement, grant mint, public route, deploy, live credentials,
    Tool Gateway token/egress, semantic Agent events, lifecycle orchestration,
    usage/cost claim, database or secret mutation.
  - No second service/package, sandbank, compatibility fallback, deprecated
    `execStream()`, or wholesale copy of the FastClaw smoke artifact.
- Taste constraints: one direct provider adapter; official `shellQuote` and
  current process/session APIs; fail closed without synthesized provider output.

## Stop Conditions

- Stop if any edit outside Allowed Paths is required.
- Stop if the pinned SDK cannot expose both real-time process output and a
  provider process handle that `kill()` can terminate.
- Stop if image and npm versions/digest cannot be verified or dry-run build
  requires a deploy/account mutation.
- Stop if adapter implementation requires enabling FastClaw, minting a grant,
  allowing Internet, or adding a second authority/service.

## Falsifier

The direction is wrong if current main has no reusable official SDK/image
integration, or if 0.12.3 cannot retain a killable process while streaming.
Cheapest proof passed: main has `apps/sandbox-bridge`; npm/image are 0.12.3;
Docker digest resolves; dry-run build passes; official process API supplies
`startProcess`/output callbacks/process kill. The deprecated buffered bridge
path itself is evidence only, not the adapter implementation.

## Root Cause Evidence

Not a bugfix.

## Workflow Inventory

- Source plan: `plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md`
- Review: `tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md`
- Notes: `tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md`
- Checks: `.ai/harness/checks/latest.json`
- Base after current-main convergence: `f7984e7a796140fab95c917a95b48300496f67de`
- Completion: strict contract, review pass/manual override, final fingerprint
  and `verify-sprint` pass.

## Allowed Paths

```yaml
allowed_paths:
  - packages/agent-runtime/src/index.ts
  - packages/agent-runtime/src/index.test.ts
  - apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts
  - apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts
  - apps/sandbox-bridge/src/lease-registry.ts
  - apps/sandbox-bridge/src/lease-registry.test.ts
  - apps/sandbox-bridge/src/index.ts
  - apps/sandbox-bridge/Dockerfile
  - apps/sandbox-bridge/wrangler.jsonc
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md
  - tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md
  - tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md
```

## Delegation Contract

```yaml
delegation:
  budget:
    tokens: null
    tool_calls: null
    wall_time_minutes: null
  permission_scope:
    mode: inherit_allowed_paths
    writable_paths: []
    network: inherited
  roles:
    parent:
      mode: narrate_and_gatekeep
      purpose: approval_checkpoint_owner
    explorer:
      mode: read_only
      purpose: official_contract_research
    worker:
      mode: edit_within_allowed_paths
      purpose: implementation
    verifier:
      mode: read_only
      purpose: exit_criteria_review
  runner:
    preferred: [subagent, codex-exec, main-thread]
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts
    - apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts
    - apps/sandbox-bridge/src/lease-registry.ts
    - apps/sandbox-bridge/src/lease-registry.test.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260710-2237-cloudflare-sandbox-adapter-spike.notes.md
  tests_pass: []
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/index.test.ts apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts apps/sandbox-bridge/src/lease-registry.test.ts apps/sandbox-bridge/src/index.test.ts
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run typecheck --workspace @aiphabee/sandbox-bridge
    - npm run lint
    - npm run typecheck
    - npm test
    - npm run check:answer-evidence-contract
    - repo-harness run check-context-files
    - bash -lc 'test "$(jq -r ".capabilities[] | select(.id == \"agent_control_plane\") | .invariants.sandbox_adapter_implemented" .ai/context/capabilities.json)" = "true"'
    - bash -lc 'test "$(jq -r ".capabilities[] | select(.id == \"fastclaw_personal_runner\") | .invariants.sandbox_adapter_implemented" .ai/context/capabilities.json)" = "true"'
    - bash -lc 'test "$(rg -n "createCloudflareSandboxBackend\\(" apps packages --glob "*.ts" | wc -l | tr -d " ")" = "1"'
    - bash -lc 'rg "enableInternet = false" apps/sandbox-bridge/src/index.ts && rg "enableDefaultSession: false" apps/sandbox-bridge/src/index.ts && rg "transport: " apps/sandbox-bridge/src/index.ts | rg "rpc"'
    - node -e 'const packageJson = require("./apps/sandbox-bridge/package.json"); if (packageJson.dependencies["@cloudflare/sandbox"] !== "0.12.3") process.exit(1)'
    - bash -lc 'grep -F "FROM docker.io/cloudflare/sandbox:0.12.3@sha256:23f67e16131b780865a5fa5aa3c8607408a730105c248836409f4e02bb6bf042" apps/sandbox-bridge/Dockerfile'
    - bash -lc '! rg "execStream\\(" apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts'
    - bash -lc 'out=$(mktemp -d); trap "rm -rf $out" EXIT; npx wrangler deploy --dry-run --config apps/sandbox-bridge/wrangler.jsonc --outdir "$out"'
    - git diff --quiet f7984e7a796140fab95c917a95b48300496f67de -- package.json package-lock.json apps/sandbox-bridge/package.json
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 8
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: adapter covers create, streamed process output, file
  round-trip, real provider kill and destroy without a production grant mint.
- Edge cases: unknown/cross-owner/cross-tenant/terminal leases never call the
  provider; provider and registry failures remain explicit; destroy retry does
  not fabricate terminal success.
- Regression risks: in-memory lease maps, naked IDs, buffered exec, AbortSignal
  called kill, version/image drift, Internet enablement or optimistic capability
  flags are blockers.

## Rollback Point

- Base: `f7984e7a796140fab95c917a95b48300496f67de`.
- Revert the single Row-3 commit. The main-sync merge stays as repository
  convergence; no external rollback is needed.
