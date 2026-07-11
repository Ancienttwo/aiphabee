#!/usr/bin/env node
import { readFileSync } from "node:fs";

const contract = JSON.parse(
  readFileSync("deploy/fastclaw/durable-memory-artifact-handoff.contract.json", "utf8")
);
const capabilities = JSON.parse(readFileSync(".ai/context/capabilities.json", "utf8"));
const packageJson = JSON.parse(readFileSync("packages/agent-runtime/package.json", "utf8"));
const runtimeSource = readFileSync(
  "packages/agent-runtime/src/durable-memory-artifact-handoff.ts",
  "utf8"
);
const workerSource = readFileSync(
  "apps/worker/src/durable-memory-artifact-handoff.ts",
  "utf8"
);
const migration = readFileSync(
  "deploy/database/migrations/20260711140000_durable_memory_artifact_handoff.sql",
  "utf8"
);
const errors = [];

if (
  contract.version !== "2026-07-11.durable-memory-artifact-handoff.v0" ||
  contract.approval?.authority !== "aiphabee" ||
  contract.approval?.sandbox_can_approve !== false ||
  contract.approval?.approval_before_sandbox_read !== true ||
  contract.approval?.exact_decision_per_candidate !== true
) {
  errors.push("approval must remain exact, AiphaBee-owned and precede every sandbox read");
}
if (
  contract.limits?.max_candidates !== 16 ||
  contract.limits?.memory_max_bytes !== 65536 ||
  contract.limits?.artifact_max_bytes !== 10485760 ||
  !runtimeSource.includes("DURABLE_HANDOFF_MEMORY_MAX_BYTES = 64 * 1024") ||
  !runtimeSource.includes("DURABLE_HANDOFF_ARTIFACT_MAX_BYTES = 10 * 1024 * 1024")
) {
  errors.push("bounded candidate and byte limits drifted");
}
if (
  contract.scan?.authoritative_scanner_required !== true ||
  contract.scan?.local_heuristic_is_authority !== false ||
  contract.scan?.accepted_status !== "clean" ||
  contract.scan?.classification_must_match !== true
) {
  errors.push("only an authoritative exact-classification clean scan may persist");
}
const requiredFields = [
  "tenant_id",
  "owner_user_id",
  "run_id",
  "lease_id",
  "kind",
  "content_hash_sha256",
  "classification",
  "byte_size",
  "retention_policy",
  "expires_at",
  "approval",
  "scan",
  "provenance",
  "evidence",
  "storage_key"
];
if (
  JSON.stringify(contract.record_fields) !== JSON.stringify(requiredFields) ||
  contract.storage?.bytes !== "AIPHABEE_ARTIFACTS_R2" ||
  contract.storage?.metadata !== "aiphabee_core.durable_agent_handoff" ||
  contract.storage?.object_key_is_authorization !== false ||
  contract.storage?.metadata_insert_failure_compensates_object !== true ||
  contract.storage?.tenant_scoped_metadata_read_before_object !== true
) {
  errors.push("durable record or tenant-owned storage contract drifted");
}
if (
  packageJson.exports?.["./durable-memory-artifact-handoff"] === undefined ||
  !runtimeSource.includes("await input.handoff.metadata_store.insert(record)") ||
  !runtimeSource.includes("await input.handoff.object_store.delete(key)") ||
  !runtimeSource.includes("const cleanup = await cleanupSandbox(input.backend, input.lease)") ||
  !runtimeSource.includes("findActiveById") ||
  !workerSource.includes("where workspace_id = $1") ||
  !workerSource.includes("new R2DurableHandoffObjectStore")
) {
  errors.push("implementation no longer proves compensation, cleanup or tenant-first reads");
}
if (
  !migration.includes("create table if not exists aiphabee_core.durable_agent_handoff") ||
  !migration.includes("force row level security") ||
  !migration.includes("durable_agent_handoff_owner_scope") ||
  !migration.includes("content_hash_sha256 ~ '^sha256:[0-9a-f]{64}$'") ||
  !migration.includes("scan ->> 'status' = 'clean'")
) {
  errors.push("PostgreSQL metadata constraints or RLS are incomplete");
}
if (
  contract.cleanup?.destroy_attempted_on_every_path !== true ||
  contract.cleanup?.destroy_is_idempotent !== true ||
  contract.cleanup?.destroy_failure_release_safe !== false ||
  contract.cleanup?.fixture_residual_files_after_destroy !== 0
) {
  errors.push("sandbox cleanup must remain mandatory, idempotent and fail closed");
}
if (
  contract.release?.public_route_added !== false ||
  contract.release?.live_scanner_wired !== false ||
  contract.release?.database_migration_applied_live !== false ||
  contract.release?.cloudflare_deployed !== false ||
  contract.release?.credentialed_live_acceptance !== false ||
  contract.release?.live_acceptance_owned_by_sprint_row !== 10
) {
  errors.push("Row 8 must not claim public, deployed or credentialed live acceptance");
}
const capability = capabilities.capabilities?.find(
  (entry) => entry.id === "fastclaw_personal_runner"
);
if (
  capability?.invariants?.durable_handoff_contract_implemented !== true ||
  capability?.invariants?.durable_handoff_worker_stores_implemented !== true ||
  capability?.invariants?.durable_handoff_live_scanner_wired !== false ||
  capability?.invariants?.runtime_dispatch_implemented !== false
) {
  errors.push("capability truth must distinguish deterministic durable handoff from live dispatch");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_contract" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      approval_before_read: true,
      durable_storage: "r2+postgresql",
      live_scanner: false,
      status: "ok",
      tenant_scoped_read: true
    },
    null,
    2
  )
);
