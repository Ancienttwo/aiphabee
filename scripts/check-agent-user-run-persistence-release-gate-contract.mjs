#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const contractPath = "deploy/agent/user-run-persistence-release-gate.contract.json";
const packagePath = "package.json";
const runtimePath = "packages/agent-runtime/src/index.ts";
const runtimeTestPath = "packages/agent-runtime/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const migrationPath =
  "supabase/migrations/20260622018000_agent_user_run_persistence_release_gate.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const expectedVersion = "2026-06-22.phase1.agent-user-run-persistence-release-gate.v0";
const expectedRoute = "POST /agent/release-gates/user-run-persistence/plan";
const expectedScript = "node scripts/check-agent-user-run-persistence-release-gate-contract.mjs";
const expectedChecks = [
  "agent_run_live_write_smoke_contract_linked",
  "agent_run_state_persistence_smoke_contract_linked",
  "agent_billing_posted_ledger_smoke_contract_linked",
  "hash_only_smoke_responses_enforced",
  "production_cutover_signoff_required",
  "production_retention_policy_required"
];
const expectedTables = [
  "core.agent_user_run_persistence_release_gate",
  "governance.agent_user_run_persistence_release_gate_contract"
];
const expectedSmokeRoutes = [
  "POST /agent/runs/live-write-smoke",
  "POST /agent/runs/state-persistence-smoke",
  "POST /agent/runs/billing-posted-ledger-smoke"
];
const expectedSmokeContracts = [
  "deploy/agent/run-live-write-smoke.contract.json",
  "deploy/agent/state-persistence-smoke.contract.json",
  "deploy/agent/billing-posted-ledger-smoke.contract.json"
];
const expectedSmokeChecks = [
  "npm run check:agent-run-live-write-smoke",
  "npm run check:agent-run-state-persistence-smoke",
  "npm run check:agent-billing-posted-ledger-smoke"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];
const errors = [];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const databaseContract = readJson(databaseContractPath);
const runtimeSource = readText(runtimePath);
const runtimeTestSource = readText(runtimeTestPath);
const workerSource = readText(workerPath);
const workerTestSource = readText(workerTestPath);
const migrationSource = readText(migrationPath);

validateContract(contract);
validatePackage(packageJson);
validateDatabaseContract(databaseContract);
validateRuntimeSource(runtimeSource);
validateWorkerSource(workerSource);
validateTestSource(runtimeTestSource, runtimeTestPath);
validateTestSource(workerTestSource, workerTestPath);
validateMigration(migrationSource);
validateNoSecrets(contractPath, JSON.stringify(contract));
validateNoSecrets(runtimePath, runtimeSource);
validateNoSecrets(workerPath, workerSource);
validateNoSecrets(migrationPath, migrationSource);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_contract"
    },
    1
  );
}

emit(
  {
    checks: expectedChecks.length,
    route: expectedRoute,
    status: "ok"
  },
  0
);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : error}`);
    return {};
  }
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    errors.push(`${path} must be readable: ${error instanceof Error ? error.message : error}`);
    return "";
  }
}

function validateContract(value) {
  expectEqual(value.version, expectedVersion, "contract.version");
  expectEqual(value.status, "local_contract", "contract.status");
  expectEqual(value.package, "@aiphabee/agent-runtime", "contract.package");
  expectEqual(value.runtime_route, "GET /agent/runtime", "contract.runtime_route");
  expectEqual(value.route, expectedRoute, "contract.route");
  expectEqual(value.worker_entrypoint, workerPath, "contract.worker_entrypoint");
  expectEqual(value.checker, expectedScript.replace(/^node /u, ""), "contract.checker");
  expectEqual(value.migration, migrationPath, "contract.migration");
  expectEqual(value.database_contract, databaseContractPath, "contract.database_contract");
  expectBoolean(value.standard_response_envelope, true, "standard_response_envelope");
  expectBoolean(value.actual_tool_execution, false, "actual_tool_execution");
  expectBoolean(value.frontend_rendering, false, "frontend_rendering");
  expectBoolean(value.persistent_writes, false, "persistent_writes");
  expectBoolean(value.live_db_writes, false, "live_db_writes");
  expectBoolean(value.live_tool_execution, false, "live_tool_execution");
  expectBoolean(value.model_calls, false, "model_calls");
  expectBoolean(value.sql_emitted, false, "sql_emitted");
  expectBoolean(
    value.production_persistence_enabled,
    false,
    "production_persistence_enabled"
  );
  expectBoolean(value.production_cutover_allowed, false, "production_cutover_allowed");
  expectBoolean(
    value.hash_only_smoke_responses_required,
    true,
    "hash_only_smoke_responses_required"
  );
  expectArrayEqual(value.required_checks, expectedChecks, "required_checks");
  expectArrayEqual(value.tables, expectedTables, "tables");
  expectArrayEqual(value.smoke_routes, expectedSmokeRoutes, "smoke_routes");
  expectArrayEqual(value.linked_smoke_contracts, expectedSmokeContracts, "linked_smoke_contracts");
  expectArrayEqual(value.linked_smoke_checks, expectedSmokeChecks, "linked_smoke_checks");
  expectReleaseGate(value.release_gate);

  for (const linkedPath of value.linked_smoke_contracts ?? []) {
    if (typeof linkedPath !== "string" || !existsSync(linkedPath)) {
      errors.push(`linked smoke contract must exist: ${linkedPath}`);
    }
  }

  for (const notClaimed of [
    "production_agent_run_persistence",
    "production_user_run_state_persistence",
    "production_billing_posting",
    "invoice_writes",
    "user_facing_live_model_streaming",
    "frontend_ask_rendering",
    "frontend_resume_rendering",
    "ai_gateway_logs_read"
  ]) {
    if (!value.not_claimed?.includes(notClaimed)) {
      errors.push(`contract.not_claimed must include ${notClaimed}`);
    }
  }
}

function validatePackage(value) {
  const scripts = value.scripts ?? {};
  expectEqual(
    scripts["check:agent-user-run-persistence-release-gate"],
    expectedScript,
    "package.json check:agent-user-run-persistence-release-gate"
  );

  const rootCheck = scripts.check ?? "";
  const gateIndex = rootCheck.indexOf("npm run check:agent-user-run-persistence-release-gate");
  const billingIndex = rootCheck.indexOf("npm run check:agent-billing-posted-ledger-smoke");
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (gateIndex === -1) {
    errors.push("root check must include check:agent-user-run-persistence-release-gate");
  }

  if (gateIndex !== -1 && billingIndex !== -1 && gateIndex < billingIndex) {
    errors.push("root check must run user-run persistence release gate after billing ledger smoke");
  }

  if (gateIndex !== -1 && observabilityIndex !== -1 && gateIndex > observabilityIndex) {
    errors.push("root check must run user-run persistence release gate before observability checks");
  }
}

function validateDatabaseContract(value) {
  const migration = (value.migrations ?? []).find((entry) => entry.file === migrationPath);

  if (!migration) {
    errors.push("database migrations contract must include user-run persistence release gate migration");
    return;
  }

  expectArrayEqual(migration.schemas, ["core", "governance"], "database migration schemas");
  expectArrayEqual(migration.tables, expectedTables, "database migration tables");
  expectBoolean(migration.market_data, false, "database migration market_data");
  expectEqual(
    migration.default_rights_status,
    "default_deny",
    "database migration default_rights_status"
  );
}

function validateRuntimeSource(source) {
  for (const needle of [
    "AGENT_USER_RUN_PERSISTENCE_RELEASE_GATE_VERSION",
    expectedVersion,
    "AGENT_USER_RUN_PERSISTENCE_RELEASE_GATE_CHECKS",
    "AGENT_USER_RUN_PERSISTENCE_RELEASE_GATE_TABLES",
    "AgentUserRunPersistenceReleaseGateCapabilities",
    "AgentUserRunPersistenceReleaseGatePlan",
    "createAgentUserRunPersistenceReleaseGatePlan",
    "getAgentUserRunPersistenceReleaseGateCapabilities",
    "agent_user_run_persistence_release_gate:",
    "production_cutover_allowed: false",
    "production_persistence_enabled: false",
    "POST /agent/runs/live-write-smoke",
    "POST /agent/runs/state-persistence-smoke",
    "POST /agent/runs/billing-posted-ledger-smoke",
    "hash_only_response: true",
    "gate_status: \"blocked_production_user_run_persistence\""
  ]) {
    expectIncludes(source, needle, runtimePath);
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    "createAgentUserRunPersistenceReleaseGatePlan",
    "getAgentUserRunPersistenceReleaseGateCapabilities",
    'app.post("/agent/release-gates/user-run-persistence/plan"',
    "production_cutover_requested",
    "retention_policy_approved",
    "operator_signoff",
    "agent-user-run-persistence-release-gate-plan",
    "rows: plan.release_checks.length"
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source, path) {
  for (const needle of [
    expectedRoute,
    "agent_user_run_persistence_release_gate_scaffold",
    "agent_run_live_write_smoke_contract_linked",
    "agent_run_state_persistence_smoke_contract_linked",
    "agent_billing_posted_ledger_smoke_contract_linked",
    "blocked_production_user_run_persistence",
    "production_write_path",
    "frontend_resume_rendering",
    "production_cutover_allowed: false",
    "production_persistence_enabled: false"
  ]) {
    expectIncludes(source, needle, path);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists core.agent_user_run_persistence_release_gate",
    "create table if not exists governance.agent_user_run_persistence_release_gate_contract",
    "agent_run_live_write_smoke_contract_linked boolean not null default true",
    "agent_run_state_persistence_smoke_contract_linked boolean not null default true",
    "agent_billing_posted_ledger_smoke_contract_linked boolean not null default true",
    "hash_only_smoke_responses_required boolean not null default true",
    "production_persistence_enabled boolean not null default false",
    "production_cutover_allowed boolean not null default false",
    "live_db_writes_enabled boolean not null default false",
    "frontend_rendering_enabled boolean not null default false",
    "default_rights_status text not null default 'default_deny'",
    "blocked_production_user_run_persistence",
    "post /agent/release-gates/user-run-persistence/plan",
    "post /agent/runs/live-write-smoke",
    "post /agent/runs/state-persistence-smoke",
    "post /agent/runs/billing-posted-ledger-smoke"
  ]) {
    expectIncludes(lower, needle, migrationPath);
  }
}

function expectReleaseGate(value) {
  if (!isRecord(value)) {
    errors.push("release_gate must be an object");
    return;
  }

  expectEqual(
    value.gate_status,
    "blocked_production_user_run_persistence",
    "release_gate.gate_status"
  );
  expectBoolean(value.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArrayEqual(
    value.required_signoffs,
    ["agent", "data", "billing", "operations"],
    "release_gate.required_signoffs"
  );
  expectArrayEqual(
    value.blockers,
    ["production_write_path", "frontend_resume_rendering"],
    "release_gate.blockers"
  );
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} must be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function expectBoolean(actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} must be ${expected}`);
  }
}

function expectArrayEqual(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${label} must equal ${JSON.stringify(expected)}`);
  }
}

function expectIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    errors.push(`${label} must include ${needle}`);
  }
}

function validateNoSecrets(label, source) {
  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(source)) {
      errors.push(`${label} must not contain secret-like values (${pattern})`);
    }
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
