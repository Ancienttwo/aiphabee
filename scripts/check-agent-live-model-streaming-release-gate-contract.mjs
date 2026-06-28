#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const contractPath = "deploy/agent/live-model-streaming-release-gate.contract.json";
const packagePath = "package.json";
const runtimePath = "packages/agent-runtime/src/index.ts";
const runtimeTestPath = "packages/agent-runtime/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const migrationPath =
  "supabase/migrations/20260622020000_agent_live_model_streaming_release_gate.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const expectedVersion = "2026-06-22.phase1.agent-live-model-streaming-release-gate.v0";
const expectedRoute = "POST /agent/release-gates/live-model-streaming/plan";
const expectedScript = "node scripts/check-agent-live-model-streaming-release-gate-contract.mjs";
const expectedChecks = [
  "backend_progress_stream_contract_linked",
  "model_execution_stream_text_smoke_contract_linked",
  "live_tool_loop_stream_text_smoke_contract_linked",
  "generated_answer_evidence_binding_smoke_linked",
  "ai_gateway_observability_gate_linked",
  "user_facing_stream_cutover_blocked"
];
const expectedTables = [
  "aiphabee_core.agent_live_model_streaming_release_gate",
  "aiphabee_governance.agent_live_model_streaming_release_gate_contract"
];
const expectedLinkedContracts = [
  "deploy/agent/tool-loop-planner.contract.json",
  "deploy/agent/model-execution-audit-smoke.contract.json",
  "deploy/agent/live-tool-loop-smoke.contract.json",
  "deploy/agent/generated-answer-evidence-smoke.contract.json",
  "deploy/agent/ai-gateway-observability-release-gate.contract.json"
];
const expectedLinkedChecks = [
  "npm run check:tool-loop-agent",
  "npm run check:agent-model-execution-audit-smoke",
  "npm run check:agent-live-tool-loop-smoke",
  "npm run check:agent-generated-answer-evidence-smoke",
  "npm run check:agent-ai-gateway-observability-release-gate"
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
  expectBoolean(value.live_model_execution, false, "live_model_execution");
  expectBoolean(value.live_model_streaming, false, "live_model_streaming");
  expectBoolean(value.model_calls, false, "model_calls");
  expectBoolean(value.sql_emitted, false, "sql_emitted");
  expectBoolean(value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(
    value.backend_progress_stream_content_type,
    "text/event-stream",
    "backend_progress_stream_content_type"
  );
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
    "user_facing_live_model_streaming",
    "live_model_token_streaming_route",
    "frontend_ask_streaming_rendering",
    "ai_gateway_logs_read",
    "live_token_cost_fallback_log_writes",
    "production_model_routing_cutover",
    "persistent_user_run_stream_state",
    "raw_model_output_returned"
  ]) {
    if (!value.not_claimed?.includes(notClaimed)) {
      errors.push(`contract.not_claimed must include ${notClaimed}`);
    }
  }
}

function validatePackage(value) {
  const scripts = value.scripts ?? {};
  expectEqual(
    scripts["check:agent-live-model-streaming-release-gate"],
    expectedScript,
    "package.json check:agent-live-model-streaming-release-gate"
  );

  const rootCheck = scripts.check ?? "";
  const gateNeedle = "npm run check:agent-live-model-streaming-release-gate";
  const gateIndex = rootCheck.indexOf(gateNeedle);
  const generatedAnswerIndex = rootCheck.indexOf("npm run check:agent-generated-answer-evidence-smoke");
  const runLiveWriteIndex = rootCheck.indexOf("npm run check:agent-run-live-write-smoke");

  if (gateIndex === -1) {
    errors.push(`root check must include ${gateNeedle}`);
  }

  if (gateIndex !== -1 && generatedAnswerIndex !== -1 && gateIndex < generatedAnswerIndex) {
    errors.push("root check must run live model streaming gate after generated-answer smoke");
  }

  if (gateIndex !== -1 && runLiveWriteIndex !== -1 && gateIndex > runLiveWriteIndex) {
    errors.push("root check must run live model streaming gate before run live-write smoke");
  }
}

function validateDatabaseContract(value) {
  const migration = (value.migrations ?? []).find((entry) => entry.file === migrationPath);

  if (!migration) {
    errors.push("database migrations contract must include live model streaming release gate migration");
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
    "AGENT_LIVE_MODEL_STREAMING_RELEASE_GATE_VERSION",
    expectedVersion,
    "AGENT_LIVE_MODEL_STREAMING_RELEASE_GATE_CHECKS",
    "AGENT_LIVE_MODEL_STREAMING_RELEASE_GATE_TABLES",
    "AgentLiveModelStreamingReleaseGateCapabilities",
    "AgentLiveModelStreamingReleaseGatePlan",
    "createAgentLiveModelStreamingReleaseGatePlan",
    "getAgentLiveModelStreamingReleaseGateCapabilities",
    "agent_live_model_streaming_release_gate:",
    "live_model_streaming: false",
    "live_model_execution: false",
    "release_transition_allowed: false",
    "gate_status: \"blocked_user_facing_live_model_streaming\"",
    "route_does_not_execute_user_model_stream"
  ]) {
    expectIncludes(source, needle, runtimePath);
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    "createAgentLiveModelStreamingReleaseGatePlan",
    "getAgentLiveModelStreamingReleaseGateCapabilities",
    'app.post("/agent/release-gates/live-model-streaming/plan"',
    "backend_progress_stream_accepted",
    "model_audit_stream_text_accepted",
    "live_tool_loop_stream_text_accepted",
    "generated_answer_evidence_accepted",
    "ai_gateway_observability_gate_accepted",
    "stream_auth_redaction_accepted",
    "frontend_streaming_ui_accepted",
    "agent-live-model-streaming-release-gate-plan",
    "rows: plan.release_checks.length"
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source, path) {
  for (const needle of [
    expectedRoute,
    "agent_live_model_streaming_release_gate_scaffold",
    "backend_progress_stream_contract_linked",
    "model_execution_stream_text_smoke_contract_linked",
    "live_tool_loop_stream_text_smoke_contract_linked",
    "generated_answer_evidence_binding_smoke_linked",
    "ai_gateway_observability_gate_linked",
    "user_facing_stream_cutover_blocked",
    "blocked_user_facing_live_model_streaming",
    "route_does_not_execute_user_model_stream",
    "live_model_streaming: false",
    "live_model_execution: false",
    "release_transition_allowed: false"
  ]) {
    expectIncludes(source, needle, path);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists aiphabee_core.agent_live_model_streaming_release_gate",
    "create table if not exists aiphabee_governance.agent_live_model_streaming_release_gate_contract",
    "backend_progress_stream_contract_linked boolean not null default true",
    "model_execution_stream_text_smoke_contract_linked boolean not null default true",
    "live_tool_loop_stream_text_smoke_contract_linked boolean not null default true",
    "generated_answer_evidence_binding_smoke_linked boolean not null default true",
    "ai_gateway_observability_gate_linked boolean not null default true",
    "user_stream_auth_redaction_required boolean not null default true",
    "frontend_streaming_ui_required boolean not null default true",
    "release_transition_allowed boolean not null default false",
    "live_model_execution_enabled boolean not null default false",
    "live_model_streaming_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "frontend_rendering_enabled boolean not null default false",
    "default_rights_status text not null default 'default_deny'",
    "blocked_user_facing_live_model_streaming",
    "post /agent/release-gates/live-model-streaming/plan",
    "post /agent/runs/stream",
    "text/event-stream",
    "post /agent/runs/model-execution-audit-smoke",
    "post /agent/runs/live-tool-loop-smoke",
    "post /agent/runs/generated-answer-evidence-smoke"
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
    "blocked_user_facing_live_model_streaming",
    "release_gate.gate_status"
  );
  expectBoolean(value.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArrayEqual(
    value.required_signoffs,
    ["agent", "product", "observability", "security"],
    "release_gate.required_signoffs"
  );
  expectArrayEqual(
    value.blockers,
    [
      "backend_progress_stream",
      "guarded_model_audit_stream_text",
      "guarded_live_tool_loop_stream_text",
      "generated_answer_evidence_binding",
      "ai_gateway_observability_gate",
      "user_stream_auth_redaction",
      "frontend_streaming_ui",
      "route_does_not_execute_user_model_stream"
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
