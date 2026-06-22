#!/usr/bin/env node
import { readFileSync } from "node:fs";

const contractPath = "deploy/agent/billing-posted-ledger-smoke.contract.json";
const packagePath = "package.json";
const workerPath = "apps/worker/src/index.ts";
const testPath = "apps/worker/src/agent-billing-posted-ledger-smoke.test.ts";
const migrationPath = "supabase/migrations/20260622017000_agent_billing_posted_ledger_smoke.sql";
const databaseContractPath = "deploy/database/migrations.contract.json";
const liveWriteContractPath = "deploy/agent/run-live-write-smoke.contract.json";
const usageQuotaContractPath = "deploy/usage/quota-display.contract.json";
const billingReconciliationContractPath = "deploy/usage/billing-reconciliation.contract.json";

const expectedVersion = "2026-06-22.phase1.agent-billing-posted-ledger-smoke.v0";
const expectedScript = "node scripts/check-agent-billing-posted-ledger-smoke-contract.mjs";
const expectedRoute = "POST /agent/runs/billing-posted-ledger-smoke";
const expectedToken = "AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN";
const expectedHeader = "agent-billing-posted-ledger-v1";
const expectedSurface = "agent_billing_posted_ledger_preview_to_posted_idempotency";
const expectedTables = [
  "core.account",
  "core.workspace",
  "core.usage_meter_rule",
  "core.usage_event",
  "core.usage_ledger_entry"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];
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
    "scripts/check-agent-billing-posted-ledger-smoke-contract.mjs",
    "contract.checker"
  );
  expectEqual(
    contract.test_file,
    "apps/worker/src/agent-billing-posted-ledger-smoke.test.ts",
    "contract.test_file"
  );
  expectEqual(contract.worker_entrypoint, workerPath, "contract.worker_entrypoint");
  expectEqual(contract.migration, migrationPath, "contract.migration");
  expectEqual(contract.database_contract, databaseContractPath, "contract.database_contract");
  expectEqual(
    contract.agent_live_write_contract,
    liveWriteContractPath,
    "contract.agent_live_write_contract"
  );
  expectEqual(
    contract.usage_ledger_contract,
    usageQuotaContractPath,
    "contract.usage_ledger_contract"
  );
  expectEqual(
    contract.billing_reconciliation_contract,
    billingReconciliationContractPath,
    "contract.billing_reconciliation_contract"
  );
  expectEqual(contract.smoke_token_binding, expectedToken, "contract.smoke_token_binding");
  expectEqual(contract.smoke_header?.name, "x-aiphabee-smoke", "contract.smoke_header.name");
  expectEqual(contract.smoke_header?.value, expectedHeader, "contract.smoke_header.value");
  expectEqual(contract.hyperdrive_binding, "AIPHABEE_HYPERDRIVE", "contract.hyperdrive_binding");
  expectBoolean(contract.actual_hyperdrive_execution, true, "actual_hyperdrive_execution");
  expectBoolean(contract.transactional_preview_to_posted, true, "transactional_preview_to_posted");
  expectBoolean(contract.preview_state_verified, true, "preview_state_verified");
  expectBoolean(contract.posted_state_verified, true, "posted_state_verified");
  expectBoolean(contract.idempotency_no_double_charge, true, "idempotency_no_double_charge");
  expectBoolean(contract.synthetic_posted_transition, true, "synthetic_posted_transition");
  expectBoolean(contract.cleanup_verified, true, "cleanup_verified");
  expectBoolean(contract.auth_enforced_before_db, true, "auth_enforced_before_db");
  expectBoolean(contract.hash_only_response, true, "hash_only_response");
  expectBoolean(contract.billing_provider_calls, false, "billing_provider_calls");
  expectBoolean(contract.invoice_writes, false, "invoice_writes");
  expectBoolean(contract.production_billing_posted, false, "production_billing_posted");
  expectBoolean(contract.frontend, false, "frontend");
  expectBoolean(contract.user_facing_streaming, false, "user_facing_streaming");
  expectArrayEqual(contract.tables, expectedTables, "contract.tables");

  for (const notClaimed of [
    "production_billing_posting",
    "billing_provider_calls",
    "invoice_writes",
    "live_billing_reconciliation",
    "production_agent_run_persistence",
    "production_user_run_state_persistence",
    "user_facing_live_model_streaming",
    "frontend_ask_rendering",
    "ai_gateway_logs_read"
  ]) {
    if (!contract.not_claimed?.includes(notClaimed)) {
      errors.push(`contract.not_claimed must include ${notClaimed}`);
    }
  }

  expectEqual(
    contract.verification?.unit_test,
    "npm run test -- apps/worker/src/agent-billing-posted-ledger-smoke.test.ts",
    "verification.unit_test"
  );
  expectEqual(
    contract.verification?.contract_check,
    "npm run check:agent-billing-posted-ledger-smoke",
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
    scripts["check:agent-billing-posted-ledger-smoke"],
    expectedScript,
    "package.json check:agent-billing-posted-ledger-smoke"
  );

  const rootCheck = scripts.check ?? "";
  const billingIndex = rootCheck.indexOf("npm run check:agent-billing-posted-ledger-smoke");
  const stateIndex = rootCheck.indexOf("npm run check:agent-run-state-persistence-smoke");
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (billingIndex === -1) {
    errors.push("root check must include check:agent-billing-posted-ledger-smoke");
  }

  if (billingIndex !== -1 && stateIndex !== -1 && billingIndex < stateIndex) {
    errors.push("root check must run billing posted ledger smoke after state persistence smoke");
  }

  if (billingIndex !== -1 && observabilityIndex !== -1 && billingIndex > observabilityIndex) {
    errors.push("root check must run billing posted ledger smoke before observability checks");
  }
}

function validateWorkerSource(source) {
  for (const needle of [
    "AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN?: string",
    'const AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE =',
    '"/agent/runs/billing-posted-ledger-smoke"',
    'const AGENT_BILLING_POSTED_LEDGER_SMOKE_HEADER_VALUE =',
    '"agent-billing-posted-ledger-v1"',
    "AGENT_BILLING_POSTED_LEDGER_SMOKE_TOKEN_BINDING",
    "app.post(AGENT_BILLING_POSTED_LEDGER_SMOKE_ROUTE",
    "missingAgentBillingPostedLedgerSmokeEnv",
    "isAgentBillingPostedLedgerSmokeAuthorized",
    "runAgentBillingPostedLedgerSmoke",
    "createUsageLedgerEventPlan",
    "insert into core.account",
    "insert into core.workspace",
    "insert into core.usage_meter_rule",
    "insert into core.usage_event",
    "insert into core.usage_ledger_entry",
    "billable_state = 'preview'",
    "billable_state = 'posted'",
    "posted_at = $2::timestamptz",
    "delete from core.usage_ledger_entry",
    "delete from core.usage_event",
    "idempotent_skipped_rows",
    "no_double_charge_verified",
    "billing_provider_calls: false",
    "production_billing_posted: false",
    expectedSurface
  ]) {
    expectIncludes(source, needle, workerPath);
  }
}

function validateTestSource(source) {
  for (const needle of [
    'const SMOKE_ROUTE = "/agent/runs/billing-posted-ledger-smoke"',
    'const SMOKE_TOKEN = "agent-billing-posted-ledger-smoke-token-000000"',
    '"x-aiphabee-smoke": "agent-billing-posted-ledger-v1"',
    "AIPHABEE_AGENT_BILLING_LEDGER_SMOKE_TOKEN",
    "AIPHABEE_HYPERDRIVE",
    "insert into core.usage_event",
    "insert into core.usage_ledger_entry",
    "update core.usage_ledger_entry",
    "billable_state = 'preview'",
    "billable_state = 'posted'",
    "delete from core.usage_ledger_entry",
    "idempotent_skipped_rows: 0",
    "no_double_charge_verified: true",
    "billing_provider_calls: false",
    "production_billing_posted: false",
    "synthetic_posted_transition: true",
    "operation_count: 16",
    'not.toContain("mock-agent-billing-posted-ledger-connection")'
  ]) {
    expectIncludes(source, needle, testPath);
  }
}

function validateMigration(source) {
  const lower = source.toLowerCase();

  for (const needle of [
    "create table if not exists governance.agent_billing_posted_ledger_smoke_contract",
    "guarded_smoke_only boolean not null default true",
    "synthetic_posted_transition boolean not null default true",
    "billing_provider_calls boolean not null default false",
    "invoice_writes boolean not null default false",
    "production_billing_posted boolean not null default false",
    "default_rights_status = 'default_deny'",
    "2026-06-22.phase1.agent-billing-posted-ledger-smoke.v0"
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

  expectArrayEqual(entry.schemas, ["governance"], "database entry schemas");
  expectArrayEqual(
    entry.tables,
    ["governance.agent_billing_posted_ledger_smoke_contract"],
    "database entry tables"
  );
  expectBoolean(entry.market_data, false, "database entry market_data");
  expectEqual(entry.default_rights_status, "default_deny", "database entry default_rights_status");
}

function validateLinkedContracts() {
  const liveWrite = readJson(liveWriteContractPath);
  const usageQuota = readJson(usageQuotaContractPath);
  const billingReconciliation = readJson(billingReconciliationContractPath);

  expectEqual(liveWrite.route, "POST /agent/runs/live-write-smoke", "live write route");
  expectBoolean(liveWrite.billing_posted, false, "live write billing_posted precondition");

  for (const table of ["core.usage_event", "core.usage_ledger_entry"]) {
    if (!usageQuota.tables?.includes(table)) {
      errors.push(`usage quota contract must include ${table}`);
    }

    if (!billingReconciliation.tables?.includes(table)) {
      errors.push(`billing reconciliation contract must include ${table}`);
    }
  }
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern.source}`);
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
validateNoSecrets(contract);

if (errors.length > 0) {
  console.error(
    JSON.stringify(
      {
        errors,
        path: contractPath,
        status: "invalid_contract"
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
      route: contract.route,
      status: "ok",
      tables: contract.tables.length,
      token_binding: contract.smoke_token_binding
    },
    null,
    2
  )
);
