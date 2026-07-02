#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/auth-limits-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationPath =
  "deploy/database/migrations/20260621136000_mcp_auth_limits_release_gate_scaffold.sql";
const requiredRuntimeCapabilityFields = [
  "mcp_auth_limits_release_gate_ready",
  "mcp_auth_limits_release_gate_route",
  "mcp_auth_limits_release_gate_version",
  "mcp_auth_limits_release_gate_required_checks",
  "oauth_pkce_ready",
  "oauth_revoke_enforced_before_new_calls",
  "api_key_rotation_old_key_denied",
  "api_key_revoke_enforced_before_new_calls",
  "cursor_pagination_ready",
  "pagination_or_rights_bypass_blocked",
  "max_row_limit_enforced",
  "time_range_limits_ready",
  "mcp_tool_limiter_ready",
  "standard_error_codes_ready"
];
const requiredChecks = [
  "oauth_scope_catalog_and_pkce_ready",
  "oauth_revoke_denies_future_calls",
  "api_key_rotation_denies_old_key",
  "api_key_revoke_denies_future_calls",
  "cursor_pagination_bypass_blocked",
  "quota_and_limit_bypass_blocked",
  "standard_error_codes_stable"
];
const requiredOutputFields = [
  "oauth_scope_gate",
  "api_key_gate",
  "limit_gate",
  "error_stability_gate",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredBlockers = [
  "live_oauth_provider_missing",
  "live_token_store_missing",
  "live_api_key_secret_generation_missing",
  "live_limiter_window_reads_missing",
  "live_usage_ledger_writes_missing"
];
const requiredTables = [
  "aiphabee_core.mcp_auth_limits_release_gate",
  "aiphabee_governance.mcp_auth_limits_release_gate_contract"
];
const requiredCoveredItems = [
  "mcp_oauth_scope_revoke_key_rotation",
  "mcp_cursor_and_limit_bypass_blocked",
  "mcp_standard_error_stability"
];
const requiredLinkedContracts = [
  "deploy/mcp/oauth-pkce.contract.json",
  "deploy/mcp/api-key.contract.json",
  "deploy/mcp/revocation-enforcement.contract.json",
  "deploy/mcp/pagination-limits.contract.json",
  "deploy/mcp/tool-limiter.contract.json",
  "deploy/mcp/error-codes.contract.json",
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
    "2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0",
    "version"
  );
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(errors, value.package, "@aiphabee/mcp-runtime", "package");
  expectEqual(errors, value.runtime_route, "GET /mcp/runtime", "runtime_route");
  expectEqual(errors, value.route, "POST /mcp/release-gates/auth-limits/plan", "route");
  expectEqual(errors, value.protocol_route, "POST /mcp", "protocol_route");
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");
  [
    "frontend_rendering",
    "persistent_writes",
    "live_api_key_generation",
    "live_auth_middleware",
    "live_db_writes",
    "live_limiter_enforcement",
    "live_oauth_provider",
    "live_tool_execution",
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

  expectEqual(errors, value.oauth_policy?.pkce_method, "S256", "oauth_policy.pkce_method");
  expectEqual(errors, value.oauth_policy?.plain_method_allowed, false, "oauth_policy.plain_method_allowed");
  expectEqual(errors, value.oauth_policy?.scopes_revocable, true, "oauth_policy.scopes_revocable");
  expectArray(
    errors,
    value.oauth_policy?.sample_scopes,
    ["security.read", "market.read", "analytics.run"],
    "oauth_policy.sample_scopes"
  );
  expectEqual(
    errors,
    value.oauth_policy?.revoked_standard_error,
    "AUTH_REQUIRED",
    "oauth_policy.revoked_standard_error"
  );

  expectEqual(errors, value.api_key_policy?.server_to_server_only, true, "api_key_policy.server_to_server_only");
  expectEqual(errors, value.api_key_policy?.raw_key_stored, false, "api_key_policy.raw_key_stored");
  expectEqual(errors, value.api_key_policy?.live_secret_generated, false, "api_key_policy.live_secret_generated");
  expectEqual(
    errors,
    value.api_key_policy?.old_key_future_calls_denied_after_rotation,
    true,
    "api_key_policy.old_key_future_calls_denied_after_rotation"
  );
  expectEqual(
    errors,
    value.api_key_policy?.future_calls_denied_after_revoke,
    true,
    "api_key_policy.future_calls_denied_after_revoke"
  );

  expectEqual(errors, value.limit_policy?.sample_tool_name, "get_price_history", "limit_policy.sample_tool_name");
  expectEqual(errors, value.limit_policy?.required_scope, "prices:read", "limit_policy.required_scope");
  expectEqual(errors, value.limit_policy?.cursor_opaque, true, "limit_policy.cursor_opaque");
  expectEqual(errors, value.limit_policy?.cursor_bound_to_request, true, "limit_policy.cursor_bound_to_request");
  expectEqual(errors, value.limit_policy?.plan_or_rights_bypass_blocked, true, "limit_policy.plan_or_rights_bypass_blocked");
  expectEqual(errors, value.limit_policy?.max_rows_enforced, true, "limit_policy.max_rows_enforced");
  expectEqual(errors, value.limit_policy?.max_limit, 3, "limit_policy.max_limit");
  expectEqual(errors, value.limit_policy?.too_many_rows_standard_error, "TOO_MANY_ROWS", "limit_policy.too_many_rows_standard_error");
  expectEqual(errors, value.limit_policy?.time_range_standard_error, "OUT_OF_RANGE", "limit_policy.time_range_standard_error");
  expectEqual(errors, value.limit_policy?.rate_limit_standard_error, "RATE_LIMITED", "limit_policy.rate_limit_standard_error");
  expectEqual(errors, value.limit_policy?.budget_standard_error, "BUDGET_EXCEEDED", "limit_policy.budget_standard_error");
  expectEqual(errors, value.limit_policy?.live_window_reads, false, "limit_policy.live_window_reads");
  expectEqual(errors, value.limit_policy?.live_debit, false, "limit_policy.live_debit");

  expectEqual(
    errors,
    value.error_stability_policy?.standard_error_code_version,
    "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
    "error_stability_policy.standard_error_code_version"
  );
  expectObjectMappings(
    errors,
    value.error_stability_policy?.required_mappings,
    {
      MCP_CREDENTIAL_REVOKED: "AUTH_REQUIRED",
      MCP_REDISTRIBUTION_RIGHTS_REQUIRED: "DATA_NOT_LICENSED",
      TOOL_LIMIT_EXCEEDED: "TOO_MANY_ROWS",
      TOOL_SCOPE_REQUIRED: "SCOPE_DENIED",
      TOOL_TIME_RANGE_EXCEEDED: "OUT_OF_RANGE"
    },
    "error_stability_policy.required_mappings"
  );
  expectArray(
    errors,
    value.error_stability_policy?.limiter_error_codes,
    ["RATE_LIMITED", "BUDGET_EXCEEDED"],
    "error_stability_policy.limiter_error_codes"
  );

  expectEqual(
    errors,
    value.release_gate?.gate_status,
    "blocked_live_mcp_auth_limits_validation",
    "release_gate.gate_status"
  );
  expectEqual(errors, value.release_gate?.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArray(
    errors,
    value.release_gate?.required_signoffs,
    ["platform", "security", "billing", "data-rights"],
    "release_gate.required_signoffs"
  );
  expectArray(errors, value.release_gate?.blockers, requiredBlockers, "release_gate.blockers");

  if (packageValue.scripts?.["check:mcp-auth-limits-release-gate"] !== "node scripts/check-mcp-auth-limits-release-gate-contract.mjs") {
    errors.push("package.json missing check:mcp-auth-limits-release-gate script");
  }
  if (typeof packageValue.scripts?.check !== "string" || !packageValue.scripts.check.includes("npm run check:mcp-auth-limits-release-gate")) {
    errors.push("package.json root check does not include check:mcp-auth-limits-release-gate");
  }

  const migrationEntry = databaseValue.migrations?.find((entry) => entry.file === migrationPath);
  if (migrationEntry === undefined) {
    errors.push("database migrations contract missing MCP auth limits release gate migration");
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
    "live_oauth_provider_enabled boolean not null default false",
    "live_api_key_generation_enabled boolean not null default false",
    "live_limiter_enforcement_enabled boolean not null default false",
    "live_tool_execution_enabled boolean not null default false",
    "live_db_writes_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "gate_status text not null default 'blocked_live_mcp_auth_limits_validation'"
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

function expectObjectMappings(errors, actual, expected, path) {
  if (actual === null || typeof actual !== "object" || Array.isArray(actual)) {
    errors.push(`${path} expected object`);
    return;
  }

  for (const [key, expectedValue] of Object.entries(expected)) {
    if (actual[key] !== expectedValue) {
      errors.push(`${path}.${key} expected ${expectedValue} but received ${actual[key]}`);
    }
  }
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
