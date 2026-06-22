#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/account/enterprise-controls.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const accountSourcePath = "packages/account-runtime/src/index.ts";
const accountTestPath = "packages/account-runtime/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredPhase4Items = [
  "Team/Enterprise",
  "seats",
  "SSO",
  "audit",
  "private_data_connector"
];
const requiredPlanCodes = ["team", "enterprise"];
const requiredControls = ["seats", "sso", "audit", "private_data_connector"];
const requiredSsoProtocols = ["saml", "oidc"];
const requiredConnectorKinds = ["customer_warehouse", "managed_bucket", "private_api"];
const requiredTables = [
  "core.enterprise_seat_assignment",
  "core.enterprise_sso_config",
  "audit.enterprise_admin_event",
  "core.private_data_connector",
  "governance.enterprise_controls_contract"
];
const requiredOutputFields = [
  "account",
  "workspace",
  "plan_code",
  "requested_controls",
  "controls",
  "audit",
  "security",
  "validation"
];
const requiredBlockedStatuses = [
  "blocked_missing_context",
  "blocked_enterprise_plan_required",
  "blocked_unsupported_control"
];
const forbiddenPayloads = [
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret",
  "connection_string",
  "private_key",
  "api_key",
  "credential_material"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  account: readText(accountSourcePath),
  accountTest: readText(accountTestPath),
  tracker: readText(trackerPath),
  worker: readText(workerSourcePath),
  workerTest: readText(workerTestPath)
};
const errors = validateContract(contract, databaseContract, packageJson, sourceFiles);

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
    supported_controls: contract.supported_controls
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
        status: "missing_file"
      },
      1
    );
  }
}

function validateContract(value, databaseValue, packageValue, sourceFilesValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase4.enterprise-controls-scaffold.v0") {
    errors.push("version must match enterprise controls scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/account-runtime") {
    errors.push("package must be @aiphabee/account-runtime");
  }

  if (value.runtime_route !== "GET /account/runtime") {
    errors.push("runtime_route must be GET /account/runtime");
  }

  if (value.route !== "POST /account/enterprise-controls/plan") {
    errors.push("route must be POST /account/enterprise-controls/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_directory_sync",
    "live_identity_provider_calls",
    "live_private_connector_calls",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
  );
  errors.push(...validateStringArray(value.plan_codes, requiredPlanCodes, "plan_codes"));
  errors.push(...validateStringArray(value.supported_controls, requiredControls, "supported_controls"));
  errors.push(...validateStringArray(value.sso_protocols, requiredSsoProtocols, "sso_protocols"));
  errors.push(
    ...validateStringArray(
      value.private_data_connector_kinds,
      requiredConnectorKinds,
      "private_data_connector_kinds"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validateStringArray(value.blocked_statuses, requiredBlockedStatuses, "blocked_statuses"));
  errors.push(...validateStringArray(value.forbidden_payloads, forbiddenPayloads, "forbidden_payloads"));
  errors.push(...validateAudit(value.audit));
  errors.push(...validateSecurityContract(value.security_contract));
  errors.push(...validateDatabaseMigration(databaseValue));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateAudit(value) {
  if (!isRecord(value)) {
    return ["audit must be an object"];
  }

  const errors = [];

  if (value.required !== true) {
    errors.push("audit.required must be true");
  }

  if (value.audit_event !== "account.enterprise_controls.plan") {
    errors.push("audit.audit_event must be account.enterprise_controls.plan");
  }

  if (value.event_table !== "audit.enterprise_admin_event") {
    errors.push("audit.event_table must be audit.enterprise_admin_event");
  }

  if (value.raw_payload_stored !== false) {
    errors.push("audit.raw_payload_stored must be false");
  }

  return errors;
}

function validateSecurityContract(value) {
  if (!isRecord(value)) {
    return ["security_contract must be an object"];
  }

  const errors = [];

  for (const field of [
    "team_enterprise_only",
    "partner_rights_matrix_required",
    "default_deny_until_approved"
  ]) {
    if (value[field] !== true) {
      errors.push(`security_contract.${field} must be true`);
    }
  }

  for (const field of [
    "credential_material_stored",
    "raw_connection_string_included",
    "raw_email_included"
  ]) {
    if (value[field] !== false) {
      errors.push(`security_contract.${field} must be false`);
    }
  }

  return errors;
}

function validateDatabaseMigration(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.migrations)) {
    return ["database migrations contract must include migrations"];
  }

  const migration = value.migrations.find(
    (item) => isRecord(item) && item.file === "supabase/migrations/20260622007000_enterprise_controls_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database migrations contract must include enterprise controls scaffold migration"];
  }

  errors.push(...validateStringArray(migration.tables, requiredTables, "migration.tables"));

  if (migration.default_rights_status !== "default_deny") {
    errors.push("enterprise controls migration must preserve default_deny");
  }

  if (migration.market_data !== false) {
    errors.push("enterprise controls migration market_data must be false");
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:enterprise-controls"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-enterprise-controls-contract.mjs")
  ) {
    errors.push("check:enterprise-controls must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:enterprise-controls")) {
    errors.push("root check script must include check:enterprise-controls");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    account: [
      "ENTERPRISE_CONTROLS_VERSION",
      "createEnterpriseControlsPlan",
      "getEnterpriseControlsCapabilities",
      "blocked_enterprise_plan_required",
      "private_data_connector"
    ],
    accountTest: [
      "reports Team and Enterprise controls without live providers",
      "plans Team and Enterprise seats SSO audit and private data connectors without writes",
      "blocks enterprise controls for non-enterprise plans and unsupported controls"
    ],
    worker: [
      'app.post("/account/enterprise-controls/plan"',
      "createEnterpriseControlsPlan",
      "getEnterpriseControlsCapabilities",
      "normalizePrivateDataConnectorKind"
    ],
    workerTest: [
      "plans Team Enterprise controls without live providers or writes",
      "blocks enterprise controls for non-enterprise plans"
    ]
  };

  for (const [fileKey, tokens] of Object.entries(requiredByFile)) {
    const text = value[fileKey];

    if (typeof text !== "string") {
      errors.push(`${fileKey} source missing`);
      continue;
    }

    for (const token of tokens) {
      if (!text.includes(token)) {
        errors.push(`${fileKey} must include ${token}`);
      }
    }
  }

  return errors;
}

function validateTrackerSync(tracker) {
  const errors = [];

  if (!tracker.includes("- [x] Team/Enterprise")) {
    errors.push("tracker must mark Team/Enterprise phase4 item complete");
  }

  if (!tracker.includes("npm run check:enterprise-controls")) {
    errors.push("tracker enterprise controls row must reference check:enterprise-controls");
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

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
