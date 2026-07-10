# Task Review: fastclaw-dedicated-agent-lifecycle

> **Status**: Pass
> **Plan**: plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md
> **Contract**: tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md
> **Notes File**: tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-10 16:18
> **Recommendation**: pass
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:897098c464f6cf168f8ce5aa001d0a1a7f56d6eac335af0513c3294e337dd794
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: pass
- Change type: code-change
- Intended files changed: lifecycle package/client, Worker route/repository/tests,
  DB/env contracts, and the linked FastClaw prerequisite.
- Actual files changed: intended AiphaBee paths only; linked FastClaw commit
  `826d306aaa7861776b532e7be5e936a839afcbae`; primary Netquity worktree untouched.
- Commands passed: FastClaw `go test ./...`; AiphaBee lint, 1003-test suite,
  targeted 265-test lifecycle/route suite, typecheck, env/database checks,
  PostgreSQL 17 migration/lifecycle integration, and diff checks.
- External acceptance: pass
- Residual risks: persistent production FastClaw service/storage and
  `runner_remote` remain unprovisioned; the feature flag and lifecycle secrets
  are off after staging acceptance.
- Reviewer action required: none for this implementation unit.
- Rollback: disable lifecycle flag and revert application commits; retain
  additive profile/audit tables and tombstones.

## Mode Evidence

- Selected route: approved host plan in an isolated linked worktree.
- P1/P2/P3 evidence: implementation notes map the authority boundaries, trace
  one lifecycle request end-to-end, and record the synchronous lease/idempotency
  decision and 10x failure boundary.
- Root cause or plan evidence: captured planning output and contract Goal/Scope.

## Verification Evidence

- Waza `/check` run: equivalent contract review completed against Goal, Scope,
  allowed paths, acceptance notes, and rollback boundary.
- Commands run: see Human Review Card and implementation notes.
- Manual checks: FastClaw worktree clean/committed; AiphaBee primary worktree not
  touched; current environment checked by variable name only; no secret values
  printed or committed.
- Supporting artifacts: this review, implementation notes, strict contract
  output (26/26 PASS), PostgreSQL integration test, and
  `.ai/harness/checks/latest.json`.
- Implementation notes reviewed: yes.
- Final run snapshot is recorded by `.ai/harness/checks/latest.json` after this
  diff-bound external acceptance is verified.

## External Acceptance Advice

> **External Acceptance**: pass
> **External Reviewer**: Claude
> **External Source**: claude-review
> **External Started**: 2026-07-10 16:00
> **External Completed**: 2026-07-10 16:18
> **Reviewed Diff Fingerprint**: sha256:897098c464f6cf168f8ce5aa001d0a1a7f56d6eac335af0513c3294e337dd794
> **Reviewed Scope**: branch+staged+unstaged+untracked

- P1 blockers: none
- The shared staging database was extended only for the two missing authority
  tables; lifecycle access uses a dedicated caching-disabled Hyperdrive and
  table-scoped BYPASSRLS role.
- P2 advisories: none within the staging implementation boundary. Production
  BYPASSRLS role provisioning remains an explicit promotion gate; it is not
  represented as provisioned product state.
- Acceptance checklist: activate `1/1`; same-request replay `1/1`; disable
  FastClaw denial HTTP `403`; reactivate `1/1`; closed-account delete remote
  `0/0`; local tombstone `deleted`; audit events `4`; fixture cleanup rows `11`.
- Cleanup checklist: temporary Container Worker/application/images removed,
  ops Worker readback `404`, lifecycle secrets `0`, canonical staging Worker
  redeployed without the temporary service binding, protected route HTTP `401`.
- This is a live-provider staging PASS. It does not authorize production
  `runner_remote`, public onboarding, or persistent paid-user enablement.

Claude follow-up output, verbatim:

> 六項整改逐一核對完畢。以下是本輪 follow-up 驗收結論。
>
> ## 前次 P2 閉環核對
>
> 1. **RLS policies SELECT-only** — 已閉環。`deploy/database/migrations/20260710120000_research_agent_lifecycle.sql:85` 與 `:102` 兩條 policy 均為 `for select` 且移除 `with check`；在 `force row level security`（`:70-74`）下，mutation 無對應 policy 即 default-deny，語義正確。
> 2. **對抗性 runtime mutation 測試** — 已閉環。`apps/worker/src/research-agent-lifecycle.postgres.test.ts:96-115` 對 runtime role 顯式授予 `update/delete` 權限後，驗證 profile UPDATE 與 audit DELETE 均 `rowCount === 0`（PostgreSQL 對無 UPDATE/DELETE policy 的行為正是零列命中，斷言語義正確）；`:116-120` 補上 cross-account SELECT 隔離。
> 3. **user-Hyperdrive 負向測試隔離** — 已閉環。`apps/worker/src/research-agent-lifecycle.test.ts:149-162` 補齊完整 FastClaw 配置，失敗原因唯一收斂到缺 control Hyperdrive；`:164-178` 另有 service-binding 缺失的對偶負向測試，兩者互不混淆。
> 4. **測試 role 冪等建立** — 已閉環。`postgres.test.ts:167-171` 以 `pg_roles` 存在性檢查包裹 `create role`（role 是 cluster 級、schema 每輪 drop 重建，模式正確）；連跑兩輪 PASS 記錄在 notes。
> 5. **ledger 記錄 rls_tables** — 已閉環，且比純文檔更強：`scripts/check-database-migrations-contract.mjs:331-349` 會對每個 `rls_tables` 條目交叉驗證 SQL 中確有 `enable row level security` 與 `force row level security` 字面語句。unique partial index 不列入 ledger 的理由屬實——validator `:324` 只匹配字面 `create index if not exists`，`create unique index` 無法通過，兩條 unique partial index 仍保留為 SQL 顯式不變量（migration `:118-124`），屬正確殘留而非遺漏。
> 6. **sha256 綁定與 staging readback** — 已記錄於 notes（含兩表 forced SELECT policy 的 readback 證據）。驗證面限制：本 review 環境（含派生子代理）無 shell 執行能力，migration 檔的 `sha256:bc34…` 無法獨立重算，僅核對了檔案內容與 notes 敘述一致；整體 diff fingerprint `sha256:897098c4…` 已由 harness 比對通過。此為環境限制，非代碼缺陷。
>
> 其餘檢視點（audit policy 子查詢嵌套 profile 的 RLS 遞歸安全、`reset role` 清理、INSERT 無 policy 的 default-deny 同機制覆蓋）均無達到 P2 門檻的問題。production BYPASSRLS role provisioning 維持為顯式閘門項，正確排除在本次 staging 驗收之外。
>
> No findings beyond the documented production role-provisioning gate.

## Behavior Diff Notes

- Added durable `(workspace_id, account_id)` profile/audit authority, bounded
  FastClaw client, internal lifecycle route, DB lease/CAS reconciliation, and
  owner-scoped remote Agent idempotency.
- Disabled FastClaw app-users now fail closed for both header and OpenAI body
  identity switching. Deletion is explicit and idempotent.
- Review found and fixed three pre-gate defects: resumed FastClaw provisioning
  wrote model config through a fresh id instead of the persisted Agent id;
  response size checking buffered before enforcing the bound; request-id reuse
  could replay a different lifecycle intent. Remote ids now also have local
  uniqueness guards.

## Residual Risks / Follow-ups

- Credentialed staging acceptance is closed. Production still needs a durable
  FastClaw control service with persistent storage and a provisioned
  `FASTCLAW_CONTROL_SERVICE` binding; the temporary acceptance deployment was
  deliberately deleted.
- Final cross-model `claude-review` is bound to the current fingerprint and
  reports no findings beyond the documented production role-provisioning gate.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Unit, route, full-suite, real PostgreSQL, and live staging lifecycle pass; production cutover remains gated. |
| Product depth | 8/10 | Durable lifecycle/kill/delete authority is complete; public onboarding and billing source intentionally deferred. |
| Design quality | 9/10 | Existing ownership boundaries, fail-closed semantics, lease/idempotency crash recovery, no HTTP transaction. |
| Code quality | 9/10 | Typed contracts, bounded parsing, stable errors, targeted and integration regression coverage. |

## Failing Items

- None.

## Retest Steps

- Re-run: contract `commands_succeed` plus the credentialed PostgreSQL test
  command documented in implementation notes.
- Re-check: provision a durable FastClaw service/storage target and repeat the
  same staging lifecycle packet before any persistent feature enablement.

## Summary

- PASS for implementation and credentialed staging acceptance. Do not interpret
  this review as production runner cutover approval.
