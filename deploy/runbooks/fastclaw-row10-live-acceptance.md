# FastClaw Row 10 live acceptance runbook

## Boundary

- FastClaw is the persistent VPS service.
- Cloudflare hosts only Worker orchestration, R2, ephemeral Sandbox and the
  independent scanner container.
- The target database is the shared staging PostgreSQL with the dedicated
  AiphaBee/FastClaw role and schema.
- Production/public routes, paid-plan auto-routing and product feature
  enablement remain off throughout this procedure.

## Private inputs

Keep the account-scoped Cloudflare token only in the ignored, mode-0600 file:

```text
_ops/env/aiphabee-fastclaw-row10-provider.private.env
```

The file exports `FASTCLAW_ROW10_PROVIDER_API_TOKEN` with Account Analytics
Read, Workers Observability Edit and Billing Read. Never print or commit its
value. All run identifiers in the promoted packet are hashes.

## Preflight

```bash
npm run check:database
npm run check:env
npm run check:fastclaw-live-release-evidence
npx wrangler deploy --dry-run --containers-rollout=none --config apps/sandbox-bridge/wrangler.jsonc
```

Read back the VPS through the private bearer ingress: authenticated
`/api/status` must return 200 and unauthenticated ingress must return 404.

## Migrate and deploy staging dependencies

```bash
node scripts/apply-fastclaw-row10-staging-migrations.mjs --apply
node scripts/deploy-fastclaw-vps-staging.mjs --apply --resume --rebuild
```

Deploy the private staging Worker/Bridge composition only after the preflight
passes. Do not add a public Worker route or a Cloudflare-hosted FastClaw
Container.

## Capture

Load the ignored provider env in the operator shell without echoing it, then run
the live evidence runner using its documented capture command. The candidate is
valid only when it proves exactly ten distinct workspace/account/Sandbox hashes,
maximum concurrent Sandboxes 10, all cross-tenant probes rejected, one
kill-switch path, nine clean handoffs, ten terminal destroys and complete
Worker/DO/Container/logs/Billing reads.

Promote only the redacted packet at:

```text
_ops/fastclaw-row10/live-release-evidence.json
```

Verify the packet and its exact file-byte fingerprint:

```bash
node scripts/run-fastclaw-live-release-evidence.ts --check-packet _ops/fastclaw-row10/live-release-evidence.json
shasum -a 256 _ops/fastclaw-row10/live-release-evidence.json
```

## Cleanup and release decision

```bash
node scripts/cleanup-fastclaw-row10-live-acceptance.mjs
```

Cleanup must independently read back zero residual database rows, no R2
objects, and terminal/not-running Sandbox instances. Any missing metric,
non-zero residual, failed scan, identity mismatch or reviewer rejection keeps
Row 10 blocked. Manual override is forbidden.

After fresh independent security and compliance reviews pass, Row 10 may be
marked complete with `release_allowed=true` while `feature_enabled=false`.
This closes staging evidence only; it does not authorize production dispatch.
