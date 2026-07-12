# Task Review: live-security-load-cost-release-evidence

> **Status**: Passed
> **Plan**: plans/plan-20260711-1552-live-security-load-cost-release-evidence.md
> **Contract**: tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md
> **Notes File**: tasks/notes/20260711-1552-live-security-load-cost-release-evidence.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-12 15:30
> **Recommendation**: pass
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:684bdfa12d506cabed833e07d1f94bec2b11b492f75d500be699910f7740fb8c
> **Reviewed Scope**: AiphaBee branch plus linked FastClaw commit `efc65f947fa8a4a3b1be67d9c61b83fd4552248b`

## Human Review Card

- Verdict: pass
- Row 10 has provider-linked live evidence and fresh independent security/compliance acceptance.
- Change type: code-change | migration | delegated-run
- Commands passed: FastClaw Go test/vet; focused and full AiphaBee Vitest; lint/typecheck; DB/env contracts; Bridge dry-run; packet schema/readback; VPS and Cloudflare live acceptance.
- External acceptance: passed; Anthropic Claude Code 2.1.205 independently reviewed the final FastClaw broker entrypoint wiring and final evidence packet gate.
- Residual risks: three accepted P2 transport advisories remain below. Production/public dispatch is disabled and was out of scope.
- Rollback: revert the AiphaBee Row-10 commit and linked FastClaw commits; keep production disabled; use the operator cleanup command and read back zero residual state.

## P1 / P2 / P3

- P1 map: AiphaBee owns run, policy, callback and terminal state; FastClaw is an always-on VPS reasoning service; Cloudflare owns only ephemeral Sandbox, Bridge and scanner; shared staging PostgreSQL stores private staging state.
- P2 trace: AiphaBee creates a dedicated run, calls the VPS broker, receives a tool proposal, executes policy-approved work through Cloudflare Sandbox, posts the exact result under run authorization plus dedicated-user identity, receives the final stream, scans/hands off approved artifacts, records provider usage and destroys the Sandbox.
- P3 decision: Row 10 closes the staging release-evidence gate while `feature_enabled=false`, `runtime_dispatch_implemented=false`, paid-plan auto-selection false and public routes absent. This preserves the production authority boundary instead of conflating evidence acceptance with product enablement.

## Verification Evidence

- Live packet: ignored `_ops/fastclaw-row10/live-release-evidence.json`.
- Exact file-byte fingerprint: `sha256:feeb1da01341f58bb1ba5a68fa41320d59be5ebf9e8826c305bd84a0c1215077`.
- Live result: 10 distinct tenants/users/workspaces/Sandboxes, maximum concurrency 10, all cross-tenant probes rejected, nine clean handoffs, one kill-switch path, all ten destroyed, `residual_rows=0`.
- Provider result: Worker, Durable Object, Container, logs and Billing reads complete. Billing returned 420 account-period records.
- Cost result: complete raw list cost `$0.029066052431813046`, average `$0.0029066052431813046/run`, P95 `$0.0043181852642341706/run`; account-period contracted cost `$3.8600075` remains unallocated.
- FastClaw result: full `go test ./...`, `go vet ./...`, Docker build/deploy, authenticated VPS status and unauthenticated 404 readback passed at linked commit `efc65f947fa8a4a3b1be67d9c61b83fd4552248b`.

## External Acceptance Advice

> **External Acceptance**: pass
> **External Reviewer**: Claude
> **External Source**: claude-review
> **External Version**: Anthropic Claude Code 2.1.205; final focused FastClaw security and packet compliance reviews
> **External Completed**: 2026-07-12
> **Manual Override**: forbidden and not used
> **Reviewed Diff Fingerprint**: sha256:684bdfa12d506cabed833e07d1f94bec2b11b492f75d500be699910f7740fb8c
> **Reviewed Scope**: branch+staged+unstaged+untracked

- P1 blockers: none
- P2 advisories: three accepted transport hardening items recorded below; none blocks the staging evidence gate.

Final FastClaw security review, verbatim:

> VERDICT: PASS
>
> P1: `/v1/chat/completions` 与 `/v1/chat/completions/{run_id}/tool-results/{call_id}` 均经 `s.authMiddleware(rateLimitMiddleware(...))` 注册（api.go RegisterRoutes），未绕过既有身份验证链；AiphaBee 专属分支只在 `aiphaBeeExternalToolContractHeader` 非空或 sandbox authorization 非空时才生效，两个 gate 函数（`requireAiphaBeeExternalContract`、`requireAiphaBeeDedicatedUser`）均以 header/context 是否存在为前置条件。
>
> P2: 普通聊天请求（无 `X-AiphaBee-*` header、无 sandbox authorization）走到 `requireAiphaBeeExternalContract` 时 `contract==""` 且 `authorization==""`，命中首个分支直接 `return nil`，不产生任何额外校验或副作用；随后 `r.Header.Get(aiphaBeeExternalToolContractHeader) == aiphaBeeExternalToolContractVersion` 为 false，`requireAiphaBeeDedicatedUser` 被跳过；`req.User` 身份切换与 `userSpaceFor` 走原有路径，未见 AiphaBee 逻辑侵入 ordinary chat 主干。
>
> EVIDENCE: `requireAiphaBeeExternalContract`（短路空值分支）、`HandleChatCompletions` 中两处以 `aiphaBeeExternalToolContractHeader` 值作为唯一触发条件的 if 块、`RegisterRoutes` 中两条路由均套 `authMiddleware`。未见证据显示 header 缺省时会进入 `handleAiphaBeeExternalRun` 或改变响应路径。

Final release-evidence compliance review, verbatim:

> VERDICT: PASS
>
> P1: build's readback validation calls `fail({ status: "invalid_live_release_packet" })` directly when `packet.acceptance.runs.length !== 10`, workspace/account/sandbox hash uniqueness fails, `cleanup.status !== "cleanup_confirmed"`, `cleanup.residual_rows !== 0`, or `release_gate.feature_enabled !== false` — this is a hard fail-closed exit gated on application/cleanup fields, not a soft warning.
>
> P2: `writePacket` computes `hash(content)` on the exact same `content` string (`JSON.stringify(packet, null, 2) + "\n"`) that is passed to `writeFile`, so the returned hash covers exactly the written bytes; Worker cost uses only named constants `pricing.worker_request` and `pricing.worker_cpu_ms` (no inline magic numbers), matching the same pattern as `container_cpu_per_second`, `durable_object_gb_second`, etc.
>
> EVIDENCE: packet hash `sha256:feeb1da01341f58bb1ba5a68fa41320d59be5ebf9e8826c305bd84a0c1215077` in `measured_live_cost.packet_hash` and in the committed research prose matches transcript `reported_sha256` and `shasum_actual_file_bytes` (both identical 64-hex-char strings); transcript confirms `runs=10 max_concurrency=10 distinct 10/10/10 cross_tenant_rejected=10 destroyed=10 residual_rows=0` matching the buildPacket blocker conditions (`blockers=[]`, `status=passed`), and provider worker/log/DO/container/billing all `true` matching the `complete`/`read_proven` flags referenced in `buildPacket`.

Final fingerprint acceptance key lines, verbatim:

> VERDICT: PASS
>
> P1 blockers: none
>
> FINGERPRINT: sha256:684bdfa12d506cabed833e07d1f94bec2b11b492f75d500be699910f7740fb8c

The reviewer independently ran the repository fingerprint hook and read the
authority contract, capability, checker, runbook, Sprint and review. It found
the closeout consistent and recorded only the non-blocking fingerprint-history
advisory described under Accepted P2 Advisories.

Post-commit acceptance key lines, verbatim:

> VERDICT: PASS
>
> P1 blockers: none
>
> FINGERPRINT: sha256:684bdfa12d506cabed833e07d1f94bec2b11b492f75d500be699910f7740fb8c

## Accepted P2 Advisories

- Caddy's bearer-header matcher does not document a constant-time comparison. The public token is high-entropy and route/method scoped; moving authentication into an app-layer constant-time verifier is a separate hardening slice.
- `admin_api_key` validation only requires non-empty input while sibling secrets enforce 32 bytes. The deployed secret is strong, but constructor validation should be aligned in a later hardening slice.
- The Caddy-to-FastClaw hop is plaintext on a trusted Docker network. TLS terminates at Caddy; the external network membership must remain restricted to trusted containers.

These are P2 hardening items, not Row-10 correctness or isolation blockers. The independent transport review returned `Security verdict: PASS`, `Compliance verdict: PASS`, `Overall verdict: PASS`.

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 10/10 | Ten-way live path, kill, scan, handoff, provider usage and cleanup pass. |
| Product depth | 9/10 | Cost and invoice boundaries are explicit; production enablement remains deliberately separate. |
| Design quality | 9/10 | VPS FastClaw and Cloudflare Sandbox ownership is explicit and fail-closed. |
| Code quality | 9/10 | Full regression plus independent focused review pass. |

## Summary

Row 10 passes without manual override. The Sprint may close while production and public FastClaw routes remain disabled.
