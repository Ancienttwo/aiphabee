#!/bin/sh
set -eu

: "${FASTCLAW_BOOTSTRAP_ADMIN_PASSWORD:?FASTCLAW_BOOTSTRAP_ADMIN_PASSWORD is required}"
: "${FASTCLAW_BOOTSTRAP_MODEL:?FASTCLAW_BOOTSTRAP_MODEL is required}"
: "${FASTCLAW_BOOTSTRAP_PROVIDER_BASE_URL:?FASTCLAW_BOOTSTRAP_PROVIDER_BASE_URL is required}"
: "${FASTCLAW_CONTROL_API_KEY:?FASTCLAW_CONTROL_API_KEY is required}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY is required}"

fastclaw agents init "AiphaBee Template" \
	--id agt_1180f3adbf5bbf6608 \
	--ensure \
	--username aiphabee-admin \
	--email fastclaw-control@aiphabee.internal \
	--password "${FASTCLAW_BOOTSTRAP_ADMIN_PASSWORD}" \
	--display-name "AiphaBee Control" \
	--description "Template Agent for dedicated AiphaBee research Agents" \
	--provider openai \
	--model "${FASTCLAW_BOOTSTRAP_MODEL}" \
	--api-key-env OPENAI_API_KEY \
	--no-start

fastclaw agents config "AiphaBee Template" set \
	provider.openai.apiBase "${FASTCLAW_BOOTSTRAP_PROVIDER_BASE_URL}"

fastclaw apikey ensure \
	--name aiphabee-control \
	--token-env FASTCLAW_CONTROL_API_KEY

fastclaw workspace-smoke

unset FASTCLAW_BOOTSTRAP_ADMIN_PASSWORD
unset FASTCLAW_CONTROL_API_KEY
unset OPENAI_API_KEY
exec fastclaw gateway
