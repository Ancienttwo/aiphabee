# FastClaw + Cloudflare Sandbox smoke runbook

> **Scope**: staging/operator acceptance only
> **Production runner**: remains disabled
> **Sandbox**: Cloudflare `standard-1`, max 10 instances, public internet disabled

## Preconditions

- Cloudflare Workers Paid account with Containers/Sandbox enabled.
- Cloudflare API credentials accepted by Wrangler.
- Docker daemon running for the container image build.
- FastClaw branch `codex/aiphabee-cloudflare-sandbox`, based on
  `dev@c4c4194e58ba2343d93e938a735e699e68d0d2fa`.
- A fresh FastClaw SQLite home/database, one admin API key, and one template
  Agent whose OpenAI-compatible provider points at the deterministic local
  model server below.
- One shared random HMAC secret of at least 32 bytes. Store it only as the
  Worker secret `SANDBOX_RUN_HMAC_KEY` and the operator process environment.

Current machine readback on 2026-07-10: Docker is not running and the required
live FastClaw/Cloudflare credentials are absent, so live deployment is not
claimed by this contract.

## 1. Deploy the staging Bridge

```sh
cd /Users/ancienttwo/Projects/AiphaBee-wt-fastclaw-dedicated-agent-cloudflare-sandbox-smoke
docker info
export SANDBOX_RUN_HMAC_KEY="$(openssl rand -hex 32)"
printf '%s' "$SANDBOX_RUN_HMAC_KEY" | npx wrangler secret put SANDBOX_RUN_HMAC_KEY \
  --cwd apps/sandbox-bridge
npm --workspace @aiphabee/sandbox-bridge run deploy:staging
curl -fsS https://<bridge-worker>/health
```

Expected health body: `{"ok":true,"service":"aiphabee-sandbox-bridge"}`.
Do not deploy without the secret. The Bridge accepts only run-scoped HMAC
bearer tokens; there is no unauthenticated production mode.

## 2. Start the deterministic model and FastClaw

```sh
npm run serve:fastclaw-smoke-model
```

The server binds only to `127.0.0.1:18081` and reports base URL
`http://127.0.0.1:18081/v1`. Configure a FastClaw OpenAI-compatible provider
with that base URL and any non-empty test API key, then assign the provider/model
to the template Agent. No real LLM credential is needed.

Start the FastClaw branch with a fresh temporary home/database and the Bridge:

```sh
export FASTCLAW_HOME="$(mktemp -d)"
export FASTCLAW_SANDBOX_ENABLED=true
export FASTCLAW_SANDBOX_BACKEND=cloudflare
export FASTCLAW_SANDBOX_CLOUDFLARE_URL=https://<bridge-worker>
cd /Users/ancienttwo/Projects/fastclaw-wt-aiphabee-cloudflare-sandbox
go run ./cmd/fastclaw gateway
```

Use FastClaw's admin UI/API to create the admin key and template Agent in this
temporary database. The smoke runner calls `POST /v1/users`, then
`POST /api/users/{id}/agents` with `forkFrom`, so every run gets a dedicated
Agent identity in the disposable database.

The smoke runner caps active work at 540 seconds and issues a token valid for
at most 600 seconds, reserving 60 seconds for evidence readback and cleanup.
FastClaw drops its local executor/token reference when the turn ends; AiphaBee
is the single provider-cleanup owner and performs Bridge destroy/readback.

## 3. Run one sandbox, then concurrency 10

```sh
export FASTCLAW_BASE_URL=http://127.0.0.1:18953
export FASTCLAW_ADMIN_API_KEY=<temporary-admin-api-key>
export FASTCLAW_TEMPLATE_AGENT_ID=<template-agent-id>
export AIPHABEE_SANDBOX_BRIDGE_URL=https://<bridge-worker>
# Keep the same SANDBOX_RUN_HMAC_KEY value exported from Bridge deploy.

AIPHABEE_SMOKE_CONCURRENCY=1 npm run smoke:fastclaw-cloudflare-sandbox
AIPHABEE_SMOKE_CONCURRENCY=10 npm run smoke:fastclaw-cloudflare-sandbox
```

Acceptance per run:

- event order is `run.requested -> run.started -> run.completed`;
- completed payload has a dedicated `agent_id`, expected artifact SHA-256,
  `sandbox_destroyed=true`, and `standard-1` cost estimate;
- pre-destroy Bridge readback contains a structured successful-exec receipt
  whose argv hash matches the exact command and whose stdout hash matches the
  exact `sha256sum` output; a direct Bridge file read also hashes to the
  expected artifact, so an LLM echo alone cannot pass;
- Bridge destroy returns 204 and `/running` returns
  `running=false, terminal=true` (the response may also retain the exec
  receipt);
- any destroy/readback failure emits `run.failed` with
  `leak_candidate=true` and is not a PASS.

The cost object is a raw list-price bound. It uses 4 GiB memory, 8 GB disk,
and 0–0.5 active vCPU for measured wall time; it does not apply monthly
included usage or include Workers, Durable Objects, logs, egress, FastClaw,
LLM, or tool-provider cost.

## 4. Rollback/readback

```sh
npx wrangler delete --cwd apps/sandbox-bridge
git -C /Users/ancienttwo/Projects/fastclaw-wt-aiphabee-cloudflare-sandbox \
  log --oneline c4c4194..HEAD
```

Stop FastClaw and remove the temporary `FASTCLAW_HOME`. No production DB
migration or persistent user-to-Agent mapping was created, so rollback is the
two additive branches plus the staging Worker only.
