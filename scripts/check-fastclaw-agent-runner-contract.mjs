#!/usr/bin/env node
import { readFileSync } from "node:fs";

const contract = JSON.parse(
  readFileSync("deploy/fastclaw/fastclaw-agent-runner.contract.json", "utf8")
);
const capabilities = JSON.parse(readFileSync(".ai/context/capabilities.json", "utf8"));
const packageJson = JSON.parse(readFileSync("packages/agent-runtime/package.json", "utf8"));
const runtimeSource = readFileSync("packages/agent-runtime/src/index.ts", "utf8");
const grantSource = readFileSync(
  "packages/agent-runtime/src/sandbox-access-grant.ts",
  "utf8"
);
const errors = [];

if (
  contract.runner?.family !== "fastclaw" ||
  contract.runner?.id !== "fastclaw.personal-v0" ||
  contract.runner?.mode !== "runner_remote" ||
  contract.runner?.registry_enabled !== true ||
  contract.runner?.selection_owner !== "agent_runtime"
) {
  errors.push("runner selection must remain Agent Runtime-owned and FastClaw-specific");
}
if (
  contract.activation?.grant_mint_package_exported !== false ||
  contract.activation?.grant_runtime_authenticity_checked !== true ||
  contract.activation?.grant_deep_frozen !== true ||
  contract.activation?.registry_flip_is_authorization !== false ||
  contract.activation?.dedicated_identity_live_read_required !== true ||
  contract.activation?.temporal_entitlement_live_read_required !== true
) {
  errors.push("activation must require authentic private authority and a frozen grant");
}
if (
  packageJson.exports?.["./sandbox-access-grant"] !== undefined ||
  packageJson.exports?.["./fastclaw-agent-runner"] === undefined ||
  !grantSource.includes("const authenticActivations = new WeakSet<object>()") ||
  !grantSource.includes("Object.freeze")
) {
  errors.push("grant mint must stay internal while the activated runner is package-addressable");
}
if (
  !runtimeSource.includes('export const AGENT_EXECUTABLE_RUN_MODES = ["dry_run", "runner_remote"]') ||
  !runtimeSource.includes(`{
    enabled: true,
    family: "fastclaw",
    runner_id: "fastclaw.personal-v0",
    supported_modes: ["runner_remote"]
  }`) ||
  !runtimeSource.includes('return blocked("blocked_runner_activation_required")') ||
  !runtimeSource.includes('input.activatedRunnerId !== registration.runner_id')
) {
  errors.push("runtime registry and executable mode truth are not aligned");
}
if (
  contract.transport?.required_contract_version !==
    "2026-07-11.aiphabee-tool-callback.v1" ||
  contract.transport?.tool_interception !== "callback_before_execution" ||
  contract.transport?.opaque_fastclaw_sse_compliant !== false ||
  contract.transport?.live_transport_wired !== false
) {
  errors.push("opaque FastClaw transport must stay non-compliant until callback readback exists");
}
for (const [key, expected] of Object.entries({
  monotonic_indexes: true,
  private_reasoning_public: false,
  protected_remote_ids_public: false,
  public_error_messages: false,
  raw_final_public: false,
  raw_progress_public: false,
  sandbox_authorization_public: false,
  tool_input_or_output_public: false,
  unique_terminal: true
})) {
  if (contract.events?.[key] !== expected) errors.push(`event contract drift: ${key}`);
}
if (
  contract.final_authority?.aiphabee_post_check_required !== true ||
  contract.final_authority?.failed_post_check_fallback_to_raw !== false ||
  contract.release?.public_route_added !== false ||
  contract.release?.production_enabled !== false ||
  contract.release?.credentialed_live_acceptance !== false ||
  contract.release?.live_acceptance_owned_by_sprint_row !== 10
) {
  errors.push("final/release posture must remain fail-closed and non-live");
}
const capability = capabilities.capabilities?.find(
  (entry) => entry.id === "fastclaw_personal_runner"
);
if (
  capability?.invariants?.runner_adapter_implemented !== true ||
  capability?.invariants?.private_sandbox_grant_mint_implemented !== true ||
  capability?.invariants?.callback_tool_policy_required !== true ||
  capability?.invariants?.opaque_sse_live_transport_compatible !== false ||
  capability?.invariants?.runtime_dispatch_implemented !== false
) {
  errors.push("capability truth must distinguish the adapter from live runtime dispatch");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_contract" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      adapter: true,
      live_transport: false,
      runner_id: contract.runner.id,
      status: "ok",
      tool_interception: contract.transport.tool_interception
    },
    null,
    2
  )
);
