#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/developer-console.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const runtimePath = "packages/mcp-runtime/src/index.ts";
const workerPath = "apps/worker/src/index.ts";
const migrationPath = "supabase/migrations/20260622014000_mcp_developer_console_scaffold.sql";

const requiredRuntimeCapabilityFields = [
  "mcp_developer_console_backend_ready",
  "mcp_developer_console_route",
  "mcp_developer_console_version",
  "mcp_developer_console_required_checks",
  "mcp_developer_console_log_fields",
  "mcp_developer_console_forbidden_fields",
  "mcp_developer_console_live",
  "developer_console_reconciliation_ready",
  "usage_request_id_visible",
  "usage_reconciliation_ready"
];
const requiredChecks = [
  "connection_guide_surface_ready",
  "api_key_and_oauth_routes_linked",
  "scope_catalog_visible",
  "quota_usage_summary_visible",
  "request_log_schema_ready",
  "examples_cover_initialize_tools_list_tools_call",
  "first_call_guide_under_10_minute_target",
  "no_live_console_claim"
];
const requiredOutputFields = [
  "connection_guide",
  "credentials",
  "scope_panel",
  "quota_panel",
  "request_log_panel",
  "examples",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredGuideSteps = [
  "choose_credential",
  "initialize",
  "list_tools",
  "first_tool_call"
];
const requiredScopes = [
  "security.read",
  "market.read",
  "fundamentals.read",
  "filings.read",
  "analytics.run",
  "portfolio.read",
  "alerts.write",
  "exports.read",
  "admin.usage.read"
];
const requiredRequestLogFields = [
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
const requiredForbiddenFields = [
  "raw_api_key",
  "oauth_access_token",
  "oauth_refresh_token",
  "raw_prompt",
  "raw_generated_answer",
  "raw_document_body",
  "payment_identifier",
  "personal_contact"
];
const requiredMethods = ["initialize", "tools/list", "tools/call"];
const requiredBlockers = [
  "developer_console_ui_missing",
  "live_console_log_store_missing",
  "live_usage_ledger_reads_missing",
  "live_api_key_secret_generation_missing",
  "live_oauth_provider_missing",
  "live_target_client_e2e_missing"
];
const requiredTables = [
  "core.mcp_developer_console_request_log",
  "governance.mcp_developer_console_contract"
];
const requiredLinkedContracts = [
  "deploy/mcp/target-clients-console-release-gate.contract.json",
  "deploy/mcp/compatibility.contract.json",
  "deploy/mcp/api-key.contract.json",
  "deploy/mcp/oauth-pkce.contract.json",
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
const runtimeSource = readText(runtimePath);
const workerSource = readText(workerPath);
const migrationSql = readText(migrationPath);
const errors = validateContract(
  contract,
  databaseContract,
  packageJson,
  runtimeSource,
  workerSource,
  migrationSql
);

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

function validateContract(
  value,
  databaseValue,
  packageValue,
  runtimeValue,
  workerValue,
  migrationValue
) {
  const errors = [];

  expectEqual(
    errors,
    value.version,
    "2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0",
    "version"
  );
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(errors, value.package, "@aiphabee/mcp-runtime", "package");
  expectEqual(errors, value.runtime_route, "GET /mcp/runtime", "runtime_route");
  expectEqual(errors, value.route, "POST /mcp/developer-console/plan", "route");
  expectEqual(errors, value.protocol_route, "POST /mcp", "protocol_route");
  expectEqual(
    errors,
    value.compatibility_status_route,
    "GET /mcp/compatibility/status",
    "compatibility_status_route"
  );
  expectEqual(
    errors,
    value.target_clients_console_gate_route,
    "POST /mcp/release-gates/target-clients-console/plan",
    "target_clients_console_gate_route"
  );
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");
  [
    "developer_console_live",
    "frontend_rendering",
    "persistent_writes",
    "live_api_key_generation",
    "live_console_log_store",
    "live_oauth_provider",
    "live_tool_execution",
    "live_usage_ledger_reads",
    "model_calls",
    "sql_emitted"
  ].forEach((flag) => expectEqual(errors, value[flag], false, flag));

  expectArray(errors, value.required_runtime_capability_fields, requiredRuntimeCapabilityFields, "required_runtime_capability_fields");
  expectArray(errors, value.required_checks, requiredChecks, "required_checks");
  expectArray(errors, value.required_output_fields, requiredOutputFields, "required_output_fields");
  expectArray(errors, value.tables, requiredTables, "tables");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");
  requiredLinkedContracts.forEach((path) => {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  });

  validateConnectionGuide(errors, value.connection_guide_policy);
  validateCredentialPolicy(errors, value.credential_policy);
  validateScopePolicy(errors, value.scope_policy);
  validateQuotaPolicy(errors, value.quota_policy);
  validateRequestLogPolicy(errors, value.request_log_policy);
  validateExamplesPolicy(errors, value.examples_policy);
  validateReleaseGate(errors, value.release_gate);
  validateDatabase(errors, databaseValue, migrationValue);
  validateSources(errors, packageValue, runtimeValue, workerValue);
  forbiddenTextPatterns.forEach((pattern) => {
    if (pattern.test(JSON.stringify(value)) || pattern.test(migrationValue)) {
      errors.push(`forbidden sensitive pattern found: ${pattern.source}`);
    }
  });

  return errors;
}

function validateConnectionGuide(errors, value) {
  expectEqual(errors, value?.artifact, "docs/public/mcp.md", "connection_guide_policy.artifact");
  expectEqual(
    errors,
    value?.time_to_first_call_target_minutes,
    10,
    "connection_guide_policy.time_to_first_call_target_minutes"
  );
  expectEqual(errors, value?.protocol_route, "POST /mcp", "connection_guide_policy.protocol_route");
  expectArray(errors, value?.required_steps, requiredGuideSteps, "connection_guide_policy.required_steps");
  expectEqual(
    errors,
    value?.target_clients_console_gate_linked,
    true,
    "connection_guide_policy.target_clients_console_gate_linked"
  );
}

function validateCredentialPolicy(errors, value) {
  expectEqual(
    errors,
    value?.api_key?.runtime_route,
    "GET /mcp/api-keys/runtime",
    "credential_policy.api_key.runtime_route"
  );
  expectEqual(
    errors,
    value?.api_key?.create_route,
    "POST /mcp/api-keys/create/plan",
    "credential_policy.api_key.create_route"
  );
  expectEqual(
    errors,
    value?.api_key?.rotate_route,
    "POST /mcp/api-keys/rotate/plan",
    "credential_policy.api_key.rotate_route"
  );
  expectEqual(
    errors,
    value?.api_key?.revoke_route,
    "POST /mcp/api-keys/revoke/plan",
    "credential_policy.api_key.revoke_route"
  );
  expectEqual(
    errors,
    value?.api_key?.server_to_server_only,
    true,
    "credential_policy.api_key.server_to_server_only"
  );
  expectEqual(
    errors,
    value?.api_key?.one_time_display,
    true,
    "credential_policy.api_key.one_time_display"
  );
  expectEqual(
    errors,
    value?.api_key?.live_api_key_generation,
    false,
    "credential_policy.api_key.live_api_key_generation"
  );
  expectEqual(
    errors,
    value?.oauth?.runtime_route,
    "GET /mcp/oauth/runtime",
    "credential_policy.oauth.runtime_route"
  );
  expectEqual(
    errors,
    value?.oauth?.authorize_route,
    "POST /mcp/oauth/authorize/plan",
    "credential_policy.oauth.authorize_route"
  );
  expectEqual(
    errors,
    value?.oauth?.token_route,
    "POST /mcp/oauth/token/plan",
    "credential_policy.oauth.token_route"
  );
  expectEqual(
    errors,
    value?.oauth?.revoke_route,
    "POST /mcp/oauth/revoke/plan",
    "credential_policy.oauth.revoke_route"
  );
  expectArray(errors, value?.oauth?.pkce_methods, ["S256"], "credential_policy.oauth.pkce_methods");
  expectEqual(
    errors,
    value?.oauth?.live_oauth_provider,
    false,
    "credential_policy.oauth.live_oauth_provider"
  );
  expectEqual(
    errors,
    value?.oauth?.third_party_token_passthrough,
    false,
    "credential_policy.oauth.third_party_token_passthrough"
  );
}

function validateScopePolicy(errors, value) {
  expectEqual(
    errors,
    value?.scope_catalog_source,
    "docs/researches/AiphaBee_PRD_v1.0.md#9.7",
    "scope_policy.scope_catalog_source"
  );
  expectEqual(errors, value?.scope_visibility, true, "scope_policy.scope_visibility");
  expectArray(errors, value?.required_scopes, requiredScopes, "scope_policy.required_scopes");
  expectEqual(errors, value?.scopes_revocable, true, "scope_policy.scopes_revocable");
}

function validateQuotaPolicy(errors, value) {
  expectEqual(errors, value?.request_id_visible, true, "quota_policy.request_id_visible");
  expectEqual(
    errors,
    value?.freshness_target_minutes,
    5,
    "quota_policy.freshness_target_minutes"
  );
  expectEqual(errors, value?.live_ledger_reads, false, "quota_policy.live_ledger_reads");
  expectArray(
    errors,
    value?.display_fields,
    [
      "request_id",
      "plan_code",
      "period",
      "credit_limit",
      "credits_used",
      "credits_pending",
      "credits_remaining"
    ],
    "quota_policy.display_fields"
  );
}

function validateRequestLogPolicy(errors, value) {
  expectEqual(errors, value?.live_log_store, false, "request_log_policy.live_log_store");
  expectEqual(
    errors,
    value?.usage_ledger_reads_live,
    false,
    "request_log_policy.usage_ledger_reads_live"
  );
  expectEqual(
    errors,
    value?.status_source,
    "GET /mcp/compatibility/status",
    "request_log_policy.status_source"
  );
  expectArray(errors, value?.fields, requiredRequestLogFields, "request_log_policy.fields");
  expectArray(errors, value?.forbidden_fields, requiredForbiddenFields, "request_log_policy.forbidden_fields");
}

function validateExamplesPolicy(errors, value) {
  expectEqual(errors, value?.protocol_route, "POST /mcp", "examples_policy.protocol_route");
  expectEqual(errors, value?.live_tool_execution, false, "examples_policy.live_tool_execution");
  expectArray(errors, value?.methods, requiredMethods, "examples_policy.methods");
}

function validateReleaseGate(errors, value) {
  expectEqual(
    errors,
    value?.gate_status,
    "blocked_live_mcp_developer_console_validation",
    "release_gate.gate_status"
  );
  expectEqual(errors, value?.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArray(
    errors,
    value?.required_signoffs,
    ["platform", "developer-relations", "support", "billing", "security"],
    "release_gate.required_signoffs"
  );
  expectArray(errors, value?.blockers, requiredBlockers, "release_gate.blockers");
}

function validateDatabase(errors, databaseValue, migrationValue) {
  const migration = databaseValue.migrations?.find(
    (candidate) => candidate.file === migrationPath
  );
  if (!migration) {
    errors.push(`database contract must list ${migrationPath}`);
    return;
  }
  expectArray(errors, migration.schemas, ["core", "governance"], "database migration schemas");
  expectArray(errors, migration.tables, requiredTables, "database migration tables");
  expectEqual(errors, migration.market_data, false, "database migration market_data");
  expectEqual(
    errors,
    migration.default_rights_status,
    "default_deny",
    "database migration default_rights_status"
  );
  requiredTables.forEach((table) => {
    if (!migrationValue.toLowerCase().includes(`create table if not exists ${table}`)) {
      errors.push(`migration must create ${table}`);
    }
  });
  if (!migrationValue.includes("blocked_live_mcp_developer_console_validation")) {
    errors.push("migration must preserve blocked live Developer Console gate status");
  }
}

function validateSources(errors, packageValue, runtimeValue, workerValue) {
  if (packageValue.scripts?.["check:mcp-developer-console"] !== "node scripts/check-mcp-developer-console-contract.mjs") {
    errors.push("package.json must expose check:mcp-developer-console");
  }
  [
    "MCP_DEVELOPER_CONSOLE_VERSION",
    "MCP_DEVELOPER_CONSOLE_REQUIRED_CHECKS",
    "MCP_DEVELOPER_CONSOLE_REQUEST_LOG_FIELDS",
    "getMcpDeveloperConsoleCapabilities",
    "createMcpDeveloperConsolePlan"
  ].forEach((needle) => {
    if (!runtimeValue.includes(needle)) {
      errors.push(`runtime source missing ${needle}`);
    }
  });
  if (!workerValue.includes('app.post("/mcp/developer-console/plan"')) {
    errors.push("worker source must expose POST /mcp/developer-console/plan");
  }
  if (!workerValue.includes("createMcpDeveloperConsolePlan")) {
    errors.push("worker source must call createMcpDeveloperConsolePlan");
  }
}

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} must be ${JSON.stringify(expected)}`);
  }
}

function expectArray(errors, actual, expected, label) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (actual.join("\n") !== expected.join("\n")) {
    errors.push(`${label} mismatch`);
  }
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
