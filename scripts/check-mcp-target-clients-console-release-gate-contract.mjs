#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/target-clients-console-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationPath =
  "supabase/migrations/20260621137000_mcp_target_clients_console_release_gate_scaffold.sql";
const requiredRuntimeCapabilityFields = [
  "mcp_target_clients_console_release_gate_ready",
  "mcp_target_clients_console_release_gate_route",
  "mcp_target_clients_console_release_gate_version",
  "mcp_target_clients_console_release_gate_required_checks",
  "mcp_target_client_e2e_matrix_ready",
  "developer_console_reconciliation_ready",
  "developer_console_live",
  "mcp_compatibility_status_route",
  "mcp_live_client_e2e_passed",
  "usage_request_id_visible",
  "usage_reconciliation_ready"
];
const requiredChecks = [
  "target_client_matrix_present",
  "inspector_and_sdk_smoke_vectors_planned",
  "first_call_guide_under_10_minute_target",
  "console_reconciliation_fields_present",
  "request_usage_scope_and_key_reconciliation_ready",
  "compatibility_status_linked",
  "no_live_console_or_client_claim"
];
const requiredOutputFields = [
  "target_client_gate",
  "console_reconciliation_gate",
  "compatibility_gate",
  "protocol_gate",
  "auth_limits_gate",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredTargetClients = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
];
const requiredConsoleFields = [
  "request_id",
  "workspace_id",
  "client_name",
  "client_version",
  "credential_kind",
  "credential_reference",
  "scope",
  "tool_name",
  "tool_version",
  "status",
  "standard_error_code",
  "credits",
  "credits_remaining",
  "usage_event_id",
  "data_version",
  "methodology_version",
  "source_record_id"
];
const requiredForbiddenConsoleFields = [
  "raw_api_key",
  "oauth_access_token",
  "oauth_refresh_token",
  "raw_prompt",
  "raw_generated_answer",
  "raw_document_body",
  "payment_identifier",
  "personal_contact"
];
const requiredBlockers = [
  "live_target_client_e2e_missing",
  "developer_console_ui_missing",
  "live_console_log_store_missing",
  "live_usage_ledger_reads_missing",
  "public_status_page_deploy_missing"
];
const requiredTables = [
  "core.mcp_target_clients_console_release_gate",
  "governance.mcp_target_clients_console_release_gate_contract"
];
const requiredCoveredItems = [
  "mcp_target_client_e2e",
  "developer_console_reconciliation"
];
const requiredLinkedContracts = [
  "deploy/mcp/compatibility.contract.json",
  "deploy/mcp/protocol-release-gate.contract.json",
  "deploy/mcp/auth-limits-release-gate.contract.json",
  "deploy/mcp/usage-envelope.contract.json",
  "deploy/database/migrations.contract.json"
];
const forbiddenTextPatterns = [
  /(?:^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson(packageJsonPath);
const migrationSql = readText(migrationPath);
const errors = validateContract(contract, databaseContract, packageJson, migrationSql);

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
    checks: contract.required_checks.length,
    route: contract.route,
    status: "ok",
    target_clients: contract.target_client_policy.target_clients.length,
    version: contract.version
  },
  0
);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "invalid_json"
      },
      1
    );
  }
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_text"
      },
      1
    );
  }
}

function validateContract(value, databaseValue, packageValue, migrationValue) {
  const errors = [];

  expectEqual(
    errors,
    value.version,
    "2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0",
    "version"
  );
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(errors, value.package, "@aiphabee/mcp-runtime", "package");
  expectEqual(errors, value.runtime_route, "GET /mcp/runtime", "runtime_route");
  expectEqual(
    errors,
    value.route,
    "POST /mcp/release-gates/target-clients-console/plan",
    "route"
  );
  expectEqual(errors, value.protocol_route, "POST /mcp", "protocol_route");
  expectEqual(
    errors,
    value.compatibility_status_route,
    "GET /mcp/compatibility/status",
    "compatibility_status_route"
  );
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");
  [
    "developer_console_live",
    "frontend_rendering",
    "persistent_writes",
    "live_client_e2e_passed",
    "live_console_log_store",
    "live_db_writes",
    "live_sdk_inspector_smoke",
    "live_tool_execution",
    "live_usage_ledger_reads",
    "model_calls",
    "sql_emitted"
  ].forEach((flag) => expectEqual(errors, value[flag], false, flag));

  expectArray(errors, value.required_runtime_capability_fields, requiredRuntimeCapabilityFields, "required_runtime_capability_fields");
  expectArray(errors, value.required_checks, requiredChecks, "required_checks");
  expectArray(errors, value.required_output_fields, requiredOutputFields, "required_output_fields");
  expectArray(errors, value.tables, requiredTables, "tables");
  expectArray(errors, value.covered_sprint_3_3_items, requiredCoveredItems, "covered_sprint_3_3_items");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");
  for (const path of requiredLinkedContracts) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }

  expectEqual(
    errors,
    value.target_client_policy?.target_protocol_version,
    "2025-03-26",
    "target_client_policy.target_protocol_version"
  );
  expectEqual(
    errors,
    value.target_client_policy?.time_to_first_call_target_minutes,
    10,
    "target_client_policy.time_to_first_call_target_minutes"
  );
  expectEqual(
    errors,
    value.target_client_policy?.connection_guide_artifact,
    "docs/public/mcp.md",
    "target_client_policy.connection_guide_artifact"
  );
  expectEqual(errors, existsSync(resolve(process.cwd(), "docs/public/mcp.md")), true, "docs/public/mcp.md exists");
  expectArray(
    errors,
    value.target_client_policy?.target_clients,
    requiredTargetClients,
    "target_client_policy.target_clients"
  );
  expectArray(
    errors,
    value.target_client_policy?.planned_checks,
    ["connectivity", "initialize", "tools/list", "tools/call", "console_reconciliation"],
    "target_client_policy.planned_checks"
  );
  expectEqual(
    errors,
    value.target_client_policy?.live_e2e_passed,
    false,
    "target_client_policy.live_e2e_passed"
  );

  expectEqual(
    errors,
    value.console_reconciliation_policy?.console_live,
    false,
    "console_reconciliation_policy.console_live"
  );
  expectEqual(
    errors,
    value.console_reconciliation_policy?.log_store_live,
    false,
    "console_reconciliation_policy.log_store_live"
  );
  expectEqual(
    errors,
    value.console_reconciliation_policy?.usage_ledger_reads_live,
    false,
    "console_reconciliation_policy.usage_ledger_reads_live"
  );
  expectEqual(
    errors,
    value.console_reconciliation_policy?.request_id_visible,
    true,
    "console_reconciliation_policy.request_id_visible"
  );
  expectEqual(
    errors,
    value.console_reconciliation_policy?.scope_visibility,
    true,
    "console_reconciliation_policy.scope_visibility"
  );
  expectEqual(
    errors,
    value.console_reconciliation_policy?.status_source,
    "GET /mcp/compatibility/status",
    "console_reconciliation_policy.status_source"
  );
  expectArray(
    errors,
    value.console_reconciliation_policy?.required_fields,
    requiredConsoleFields,
    "console_reconciliation_policy.required_fields"
  );
  expectArray(
    errors,
    value.console_reconciliation_policy?.forbidden_fields,
    requiredForbiddenConsoleFields,
    "console_reconciliation_policy.forbidden_fields"
  );

  expectEqual(
    errors,
    value.release_gate?.gate_status,
    "blocked_live_mcp_target_clients_console_validation",
    "release_gate.gate_status"
  );
  expectEqual(errors, value.release_gate?.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArray(
    errors,
    value.release_gate?.required_signoffs,
    ["platform", "developer-relations", "support", "billing", "data-rights"],
    "release_gate.required_signoffs"
  );
  expectArray(errors, value.release_gate?.blockers, requiredBlockers, "release_gate.blockers");

  if (packageValue.scripts?.["check:mcp-target-clients-console-release-gate"] !== "node scripts/check-mcp-target-clients-console-release-gate-contract.mjs") {
    errors.push("package.json missing check:mcp-target-clients-console-release-gate script");
  }
  if (typeof packageValue.scripts?.check !== "string" || !packageValue.scripts.check.includes("npm run check:mcp-target-clients-console-release-gate")) {
    errors.push("package.json root check does not include check:mcp-target-clients-console-release-gate");
  }

  const migrationEntry = databaseValue.migrations?.find((entry) => entry.file === migrationPath);
  if (migrationEntry === undefined) {
    errors.push("database migrations contract missing MCP target clients Console release gate migration");
  } else {
    expectArray(errors, migrationEntry.tables, requiredTables, "database.migration.tables");
    expectEqual(errors, migrationEntry.default_rights_status, "default_deny", "database.migration.default_rights_status");
    expectEqual(errors, migrationEntry.market_data, false, "database.migration.market_data");
  }

  for (const table of requiredTables) {
    if (!migrationValue.includes(table)) {
      errors.push(`migration missing table ${table}`);
    }
  }
  [
    "developer_console_live boolean not null default false",
    "live_client_e2e_passed boolean not null default false",
    "live_console_log_store_enabled boolean not null default false",
    "live_usage_ledger_reads_enabled boolean not null default false",
    "live_tool_execution_enabled boolean not null default false",
    "live_db_writes_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "gate_status text not null default 'blocked_live_mcp_target_clients_console_validation'"
  ].forEach((snippet) => {
    if (!migrationValue.includes(snippet)) {
      errors.push(`migration missing no-live snippet: ${snippet}`);
    }
  });

  const scannedText = [
    readText(contractPath),
    readText(packageJsonPath),
    readText(databaseContractPath),
    migrationValue
  ].join("\n");
  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(scannedText)) {
      errors.push(`forbidden secret-like pattern matched: ${pattern}`);
    }
  }

  return errors;
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} expected array`);
    return;
  }

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} mismatch: expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
