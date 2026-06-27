#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/database/supabase-retirement.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const workerConfigPath = "apps/worker/wrangler.jsonc";
const envSchemaPath = "deploy/env/env.schema.json";
const secretStoresPath = "deploy/secrets/stores.contract.json";
const liveSecretSmokePath = "deploy/secrets/live-smoke-readiness.contract.json";
const providerSmokeScriptPath = "scripts/smoke-provider-secret-stores-live.mjs";
const providerSmokeCheckerPath = "scripts/check-provider-secret-stores-live-readiness.mjs";
const secretStoreCheckerPath = "scripts/check-secret-stores-contract.mjs";
const liveSmokeLedgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const liveSmokeCaptureTransitionPath = "deploy/governance/live-smoke-capture-transition-review.contract.json";
const documentationPath = "docs/governance/aiphabee-supabase-retirement.md";
const expectedActiveProviders = ["cloudflare_workers", "github_actions"];
const forbiddenActivePatterns = [
  { label: "@supabase", pattern: /@supabase\//u },
  { label: "SUPABASE_", pattern: /\bSUPABASE_[A-Z0-9_]*\b/u },
  { label: "auth.uid(", pattern: /\bauth\.uid\s*\(/iu }
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const workerConfig = readJson(workerConfigPath);
const envSchema = readJson(envSchemaPath);
const secretStores = readJson(secretStoresPath);
const liveSecretSmoke = readJson(liveSecretSmokePath);
const providerSmokeScript = readText(providerSmokeScriptPath);
const providerSmokeChecker = readText(providerSmokeCheckerPath);
const secretStoreChecker = readText(secretStoreCheckerPath);
const liveSmokeLedger = readJson(liveSmokeLedgerPath);
const captureTransition = readJson(liveSmokeCaptureTransitionPath);
const documentation = readText(documentationPath);
const errors = validate();

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_supabase_retirement_readiness"
    },
    1
  );
}

emit(
  {
    cold_backup_status: contract.cold_backup.status,
    delete_allowed: contract.delete_allowed,
    deletion_gates: contract.deletion_gates.length,
    removal_readback_status: contract.removal_readback?.status,
    status: "ok",
    supabase_project_status: contract.supabase_project.latest_readback_status
  },
  0
);

function validate() {
  const errors = [];

  if (contract.version !== "2026-06-27.aiphabee-supabase-retirement.v1") {
    errors.push("version must match Supabase retirement contract version");
  }

  if (contract.status !== "project_removed_without_cold_backup") {
    errors.push("status must be project_removed_without_cold_backup after Supabase API removal readback");
  }

  if (contract.delete_allowed !== false) {
    errors.push("delete_allowed must remain false in this packet");
  }

  if (contract.checker !== "scripts/check-supabase-retirement-readiness.mjs") {
    errors.push("checker must point to this script");
  }

  if (contract.documentation !== documentationPath) {
    errors.push(`documentation must be ${documentationPath}`);
  }

  errors.push(...validateRuntime());
  errors.push(...validateRemovalReadback());
  errors.push(...validateColdBackup());
  errors.push(...validateSecretStoreCleanup());
  errors.push(...validateConnectionAudit());
  errors.push(...validateDeletionGates());
  errors.push(...validateDocumentation());

  return errors;
}

function validateRemovalReadback() {
  const errors = [];

  if (contract.supabase_project.latest_readback_status !== "REMOVED_BY_SUPABASE_API_READBACK") {
    errors.push("supabase_project.latest_readback_status must reflect the Supabase API removal readback");
  }

  if (!isRecord(contract.removal_readback)) {
    return ["removal_readback must be an object"];
  }

  if (contract.removal_readback.status !== "removed_or_inaccessible") {
    errors.push("removal_readback.status must be removed_or_inaccessible");
  }

  if (contract.removal_readback.projects_list?.aiphabee_project_listed !== false) {
    errors.push("projects list readback must show the AiphaBee Supabase project is not listed");
  }

  if (contract.removal_readback.api_keys_readback?.safe_failure_reason !== "resource_removed") {
    errors.push("api keys readback must record resource_removed");
  }

  if (contract.removal_readback.dns_readback?.status !== "no_a_or_aaaa_records") {
    errors.push("DNS readback must show no A/AAAA records for the old Supabase DB host");
  }

  return errors;
}

function validateRuntime() {
  const errors = [];

  if (databaseContract.provider !== "planetscale_postgres") {
    errors.push("database contract provider must be planetscale_postgres");
  }

  if (databaseContract.connection_path !== "cloudflare_hyperdrive") {
    errors.push("database contract connection_path must be cloudflare_hyperdrive");
  }

  const productionHyperdrive = workerConfig.hyperdrive?.find(
    (binding) => binding.binding === contract.current_runtime.production_hyperdrive_binding
  );

  if (!productionHyperdrive) {
    errors.push("production worker must bind AIPHABEE_HYPERDRIVE");
  } else if (productionHyperdrive.id !== contract.current_runtime.production_hyperdrive_config_id) {
    errors.push("production AIPHABEE_HYPERDRIVE must point to the PlanetScale runtime config");
  }

  if (contract.current_runtime.provider !== databaseContract.provider) {
    errors.push("current_runtime.provider must match database contract provider");
  }

  if (contract.current_runtime.connection_path !== databaseContract.connection_path) {
    errors.push("current_runtime.connection_path must match database contract connection_path");
  }

  if (contract.current_runtime.planet_scale_direct_select_1_status !== "passed") {
    errors.push("PlanetScale direct SELECT 1 readback must be passed");
  }

  return errors;
}

function validateColdBackup() {
  const errors = [];

  if (!isRecord(contract.cold_backup)) {
    return ["cold_backup must be an object"];
  }

  if (contract.cold_backup.required_before_delete !== true) {
    errors.push("cold_backup.required_before_delete must be true");
  }

  if (contract.cold_backup.status !== "not_obtained_project_removed") {
    errors.push("cold_backup.status must be not_obtained_project_removed");
  }

  if (!String(contract.cold_backup.artifact_directory ?? "").startsWith("_ops/backups/")) {
    errors.push("cold_backup.artifact_directory must stay under ignored _ops/backups");
  }

  const attempts = contract.cold_backup.attempts ?? [];
  for (const required of [
    "pg_dump_pooler_from_superseded_private_env",
    "pg_dump_direct_from_superseded_private_env",
    "supabase_cli_db_dump_dry_run",
    "supabase_cli_db_dump_linked_with_password",
    "psql_private_url_select_1",
    "supabase_projects_api_keys"
  ]) {
    if (!attempts.some((attempt) => attempt.method === required)) {
      errors.push(`cold_backup.attempts must include ${required}`);
    }
  }

  if (contract.cold_backup.forbidden_evidence?.includes("database_password_or_connection_url_in_repo") !== true) {
    errors.push("cold_backup.forbidden_evidence must forbid credentials in repo");
  }

  return errors;
}

function validateSecretStoreCleanup() {
  const errors = [];
  const envNames = new Set(envSchema.variables?.map((variable) => variable.name));
  const secretNames = new Set(secretStores.secret_names ?? []);
  const providerNames = (secretStores.providers ?? []).map((provider) => provider.name);
  const liveProviderNames = (liveSecretSmoke.providers ?? []).map((provider) => provider.name);

  for (const removedName of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (envNames.has(removedName)) {
      errors.push(`env schema must not include ${removedName}`);
    }
    if (secretNames.has(removedName)) {
      errors.push(`secret stores contract must not include ${removedName}`);
    }
  }

  errors.push(...expectExactArray(providerNames, expectedActiveProviders, "secret store providers"));
  errors.push(...expectExactArray(liveProviderNames, expectedActiveProviders, "live secret smoke providers"));
  errors.push(...expectExactArray(contract.secret_store_cleanup.active_providers, expectedActiveProviders, "retirement active providers"));

  if (contract.secret_store_cleanup.retired_provider !== "supabase") {
    errors.push("secret_store_cleanup.retired_provider must be supabase");
  }

  for (const [path, text] of [
    [providerSmokeScriptPath, providerSmokeScript],
    [providerSmokeCheckerPath, providerSmokeChecker],
    [secretStoreCheckerPath, secretStoreChecker],
    [liveSmokeLedgerPath, JSON.stringify(liveSmokeLedger)],
    [liveSmokeCaptureTransitionPath, JSON.stringify(captureTransition)]
  ]) {
    if (/\bSUPABASE_PROJECT_REF\b/u.test(text) || /supabase_secret_set_rotate_delete/u.test(text)) {
      errors.push(`${path} must not require active Supabase secret-store smoke`);
    }
  }

  return errors;
}

function validateConnectionAudit() {
  const errors = [];
  const activeRefs = scanActiveRuntimeRefs(contract.connection_audit.active_runtime_scan_roots);

  if (activeRefs.length > 0) {
    errors.push(...activeRefs.map((ref) => `active runtime Supabase ref: ${ref}`));
  }

  if (contract.connection_audit.active_runtime_supabase_refs !== 0) {
    errors.push("connection_audit.active_runtime_supabase_refs must be 0");
  }

  return errors;
}

function validateDeletionGates() {
  const errors = [];
  const expected = new Map([
    ["production_runtime_moved_to_planetscale", "passed"],
    ["secret_store_contract_cleanup", "passed"],
    ["active_runtime_connection_audit", "passed"],
    ["cold_backup_manifest_present", "failed"],
    ["supabase_project_removed", "passed"],
    ["manual_supabase_project_delete", "externally_completed_or_removed"]
  ]);
  const observed = new Map((contract.deletion_gates ?? []).map((gate) => [gate.id, gate.status]));

  for (const [gate, status] of expected.entries()) {
    if (observed.get(gate) !== status) {
      errors.push(`deletion gate ${gate} must be ${status}`);
    }
  }

  for (const claim of [
    "cold_backup_complete",
    "restorable_supabase_backup_available",
    "supabase_credentials_rotated_or_revoked",
    "billing_stopped"
  ]) {
    if (!contract.not_claimed?.includes(claim)) {
      errors.push(`not_claimed must include ${claim}`);
    }
  }

  return errors;
}

function validateDocumentation() {
  const requiredText = [
    "delete_allowed=false",
    "project_removed_without_cold_backup",
    "Resource has been removed",
    "cold_backup_manifest_present`: failed",
    "pg_dump_pooler_from_superseded_private_env",
    "pg_dump_direct_from_superseded_private_env",
    "supabase_cli_db_dump_dry_run",
    "supabase_cli_db_dump_linked_with_password",
    "psql_private_url_select_1"
  ];

  return requiredText
    .filter((text) => !documentation.includes(text))
    .map((text) => `documentation must mention ${text}`);
}

function scanActiveRuntimeRefs(roots) {
  const refs = [];

  for (const rootPath of roots ?? []) {
    scanDirectory(resolve(root, rootPath), refs);
  }

  return refs;
}

function scanDirectory(directory, refs) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, refs);
      continue;
    }

    if (!entry.isFile() || !/\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc)$/u.test(entry.name)) {
      continue;
    }

    const text = readFileSync(fullPath, "utf8");
    for (const { label, pattern } of forbiddenActivePatterns) {
      if (pattern.test(text)) {
        refs.push(`${relativePath(fullPath)} contains ${label}`);
      }
    }
  }
}

function expectExactArray(value, expected, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const observed = [...value].sort();
  const sortedExpected = [...expected].sort();
  return observed.join("\n") === sortedExpected.join("\n")
    ? []
    : [`${label} must be exactly ${sortedExpected.join(", ")}`];
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function relativePath(path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
