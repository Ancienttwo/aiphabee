#!/usr/bin/env node
import { readFileSync } from "node:fs";

const contractPath = "deploy/agent/state-persistence-smoke.contract.json";
const packagePath = "package.json";
const workerPath = "apps/worker/src/index.ts";
const testPath = "apps/worker/src/agent-run-state-persistence-smoke.test.ts";
const migrationPath = "deploy/database/migrations/20260622016000_agent_run_state_persistence_smoke.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const failureRecoveryContractPath = "deploy/agent/failure-recovery-policy.contract.json";
const liveWriteContractPath = "deploy/agent/run-live-write-smoke.contract.json";

const expectedVersion = "2026-06-22.phase1.agent-run-state-persistence-smoke.v0";
const expectedScript = "node scripts/check-agent-run-state-persistence-smoke-contract.mjs";
const expectedRoute = "POST /agent/runs/state-persistence-smoke";
const expectedToken = "AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN";
const expectedHeader = "agent-run-state-persistence-v1";
const expectedSurface = "agent_run_state_checkpoint_insert_select_update_delete";
const expectedTables = ["aiphabee_core.agent_run_state", "aiphabee_core.agent_run_checkpoint"];
const errors = [];

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

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} must be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function expectBoolean(value, expected, label) {
  if (value !== expected) {
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

function validateContract(contract) {
  expectEqual(contract.version, expectedVersion, "contract.version");
  expectEqual(contract.status, "local_contract", "contract.status");
  expectEqual(contract.route, expectedRoute, "contract.route");
  expectEqual(
    contract.checker,
    "scripts/check-agent-run-state-persistence-smoke-contract.mjs",
    "contract.checker"
  );
  expectEqual(
    contract.test_file,
    "apps/worker/src/agent-run-state-persistence-smoke.test.ts",
    "contract.test_file"
  );
  expectEqual(contract.worker_entrypoint, workerPath, "contract.worker_entrypoint");
  expectEqual(contract.migration, migrationPath, "contract.migration");
  expectEqual(contract.database_contract, databaseContractPath, "contract.database_contract");
  expectEqual(
    contract.failure_recovery_contract,
    failureRecoveryContractPath,
    "contract.failure_recovery_contract"
  );
  expectEqual(
    contract.agent_live_write_contract,
    liveWriteContractPath,
    "contract.agent_live_write_contract"
  );
  expectEqual(contract.smoke_token_binding, expectedToken, "contract.smoke_token_binding");
  expectEqual(contract.smoke_header?.name, "x-aiphabee-smoke", "contract.smoke_header.name");
  expectEqual(contract.smoke_header?.value, expectedHeader, "contract.smoke_header.value");
  expectEqual(contract.hyperdrive_binding, "AIPHABEE_HYPERDRIVE", "contract.hyperdrive_binding");
  expectBoolean(contract.actual_hyperdrive_execution, true, "actual_hyperdrive_execution");
  expectBoolean(
    contract.transactional_insert_select_update_delete,
    true,
    "transactional_insert_select_update_delete"
  );
  expectBoolean(contract.durable_run_state_smoke, true, "durable_run_state_smoke");
  expectBoolean(contract.checkpoint_smoke, true, "checkpoint_smoke");
  expectBoolean(contract.state_transition_verified, true, "state_transition_verified");
  expectBoolean(contract.resume_token_hash_only, true, "resume_token_hash_only");
  expectBoolean(contract.idempotency_key_hash_only, true, "idempotency_key_hash_only");
  expectBoolean(contract.cleanup_verified, true, "cleanup_verified");
  expectBoolean(contract.auth_enforced_before_db, true, "auth_enforced_before_db");
  expectBoolean(contract.hash_only_response, true, "hash_only_response");
  expectBoolean(
    contract.production_persistence_enabled,
    false,
    "production_persistence_enabled"
  );
  expectBoolean(contract.user_facing_resume_enabled, false, "user_facing_resume_enabled");
  expectBoolean(
    contract.arbitrary_user_tool_loop_execution,
    false,
    "arbitrary_user_tool_loop_execution"
  );
  expectBoolean(contract.frontend, false, "frontend");
  expectArrayEqual(contract.tables, expectedTables, "contract.tables");

  for (const notClaimed of [
    "production_agent_run_persistence",
    "arbitrary_user_tool_loop_execution",
    "user_facing_live_model_streaming",
    "frontend_resume_rendering",
    "production_billing_posting",
    "workflow_task_checkpoint_writes",
    "queue_notification_fanout"
  ]) {
    if (!contract.not_claimed?.includes(notClaimed)) {
      errors.push(`contract.not_claimed must include ${notClaimed}`);
    }
  }

  expectEqual(
    contract.verification?.unit_test,
    "npm run test -- apps/worker/src/agent-run-state-persistence-smoke.test.ts",
    "verification.unit_test"
  );
  expectEqual(
    contract.verification?.contract_check,
    "npm run check:agent-run-state-persistence-smoke",
    "verification.contract_check"
  );
  expectEqual(
    contract.verification?.worker_typecheck,
    "npm run typecheck --workspace @aiphabee/worker",
    "verification.worker_typecheck"
  );
  expectEqual(
    contract.verification?.database_check,
    "npm run check:database",
    "verification.database_check"
  );
}

function validatePackage(pkg) {
  const scripts = pkg.scripts ?? {};

  expectEqual(
    scripts["check:agent-run-state-persistence-smoke"],
    expectedScript,
    "package.json check:agent-run-state-persistence-smoke"
  );

  const rootCheck = scripts.check ?? "";
  const stateIndex = rootCheck.indexOf("npm run check:agent-run-state-persistence-smoke");
  const liveWriteIndex = rootCheck.indexOf("npm run check:agent-run-live-write-smoke");
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (stateIndex === -1) {
    errors.push("root check must include check:agent-run-state-persistence-smoke");
  }

  if (stateIndex !== -1 && liveWriteIndex !== -1 && stateIndex < liveWriteIndex) {
    errors.push("root check must run state persistence smoke after Agent run live write smoke");
  }

  if (stateIndex !== -1 && observabilityIndex !== -1 && stateIndex > observabilityIndex) {
    errors.push("root check must run state persistence smoke before observability checks");
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    'AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN?: string',
    'const AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE = "/agent/runs/state-persistence-smoke"',
    'const AGENT_RUN_STATE_PERSISTENCE_SMOKE_HEADER_VALUE = "agent-run-state-persistence-v1"',
    'const AGENT_RUN_STATE_PERSISTENCE_SMOKE_TOKEN_BINDING =',
    'app.post(AGENT_RUN_STATE_PERSISTENCE_SMOKE_ROUTE',
    "missingAgentRunStatePersistenceSmokeEnv",
    "isAgentRunStatePersistenceSmokeAuthorized",
    "runAgentRunStatePersistenceSmoke",
    "insert into aiphabee_core.agent_run_state",
    "insert into aiphabee_core.agent_run_checkpoint",
    "update aiphabee_core.agent_run_state",
    "delete from aiphabee_core.agent_run_checkpoint",
    "delete from aiphabee_core.agent_run_state",
    "resume_token_hash",
    "idempotency_key_hash",
    "agent_run_state_persistence_result",
    expectedSurface,
    "production_persistence_enabled: false",
    "user_facing_resume_enabled: false"
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source) {
  for (const needle of [
    'const SMOKE_ROUTE = "/agent/runs/state-persistence-smoke"',
    'const SMOKE_TOKEN = "agent-run-state-persistence-smoke-token-000000"',
    '"x-aiphabee-smoke": "agent-run-state-persistence-v1"',
    "AIPHABEE_AGENT_RUN_STATE_SMOKE_TOKEN",
    "AIPHABEE_HYPERDRIVE",
    "insert into aiphabee_core.agent_run_state",
    "insert into aiphabee_core.agent_run_checkpoint",
    "update aiphabee_core.agent_run_state",
    "delete from aiphabee_core.agent_run_checkpoint",
    "delete from aiphabee_core.agent_run_state",
    "cleanup_verified: true",
    "operation_count: 10",
    "production_persistence_enabled: false",
    "user_facing_resume_enabled: false",
    'not.toContain("mock-agent-run-state-persistence-connection")'
  ]) {
    expectIncludes(source, needle, testPath);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists aiphabee_core.agent_run_state",
    "create table if not exists aiphabee_core.agent_run_checkpoint",
    "create table if not exists aiphabee_governance.agent_run_state_persistence_smoke_contract",
    "run_state_id text primary key",
    "resume_token_hash text not null",
    "idempotency_key_hash text not null",
    "state_json jsonb not null",
    "checkpoint_json jsonb not null",
    "production_persistence_enabled boolean not null default false",
    "user_facing_resume_enabled boolean not null default false",
    "default_rights_status = 'default_deny'",
    "2026-06-22.phase1.agent-run-state-persistence-smoke.v0"
  ]) {
    expectIncludes(lower, needle, migrationPath);
  }
}

function validateDatabaseContract(databaseContract) {
  const entry = (databaseContract.migrations ?? []).find((item) => item.file === migrationPath);

  if (!entry) {
    errors.push(`${databaseContractPath} must include ${migrationPath}`);
    return;
  }

  expectArrayEqual(entry.schemas, ["aiphabee_core", "aiphabee_governance"], "database entry schemas");
  expectArrayEqual(
    entry.tables,
    [
      "aiphabee_core.agent_run_state",
      "aiphabee_core.agent_run_checkpoint",
      "aiphabee_governance.agent_run_state_persistence_smoke_contract"
    ],
    "database entry tables"
  );
  expectBoolean(entry.market_data, false, "database entry market_data");
  expectEqual(entry.default_rights_status, "default_deny", "database entry default_rights_status");
}

function validateLinkedContracts() {
  const failureRecovery = readJson(failureRecoveryContractPath);
  const liveWrite = readJson(liveWriteContractPath);

  expectEqual(
    failureRecovery.recovery_state?.state_store,
    "planned_run_state",
    "failure recovery state store"
  );
  expectBoolean(
    failureRecovery.recovery_state?.persisted,
    false,
    "failure recovery persisted precondition"
  );
  expectEqual(liveWrite.route, "POST /agent/runs/live-write-smoke", "live write route");
  expectBoolean(liveWrite.production_persistence_enabled, false, "live write non-claim");
}

function validateNoSecrets(text, label) {
  const forbiddenPatterns = [
    /Bearer\s+[A-Za-z0-9._~+/=-]{16,}/u,
    /postgres(?:ql)?:\/\/[^"'\s]+/iu,
    /sk-[A-Za-z0-9]{20,}/u,
    /api[_-]?key["']?\s*[:=]\s*["'][^"']{12,}/iu
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      errors.push(`${label} must not contain secret-like material matching ${pattern}`);
    }
  }
}

const contract = readJson(contractPath);
const pkg = readJson(packagePath);
const databaseContract = readJson(databaseContractPath);
const workerSource = readText(workerPath);
const testSource = readText(testPath);
const migrationSource = readText(migrationPath);

validateContract(contract);
validatePackage(pkg);
validateWorkerSource(workerSource);
validateTestSource(testSource);
validateMigration(migrationSource);
validateDatabaseContract(databaseContract);
validateLinkedContracts();
validateNoSecrets(JSON.stringify(contract), contractPath);

if (errors.length > 0) {
  console.error(
    JSON.stringify(
      {
        errors,
        status: "failed"
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      route: expectedRoute,
      status: "ok",
      tables: expectedTables.length,
      token_binding: expectedToken
    },
    null,
    2
  )
);
