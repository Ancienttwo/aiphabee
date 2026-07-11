#!/usr/bin/env node
import { readFileSync } from "node:fs";

const contract = JSON.parse(
  readFileSync("deploy/fastclaw/research-agent-product-control.contract.json", "utf8")
);
const capabilities = JSON.parse(readFileSync(".ai/context/capabilities.json", "utf8"));
const source = readFileSync("apps/worker/src/research-agent-product-control.ts", "utf8");
const migration = readFileSync(
  "deploy/database/migrations/20260711151100_research_agent_product_control.sql",
  "utf8"
);
const errors = [];

if (
  contract.version !== "2026-07-11.research-agent-product-control.v0" ||
  JSON.stringify(contract.status?.user_states) !==
    JSON.stringify(["provisioning", "ready", "retryable", "blocked", "disabled"]) ||
  contract.status?.temporal_entitlement_required !== true ||
  contract.status?.single_snapshot !== true ||
  contract.status?.selection_owner !== "agent_runtime" ||
  contract.status?.default_runner_family !== "edge" ||
  contract.status?.paid_plan_auto_selects_fastclaw !== false ||
  contract.status?.selected_runner_family !== null
) {
  errors.push("user status must preserve temporal entitlement without becoming routing authority");
}

const requiredDimensions = [
  "model_input_tokens",
  "model_output_tokens",
  "tool_calls_succeeded",
  "tool_calls_failed",
  "sandbox_wall_clock_ms",
  "sandbox_cpu_ms",
  "sandbox_peak_memory_bytes",
  "sandbox_peak_disk_bytes",
  "storage_bytes_written",
  "storage_bytes_read",
  "storage_write_ops",
  "storage_read_ops",
  "storage_delete_ops"
];
if (
  contract.usage?.measurement !== "observed" ||
  contract.usage?.estimated_usage_accepted !== false ||
  contract.usage?.terminal_state_required !== true ||
  JSON.stringify(contract.usage?.dimensions) !== JSON.stringify(requiredDimensions) ||
  contract.usage?.detail_table !== "aiphabee_core.research_agent_run_usage" ||
  contract.usage?.usage_event_linked !== true ||
  contract.usage?.usage_ledger_state !== "preview" ||
  contract.usage?.unpriced_preview_credit_delta !== 0 ||
  contract.usage?.billing_provider_calls !== false ||
  contract.usage?.exact_replay_required !== true ||
  contract.usage?.mismatched_replay_blocked !== true ||
  contract.usage?.methodology !== "fastclaw-cost-pending-live-row10-v0"
) {
  errors.push("observed per-run usage and preview billing trace contract drifted");
}

if (
  JSON.stringify(contract.admin?.allowed_roles) !== JSON.stringify(["owner", "admin"]) ||
  JSON.stringify(contract.admin?.actions) !==
    JSON.stringify(["retry", "disable", "delete", "kill"]) ||
  contract.admin?.current_temporal_membership_required !== true ||
  contract.admin?.request_idempotent !== true ||
  contract.admin?.started_before_side_effect !== true ||
  contract.admin?.lifecycle_authority_reused !== true ||
  contract.admin?.kill_authority_injected !== true ||
  contract.admin?.live_kill_dispatch_wired !== false ||
  contract.admin?.audit_table !== "aiphabee_audit.research_agent_admin_event" ||
  contract.admin?.raw_fastclaw_ids_recorded !== false ||
  contract.admin?.tokens_or_leases_recorded !== false ||
  contract.admin?.raw_errors_recorded !== false
) {
  errors.push("admin authority, idempotency, audit or non-leakage contract drifted");
}

if (
  !source.includes('selection_owner: "agent_runtime"') ||
  !source.includes('selected_runner_family: null') ||
  !source.includes('paid_plan_auto_selects_fastclaw: false') ||
  !source.includes('measurement !== "observed"') ||
  !source.includes("USAGE_REPLAY_MISMATCH") ||
  !source.includes("wm.role in ('owner', 'admin')") ||
  !source.includes("status = 'started'")
) {
  errors.push("implementation no longer proves no-auto-route, observed usage or admin replay boundaries");
}

if (
  !migration.includes("create table if not exists aiphabee_core.research_agent_run_usage") ||
  !migration.includes("create table if not exists aiphabee_audit.research_agent_admin_event") ||
  !migration.includes("measurement = 'observed'") ||
  !migration.includes("terminal_state text not null") ||
  !source.includes("'preview'") ||
  !migration.includes("force row level security") ||
  !migration.includes("research_agent_admin_event_admin_scope")
) {
  errors.push("database detail/audit/RLS contract is incomplete");
}

if (
  contract.release?.public_route_added !== false ||
  contract.release?.posted_billing_enabled !== false ||
  contract.release?.database_migration_applied_live !== false ||
  contract.release?.cloudflare_deployed !== false ||
  contract.release?.credentialed_live_acceptance !== false ||
  contract.release?.live_acceptance_owned_by_sprint_row !== 10
) {
  errors.push("Row 9 must remain private, preview-only and non-live");
}

const capability = capabilities.capabilities?.find(
  (entry) => entry.id === "fastclaw_personal_runner"
);
if (
  capability?.invariants?.product_control_implemented !== true ||
  capability?.invariants?.paid_plan_auto_selects_fastclaw !== false ||
  capability?.invariants?.observed_run_usage_attribution_implemented !== true ||
  capability?.invariants?.admin_control_contract_implemented !== true ||
  capability?.invariants?.live_kill_dispatch_wired !== false ||
  capability?.invariants?.runtime_dispatch_implemented !== false
) {
  errors.push("capability truth must distinguish product control from live dispatch");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_contract" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      admin_actions: contract.admin.actions,
      billing_state: "preview",
      live_kill_dispatch: false,
      status: "ok",
      user_states: contract.status.user_states
    },
    null,
    2
  )
);
