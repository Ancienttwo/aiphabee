#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/run-live-write-smoke.contract.json";
const packagePath = "package.json";
const workerPath = "apps/worker/src/index.ts";
const testPath = "apps/worker/src/agent-run-live-write-smoke.test.ts";
const migrationPath = "deploy/database/migrations/20260622015000_agent_run_live_write_smoke.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const observabilityContractPath = "deploy/observability/events.contract.json";
const evidenceLiveDbContractPath = "deploy/evidence/live-db-write-smoke.contract.json";
const usageQuotaContractPath = "deploy/usage/quota-display.contract.json";
const expectedVersion = "2026-06-22.phase1.agent-run-live-write-smoke.v0";
const expectedScript = "node scripts/check-agent-run-live-write-smoke-contract.mjs";
const requiredTables = [
  "aiphabee_audit.agent_run_audit_event",
  "aiphabee_core.evidence_record",
  "aiphabee_core.evidence_source_ref",
  "platform.account",
  "platform.workspace",
  "aiphabee_core.usage_meter_rule",
  "aiphabee_core.usage_event",
  "aiphabee_core.usage_ledger_entry"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const databaseContract = readJson(databaseContractPath);
const observabilityContract = readJson(observabilityContractPath);
const evidenceLiveDbContract = readJson(evidenceLiveDbContractPath);
const usageQuotaContract = readJson(usageQuotaContractPath);
const workerSource = readText(workerPath);
const testSource = readText(testPath);
const migrationSource = readText(migrationPath);
const errors = [
  ...validateContract(contract),
  ...validatePackage(packageJson),
  ...validateWorkerSource(workerSource),
  ...validateTestSource(testSource),
  ...validateMigration(migrationSource, databaseContract),
  ...validateLinkedContracts(observabilityContract, evidenceLiveDbContract, usageQuotaContract),
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
    tables: contract.tables.length,
    token_binding: contract.smoke_token_binding
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["agent run live write smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-agent-run-live-write-smoke-contract.mjs",
    database_contract: databaseContractPath,
    evidence_live_db_write_contract: evidenceLiveDbContractPath,
    hyperdrive_binding: "AIPHABEE_HYPERDRIVE",
    migration: migrationPath,
    observability_event_contract: observabilityContractPath,
    route: "POST /agent/runs/live-write-smoke",
    smoke_token_binding: "AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN",
    status: "local_contract",
    test_file: testPath,
    usage_ledger_contract: usageQuotaContractPath,
    version: expectedVersion,
    worker_entrypoint: workerPath
  };

  for (const [field, expected] of Object.entries(expectedFields)) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  if (!isRecord(value.smoke_header)) {
    errors.push("smoke_header must be an object");
  } else {
    if (value.smoke_header.name !== "x-aiphabee-smoke") {
      errors.push("smoke_header.name must be x-aiphabee-smoke");
    }

    if (value.smoke_header.value !== "agent-run-live-write-v1") {
      errors.push("smoke_header.value must be agent-run-live-write-v1");
    }
  }

  for (const field of [
    "actual_hyperdrive_execution",
    "auth_enforced_before_db",
    "cleanup_verified",
    "hash_only_response",
    "live_audit_write_smoke",
    "live_evidence_write_smoke",
    "live_usage_ledger_write_smoke",
    "transactional_insert_select_delete"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "billing_posted",
    "durable_run_state_persistence",
    "frontend",
    "production_persistence_enabled",
    "user_facing_streaming"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "production_agent_run_persistence",
        "durable_run_state_persistence",
        "user_facing_live_model_streaming",
        "frontend_ask_rendering",
        "production_billing_posting",
        "ai_gateway_logs_read",
        "production_unsourced_numeric_sampling"
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
    contract_check: "npm run check:agent-run-live-write-smoke",
    database_check: "npm run check:database",
    unit_test: "npm run test -- apps/worker/src/agent-run-live-write-smoke.test.ts",
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

  if (scripts["check:agent-run-live-write-smoke"] !== expectedScript) {
    errors.push(`package.json check:agent-run-live-write-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const generatedAnswerIndex = rootCheck.indexOf(
    "npm run check:agent-generated-answer-evidence-smoke"
  );
  const liveWriteIndex = rootCheck.indexOf("npm run check:agent-run-live-write-smoke");
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (liveWriteIndex < 0) {
    errors.push("root check must include check:agent-run-live-write-smoke");
  }

  if (generatedAnswerIndex < 0 || liveWriteIndex < generatedAnswerIndex) {
    errors.push("root check must run Agent run live write smoke after generated-answer smoke");
  }

  if (observabilityIndex < 0 || liveWriteIndex > observabilityIndex) {
    errors.push("root check must run Agent run live write smoke before observability checks");
  }

  return errors;
}

function validateWorkerSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN",
    "AGENT_RUN_LIVE_WRITE_SMOKE_ROUTE",
    "AGENT_RUN_LIVE_WRITE_SMOKE_HEADER_VALUE",
    "runAgentRunLiveWriteSmoke",
    "isAgentRunLiveWriteSmokeAuthorized",
    "createAgentDryRunTelemetry",
    "createEvidenceRecordPlan",
    "createUsageLedgerEventPlan",
    "insert into aiphabee_audit.agent_run_audit_event",
    "insert into aiphabee_core.evidence_record",
    "insert into aiphabee_core.usage_event",
    "insert into aiphabee_core.usage_ledger_entry",
    "delete from aiphabee_core.usage_ledger_entry",
    "delete from aiphabee_audit.agent_run_audit_event",
    "production_persistence_enabled: false",
    "agent_run_audit_evidence_usage_insert_select_delete"
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
    "AIPHABEE_AGENT_RUN_LIVE_WRITE_SMOKE_TOKEN",
    "agent-run-live-write-v1",
    "insert into aiphabee_audit.agent_run_audit_event",
    "insert into aiphabee_core.evidence_record",
    "insert into aiphabee_core.usage_event",
    "insert into aiphabee_core.usage_ledger_entry",
    "delete from aiphabee_core.usage_ledger_entry",
    "delete from aiphabee_audit.agent_run_audit_event",
    "cleanup_verified: true",
    "production_persistence_enabled: false",
    "not.toContain(\"mock-agent-run-live-write-connection\")"
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
    "create schema if not exists aiphabee_audit",
    "create schema if not exists aiphabee_governance",
    "create table if not exists aiphabee_audit.agent_run_audit_event",
    "create table if not exists aiphabee_governance.agent_run_live_write_smoke_contract",
    "default_deny",
    "production_persistence_enabled boolean not null default false",
    "guarded_smoke_only boolean not null default true"
  ]) {
    if (!lowerSource.includes(text)) {
      errors.push(`migration must include ${text}`);
    }
  }

  const entry = Array.isArray(databaseValue.migrations)
    ? databaseValue.migrations.find((migration) => migration.file === migrationPath)
    : undefined;

  if (!isRecord(entry)) {
    errors.push("database migrations contract must include agent run live write migration");
  } else {
    if (entry.market_data !== false) {
      errors.push("database migration entry market_data must be false");
    }

    if (entry.default_rights_status !== "default_deny") {
      errors.push("database migration entry default_rights_status must be default_deny");
    }

    errors.push(...validateStringArray(entry.schemas, ["aiphabee_audit", "aiphabee_governance"], "migration.schemas"));
    errors.push(
      ...validateStringArray(
        entry.tables,
        ["aiphabee_audit.agent_run_audit_event", "aiphabee_governance.agent_run_live_write_smoke_contract"],
        "migration.tables"
      )
    );
  }

  return errors;
}

function validateLinkedContracts(observabilityValue, evidenceValue, usageValue) {
  const errors = [];

  const eventTypes = Array.isArray(observabilityValue.event_types)
    ? observabilityValue.event_types.map((eventType) => eventType.type)
    : [];

  if (!eventTypes.includes("run.audit")) {
    errors.push("observability contract must include run.audit");
  }

  if (evidenceValue.route !== "POST /evidence/records/live-db-smoke") {
    errors.push("evidence live DB smoke route mismatch");
  }

  if (evidenceValue.hyperdrive_binding !== "AIPHABEE_HYPERDRIVE") {
    errors.push("evidence live DB smoke must use AIPHABEE_HYPERDRIVE");
  }

  errors.push(
    ...validateStringArray(
      usageValue.tables,
      ["aiphabee_core.usage_event", "aiphabee_core.usage_ledger_entry"],
      "usage_quota.tables"
    )
  );

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
