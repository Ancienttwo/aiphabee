#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const contractPath = "deploy/agent/token-cost-fallback-release-gate.contract.json";
const packagePath = "package.json";
const runtimePath = "packages/agent-runtime/src/index.ts";
const runtimeTestPath = "packages/agent-runtime/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const migrationPath =
  "supabase/migrations/20260622023000_agent_token_cost_fallback_release_gate.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const expectedVersion = "2026-06-22.phase1.agent-token-cost-fallback-release-gate.v0";
const expectedRoute = "POST /agent/release-gates/token-cost-fallback/plan";
const expectedScript =
  "node scripts/check-agent-token-cost-fallback-release-gate-contract.mjs";
const expectedChecks = [
  "model_execution_audit_smoke_linked",
  "model_routing_audit_contract_linked",
  "run_tool_audit_fields_contract_linked",
  "ai_gateway_observability_gate_linked",
  "billing_posted_ledger_smoke_linked",
  "user_run_persistence_gate_linked",
  "live_token_cost_fallback_writes_blocked"
];
const expectedTables = [
  "aiphabee_core.agent_token_cost_fallback_release_gate",
  "aiphabee_governance.agent_token_cost_fallback_release_gate_contract"
];
const expectedLinkedContracts = [
  "deploy/agent/model-execution-audit-smoke.contract.json",
  "deploy/agent/model-routing-audit.contract.json",
  "deploy/governance/run-tool-audit-fields.contract.json",
  "deploy/agent/ai-gateway-observability-release-gate.contract.json",
  "deploy/agent/billing-posted-ledger-smoke.contract.json",
  "deploy/agent/user-run-persistence-release-gate.contract.json"
];
const expectedLinkedChecks = [
  "npm run check:agent-model-execution-audit-smoke",
  "npm run check:model-routing-audit",
  "npm run check:run-tool-audit-fields",
  "npm run check:agent-ai-gateway-observability-release-gate",
  "npm run check:agent-billing-posted-ledger-smoke",
  "npm run check:agent-user-run-persistence-release-gate"
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
  expectBoolean(
    value.live_token_cost_fallback_log_writes,
    false,
    "live_token_cost_fallback_log_writes"
  );
  expectBoolean(value.production_cost_ledger_enabled, false, "production_cost_ledger_enabled");
  expectBoolean(value.model_calls, false, "model_calls");
  expectBoolean(value.sql_emitted, false, "sql_emitted");
  expectBoolean(value.release_transition_allowed, false, "release_transition_allowed");
  expectArrayEqual(value.required_checks, expectedChecks, "required_checks");
  expectArrayEqual(value.tables, expectedTables, "tables");
  expectArrayEqual(value.linked_contracts, expectedLinkedContracts, "linked_contracts");
  expectArrayEqual(value.linked_checks, expectedLinkedChecks, "linked_checks");
  expectReleaseGate(value.release_gate);

  for (const linkedPath of value.linked_contracts ?? []) {
    if (typeof linkedPath !== "string" || !existsSync(linkedPath)) {
      errors.push(`linked contract must exist: ${linkedPath}`);
    }
  }

  for (const notClaimed of [
    "live_token_cost_fallback_log_writes",
    "production_cost_ledger",
    "ai_gateway_request_log_cost_cache_rate_limit_fallback_accepted_evidence",
    "live_model_execution_cutover",
    "frontend_ask_rendering",
    "release_transition"
  ]) {
    if (!value.not_claimed?.includes(notClaimed)) {
      errors.push(`contract.not_claimed must include ${notClaimed}`);
    }
  }
}

function validatePackage(value) {
  const scripts = value.scripts ?? {};
  expectEqual(
    scripts["check:agent-token-cost-fallback-release-gate"],
    expectedScript,
    "package.json check:agent-token-cost-fallback-release-gate"
  );

  const rootCheck = scripts.check ?? "";
  const gateNeedle = "npm run check:agent-token-cost-fallback-release-gate";
  const gateIndex = rootCheck.indexOf(gateNeedle);
  const buildIndex = rootCheck.indexOf("npm run build");

  if (gateIndex === -1) {
    errors.push(`root check must include ${gateNeedle}`);
    return;
  }

  for (const linkedCheck of expectedLinkedChecks) {
    const linkedIndex = rootCheck.indexOf(linkedCheck);
    if (linkedIndex === -1) {
      errors.push(`root check must include linked check ${linkedCheck}`);
      continue;
    }
    if (gateIndex < linkedIndex) {
      errors.push(`root check must run ${gateNeedle} after ${linkedCheck}`);
    }
  }

  if (buildIndex !== -1 && gateIndex > buildIndex) {
    errors.push("root check must run token/cost/fallback gate before build");
  }
}

function validateDatabaseContract(value) {
  const migration = (value.migrations ?? []).find((entry) => entry.file === migrationPath);

  if (!migration) {
    errors.push("database migrations contract must include token/cost/fallback release gate migration");
    return;
  }

  expectArrayEqual(migration.schemas, ["aiphabee_core", "aiphabee_governance"], "database migration schemas");
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
    "AGENT_TOKEN_COST_FALLBACK_RELEASE_GATE_VERSION",
    expectedVersion,
    "AGENT_TOKEN_COST_FALLBACK_RELEASE_GATE_CHECKS",
    "AGENT_TOKEN_COST_FALLBACK_RELEASE_GATE_TABLES",
    "AgentTokenCostFallbackReleaseGateCapabilities",
    "AgentTokenCostFallbackReleaseGatePlan",
    "createAgentTokenCostFallbackReleaseGatePlan",
    "getAgentTokenCostFallbackReleaseGateCapabilities",
    "agent_token_cost_fallback_release_gate:",
    "live_token_cost_fallback_log_writes: false",
    "production_cost_ledger_enabled: false",
    "release_transition_allowed: false",
    "gate_status: \"blocked_live_token_cost_fallback_writes\"",
    "route_does_not_write_live_token_cost_fallback_logs"
  ]) {
    expectIncludes(source, needle, runtimePath);
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    "createAgentTokenCostFallbackReleaseGatePlan",
    "getAgentTokenCostFallbackReleaseGateCapabilities",
    'app.post("/agent/release-gates/token-cost-fallback/plan"',
    "ai_gateway_observability_gate_accepted",
    "billing_posted_ledger_accepted",
    "cost_rate_limit_fallback_evidence_accepted",
    "live_cost_ledger_writer_accepted",
    "model_execution_audit_accepted",
    "model_routing_audit_accepted",
    "run_tool_audit_fields_accepted",
    "user_run_persistence_gate_accepted",
    "agent-token-cost-fallback-release-gate-plan",
    "rows: plan.release_checks.length"
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source, path) {
  for (const needle of [
    expectedRoute,
    "agent_token_cost_fallback_release_gate_scaffold",
    "model_execution_audit_smoke_linked",
    "model_routing_audit_contract_linked",
    "run_tool_audit_fields_contract_linked",
    "ai_gateway_observability_gate_linked",
    "billing_posted_ledger_smoke_linked",
    "user_run_persistence_gate_linked",
    "live_token_cost_fallback_writes_blocked",
    "blocked_live_token_cost_fallback_writes",
    "route_does_not_write_live_token_cost_fallback_logs",
    "live_token_cost_fallback_log_writes: false",
    "production_cost_ledger_enabled: false",
    "release_transition_allowed: false"
  ]) {
    expectIncludes(source, needle, path);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists aiphabee_core.agent_token_cost_fallback_release_gate",
    "create table if not exists aiphabee_governance.agent_token_cost_fallback_release_gate_contract",
    "model_execution_audit_smoke_linked boolean not null default true",
    "model_routing_audit_contract_linked boolean not null default true",
    "run_tool_audit_fields_contract_linked boolean not null default true",
    "ai_gateway_observability_gate_linked boolean not null default true",
    "billing_posted_ledger_smoke_linked boolean not null default true",
    "user_run_persistence_gate_linked boolean not null default true",
    "cost_rate_limit_fallback_evidence_required boolean not null default true",
    "live_cost_ledger_writer_required boolean not null default true",
    "release_transition_allowed boolean not null default false",
    "live_token_cost_fallback_log_writes_enabled boolean not null default false",
    "production_cost_ledger_enabled boolean not null default false",
    "model_call_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "frontend_rendering_enabled boolean not null default false",
    "default_rights_status text not null default 'default_deny'",
    "blocked_live_token_cost_fallback_writes",
    "post /agent/release-gates/agent_token_cost_fallback/plan",
    "post /agent/runs/model-execution-audit-smoke",
    "deploy/agent/model-routing-audit.contract.json",
    "deploy/governance/run-tool-audit-fields.contract.json",
    "post /agent/release-gates/ai-gateway-observability/plan",
    "post /agent/runs/billing-posted-ledger-smoke",
    "post /agent/release-gates/user-run-persistence/plan"
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
    "blocked_live_token_cost_fallback_writes",
    "release_gate.gate_status"
  );
  expectBoolean(value.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArrayEqual(
    value.required_signoffs,
    ["agent", "observability", "finance", "platform"],
    "release_gate.required_signoffs"
  );
  expectArrayEqual(
    value.blockers,
    [
      "model_execution_audit",
      "model_routing_audit",
      "run_tool_audit_fields",
      "ai_gateway_observability_gate",
      "billing_posted_ledger",
      "user_run_persistence_gate",
      "cost_rate_limit_fallback_evidence",
      "live_cost_ledger_writer",
      "route_does_not_write_live_token_cost_fallback_logs"
    ],
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

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
