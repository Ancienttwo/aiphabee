#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/field-rights-runtime.contract.json";
const accessContractPath = "deploy/gateway/access.contract.json";
const fieldAuthorizationContractPath = "deploy/gateway/field-authorization-config.contract.json";
const p0RightsContractPath = "deploy/gateway/p0-rights-matrix-coverage.contract.json";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const gatewaySourcePath = "packages/data-access-gateway/src/index.ts";
const gatewayTestPath = "packages/data-access-gateway/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const requiredVersion = "2026-06-22.field-rights-runtime-closeout.v0";
const requiredDimensions = [
  "workspace",
  "plan",
  "channel",
  "dataset",
  "field",
  "time_range",
  "export"
];
const requiredChannels = ["web", "mcp", "api", "export"];
const requiredDenialReasons = [
  "channel_blocked",
  "field_blocked",
  "field_default_deny",
  "workspace_entitlement_blocked",
  "workspace_entitlement_default_deny",
  "export_blocked",
  "time_range_blocked"
];
const requiredGatewayGuards = [
  "channel_rights_default_deny",
  "field_redaction",
  "field_entitlement_policy_source_scaffold",
  "workspace_entitlement_default_deny",
  "plan_entitlement",
  "export_entitlement",
  "time_range_limit",
  "cache_key_versioning"
];
const requiredCacheKeyFields = [
  "dataset",
  "channel",
  "plan",
  "workspace_id",
  "allowed_fields",
  "export_requested",
  "data_version",
  "rights_policy_version",
  "methodology_version",
  "time_range"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const accessContract = readJson(accessContractPath);
const fieldAuthorizationContract = readJson(fieldAuthorizationContractPath);
const p0RightsContract = readJson(p0RightsContractPath);
const packageJson = readJson(packageJsonPath);
const tracker = readText(trackerPath);
const gatewaySource = readText(gatewaySourcePath);
const gatewayTests = readText(gatewayTestPath);
const workerSource = readText(workerSourcePath);
const errors = validateContract({
  accessContract,
  contract,
  fieldAuthorizationContract,
  gatewaySource,
  gatewayTests,
  packageJson,
  p0RightsContract,
  tracker,
  workerSource
});

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
    dimensions: requiredDimensions,
    linked_contracts: contract.linked_contracts.length,
    status: "ok"
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

function validateContract({
  accessContract,
  contract: value,
  fieldAuthorizationContract,
  gatewaySource,
  gatewayTests,
  packageJson,
  p0RightsContract,
  tracker,
  workerSource
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== requiredVersion) {
    errors.push(`version must be ${requiredVersion}`);
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.tracker_item !== "A2.DAT-05 field rights runtime execution") {
    errors.push("tracker_item must be A2.DAT-05 field rights runtime execution");
  }

  if (value.scope !== "data_access_gateway_runtime_field_rights") {
    errors.push("scope must be data_access_gateway_runtime_field_rights");
  }

  if (value.runtime_route !== "GET /gateway/runtime") {
    errors.push("runtime_route must be GET /gateway/runtime");
  }

  if (value.access_route !== "POST /gateway/access-check") {
    errors.push("access_route must be POST /gateway/access-check");
  }

  for (const field of [
    "frontend",
    "live_data_access",
    "live_db_reads",
    "partner_rights_matrix_loaded",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validateExactStringArray(value.required_dimensions, requiredDimensions, "required_dimensions"));
  errors.push(...validateExactStringArray(value.required_channels, requiredChannels, "required_channels"));
  errors.push(...validateStringArray(value.required_denial_reasons, requiredDenialReasons, "required_denial_reasons"));
  errors.push(...validateStringArray(value.required_gateway_guards, requiredGatewayGuards, "required_gateway_guards"));
  errors.push(...validateStringArray(value.required_cache_key_fields, requiredCacheKeyFields, "required_cache_key_fields"));
  errors.push(...validateStringArray(value.not_claimed, [
    "partner_signed_rights_matrix",
    "live_partner_rights_matrix_load",
    "live_db_entitlement_reads",
    "live_serving_sql_execution",
    "persistent_usage_writes",
    "frontend_rights_ops_ui"
  ], "not_claimed"));
  errors.push(...validateLinkedFiles(value.linked_contracts));
  errors.push(...validateAccessContract(accessContract));
  errors.push(...validateFieldAuthorizationContract(fieldAuthorizationContract));
  errors.push(...validateP0RightsContract(p0RightsContract));
  errors.push(...validateGatewaySource(gatewaySource));
  errors.push(...validateGatewayTests(gatewayTests));
  errors.push(...validateWorkerRuntime(workerSource));
  errors.push(...validatePackageScript(packageJson));
  errors.push(...validateTracker(tracker));
  errors.push(...validateNoSecrets({ contract: value }));

  return errors;
}

function validateAccessContract(value) {
  if (!isRecord(value)) {
    return ["access contract must be an object"];
  }

  const errors = [];

  if (value.default_rights_status !== "default_deny") {
    errors.push("access contract default_rights_status must be default_deny");
  }

  if (value.live_data_access !== false) {
    errors.push("access contract live_data_access must be false");
  }

  errors.push(...validateContractChannels(value.channels));
  errors.push(...validateStringArray(value.required_guards, requiredGatewayGuards, "access.required_guards"));
  errors.push(...validateStringArray(value.cache_key_fields, requiredCacheKeyFields, "access.cache_key_fields"));

  return errors;
}

function validateFieldAuthorizationContract(value) {
  if (!isRecord(value)) {
    return ["field authorization contract must be an object"];
  }

  const errors = [];

  for (const field of ["default_deny_preserved", "approval_required", "policy_version_required", "effective_time_required"]) {
    if (value[field] !== true) {
      errors.push(`field authorization ${field} must be true`);
    }
  }

  for (const field of ["frontend", "live_db_reads", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`field authorization ${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.required_request_fields,
      ["operator_id", "dataset", "field_pattern", "channel", "plan", "target_status", "policy_version", "effective_at"],
      "field_authorization.required_request_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.policy_effect_tables,
      ["aiphabee_governance.data_entitlement", "aiphabee_governance.workspace_entitlement"],
      "field_authorization.policy_effect_tables"
    )
  );

  return errors;
}

function validateP0RightsContract(value) {
  if (!isRecord(value)) {
    return ["P0 rights contract must be an object"];
  }

  const errors = [];

  if (value.default_rights_status !== "default_deny") {
    errors.push("P0 rights default_rights_status must be default_deny");
  }

  if (value.partner_signed_matrix_loaded !== false) {
    errors.push("P0 rights partner_signed_matrix_loaded must be false");
  }

  if (value.live_rights_matrix_reads !== false) {
    errors.push("P0 rights live_rights_matrix_reads must be false");
  }

  errors.push(
    ...validateStringArray(
      value.required_surfaces,
      ["web", "mcp", "export", "enterprise"],
      "P0 rights required_surfaces"
    )
  );

  return errors;
}

function validateGatewaySource(source) {
  const errors = [];

  for (const token of [
    "export interface DataAccessRequest",
    "channel: DataAccessChannel",
    "dataset: string",
    "exportRequested?: boolean",
    "plan: string",
    "requestedFields: string[]",
    "timeRange?:",
    "workspaceId?: string",
    "export function evaluateDataAccessRequest",
    "const fieldDecision = evaluateFields",
    "const cacheKey = createDataAccessCacheKey",
    "createUsageLedgerEventPlan",
    "export function createPolicyFromEntitlementRows",
    "activeWorkspaceEntitlements",
    "aiphabee_governance.data_entitlement",
    "aiphabee_governance.workspace_entitlement",
    "platform.workspace_subscription"
  ]) {
    if (!source.includes(token)) {
      errors.push(`gateway source missing token ${token}`);
    }
  }

  for (const token of [
    "api: \"default_deny\"",
    "export: \"default_deny\"",
    "mcp: \"default_deny\"",
    "web: \"default_deny\"",
    "defaultFieldStatus: \"default_deny\""
  ]) {
    if (!source.includes(token)) {
      errors.push(`default policy missing ${token}`);
    }
  }

  for (const token of [
    "entitlement.workspaceId === request.workspaceId",
    "(entitlement.plan === \"*\" || entitlement.plan === request.plan)",
    "entitlement.dataset === request.dataset",
    "entitlement.channel === request.channel",
    "matchesFieldPattern(entitlement.fieldPattern, field)",
    "request.exportRequested === true && !approvedEntitlement.exportAllowed",
    "timeWindowDays > approvedEntitlement.maxWindowDays"
  ]) {
    if (!source.includes(token)) {
      errors.push(`workspace entitlement evaluator missing ${token}`);
    }
  }

  const blockedIndex = source.indexOf("entitlement.status === \"blocked\"");
  const approvedIndex = source.indexOf("entitlement.status === \"approved\"", blockedIndex + 1);
  if (blockedIndex === -1 || approvedIndex === -1 || blockedIndex > approvedIndex) {
    errors.push("workspace entitlement evaluator must check blocked rows before approved rows");
  }

  for (const denialReason of requiredDenialReasons) {
    if (!source.includes(`"${denialReason}"`)) {
      errors.push(`gateway source missing denial reason ${denialReason}`);
    }
  }

  for (const token of [
    "`dataset=${request.dataset}`",
    "`channel=${request.channel}`",
    "`plan=${request.plan}`",
    "`workspace=${request.workspaceId ?? \"none\"}`",
    "`export=${request.exportRequested === true}`",
    "`fields=${[...allowedFields].sort().join(\",\") || \"none\"}`",
    "`data_version=gateway-scaffold-v0`",
    "`rights=${policy.rightsPolicyVersion}`",
    "`methodology=${policy.methodologyVersion}`",
    "`from=${request.timeRange?.from ?? \"none\"}`",
    "`to=${request.timeRange?.to ?? \"none\"}`"
  ]) {
    if (!source.includes(token)) {
      errors.push(`cache key material missing ${token}`);
    }
  }

  return errors;
}

function validateGatewayTests(source) {
  const errors = [];

  for (const token of [
    "denies fields by default before rights approval",
    "enforces workspace, plan, export, and entitlement time range",
    "workspace=ws_synthetic_team",
    "export=false",
    "workspace_entitlement_default_deny",
    "export_blocked",
    "time_range_blocked",
    "compiles database entitlement rows into a default-deny gateway policy",
    "liveDbReads: false",
    "partnerRightsMatrixLoaded: false",
    "does not compile expired workspace entitlements into live policy",
    "reports database policy source capabilities without live reads"
  ]) {
    if (!source.includes(token)) {
      errors.push(`gateway tests missing ${token}`);
    }
  }

  return errors;
}

function validateWorkerRuntime(source) {
  const errors = [];

  for (const token of [
    "app.get(\"/gateway/runtime\"",
    "field_entitlement_enforcement",
    "live_policy_source: false",
    "operations_config: getFieldAuthorizationConfigCapabilities()",
    "policy_source: getEntitlementPolicySourceCapabilities()",
    "workspace_isolation: true"
  ]) {
    if (!source.includes(token)) {
      errors.push(`worker runtime missing ${token}`);
    }
  }

  for (const dimension of requiredDimensions) {
    if (!source.includes(`\"${dimension}\"`)) {
      errors.push(`worker runtime missing field entitlement dimension ${dimension}`);
    }
  }

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (value.scripts["check:field-rights-runtime"] !== "node scripts/check-field-rights-runtime-contract.mjs") {
    errors.push("package.json must define check:field-rights-runtime");
  }

  if (typeof value.scripts.check !== "string" || !value.scripts.check.includes("npm run check:field-rights-runtime")) {
    errors.push("package.json check script must include check:field-rights-runtime");
  }

  return errors;
}

function validateTracker(value) {
  const errors = [];

  if (
    !/- \[x\] 字段级权利矩阵进入运行时，Gateway 按「渠道 × 套餐 × 字段 × 时间范围 × 导出」裁剪/u.test(value)
  ) {
    errors.push("tracker A2 field rights runtime item must be checked");
  }

  for (const token of [
    "check:field-rights-runtime",
    "live partner rights matrix",
    "live DB entitlement reads",
    "Data Access Gateway live Serving",
    "字段级权益 live policy source"
  ]) {
    if (!value.includes(token)) {
      errors.push(`tracker must mention ${token}`);
    }
  }

  if (!/\| DAT-05 字段级数据授权 \| P0 \| 0\.1 \/ 1\.1 \| ☑ \|/u.test(value)) {
    errors.push("tracker traceability matrix must mark DAT-05 complete after live policy source readiness gate");
  }

  return errors;
}

function validateContractChannels(value) {
  if (!Array.isArray(value)) {
    return ["access.channels must be an array"];
  }

  const errors = [];
  const statuses = new Map();

  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`access.channels[${index}] must be an object`);
      return;
    }

    statuses.set(entry.name, entry.status);
  });

  for (const channel of requiredChannels) {
    if (statuses.get(channel) !== "default_deny") {
      errors.push(`access channel ${channel} must be default_deny`);
    }
  }

  return errors;
}

function validateLinkedFiles(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  return value
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${String(path)}`);
}

function validateExactStringArray(value, requiredValues, name) {
  const errors = validateStringArray(value, requiredValues, name);

  if (!Array.isArray(value)) {
    return errors;
  }

  for (const item of value) {
    if (!requiredValues.includes(item)) {
      errors.push(`${name} contains unexpected value ${item}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, name) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }

  const errors = [];

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${name} must include ${requiredValue}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
