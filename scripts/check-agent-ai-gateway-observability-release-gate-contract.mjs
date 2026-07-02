#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const contractPath = "deploy/agent/ai-gateway-observability-release-gate.contract.json";
const packagePath = "package.json";
const runtimePath = "packages/agent-runtime/src/index.ts";
const runtimeTestPath = "packages/agent-runtime/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const migrationPath =
  "deploy/database/migrations/20260622019000_agent_ai_gateway_observability_release_gate.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const expectedVersion =
  "2026-06-22.phase1.agent-ai-gateway-observability-release-gate.v0";
const expectedRoute = "POST /agent/release-gates/ai-gateway-observability/plan";
const expectedScript =
  "node scripts/check-agent-ai-gateway-observability-release-gate-contract.mjs";
const expectedChecks = [
  "model_execution_audit_smoke_contract_linked",
  "ai_gateway_observability_smoke_script_linked",
  "ai_gateway_read_permission_evidence_required",
  "request_log_cost_cache_fields_required",
  "rate_limit_fallback_evidence_required",
  "hash_only_capture_packet_required"
];
const expectedTables = [
  "aiphabee_core.agent_ai_gateway_observability_release_gate",
  "aiphabee_governance.agent_ai_gateway_observability_release_gate_contract"
];
const expectedLinkedContracts = [
  "deploy/agent/model-execution-audit-smoke.contract.json",
  "deploy/model-providers/live-smoke-readiness.contract.json",
  "deploy/agent/model-routing-audit.contract.json",
  "deploy/governance/live-smoke-capture-artifacts.contract.json",
  "deploy/governance/live-smoke-evidence-ledger.contract.json"
];
const expectedLinkedChecks = [
  "npm run check:agent-model-execution-audit-smoke",
  "npm run check:model-provider-live-readiness",
  "npm run check:model-routing-audit",
  "npm run check:live-smoke-capture-artifacts",
  "npm run check:live-smoke-evidence-ledger"
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
  expectBoolean(value.live_ai_gateway_reads, false, "live_ai_gateway_reads");
  expectBoolean(value.live_db_writes, false, "live_db_writes");
  expectBoolean(value.live_model_execution, false, "live_model_execution");
  expectBoolean(value.model_calls, false, "model_calls");
  expectBoolean(value.sql_emitted, false, "sql_emitted");
  expectBoolean(value.release_transition_allowed, false, "release_transition_allowed");
  expectArrayEqual(value.required_permissions, ["AI Gateway Read", "Account Analytics Read"], "required_permissions");
  expectArrayEqual(value.required_checks, expectedChecks, "required_checks");
  expectArrayEqual(value.tables, expectedTables, "tables");
  expectArrayEqual(value.linked_contracts, expectedLinkedContracts, "linked_contracts");
  expectArrayEqual(value.linked_scripts, ["scripts/smoke-ai-gateway-observability-live.mjs"], "linked_scripts");
  expectArrayEqual(value.linked_checks, expectedLinkedChecks, "linked_checks");
  expectReleaseGate(value.release_gate);

  for (const linkedPath of [...(value.linked_contracts ?? []), ...(value.linked_scripts ?? [])]) {
    if (typeof linkedPath !== "string" || !existsSync(linkedPath)) {
      errors.push(`linked artifact must exist: ${linkedPath}`);
    }
  }

  for (const notClaimed of [
    "ai_gateway_logs_read",
    "cost_log_verified",
    "cache_log_verified",
    "rate_limit_log_verified",
    "fallback_log_verified",
    "live_token_cost_fallback_log_writes",
    "production_model_routing_cutover",
    "frontend_ask_rendering"
  ]) {
    if (!value.not_claimed?.includes(notClaimed)) {
      errors.push(`contract.not_claimed must include ${notClaimed}`);
    }
  }
}

function validatePackage(value) {
  const scripts = value.scripts ?? {};
  expectEqual(
    scripts["check:agent-ai-gateway-observability-release-gate"],
    expectedScript,
    "package.json check:agent-ai-gateway-observability-release-gate"
  );

  const rootCheck = scripts.check ?? "";
  const gateNeedle = "npm run check:agent-ai-gateway-observability-release-gate";
  const gateIndex = rootCheck.indexOf(gateNeedle);
  const modelAuditIndex = rootCheck.indexOf("npm run check:agent-model-execution-audit-smoke");
  const liveToolLoopIndex = rootCheck.indexOf("npm run check:agent-live-tool-loop-smoke");

  if (gateIndex === -1) {
    errors.push(`root check must include ${gateNeedle}`);
  }

  if (gateIndex !== -1 && modelAuditIndex !== -1 && gateIndex < modelAuditIndex) {
    errors.push("root check must run AI Gateway observability gate after model audit smoke");
  }

  if (gateIndex !== -1 && liveToolLoopIndex !== -1 && gateIndex > liveToolLoopIndex) {
    errors.push("root check must run AI Gateway observability gate before live ToolLoop smoke");
  }
}

function validateDatabaseContract(value) {
  const migration = (value.migrations ?? []).find((entry) => entry.file === migrationPath);

  if (!migration) {
    errors.push("database migrations contract must include AI Gateway observability release gate migration");
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
    "AGENT_AI_GATEWAY_OBSERVABILITY_RELEASE_GATE_VERSION",
    expectedVersion,
    "AGENT_AI_GATEWAY_OBSERVABILITY_RELEASE_GATE_CHECKS",
    "AGENT_AI_GATEWAY_OBSERVABILITY_RELEASE_GATE_TABLES",
    "AgentAiGatewayObservabilityReleaseGateCapabilities",
    "AgentAiGatewayObservabilityReleaseGatePlan",
    "createAgentAiGatewayObservabilityReleaseGatePlan",
    "getAgentAiGatewayObservabilityReleaseGateCapabilities",
    "agent_ai_gateway_observability_release_gate:",
    "live_ai_gateway_reads: false",
    "live_model_execution: false",
    "release_transition_allowed: false",
    "gate_status: \"blocked_ai_gateway_observability_evidence\"",
    "route_does_not_verify_live_capture_packet"
  ]) {
    expectIncludes(source, needle, runtimePath);
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    "createAgentAiGatewayObservabilityReleaseGatePlan",
    "getAgentAiGatewayObservabilityReleaseGateCapabilities",
    'app.post("/agent/release-gates/ai-gateway-observability/plan"',
    "ai_gateway_read_permission_evidence",
    "account_analytics_read_permission_evidence",
    "request_log_evidence_accepted",
    "cost_cache_evidence_accepted",
    "rate_limit_fallback_evidence_accepted",
    "capture_packet_accepted",
    "agent-ai-gateway-observability-release-gate-plan",
    "rows: plan.release_checks.length"
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source, path) {
  for (const needle of [
    expectedRoute,
    "agent_ai_gateway_observability_release_gate_scaffold",
    "model_execution_audit_smoke_contract_linked",
    "ai_gateway_observability_smoke_script_linked",
    "ai_gateway_read_permission_evidence_required",
    "request_log_cost_cache_fields_required",
    "rate_limit_fallback_evidence_required",
    "hash_only_capture_packet_required",
    "blocked_ai_gateway_observability_evidence",
    "route_does_not_verify_live_capture_packet",
    "live_ai_gateway_reads: false",
    "live_model_execution: false",
    "release_transition_allowed: false"
  ]) {
    expectIncludes(source, needle, path);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists aiphabee_core.agent_ai_gateway_observability_release_gate",
    "create table if not exists aiphabee_governance.agent_ai_gateway_observability_release_gate_contract",
    "model_execution_audit_smoke_contract_linked boolean not null default true",
    "ai_gateway_observability_smoke_script_linked boolean not null default true",
    "ai_gateway_read_permission_evidence_required boolean not null default true",
    "account_analytics_read_permission_evidence_required boolean not null default true",
    "request_log_cost_cache_fields_required boolean not null default true",
    "rate_limit_fallback_evidence_required boolean not null default true",
    "hash_only_capture_packet_required boolean not null default true",
    "release_transition_allowed boolean not null default false",
    "live_ai_gateway_reads_enabled boolean not null default false",
    "live_model_execution_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "frontend_rendering_enabled boolean not null default false",
    "default_rights_status text not null default 'default_deny'",
    "blocked_ai_gateway_observability_evidence",
    "post /agent/release-gates/ai-gateway-observability/plan",
    "post /agent/runs/model-execution-audit-smoke",
    "npm run smoke:ai-gateway-observability-live",
    "ai gateway read",
    "account analytics read"
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
    "blocked_ai_gateway_observability_evidence",
    "release_gate.gate_status"
  );
  expectBoolean(value.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArrayEqual(
    value.required_signoffs,
    ["agent", "observability", "platform"],
    "release_gate.required_signoffs"
  );
  expectArrayEqual(
    value.blockers,
    [
      "ai_gateway_read_permission",
      "account_analytics_read_permission",
      "request_log_evidence",
      "cost_cache_log_fields",
      "rate_limit_fallback_evidence",
      "hash_only_capture_packet",
      "route_does_not_verify_live_capture_packet"
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

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
