#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const contractPath = "deploy/agent/user-tool-loop-execution-release-gate.contract.json";
const packagePath = "package.json";
const runtimePath = "packages/agent-runtime/src/index.ts";
const runtimeTestPath = "packages/agent-runtime/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const migrationPath =
  "supabase/migrations/20260622021000_agent_user_tool_loop_execution_release_gate.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const expectedVersion = "2026-06-22.phase1.agent-user-tool-loop-execution-release-gate.v0";
const expectedRoute = "POST /agent/release-gates/user-tool-loop-execution/plan";
const expectedScript =
  "node scripts/check-agent-user-tool-loop-execution-release-gate-contract.mjs";
const expectedChecks = [
  "tool_loop_planner_contract_linked",
  "pre_tool_call_resolution_contract_linked",
  "tool_enforcement_contract_linked",
  "budget_stop_policy_contract_linked",
  "failure_recovery_policy_contract_linked",
  "fixed_tool_execution_evidence_smoke_linked",
  "fixed_live_tool_loop_smoke_linked",
  "user_run_persistence_gate_linked",
  "arbitrary_user_tool_loop_cutover_blocked"
];
const expectedTables = [
  "aiphabee_core.agent_user_tool_loop_execution_release_gate",
  "aiphabee_governance.agent_user_tool_loop_execution_release_gate_contract"
];
const expectedLinkedContracts = [
  "deploy/agent/tool-loop-planner.contract.json",
  "deploy/agent/pre-tool-call-resolution.contract.json",
  "deploy/agent/tool-enforcement.contract.json",
  "deploy/agent/budget-stop-policy.contract.json",
  "deploy/agent/failure-recovery-policy.contract.json",
  "deploy/agent/tool-execution-evidence-smoke.contract.json",
  "deploy/agent/live-tool-loop-smoke.contract.json",
  "deploy/agent/user-run-persistence-release-gate.contract.json"
];
const expectedLinkedChecks = [
  "npm run check:tool-loop-agent",
  "npm run check:pre-tool-call-resolution",
  "npm run check:tool-enforcement",
  "npm run check:budget-stop-policy",
  "npm run check:failure-recovery-policy",
  "npm run check:agent-tool-execution-evidence-smoke",
  "npm run check:agent-live-tool-loop-smoke",
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
  expectBoolean(
    value.arbitrary_user_tool_loop_execution,
    false,
    "arbitrary_user_tool_loop_execution"
  );
  expectBoolean(value.frontend_rendering, false, "frontend_rendering");
  expectBoolean(value.live_db_writes, false, "live_db_writes");
  expectBoolean(value.live_model_execution, false, "live_model_execution");
  expectBoolean(value.live_tool_execution, false, "live_tool_execution");
  expectBoolean(value.persistent_writes, false, "persistent_writes");
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
    "arbitrary_user_tool_loop_execution",
    "user_prompt_live_tool_execution_route",
    "live_tool_execution",
    "live_model_execution",
    "frontend_ask_rendering",
    "persistent_user_run_state",
    "production_user_run_persistence_cutover",
    "live_entitlement_db_reads",
    "raw_tool_result_returned",
    "unguarded_sql_execution"
  ]) {
    if (!value.not_claimed?.includes(notClaimed)) {
      errors.push(`contract.not_claimed must include ${notClaimed}`);
    }
  }
}

function validatePackage(value) {
  const scripts = value.scripts ?? {};
  expectEqual(
    scripts["check:agent-user-tool-loop-execution-release-gate"],
    expectedScript,
    "package.json check:agent-user-tool-loop-execution-release-gate"
  );

  const rootCheck = scripts.check ?? "";
  const gateNeedle = "npm run check:agent-user-tool-loop-execution-release-gate";
  const gateIndex = rootCheck.indexOf(gateNeedle);
  const userRunPersistenceIndex = rootCheck.indexOf(
    "npm run check:agent-user-run-persistence-release-gate"
  );
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (gateIndex === -1) {
    errors.push(`root check must include ${gateNeedle}`);
  }

  if (gateIndex !== -1 && userRunPersistenceIndex !== -1 && gateIndex < userRunPersistenceIndex) {
    errors.push("root check must run user ToolLoop execution gate after user-run persistence gate");
  }

  if (gateIndex !== -1 && observabilityIndex !== -1 && gateIndex > observabilityIndex) {
    errors.push("root check must run user ToolLoop execution gate before observability checks");
  }
}

function validateDatabaseContract(value) {
  const migration = (value.migrations ?? []).find((entry) => entry.file === migrationPath);

  if (!migration) {
    errors.push("database migrations contract must include user ToolLoop execution gate migration");
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
    "AGENT_USER_TOOL_LOOP_EXECUTION_RELEASE_GATE_VERSION",
    expectedVersion,
    "AGENT_USER_TOOL_LOOP_EXECUTION_RELEASE_GATE_CHECKS",
    "AGENT_USER_TOOL_LOOP_EXECUTION_RELEASE_GATE_TABLES",
    "AgentUserToolLoopExecutionReleaseGateCapabilities",
    "AgentUserToolLoopExecutionReleaseGatePlan",
    "createAgentUserToolLoopExecutionReleaseGatePlan",
    "getAgentUserToolLoopExecutionReleaseGateCapabilities",
    "agent_user_tool_loop_execution_release_gate:",
    "arbitrary_user_tool_loop_execution: false",
    "live_tool_execution: false",
    "live_model_execution: false",
    "release_transition_allowed: false",
    "gate_status: \"blocked_arbitrary_user_tool_loop_execution\"",
    "route_does_not_accept_arbitrary_user_tool_loop"
  ]) {
    expectIncludes(source, needle, runtimePath);
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    "createAgentUserToolLoopExecutionReleaseGatePlan",
    "getAgentUserToolLoopExecutionReleaseGateCapabilities",
    'app.post("/agent/release-gates/user-tool-loop-execution/plan"',
    "tool_loop_planner_accepted",
    "pre_tool_call_resolution_accepted",
    "tool_enforcement_accepted",
    "budget_stop_policy_accepted",
    "failure_recovery_policy_accepted",
    "fixed_tool_execution_evidence_accepted",
    "fixed_live_tool_loop_smoke_accepted",
    "user_auth_entitlement_accepted",
    "user_run_persistence_gate_accepted",
    "agent-user-tool-loop-execution-release-gate-plan",
    "rows: plan.release_checks.length"
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source, path) {
  for (const needle of [
    expectedRoute,
    "agent_user_tool_loop_execution_release_gate_scaffold",
    "tool_loop_planner_contract_linked",
    "pre_tool_call_resolution_contract_linked",
    "tool_enforcement_contract_linked",
    "budget_stop_policy_contract_linked",
    "failure_recovery_policy_contract_linked",
    "fixed_tool_execution_evidence_smoke_linked",
    "fixed_live_tool_loop_smoke_linked",
    "user_run_persistence_gate_linked",
    "arbitrary_user_tool_loop_cutover_blocked",
    "blocked_arbitrary_user_tool_loop_execution",
    "route_does_not_accept_arbitrary_user_tool_loop",
    "arbitrary_user_tool_loop_execution: false",
    "live_tool_execution: false",
    "release_transition_allowed: false"
  ]) {
    expectIncludes(source, needle, path);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists aiphabee_core.agent_user_tool_loop_execution_release_gate",
    "create table if not exists aiphabee_governance.agent_user_tool_loop_execution_release_gate_contract",
    "tool_loop_planner_contract_linked boolean not null default true",
    "pre_tool_call_resolution_contract_linked boolean not null default true",
    "tool_enforcement_contract_linked boolean not null default true",
    "budget_stop_policy_contract_linked boolean not null default true",
    "failure_recovery_policy_contract_linked boolean not null default true",
    "fixed_tool_execution_evidence_smoke_linked boolean not null default true",
    "fixed_live_tool_loop_smoke_linked boolean not null default true",
    "user_run_persistence_gate_linked boolean not null default true",
    "user_auth_entitlement_required boolean not null default true",
    "release_transition_allowed boolean not null default false",
    "arbitrary_user_tool_loop_execution_enabled boolean not null default false",
    "live_tool_execution_enabled boolean not null default false",
    "live_model_execution_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "frontend_rendering_enabled boolean not null default false",
    "default_rights_status text not null default 'default_deny'",
    "blocked_arbitrary_user_tool_loop_execution",
    "post /agent/release-gates/user-tool-loop-execution/plan",
    "post /agent/runs/plan",
    "post /agent/runs/preflight",
    "post /agent/runs/tool-execution-evidence-smoke",
    "post /agent/runs/live-tool-loop-smoke",
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
    "blocked_arbitrary_user_tool_loop_execution",
    "release_gate.gate_status"
  );
  expectBoolean(value.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArrayEqual(
    value.required_signoffs,
    ["agent", "data", "security", "operations"],
    "release_gate.required_signoffs"
  );
  expectArrayEqual(
    value.blockers,
    [
      "tool_loop_planner",
      "pre_tool_call_resolution",
      "tool_enforcement",
      "budget_stop_policy",
      "failure_recovery_policy",
      "fixed_tool_execution_evidence",
      "fixed_live_tool_loop_smoke",
      "user_run_persistence_gate",
      "user_auth_entitlement",
      "route_does_not_accept_arbitrary_user_tool_loop"
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
