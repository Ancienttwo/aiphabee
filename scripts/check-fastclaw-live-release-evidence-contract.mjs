import { readFile } from "node:fs/promises";

const contractPath = "deploy/fastclaw/live-security-load-cost-release-evidence.contract.json";
const transportPath = "apps/worker/src/fastclaw-service-transport.ts";
const compositionPath = "apps/worker/src/fastclaw-live-composition.ts";
const sprintPath = "plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md";
const capabilitiesPath = ".ai/context/capabilities.json";
const runnerPath = "scripts/run-fastclaw-live-release-evidence.ts";

const [contractText, transport, composition, sprint, capabilitiesText, runner] = await Promise.all([
  readFile(contractPath, "utf8"),
  readFile(transportPath, "utf8"),
  readFile(compositionPath, "utf8"),
  readFile(sprintPath, "utf8"),
  readFile(capabilitiesPath, "utf8"),
  readFile(runnerPath, "utf8")
]);
const contract = JSON.parse(contractText);
const capability = JSON.parse(capabilitiesText).capabilities.find(
  (item) => item.id === "fastclaw_personal_runner"
);
const errors = [];

const requiredFields = [
  "cold_start_ms",
  "first_progress_ms",
  "duration_ms",
  "container_cpu_seconds",
  "container_memory_gib_seconds",
  "container_disk_gb_seconds",
  "container_egress_bytes",
  "worker_requests",
  "worker_cpu_ms",
  "durable_object_requests",
  "durable_object_gb_seconds",
  "log_events_written",
  "r2_class_a_operations",
  "r2_class_b_operations",
  "r2_storage_byte_seconds",
  "raw_list_cost_usd",
  "allocated_invoice_cost_usd",
  "terminal_state",
  "destroy_confirmed",
  "kill_switch_confirmed"
];

if (
  contract.version !== "2026-07-11.fastclaw-live-release-evidence.v0" ||
  contract.provider !== "cloudflare" ||
  contract.environment !== "staging"
) {
  errors.push("provider/version/environment contract drifted");
}

if (
  capability?.status !== "live_release_evidenced_production_disabled" ||
  capability?.invariants?.callback_transport_implemented !== true ||
  capability?.invariants?.callback_transport_deployed_live !== true ||
  capability?.invariants?.fastclaw_external_broker_linked_commit !== true ||
  capability?.invariants?.fastclaw_callback_commit !== contract.transport?.linked_fastclaw_commit ||
  capability?.invariants?.runtime_dispatch_implemented !== false ||
  capability?.invariants?.live_kill_dispatch_wired !== true ||
  capability?.invariants?.actual_cloudflare_bill_read !== true ||
  capability?.invariants?.ten_tenant_live_acceptance_passed !== true ||
  capability?.invariants?.row10_external_acceptance_passed !== true ||
  capability?.invariants?.sandbox_terminal_record_sink_wired !== true
) {
  errors.push("capability truth must show evidenced staging release with production dispatch disabled");
}

if (
  contract.transport?.contract_version !== "2026-07-11.aiphabee-tool-callback.v1" ||
  contract.transport?.tool_interception !== "callback_before_execution" ||
  contract.transport?.aiphabee_service_transport_implemented !== true ||
  contract.transport?.fastclaw_external_broker_implemented !== true ||
  contract.transport?.opaque_sse_allowed !== false ||
  contract.transport?.local_fastclaw_tool_fallback_allowed !== false
) {
  errors.push("callback-before-execution transport contract drifted");
}

if (
  !transport.includes('tool_interception = "callback_before_execution"') ||
  !transport.includes("X-AiphaBee-FastClaw-User-Id") ||
  !transport.includes("FASTCLAW_CALLBACK_RUN_MISMATCH") ||
  !composition.includes("createFastClawPersonalAgentRunner") ||
  !composition.includes("ServiceBindingFastClawCompliantTransport")
) {
  errors.push("AiphaBee private live composition no longer proves exact callback identity");
}

if (
  contract.acceptance?.required_concurrent_runs !== 10 ||
  contract.acceptance?.distinct_tenants_required !== true ||
  contract.acceptance?.distinct_users_required !== true ||
  contract.acceptance?.distinct_sandboxes_required !== true ||
  contract.acceptance?.cross_tenant_negative_probes_required !== true ||
  contract.acceptance?.kill_switch_readback_required !== true ||
  contract.acceptance?.terminal_destroy_readback_required !== true ||
  contract.acceptance?.zero_residual_instances_required !== true ||
  contract.acceptance?.manual_override_allowed !== false ||
  JSON.stringify(contract.acceptance?.required_per_run_fields) !== JSON.stringify(requiredFields)
) {
  errors.push("ten-way live security/load acceptance contract drifted");
}

const price = contract.pricing ?? {};
if (
  price.currency !== "USD" ||
  price.container_memory_gib_second !== 0.0000025 ||
  price.container_vcpu_second !== 0.00002 ||
  price.container_disk_gb_second !== 0.00000007 ||
  price.raw_list_cost_is_actual_bill !== false ||
  typeof price.actual_bill !== "boolean" ||
  !Array.isArray(price.sources) ||
  price.sources.length !== 5
) {
  errors.push("official Cloudflare price or actual-bill boundary drifted");
}

if (
  !runner.includes("/${accountId}/paygo-usage`") ||
  runner.includes("/billable/usage?from=") ||
  !runner.includes('endpoint_version: "paygo_usage_v1_alpha"') ||
  !runner.includes('blockers.push("cleanup_readback_incomplete")') ||
  !runner.includes('blockers.push("application_acceptance_incomplete")') ||
  !runner.includes("return hash(content)") ||
  runner.includes("hash(JSON.stringify(packet))") ||
  !runner.includes("workerRequests * pricing.worker_request") ||
  !runner.includes("workerCpuMs * pricing.worker_cpu_ms")
) {
  errors.push("provider billing and live cleanup release blockers must remain fail closed");
}

const liveReady =
  contract.transport?.linked_fastclaw_commit !== null &&
  contract.transport?.deployed_live === true &&
  Object.entries(contract.current_live_readback ?? {}).every(([name, value]) =>
    name === "observed_at" ? typeof value === "string" && value.length > 0 : value === true
  ) &&
  contract.acceptance?.live_packet_present === true &&
  contract.acceptance?.independent_security_review === true &&
  contract.acceptance?.independent_compliance_review === true &&
  price.actual_bill === true;

if (liveReady) {
  if (
    contract.release_gate?.feature_enabled !== false ||
    contract.release_gate?.release_allowed !== true ||
    contract.release_gate?.row_complete !== true ||
    contract.release_gate?.blockers?.length !== 0
  ) {
    errors.push("fully evidenced Row 10 must permit release with zero blockers while production stays disabled");
  }
} else if (
  contract.release_gate?.feature_enabled !== false ||
  contract.release_gate?.release_allowed !== false ||
  contract.release_gate?.row_complete !== false ||
  !Array.isArray(contract.release_gate?.blockers) ||
  contract.release_gate.blockers.length === 0
) {
  errors.push("incomplete live evidence must keep feature and Row 10 blocked");
}

if (!sprint.includes("| 10 | [x] | live-security-load-cost-release-evidence")) {
  errors.push("Sprint Row 10 must be checked after the live packet and reviews pass");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "failed" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      actual_bill: price.actual_bill,
      blockers: contract.release_gate.blockers,
      callback_transport_implemented: true,
      feature_enabled: contract.release_gate.feature_enabled,
      status: liveReady ? "release_ready" : "blocked"
    },
    null,
    2
  )
);
