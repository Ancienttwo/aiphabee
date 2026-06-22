#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/developer-console-log-store-smoke.contract.json";
const packagePath = "package.json";
const workerPath = "apps/worker/src/index.ts";
const testPath = "apps/worker/src/mcp-developer-console-log-store-smoke.test.ts";
const developerConsoleContractPath = "deploy/mcp/developer-console.contract.json";
const targetClientsConsoleGateContractPath =
  "deploy/mcp/target-clients-console-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const migrationPath = "supabase/migrations/20260622014000_mcp_developer_console_scaffold.sql";
const expectedVersion = "2026-06-22.phase2.mcp-developer-console-log-store-smoke.v0";
const expectedScript =
  "node scripts/check-mcp-developer-console-log-store-smoke-contract.mjs";
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const developerConsoleContract = readJson(developerConsoleContractPath);
const targetClientsConsoleGateContract = readJson(targetClientsConsoleGateContractPath);
const databaseContract = readJson(databaseContractPath);
const workerSource = readText(workerPath);
const testSource = readText(testPath);
const migrationSource = readText(migrationPath);
const errors = [
  ...validateContract(contract),
  ...validatePackage(packageJson),
  ...validateWorkerSource(workerSource),
  ...validateTestSource(testSource),
  ...validateMigration(migrationSource, databaseContract),
  ...validateLinkedContracts(developerConsoleContract, targetClientsConsoleGateContract),
  ...validateNoSecrets(contract)
];

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
    route: contract.route,
    status: "ok",
    table: contract.table,
    token_binding: contract.smoke_token_binding
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["MCP Developer Console log-store smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-mcp-developer-console-log-store-smoke-contract.mjs",
    database_contract: databaseContractPath,
    default_rights_status: "default_deny",
    developer_console_contract: developerConsoleContractPath,
    hyperdrive_binding: "AIPHABEE_HYPERDRIVE",
    migration: migrationPath,
    route: "POST /mcp/developer-console/log-store-smoke",
    smoke_token_binding: "AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN",
    status: "local_contract",
    table: "core.mcp_developer_console_request_log",
    target_clients_console_gate_contract: targetClientsConsoleGateContractPath,
    test_file: testPath,
    version: expectedVersion,
    worker_entrypoint: workerPath
  };

  for (const [field, expected] of Object.entries(expectedFields)) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  for (const path of [
    workerPath,
    testPath,
    developerConsoleContractPath,
    targetClientsConsoleGateContractPath,
    databaseContractPath,
    migrationPath
  ]) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked file missing: ${path}`);
    }
  }

  if (!isRecord(value.smoke_header)) {
    errors.push("smoke_header must be an object");
  } else {
    if (value.smoke_header.name !== "x-aiphabee-smoke") {
      errors.push("smoke_header.name must be x-aiphabee-smoke");
    }

    if (value.smoke_header.value !== "mcp-developer-console-log-store-v1") {
      errors.push("smoke_header.value must be mcp-developer-console-log-store-v1");
    }
  }

  for (const field of [
    "actual_hyperdrive_execution",
    "auth_enforced_before_db",
    "cleanup_verified",
    "delete_cleanup",
    "hash_only_response",
    "insert_smoke",
    "live_console_log_store_smoke",
    "select_readback",
    "transactional_insert_select_delete"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "developer_console_live",
    "frontend",
    "live_api_key_generation",
    "live_console_log_store",
    "live_oauth_provider",
    "live_tool_execution",
    "live_usage_ledger_reads",
    "production_console_log_store"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "developer_console_ui",
        "production_console_log_store",
        "live_usage_ledger_reads",
        "live_api_key_secret_generation",
        "live_oauth_provider",
        "live_target_client_e2e",
        "live_tool_execution"
      ],
      "not_claimed"
    )
  );
  errors.push(...validateVerification(value.verification));

  return errors;
}

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const errors = [];
  const expectedCommands = {
    contract_check: "npm run check:mcp-developer-console-log-store-smoke",
    database_check: "npm run check:database",
    developer_console_check: "npm run check:mcp-developer-console",
    unit_test: "npm run test -- apps/worker/src/mcp-developer-console-log-store-smoke.test.ts",
    worker_typecheck: "npm run typecheck --workspace @aiphabee/worker"
  };

  for (const [field, command] of Object.entries(expectedCommands)) {
    if (value[field] !== command) {
      errors.push(`verification.${field} must be ${command}`);
    }
  }

  return errors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];

  if (scripts["check:mcp-developer-console-log-store-smoke"] !== expectedScript) {
    errors.push(
      `package.json check:mcp-developer-console-log-store-smoke must be ${expectedScript}`
    );
  }

  const rootCheck = String(scripts.check ?? "");
  const developerConsoleIndex = rootCheck.indexOf("npm run check:mcp-developer-console");
  const smokeIndex = rootCheck.indexOf("npm run check:mcp-developer-console-log-store-smoke");
  const clientMaturityIndex = rootCheck.indexOf("npm run check:mcp-client-maturity");

  if (smokeIndex < 0) {
    errors.push("root check must include check:mcp-developer-console-log-store-smoke");
  }

  if (developerConsoleIndex < 0 || smokeIndex < developerConsoleIndex) {
    errors.push("root check must run log-store smoke after mcp-developer-console");
  }

  if (clientMaturityIndex < 0 || smokeIndex > clientMaturityIndex) {
    errors.push("root check must run log-store smoke before mcp-client-maturity");
  }

  return errors;
}

function validateWorkerSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN",
    "MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_ROUTE",
    "MCP_DEVELOPER_CONSOLE_LOG_STORE_SMOKE_HEADER_VALUE",
    "runMcpDeveloperConsoleLogStoreSmoke",
    "missingMcpDeveloperConsoleLogStoreSmokeEnv",
    "isMcpDeveloperConsoleLogStoreSmokeAuthorized",
    "insert into core.mcp_developer_console_request_log",
    "select\n        request_log_id",
    "delete from core.mcp_developer_console_request_log",
    "mcp_developer_console_request_log_insert_select_delete",
    "live_console_log_store_smoke: true",
    "production_console_log_store: false",
    "hashRuntimeSmokeString(requestLogId)",
    "hashRuntimeSmokeString(sourceRecordId)"
  ]) {
    if (!source.includes(text)) {
      errors.push(`worker source must include ${text}`);
    }
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_MCP_DEVELOPER_CONSOLE_LOG_SMOKE_TOKEN",
    "mcp-developer-console-log-store-v1",
    "missing_hyperdrive_binding",
    "insert into core.mcp_developer_console_request_log",
    "delete from core.mcp_developer_console_request_log",
    "live_console_log_store_smoke: true",
    "production_console_log_store: false",
    "not.toContain(rawRequestLogId)",
    "not.toContain(rawSourceRecordId)",
    "not.toContain(\"mock-mcp-developer-console-log-store-connection\")"
  ]) {
    if (!source.includes(text)) {
      errors.push(`test source must include ${text}`);
    }
  }

  return errors;
}

function validateMigration(source, databaseValue) {
  const errors = [];
  const lowerSource = source.toLowerCase();

  for (const text of [
    "create table if not exists core.mcp_developer_console_request_log",
    "request_log_id text primary key",
    "credential_kind in ('oauth_connection', 'api_key')",
    "live_console_log_store_enabled boolean not null default false",
    "developer_console_live boolean not null default false",
    "live_usage_ledger_reads_enabled boolean not null default false",
    "default_rights_status text not null default 'default_deny'"
  ]) {
    if (!lowerSource.includes(text)) {
      errors.push(`migration must include ${text}`);
    }
  }

  const entry = Array.isArray(databaseValue.migrations)
    ? databaseValue.migrations.find((migration) => migration.file === migrationPath)
    : undefined;

  if (!isRecord(entry)) {
    errors.push("database migrations contract must include MCP Developer Console migration");
  } else {
    if (entry.default_rights_status !== "default_deny") {
      errors.push("database migration entry default_rights_status must be default_deny");
    }

    errors.push(...validateStringArray(entry.schemas, ["core", "governance"], "migration.schemas"));
    errors.push(
      ...validateStringArray(
        entry.tables,
        [
          "core.mcp_developer_console_request_log",
          "governance.mcp_developer_console_contract"
        ],
        "migration.tables"
      )
    );
  }

  return errors;
}

function validateLinkedContracts(developerConsoleValue, targetClientsConsoleValue) {
  const errors = [];

  if (developerConsoleValue.route !== "POST /mcp/developer-console/plan") {
    errors.push("developer console contract route mismatch");
  }

  if (developerConsoleValue.live_console_log_store !== false) {
    errors.push("developer console contract must not claim live Console log store");
  }

  if (targetClientsConsoleValue.route !== "POST /mcp/release-gates/target-clients-console/plan") {
    errors.push("target-clients Console gate contract route mismatch");
  }

  if (targetClientsConsoleValue.live_console_log_store !== false) {
    errors.push("target-clients Console gate must keep live_console_log_store false");
  }

  return errors;
}

function validateStringArray(value, requiredValues, name) {
  const errors = [];

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${name} must include ${requiredValue}`);
    }
  }

  if (new Set(value).size !== value.length) {
    errors.push(`${name} must not contain duplicates`);
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
