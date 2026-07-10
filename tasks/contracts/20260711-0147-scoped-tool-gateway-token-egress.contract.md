# Task Contract: scoped-tool-gateway-token-egress

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-11 03:02
> **Review File**: `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md`
> **Notes File**: `tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Row 3 provides isolated compute but intentionally has no network path. FastClaw
cannot call authoritative AiphaBee tools until one narrow egress path exists;
opening ordinary Internet or forwarding Worker secrets would collapse the
sandbox boundary. Row 4 must therefore add a short-lived, identity/tool-bound
capability and an exact private gateway before Row 7 may activate dispatch.

## Goal

Deliver a reviewed, fixture-complete Tool Gateway security path in which a
tenant/user/run/lease/tool-scoped token expires within 600 seconds, stays outside
the sandbox process, and is injected only by the Cloudflare outbound handler
into a private named Worker entrypoint. Only the exact synthetic Tool Gateway
host can reach that entrypoint; arbitrary hostname/IP/URL requests and invalid
tokens fail before any registered tool route executes. Keep runner dispatch,
backend registration, production minting, deploy and live acceptance disabled.
Keep all real mapped tool execution denied while Tool Registry reports
`execution_ready=false`; this row proves the transport and authority boundary,
not downstream rights activation.

## Scope

- In scope: exact HMAC token issue/verify contract; Agent Runtime deny-all versus
  Tool-Gateway egress shape; Cloudflare exact-host install/remove; private named
  Worker entrypoint; existing Worker tool-route map behind current Tool Registry
  execution readiness; names-only secret
  governance; deterministic security/provider-config tests; capability and
  Sprint truth.
- Out of scope: public gateway route, arbitrary Internet/package installation,
  App DB/Netquity/broker/payment/model/provider secrets in bridge or sandbox,
  replay ledger, write-capable tools, runner activation, production token mint,
  lifecycle orchestration, usage/billing, deploy, credentialed live evidence.
- Taste constraints: no compatibility token shape, no generic proxy target, no
  second Tool Registry/executor map, no JWT dependency, no fabricated live pass.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop if `@cloudflare/containers@0.3.7` cannot provide exact-host HTTPS
  interception without `allowedHosts`, or a named Worker entrypoint cannot be
  addressed through the staging service binding.
- Stop rather than weaken acceptance if the implementation would put the job
  token or any long-lived credential in sandbox env, argv, stdin, filesystem,
  output, or a sandbox-controlled Authorization header.

## Falsifier

The direction is false if the pinned provider can reach direct Internet after an
exact-host handler is configured, if catch-all denial is bypassed, or if the
named entrypoint must also become a public route. Cheapest proof: inspect the
installed 0.3.7 `ContainerProxy.fetch` precedence, assert `allowedHosts` remains
undefined, then run bridge/Worker Wrangler dry-runs before any deploy.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md`
- Notes file: `tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-0147-scoped-tool-gateway-token-egress.contract.md
  - tasks/reviews/20260711-0147-scoped-tool-gateway-token-egress.review.md
  - tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - packages/agent-runtime/src/index.ts
  - packages/agent-runtime/src/index.test.ts
  - packages/sandbox-run-auth/src/index.ts
  - packages/sandbox-run-auth/src/index.test.ts
  - apps/worker/src/index.ts
  - apps/worker/src/index.test.ts
  - apps/worker/src/sandbox-tool-gateway.ts
  - apps/worker/src/sandbox-tool-gateway.test.ts
  - apps/worker/package.json
  - apps/worker/wrangler.jsonc
  - apps/sandbox-bridge/src/tool-gateway-egress.ts
  - apps/sandbox-bridge/src/tool-gateway-egress.test.ts
  - apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts
  - apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts
  - apps/sandbox-bridge/src/index.ts
  - apps/sandbox-bridge/src/index.test.ts
  - apps/sandbox-bridge/package.json
  - apps/sandbox-bridge/wrangler.jsonc
  - tests/shims/cloudflare-workers.ts
  - deploy/env/.env.example
  - deploy/env/dev.env.example
  - deploy/env/staging.env.example
  - deploy/env/prod.env.example
  - deploy/env/env.schema.json
  - deploy/secrets/stores.contract.json
  - package-lock.json
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
      purpose: codebase_research
    worker:
      mode: edit_within_allowed_paths
      purpose: implementation
    verifier:
      mode: read_only
      purpose: exit_criteria_review
  runner:
    preferred:
      - subagent
      - codex-exec
      - main-thread
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - apps/worker/src/sandbox-tool-gateway.ts
    - apps/worker/src/sandbox-tool-gateway.test.ts
    - apps/sandbox-bridge/src/tool-gateway-egress.ts
    - apps/sandbox-bridge/src/tool-gateway-egress.test.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-0147-scoped-tool-gateway-token-egress.notes.md
  # verify-contract executes these direct probes with Bun. The authoritative
  # Vitest command below includes all six Cloudflare-shim/provider test files.
  tests_pass:
    - path: packages/sandbox-run-auth/src/index.test.ts
    - path: packages/agent-runtime/src/index.test.ts
    - path: apps/sandbox-bridge/src/tool-gateway-egress.test.ts
  commands_succeed:
    - npx vitest run packages/sandbox-run-auth/src/index.test.ts packages/agent-runtime/src/index.test.ts apps/worker/src/sandbox-tool-gateway.test.ts apps/sandbox-bridge/src/tool-gateway-egress.test.ts apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts apps/sandbox-bridge/src/index.test.ts
    - npm run typecheck
    - npm run lint
    - npm run check:env
    - npm run check:secrets
    - npm run check:answer-evidence-contract
    - npx vitest run
    - npx wrangler deploy --dry-run --config apps/worker/wrangler.jsonc
    - npx wrangler deploy --dry-run --config apps/sandbox-bridge/wrangler.jsonc
    - node -e "const p=require('./apps/sandbox-bridge/package.json'); const l=require('./package-lock.json'); if(p.dependencies['@cloudflare/sandbox']!=='0.12.3'||p.dependencies['@cloudflare/containers']!=='0.3.7'||l.packages['node_modules/@cloudflare/containers']?.version!=='0.3.7') process.exit(1)"
    - node -e "const fs=require('node:fs'); const s=fs.readFileSync('apps/sandbox-bridge/src/index.ts','utf8'); const c=fs.readFileSync('node_modules/@cloudflare/containers/dist/lib/container.js','utf8'); if(!s.includes('export class ContainerProxy extends SandboxContainerProxy')||!s.includes('hostname === SANDBOX_TOOL_GATEWAY_HOST')||!s.includes('return super.fetch(request)')||!s.includes('AiphaBeeSandbox.outbound = denySandboxOutbound')||!s.includes('AiphaBeeSandbox.outboundHandlers =')||s.includes('static outbound =')||s.includes('allowedHosts')||!c.includes('const handlers = outboundHandlersRegistry.get(className)')) process.exit(1)"
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: exact synthetic-host request reaches only the private
  named entrypoint with verified tenant/user/run/lease/tool claims; all other
  egress and invalid token states deny before tool execution. The pure gateway
  handler proves authorized executor delegation; the real named entrypoint
  denies all mapped tools while Tool Registry execution readiness is false.
- Edge cases: malformed/tampered/future/expired/cross-tool tokens; missing
  signing key/service binding; oversized body; wrong scheme/host/port/path/
  query/method; adapter configure/remove/start timeouts; partial provider
  mutation and late completion; poisoned lease reuse; provider kill path.
- Regression risks: Container egress precedence drift, public-route exposure,
  sandbox-controlled authority headers, token leakage, duplicated tool mapping,
  accidental capability activation, fixture-only live claims.

## Rollback Point

- Commit / checkpoint: one stacked Row-4 commit on the reviewed Row-3 base.
- Revert strategy: revert that commit; no deploy, secret value, migration,
  database write, or external resource requires rollback.
