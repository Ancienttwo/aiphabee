#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/field-rights-live-policy-source.contract.json";
const packageJsonPath = "package.json";
const gatewaySourcePath = "packages/data-access-gateway/src/index.ts";
const gatewayTestPath = "packages/data-access-gateway/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredDimensions = [
  "workspace",
  "plan",
  "channel",
  "dataset",
  "field",
  "time_range",
  "export"
];
const requiredPrdDimensions = [
  "owner_source",
  "web_display",
  "mcp_api_redistribution",
  "raw_vs_derived",
  "freshness_tier",
  "history_window",
  "export_and_cache",
  "user_type_region",
  "subscriber_reporting",
  "audit_termination",
  "commercial_terms"
];
const requiredSmokeScenarios = [
  "developer_mcp_quote_redaction",
  "pro_web_financial_field_default_deny",
  "team_export_price_history_allowed",
  "developer_mcp_quote_time_range_blocked",
  "missing_workspace_default_deny",
  "developer_mcp_quote_export_blocked"
];
const requiredDenialReasons = [
  "field_blocked",
  "field_default_deny",
  "time_range_blocked",
  "workspace_entitlement_default_deny",
  "export_blocked"
];
const externalActivationBlockers = [
  "partner_signed_matrix_absent",
  "live_db_read_path_not_enabled",
  "ops_cutover_not_approved"
];
const linkedContracts = [
  "deploy/governance/field-rights-runtime.contract.json",
  "deploy/gateway/field-authorization-config.contract.json",
  "deploy/gateway/p0-rights-matrix-coverage.contract.json",
  "deploy/gateway/access.contract.json"
];
const requiredTables = [
  "aiphabee_governance.data_entitlement",
  "aiphabee_governance.workspace_entitlement",
  "platform.workspace_subscription",
  "aiphabee_core.p0_rights_matrix_entry"
];
const forbiddenTextPatterns = [
  /(?:^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  gateway: readText(gatewaySourcePath),
  gatewayTest: readText(gatewayTestPath),
  tracker: readText(trackerPath),
  worker: readText(workerSourcePath),
  workerTest: readText(workerTestPath)
};
const errors = validateContract(contract, packageJson, sourceFiles);

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
    smoke_scenarios: contract.expected_row_counts.runtime_smoke_scenarios,
    status: "ok"
  },
  0
);

function validateContract(value, packageValue, sourceFilesValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  expectEqual(
    errors,
    value.version,
    "2026-06-22.phase1.field-rights-live-policy-source-readiness.v0",
    "version"
  );
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(
    errors,
    value.tracker_item,
    "DAT-05 field rights live policy source readiness",
    "tracker_item"
  );
  expectEqual(errors, value.package, "@aiphabee/data-access-gateway", "package");
  expectEqual(errors, value.runtime_route, "GET /gateway/runtime", "runtime_route");
  expectEqual(
    errors,
    value.route,
    "GET /gateway/field-rights/live-policy-source/readiness",
    "route"
  );
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");
  expectEqual(
    errors,
    value.fixture_version,
    "field-rights-live-policy-source@partner-db-fixture-v0",
    "fixture_version"
  );
  expectEqual(
    errors,
    value.rights_policy_version,
    "field-rights-live-policy-source-fixture-v0",
    "rights_policy_version"
  );

  for (const field of [
    "frontend",
    "live_data_access",
    "live_db_reads",
    "live_partner_rights_matrix_reads",
    "persistent_writes",
    "sql_emitted"
  ]) {
    expectEqual(errors, value[field], false, field);
  }

  expectArray(errors, value.covered_prd_items, ["DAT-05"], "covered_prd_items");
  expectArray(errors, value.required_dimensions, requiredDimensions, "required_dimensions");
  expectArray(
    errors,
    value.required_prd_dimensions,
    requiredPrdDimensions,
    "required_prd_dimensions"
  );
  expectArray(
    errors,
    value.required_smoke_scenarios,
    requiredSmokeScenarios,
    "required_smoke_scenarios"
  );
  expectArray(
    errors,
    value.required_denial_reasons,
    requiredDenialReasons,
    "required_denial_reasons"
  );
  expectArray(
    errors,
    value.external_activation_blockers,
    externalActivationBlockers,
    "external_activation_blockers"
  );
  expectArray(errors, value.linked_contracts, linkedContracts, "linked_contracts");
  expectArray(errors, value.tables, requiredTables, "tables");
  errors.push(...validateExpectedCounts(value.expected_row_counts));
  for (const path of linkedContracts) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }
  errors.push(...validatePackage(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateExpectedCounts(value) {
  if (!isRecord(value)) {
    return ["expected_row_counts must be an object"];
  }

  const errors = [];
  expectEqual(errors, value.partner_matrix_rows, 4, "expected_row_counts.partner_matrix_rows");
  expectEqual(errors, value.data_entitlements, 4, "expected_row_counts.data_entitlements");
  expectEqual(
    errors,
    value.workspace_entitlements,
    4,
    "expected_row_counts.workspace_entitlements"
  );
  expectEqual(errors, value.subscription_rows, 3, "expected_row_counts.subscription_rows");
  expectEqual(
    errors,
    value.runtime_smoke_scenarios,
    6,
    "expected_row_counts.runtime_smoke_scenarios"
  );
  expectEqual(errors, value.source_records, 8, "expected_row_counts.source_records");
  return errors;
}

function validatePackage(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const checkCommand = "node scripts/check-field-rights-live-policy-source-contract.mjs";

  if (scripts["check:field-rights-live-policy-source"] !== checkCommand) {
    errors.push("package.json scripts.check:field-rights-live-policy-source mismatch");
  }

  if (!String(scripts.check ?? "").includes("npm run check:field-rights-live-policy-source")) {
    errors.push("package.json scripts.check must include check:field-rights-live-policy-source");
  }

  return errors;
}

function validateSourceTokens(sourceFilesValue) {
  const errors = [];

  for (const token of [
    "FIELD_RIGHTS_LIVE_POLICY_SOURCE_VERSION",
    "FIELD_RIGHTS_LIVE_POLICY_SOURCE_FIXTURE_VERSION",
    "getFieldRightsLivePolicySourceCapabilities",
    "createFieldRightsLivePolicySourceReadinessReport",
    "FIELD_RIGHTS_PARTNER_MATRIX_FIXTURE",
    "FIELD_RIGHTS_RUNTIME_SMOKE_SCENARIOS",
    "live_policy_source_readiness_passed"
  ]) {
    if (!sourceFilesValue.gateway.includes(token)) {
      errors.push(`gateway source missing ${token}`);
    }
  }

  for (const scenario of requiredSmokeScenarios) {
    if (!sourceFilesValue.gateway.includes(scenario)) {
      errors.push(`gateway source missing smoke scenario ${scenario}`);
    }
    if (!sourceFilesValue.gatewayTest.includes(scenario)) {
      errors.push(`gateway test missing smoke scenario ${scenario}`);
    }
  }

  for (const token of [
    "getFieldRightsLivePolicySourceCapabilities",
    "createFieldRightsLivePolicySourceReadinessReport",
    "runtime_smoke_passed: true",
    "source_records: 8"
  ]) {
    if (!sourceFilesValue.gatewayTest.includes(token)) {
      errors.push(`gateway test missing ${token}`);
    }
  }

  for (const token of [
    'app.get("/gateway/field-rights/live-policy-source/readiness"',
    "getFieldRightsLivePolicySourceCapabilities",
    "createFieldRightsLivePolicySourceReadinessReport",
    "live_policy_source_readiness"
  ]) {
    if (!sourceFilesValue.worker.includes(token)) {
      errors.push(`worker source missing ${token}`);
    }
  }

  for (const token of [
    "/gateway/field-rights/live-policy-source/readiness",
    "FieldRightsLivePolicySourceReadinessBody",
    "live_policy_source_readiness_passed",
    "partner_matrix_rows: 4"
  ]) {
    if (!sourceFilesValue.workerTest.includes(token)) {
      errors.push(`worker test missing ${token}`);
    }
  }

  if (!/^\|\s+DAT-05\b.*\|\s*☑\s*\|/mu.test(sourceFilesValue.tracker)) {
    errors.push("DAT-05 must be checked in §M traceability matrix");
  }
  if (!sourceFilesValue.tracker.includes("field-rights-live-policy-source-readiness")) {
    errors.push("tracker must mention field-rights-live-policy-source-readiness");
  }

  return errors;
}

function expectArray(errors, value, requiredValues, name) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${name} must be a string array`);
    return;
  }

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${name} must include ${requiredValue}`);
    }
  }
}

function expectEqual(errors, actual, expected, name) {
  if (actual !== expected) {
    errors.push(`${name} must be ${String(expected)}`);
  }
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern: ${pattern}`);
}

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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
