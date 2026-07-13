#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const contractPath = "deploy/governance/p0-field-distribution-status.contract.json";
const p0RightsContractPath = "deploy/gateway/p0-rights-matrix-coverage.contract.json";
const toolRegistryContractPath = "deploy/tools/registry.contract.json";
const p0ToolCatalogPath = "deploy/tools/p0-tool-catalog.contract.json";
const toolRegistrySourcePath = "packages/tool-registry/src/index.ts";
const gatewaySourcePath = "packages/data-access-gateway/src/index.ts";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredVersion = "2026-07-13.gate0-p0-field-distribution-status.exact-id.v1";
const requiredDefaultStatus = "default_deny_pending_partner_matrix";
const requiredDatasetGroups = [
  "security_master",
  "market_calendar",
  "quote_snapshot",
  "price_history",
  "corporate_actions",
  "financial_facts",
  "announcements",
  "derived_analytics",
  "evidence_lineage",
  "ipo_pipeline"
];
const requiredDistributionStatusFields = [
  "web_display",
  "mcp_api_redistribution",
  "export",
  "derived"
];
const requiredGatewaySurfaces = ["web", "mcp", "export", "enterprise"];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

if (isMain) {
  const contract = readJson(contractPath);
  const p0RightsContract = readJson(p0RightsContractPath);
  const toolRegistryContract = readJson(toolRegistryContractPath);
  const p0ToolCatalog = readJson(p0ToolCatalogPath);
  const registeredToolNames = parseRegisteredToolNames(readText(toolRegistrySourcePath));
  const packageJson = readJson(packageJsonPath);
  const gatewaySource = readText(gatewaySourcePath);
  const tracker = readText(trackerPath);
  const errors = validateContract({
    contract,
    gatewaySource,
    p0RightsContract,
    p0ToolCatalog,
    packageJson,
    registeredToolNames,
    toolRegistryContract,
    tracker
  });

  if (errors.length > 0) {
    emit({ errors, path: contractPath, status: "invalid_contract" }, 1);
  }

  emit(
    {
      dataset_groups: requiredDatasetGroups.length,
      p0_rights_scoped_tool_count: contract.required_p0_tool_count,
      registered_tool_count: registeredToolNames.length,
      registry_required_tool_count: toolRegistryContract.required_tools.length,
      status: "ok"
    },
    0
  );
}

export { validateExactToolIdReconciliation, parseRegisteredToolNames };

function parseRegisteredToolNames(source) {
  const match = source.match(/export type RegisteredToolName\s*=([\s\S]*?);/u);
  if (!match) {
    emit({ path: toolRegistrySourcePath, status: "registered_tool_name_not_found" }, 1);
  }
  const names = [...match[1].matchAll(/"([^"]+)"/gu)].map((m) => m[1]);
  if (names.length === 0) {
    emit({ path: toolRegistrySourcePath, status: "registered_tool_name_empty" }, 1);
  }
  return names;
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
        status: "missing_file"
      },
      1
    );
  }
}

function validateContract({
  contract: value,
  gatewaySource,
  p0RightsContract,
  p0ToolCatalog,
  packageJson,
  registeredToolNames,
  toolRegistryContract,
  tracker
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

  if (value.tracker_item !== "Sprint 0.1: field distribution status annotated") {
    errors.push("tracker_item must identify the Sprint 0.1 field distribution task");
  }

  for (const field of [
    "frontend",
    "live_rights_matrix_reads",
    "partner_signed_matrix_loaded",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(
    ...validateExactToolIdReconciliation(value, p0ToolCatalog, toolRegistryContract, registeredToolNames)
  );

  if (value.default_unconfirmed_status !== requiredDefaultStatus) {
    errors.push(`default_unconfirmed_status must be ${requiredDefaultStatus}`);
  }

  errors.push(
    ...validateExactStringArray(
      value.distribution_status_fields,
      requiredDistributionStatusFields,
      "distribution_status_fields"
    )
  );
  errors.push(
    ...validateExactStringArray(
      value.required_dataset_groups,
      requiredDatasetGroups,
      "required_dataset_groups"
    )
  );
  errors.push(...validateLinkedFiles(value.linked_contracts));
  errors.push(...validateFieldDistributionMatrix(value.field_distribution_matrix));
  errors.push(...validateToolDistributionDefault(value.p0_tool_distribution_default));
  errors.push(...validateP0RightsSource(p0RightsContract));
  errors.push(...validateToolRegistry(toolRegistryContract));
  errors.push(...validateGatewaySource(gatewaySource));
  errors.push(...validatePackageScript(packageJson));
  errors.push(...validateTrackerSync(tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateExactToolIdReconciliation(value, p0ToolCatalog, toolRegistryContract, registeredToolNames) {
  const errors = [];
  const catalog = Array.isArray(p0ToolCatalog?.required_tools) ? p0ToolCatalog.required_tools : null;
  const registryRequired = Array.isArray(toolRegistryContract?.required_tools) ? toolRegistryContract.required_tools : null;
  if (!catalog) return ["p0-tool-catalog required_tools must be an array"];
  if (!registryRequired) return ["tool registry required_tools must be an array"];

  // Layer 1: contract's exact P0 rights-scoped IDs must equal the canonical catalog set.
  errors.push(...validateExactStringArray(value.required_p0_tool_ids, catalog, "required_p0_tool_ids"));

  // Count stays a derived consistency field; must equal the catalog length and not be bumped.
  if (value.required_p0_tool_count !== catalog.length) {
    errors.push(`required_p0_tool_count must equal the canonical P0 rights set size (${catalog.length})`);
  }
  if (Array.isArray(value.required_p0_tool_ids) && value.required_p0_tool_count !== value.required_p0_tool_ids.length) {
    errors.push("required_p0_tool_count must equal required_p0_tool_ids length");
  }

  // Named, authority-grounded exclusions for every ID above the P0 rights set.
  const exclusions = Array.isArray(value.non_p0_rights_scoped_tools) ? value.non_p0_rights_scoped_tools : [];
  const exclusionIds = new Set();
  for (const [index, entry] of exclusions.entries()) {
    if (!isRecord(entry) || typeof entry.id !== "string" || entry.id.length === 0) {
      errors.push(`non_p0_rights_scoped_tools[${index}].id must be a non-empty string`);
      continue;
    }
    if (typeof entry.reason !== "string" || entry.reason.length === 0) {
      errors.push(`${entry.id}: non_p0_rights_scoped_tools reason must be a non-empty string`);
    }
    if (typeof entry.authority !== "string" || entry.authority.length === 0) {
      errors.push(`${entry.id}: non_p0_rights_scoped_tools authority must be a non-empty string`);
    }
    if (exclusionIds.has(entry.id)) {
      errors.push(`${entry.id}: duplicate non_p0_rights_scoped_tools entry`);
    }
    exclusionIds.add(entry.id);
    // No phantom exclusions: every excluded tool must actually be a registered tool.
    if (!registeredToolNames.includes(entry.id)) {
      errors.push(`${entry.id}: non_p0_rights_scoped_tools id is not a RegisteredToolName`);
    }
    // An excluded tool must not also be inside the P0 rights set.
    if (catalog.includes(entry.id)) {
      errors.push(`${entry.id}: non_p0_rights_scoped_tools id is also in the P0 rights catalog`);
    }
  }

  const catalogSet = new Set(catalog);
  const registrySet = new Set(registryRequired);
  const registeredSet = new Set(registeredToolNames);

  // Invariant chain: catalog(23) ⊆ registry(24) ⊆ RegisteredToolName(25).
  const catalogMissingFromRegistry = catalog.filter((id) => !registrySet.has(id)).sort();
  if (catalogMissingFromRegistry.length > 0) {
    errors.push(`P0 rights catalog IDs missing from registry required_tools: [${catalogMissingFromRegistry.join(", ")}]`);
  }
  const registryMissingFromRegistered = registryRequired.filter((id) => !registeredSet.has(id)).sort();
  if (registryMissingFromRegistered.length > 0) {
    errors.push(`registry required_tools missing from RegisteredToolName: [${registryMissingFromRegistered.join(", ")}]`);
  }

  // Every extra above the P0 rights set must be an explicitly named exclusion.
  const registryExtras = registryRequired.filter((id) => !catalogSet.has(id)).sort();
  const registeredExtras = registeredToolNames.filter((id) => !registrySet.has(id)).sort();
  for (const id of [...registryExtras, ...registeredExtras]) {
    if (!exclusionIds.has(id)) {
      errors.push(`unexplained non-P0 tool must be classified in non_p0_rights_scoped_tools: ${id}`);
    }
  }
  // Exclusions must exactly cover the union of extras (no unused exclusion).
  const extrasUnion = new Set([...registryExtras, ...registeredExtras]);
  for (const id of exclusionIds) {
    if (!extrasUnion.has(id)) {
      errors.push(`${id}: non_p0_rights_scoped_tools entry does not correspond to any registry/registered extra`);
    }
  }

  return errors;
}

function validateFieldDistributionMatrix(value) {
  if (!Array.isArray(value)) {
    return ["field_distribution_matrix must be an array"];
  }

  const errors = [];
  const seenDatasets = new Set();

  for (const [index, entry] of value.entries()) {
    if (!isRecord(entry)) {
      errors.push(`field_distribution_matrix[${index}] must be an object`);
      continue;
    }

    if (typeof entry.dataset !== "string" || entry.dataset.length === 0) {
      errors.push(`field_distribution_matrix[${index}].dataset must be a non-empty string`);
      continue;
    }

    seenDatasets.add(entry.dataset);

    if (!requiredDatasetGroups.includes(entry.dataset)) {
      errors.push(`field_distribution_matrix[${index}].dataset is not a required dataset group`);
    }

    if (!Array.isArray(entry.field_patterns) || entry.field_patterns.length === 0) {
      errors.push(`${entry.dataset}.field_patterns must be a non-empty array`);
    }

    if (entry.source_owner_status !== "unconfirmed_partner_matrix_required") {
      errors.push(`${entry.dataset}.source_owner_status must require partner matrix confirmation`);
    }

    if (!isRecord(entry.status)) {
      errors.push(`${entry.dataset}.status must be an object`);
      continue;
    }

    for (const field of requiredDistributionStatusFields) {
      if (entry.status[field] !== requiredDefaultStatus) {
        errors.push(`${entry.dataset}.status.${field} must be ${requiredDefaultStatus}`);
      }
    }
  }

  for (const dataset of requiredDatasetGroups) {
    if (!seenDatasets.has(dataset)) {
      errors.push(`field_distribution_matrix missing ${dataset}`);
    }
  }

  if (seenDatasets.size !== requiredDatasetGroups.length) {
    errors.push(`field_distribution_matrix must contain exactly ${requiredDatasetGroups.length} dataset groups`);
  }

  return errors;
}

function validateToolDistributionDefault(value) {
  if (!isRecord(value)) {
    return ["p0_tool_distribution_default must be an object"];
  }

  const errors = [];

  if (value.applies_to_registry_required_tools !== true) {
    errors.push("p0_tool_distribution_default must apply to registry required tools");
  }

  for (const field of requiredDistributionStatusFields) {
    if (value[field] !== requiredDefaultStatus) {
      errors.push(`p0_tool_distribution_default.${field} must be ${requiredDefaultStatus}`);
    }
  }

  return errors;
}

function validateP0RightsSource(value) {
  if (!isRecord(value)) {
    return ["P0 rights matrix coverage contract must be an object"];
  }

  const errors = [];

  if (value.default_rights_status !== "default_deny") {
    errors.push("P0 rights contract default_rights_status must be default_deny");
  }

  if (value.partner_signed_matrix_loaded !== false) {
    errors.push("P0 rights contract partner_signed_matrix_loaded must be false");
  }

  if (!isRecord(value.release_gate) || value.release_gate.gate_status !== "blocked_external_rights_matrix") {
    errors.push("P0 rights contract release_gate must block on external rights matrix");
  }

  errors.push(
    ...validateExactStringArray(value.dataset_groups, requiredDatasetGroups, "P0 rights dataset_groups")
  );
  errors.push(
    ...validateExactStringArray(value.required_surfaces, requiredGatewaySurfaces, "P0 rights required_surfaces")
  );

  return errors;
}

function validateToolRegistry(value) {
  if (!isRecord(value)) {
    return ["tool registry contract must be an object"];
  }

  const errors = [];

  if (value.rights_aware !== true) {
    errors.push("tool registry must be rights_aware");
  }

  if (!Array.isArray(value.required_tools) || value.required_tools.length === 0) {
    errors.push("tool registry required_tools must be a non-empty array");
  }

  if (value.live_data_access !== false) {
    errors.push("tool registry live_data_access must be false");
  }

  return errors;
}

function validateGatewaySource(source) {
  const errors = [];

  if (!source.includes("const P0_RIGHTS_MATRIX_DATASET_FIELDS")) {
    errors.push("gateway source must define P0_RIGHTS_MATRIX_DATASET_FIELDS");
  }

  if (!source.includes("function createDefaultDenySurfaceCoverage")) {
    errors.push("gateway source must define createDefaultDenySurfaceCoverage");
  }

  for (const dataset of requiredDatasetGroups) {
    if (!source.includes(`dataset: "${dataset}"`)) {
      errors.push(`gateway source P0 matrix missing dataset ${dataset}`);
    }
  }

  for (const surface of requiredGatewaySurfaces) {
    if (!source.includes(`${surface}: "configured_default_deny"`)) {
      errors.push(`gateway default deny surface coverage missing ${surface}`);
    }
  }

  const rightsStateMatches = source.match(/rights_state: "default_deny_until_partner_matrix_signed"/gu) ?? [];
  if (rightsStateMatches.length < requiredDatasetGroups.length) {
    errors.push("gateway source must keep every P0 dataset default-deny until partner matrix is signed");
  }

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (
    value.scripts["check:p0-field-distribution-status"] !==
    "node scripts/check-p0-field-distribution-status-contract.mjs"
  ) {
    errors.push("package.json must define check:p0-field-distribution-status");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:p0-field-distribution-status")
  ) {
    errors.push("package.json check script must include check:p0-field-distribution-status");
  }

  return errors;
}

function validateTrackerSync(value) {
  const expected =
    "- [x] 逐字段标注分发状态：`Web 可 / MCP 可 / 导出可 / 派生可`";

  if (!value.includes(expected) || !value.includes("check:p0-field-distribution-status")) {
    return ["Sprint tracker must mark field distribution status with check:p0-field-distribution-status evidence"];
  }

  return [];
}

function validateLinkedFiles(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  const errors = [];

  for (const path of value) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked file missing: ${path}`);
    }
  }

  return errors;
}

function validateExactStringArray(value, requiredValues, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${label} must be a string array`];
  }

  const errors = [];

  for (const required of requiredValues) {
    if (!value.includes(required)) {
      errors.push(`${label} must include ${required}`);
    }
  }

  for (const item of value) {
    if (!requiredValues.includes(item)) {
      errors.push(`${label} contains unexpected value ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern}`);
    }
  }

  return errors;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
