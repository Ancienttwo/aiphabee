# Authorized Session Memory Scaffold

> **Status**: Verified no-live account memory scaffold
> **Last Updated**: 2026-06-21 19:07 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/authorized-session-memory-scaffold.contract.md`

This slice adds a Sprint 3.1 no-live account memory planner for AGT-10. It
allows only authorized preference/consent information, supports user-visible
view/edit/delete controls, and blocks unsupported memory keys before any planned
write. It does not read live memory rows, persist memory, store prompts,
answers, financial values, credentials, or render frontend settings UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Account package | `@aiphabee/account-runtime` | Owns authorized memory keys, forbidden payload classes, and no-write view/upsert/delete planning |
| Runtime route | `GET /account/runtime` | Reports `authorized_memory` capability and no-live posture |
| Planner route | `POST /account/authorized-memory/plan` | Normalizes memory keys/actions and returns standard envelope plan |
| Schema scaffold | `aiphabee_core.authorized_session_memory`, `aiphabee_governance.authorized_session_memory_contract` | Empty future-persistence scaffolds only; current route does not write |
| Contract gate | `deploy/account/authorized-session-memory.contract.json` | Locks allowed keys, forbidden payloads, privacy policy, and output fields |
| Frontend | Out of scope | User-visible settings UI remains delegated |

## P2 Concrete Trace

1. Caller sends `POST /account/authorized-memory/plan` with `account_id`,
   `workspace_id`, action, and memory key(s).
2. Worker normalizes snake/camel fields and calls
   `createAuthorizedSessionMemoryPlan()`.
3. The package validates account/workspace context and checks memory keys
   against the authorized whitelist.
4. Unsupported keys such as stored research answers return
   `blocked_unsupported_memory_key`.
5. Valid `view`, `upsert`, and `delete` requests return planned no-live
   statuses and explicit privacy policy flags.
6. Worker wraps the plan in the standard success envelope with zero credits.

## P3 Design Decision

Selected a no-write account-runtime planner plus empty schema scaffold.

Reason:

- AGT-10 is about privacy boundaries and user control, not model memory quality.
- Account runtime already owns session/account context and forbidden credential
  payloads.
- The first acceptance risk is accidentally storing prompts, generated answers,
  financial facts, or credentials as memory.

Tradeoff:

- The backend can prove authorized-only memory shape and view/edit/delete plan
  semantics.
- It cannot yet persist or render user-managed memory preferences.

## Verification

Expected checks for this slice:

- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:authorized-session-memory`
- `npm run check:database`
- `npm run typecheck`
- `npm run test`
- `npm run check`
- `git diff --check`
- `git diff --name-only -- apps/web`
- `scripts/check-task-workflow.sh --strict`

Known local blocker:

- `npm run check` reaches `npm run build` after passing lint, typecheck, tests,
  golden regression, and contract checks, then fails only at delegated
  `@aiphabee/web` Vite build because Node v22.12.0 lacks
  `node:module.registerHooks`.

## Residual Gaps

- Live memory persistence and reads remain absent.
- Frontend view/edit/delete controls remain delegated.
- Post-generation memory extraction is intentionally absent.
