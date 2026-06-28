#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const contractPath = "deploy/agent/model-output-corpus-release-gate.contract.json";
const packagePath = "package.json";
const runtimePath = "packages/agent-runtime/src/index.ts";
const runtimeTestPath = "packages/agent-runtime/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const migrationPath =
  "supabase/migrations/20260622022000_agent_model_output_corpus_release_gate.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const expectedVersion = "2026-06-22.phase1.agent-model-output-corpus-release-gate.v0";
const expectedRoute = "POST /agent/release-gates/model-output-corpus/plan";
const expectedScript = "node scripts/check-agent-model-output-corpus-release-gate-contract.mjs";
const expectedChecks = [
  "unsourced_numeric_sampling_contract_linked",
  "generated_answer_evidence_smoke_linked",
  "model_execution_audit_smoke_linked",
  "live_model_streaming_gate_linked",
  "eval_v1_contract_linked",
  "live_smoke_evidence_ledger_linked",
  "production_model_output_corpus_cutover_blocked"
];
const expectedTables = [
  "aiphabee_core.agent_model_output_corpus_release_gate",
  "aiphabee_governance.agent_model_output_corpus_release_gate_contract"
];
const expectedLinkedContracts = [
  "deploy/observability/unsourced-numeric-sampling.contract.json",
  "deploy/agent/generated-answer-evidence-smoke.contract.json",
  "deploy/agent/model-execution-audit-smoke.contract.json",
  "deploy/agent/live-model-streaming-release-gate.contract.json",
  "deploy/observability/eval-v1.contract.json",
  "deploy/governance/live-smoke-evidence-ledger.contract.json"
];
const expectedLinkedChecks = [
  "npm run check:unsourced-numeric-sampling",
  "npm run check:agent-generated-answer-evidence-smoke",
  "npm run check:agent-model-execution-audit-smoke",
  "npm run check:agent-live-model-streaming-release-gate",
  "npm run check:eval-v1",
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
  expectBoolean(value.persistent_eval_writes, false, "persistent_eval_writes");
  expectBoolean(value.production_sampling_enabled, false, "production_sampling_enabled");
  expectBoolean(value.live_model_output_corpus_enabled, false, "live_model_output_corpus_enabled");
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
    "live_model_output_corpus",
    "production_live_generated_answer_sampling",
    "partner_approved_production_corpus",
    "persistent_eval_writes",
    "frontend_evidence_card_rendering",
    "raw_model_output_storage",
    "production_model_routing_cutover",
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
    scripts["check:agent-model-output-corpus-release-gate"],
    expectedScript,
    "package.json check:agent-model-output-corpus-release-gate"
  );

  const rootCheck = scripts.check ?? "";
  const gateNeedle = "npm run check:agent-model-output-corpus-release-gate";
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
    errors.push("root check must run model output corpus gate before build");
  }
}

function validateDatabaseContract(value) {
  const migration = (value.migrations ?? []).find((entry) => entry.file === migrationPath);

  if (!migration) {
    errors.push("database migrations contract must include model output corpus release gate migration");
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
    "AGENT_MODEL_OUTPUT_CORPUS_RELEASE_GATE_VERSION",
    expectedVersion,
    "AGENT_MODEL_OUTPUT_CORPUS_RELEASE_GATE_CHECKS",
    "AGENT_MODEL_OUTPUT_CORPUS_RELEASE_GATE_TABLES",
    "AgentModelOutputCorpusReleaseGateCapabilities",
    "AgentModelOutputCorpusReleaseGatePlan",
    "createAgentModelOutputCorpusReleaseGatePlan",
    "getAgentModelOutputCorpusReleaseGateCapabilities",
    "agent_model_output_corpus_release_gate:",
    "live_model_output_corpus_enabled: false",
    "production_sampling_enabled: false",
    "persistent_eval_writes: false",
    "release_transition_allowed: false",
    "gate_status: \"blocked_model_output_corpus_evidence\"",
    "route_does_not_ingest_live_model_output_corpus"
  ]) {
    expectIncludes(source, needle, runtimePath);
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    "createAgentModelOutputCorpusReleaseGatePlan",
    "getAgentModelOutputCorpusReleaseGateCapabilities",
    'app.post("/agent/release-gates/model-output-corpus/plan"',
    "unsourced_numeric_sampling_accepted",
    "generated_answer_evidence_accepted",
    "model_execution_audit_accepted",
    "live_model_streaming_gate_accepted",
    "eval_v1_accepted",
    "live_smoke_evidence_ledger_accepted",
    "partner_approved_corpus_accepted",
    "persistent_eval_writes_accepted",
    "frontend_evidence_cards_accepted",
    "agent-model-output-corpus-release-gate-plan",
    "rows: plan.release_checks.length"
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source, path) {
  for (const needle of [
    expectedRoute,
    "agent_model_output_corpus_release_gate_scaffold",
    "unsourced_numeric_sampling_contract_linked",
    "generated_answer_evidence_smoke_linked",
    "model_execution_audit_smoke_linked",
    "live_model_streaming_gate_linked",
    "eval_v1_contract_linked",
    "live_smoke_evidence_ledger_linked",
    "production_model_output_corpus_cutover_blocked",
    "blocked_model_output_corpus_evidence",
    "route_does_not_ingest_live_model_output_corpus",
    "live_model_output_corpus_enabled: false",
    "production_sampling_enabled: false",
    "persistent_eval_writes: false",
    "release_transition_allowed: false"
  ]) {
    expectIncludes(source, needle, path);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists aiphabee_core.agent_model_output_corpus_release_gate",
    "create table if not exists aiphabee_governance.agent_model_output_corpus_release_gate_contract",
    "unsourced_numeric_sampling_contract_linked boolean not null default true",
    "generated_answer_evidence_smoke_linked boolean not null default true",
    "model_execution_audit_smoke_linked boolean not null default true",
    "live_model_streaming_gate_linked boolean not null default true",
    "eval_v1_contract_linked boolean not null default true",
    "live_smoke_evidence_ledger_linked boolean not null default true",
    "partner_approved_model_output_corpus_required boolean not null default true",
    "persistent_eval_writes_required boolean not null default true",
    "frontend_evidence_cards_required boolean not null default true",
    "release_transition_allowed boolean not null default false",
    "live_model_output_corpus_enabled boolean not null default false",
    "production_sampling_enabled boolean not null default false",
    "persistent_eval_write_enabled boolean not null default false",
    "model_call_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "frontend_rendering_enabled boolean not null default false",
    "default_rights_status text not null default 'default_deny'",
    "blocked_model_output_corpus_evidence",
    "post /agent/release-gates/model-output-corpus/plan",
    "deploy/observability/unsourced-numeric-sampling.contract.json",
    "post /agent/runs/generated-answer-evidence-smoke",
    "post /agent/runs/model-execution-audit-smoke",
    "post /agent/release-gates/live-model-streaming/plan",
    "deploy/observability/eval-v1.contract.json",
    "deploy/governance/live-smoke-evidence-ledger.contract.json"
  ]) {
    expectIncludes(lower, needle, migrationPath);
  }
}

function expectReleaseGate(value) {
  if (!isRecord(value)) {
    errors.push("release_gate must be an object");
    return;
  }

  expectEqual(value.gate_status, "blocked_model_output_corpus_evidence", "release_gate.gate_status");
  expectBoolean(value.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArrayEqual(
    value.required_signoffs,
    ["agent", "observability", "data", "product"],
    "release_gate.required_signoffs"
  );
  expectArrayEqual(
    value.blockers,
    [
      "unsourced_numeric_sampling",
      "generated_answer_evidence_binding",
      "model_execution_audit",
      "live_model_streaming_gate",
      "eval_v1_contract",
      "live_smoke_evidence_ledger",
      "partner_approved_model_output_corpus",
      "persistent_eval_writes",
      "frontend_evidence_cards",
      "route_does_not_ingest_live_model_output_corpus"
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
