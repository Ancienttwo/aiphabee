#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/client-maturity.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationPath = "deploy/database/migrations/20260622011000_mcp_client_maturity_scaffold.sql";
const runtimeSourcePath = "packages/mcp-runtime/src/index.ts";
const runtimeTestPath = "packages/mcp-runtime/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredCoveredItems = [
  "MCP resources",
  "MCP prompts",
  "interactive MCP Apps",
  "client_maturity_assessment"
];
const requiredTargetClients = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
];
const requiredFeatures = ["tools", "resources", "prompts", "interactive_apps"];
const requiredChecks = [
  "target_clients_capability_matrix_present",
  "resources_support_guarded_by_client_maturity",
  "prompts_support_guarded_by_client_maturity",
  "interactive_apps_support_blocked_until_client_stable",
  "fallback_to_tools_only_documented",
  "no_live_resources_prompts_apps_claim"
];
const requiredOutputFields = [
  "client_maturity_gate",
  "publication_policy",
  "compatibility_gate",
  "target_clients_console_gate",
  "release_checks",
  "release_gate",
  "validation"
];
const referenceUrls = [
  "https://modelcontextprotocol.io/specification/2025-11-25/server/resources",
  "https://modelcontextprotocol.io/specification/2025-11-25/server/prompts",
  "https://developers.openai.com/apps-sdk/concepts/mcp-server"
];
const requiredBlockers = [
  "live_resources_e2e_missing",
  "live_prompts_e2e_missing",
  "interactive_apps_client_stability_missing",
  "client_capability_version_matrix_missing",
  "apps_sdk_security_review_missing"
];
const requiredTables = [
  "aiphabee_core.mcp_client_maturity_assessment",
  "aiphabee_governance.mcp_client_maturity_contract"
];
const linkedContracts = [
  "deploy/mcp/target-clients-console-release-gate.contract.json",
  "deploy/mcp/compatibility.contract.json",
  "deploy/mcp/protocol-release-gate.contract.json",
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
const sourceFiles = {
  migration: readText(migrationPath),
  runtime: readText(runtimeSourcePath),
  runtimeTest: readText(runtimeTestPath),
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
    target_clients: contract.target_clients.length,
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

function validateContract(value, databaseValue, packageValue, sourceFilesValue) {
  const errors = [];

  expectEqual(errors, value.version, "2026-06-22.phase4.mcp-client-maturity-scaffold.v0", "version");
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(errors, value.package, "@aiphabee/mcp-runtime", "package");
  expectEqual(errors, value.runtime_route, "GET /mcp/runtime", "runtime_route");
  expectEqual(errors, value.route, "POST /mcp/client-maturity/plan", "route");
  expectEqual(errors, value.protocol_route, "POST /mcp", "protocol_route");
  expectEqual(
    errors,
    value.target_clients_console_gate_route,
    "POST /mcp/release-gates/target-clients-console/plan",
    "target_clients_console_gate_route"
  );
  expectEqual(
    errors,
    value.compatibility_status_route,
    "GET /mcp/compatibility/status",
    "compatibility_status_route"
  );
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");

  for (const flag of [
    "frontend_rendering",
    "persistent_writes",
    "live_client_e2e_passed",
    "live_resources",
    "live_prompts",
    "live_interactive_apps",
    "live_tool_execution",
    "live_db_writes",
    "model_calls",
    "sql_emitted"
  ]) {
    expectEqual(errors, value[flag], false, flag);
  }

  expectArray(errors, value.covered_phase4_items, requiredCoveredItems, "covered_phase4_items");
  expectArray(errors, value.target_clients, requiredTargetClients, "target_clients");
  expectArray(errors, value.supported_features, requiredFeatures, "supported_features");
  expectArray(errors, value.required_checks, requiredChecks, "required_checks");
  expectArray(errors, value.required_output_fields, requiredOutputFields, "required_output_fields");
  expectArray(errors, value.reference_urls, referenceUrls, "reference_urls");
  expectArray(errors, value.tables, requiredTables, "tables");
  expectArray(errors, value.linked_contracts, linkedContracts, "linked_contracts");
  for (const path of linkedContracts) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }

  expectEqual(errors, value.publication_policy?.fallback_to_tools_only, true, "publication_policy.fallback_to_tools_only");
  for (const flag of [
    "resources_live",
    "prompts_live",
    "interactive_apps_live",
    "component_widgets_live",
    "tool_result_embedded_resources_live",
    "tools_call_live_execution"
  ]) {
    expectEqual(errors, value.publication_policy?.[flag], false, `publication_policy.${flag}`);
  }
  expectEqual(
    errors,
    value.release_gate?.gate_status,
    "blocked_live_mcp_client_maturity_validation",
    "release_gate.gate_status"
  );
  expectEqual(errors, value.release_gate?.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArray(
    errors,
    value.release_gate?.required_signoffs,
    ["platform", "security", "developer-relations", "data-rights"],
    "release_gate.required_signoffs"
  );
  expectArray(errors, value.release_gate?.blockers, requiredBlockers, "release_gate.blockers");

  errors.push(...validateDatabase(databaseValue));
  errors.push(...validateMigration(sourceFilesValue.migration));
  errors.push(...validatePackage(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTracker(sourceFilesValue.tracker));

  const scannedText = [
    readText(contractPath),
    readText(packageJsonPath),
    readText(databaseContractPath),
    sourceFilesValue.migration
  ].join("\n");
  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(scannedText)) {
      errors.push(`forbidden secret-like pattern matched: ${pattern}`);
    }
  }

  return errors;
}

function validateDatabase(value) {
  const errors = [];
  const migration = value.migrations?.find((entry) => entry.file === migrationPath);

  if (migration === undefined) {
    return [`database migrations contract missing ${migrationPath}`];
  }

  expectArray(errors, migration.tables, requiredTables, "database.migration.tables");
  expectEqual(errors, migration.default_rights_status, "default_deny", "database.migration.default_rights_status");
  expectEqual(errors, migration.market_data, false, "database.migration.market_data");
  return errors;
}

function validateMigration(value) {
  const errors = [];

  for (const table of requiredTables) {
    if (!value.includes(table)) {
      errors.push(`migration missing table ${table}`);
    }
  }

  for (const snippet of [
    "resources_live boolean not null default false",
    "prompts_live boolean not null default false",
    "interactive_apps_live boolean not null default false",
    "component_widgets_live boolean not null default false",
    "tool_result_embedded_resources_live boolean not null default false",
    "fallback_mode text not null default 'tools_only'",
    "live_tool_execution_enabled boolean not null default false",
    "live_db_writes_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "gate_status text not null default 'blocked_live_mcp_client_maturity_validation'",
    "default_rights_status text not null default 'default_deny'"
  ]) {
    if (!value.includes(snippet)) {
      errors.push(`migration missing no-live snippet: ${snippet}`);
    }
  }

  return errors;
}

function validatePackage(value) {
  const errors = [];

  if (
    value.scripts?.["check:mcp-client-maturity"] !==
    "node scripts/check-mcp-client-maturity-contract.mjs"
  ) {
    errors.push("package.json missing check:mcp-client-maturity script");
  }

  if (
    typeof value.scripts?.check !== "string" ||
    !value.scripts.check.includes("npm run check:mcp-client-maturity")
  ) {
    errors.push("package.json root check does not include check:mcp-client-maturity");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    runtime: [
      "MCP_CLIENT_MATURITY_VERSION",
      "MCP_CLIENT_MATURITY_REQUIRED_CHECKS",
      "createMcpClientMaturityPlan",
      "getMcpClientMaturityCapabilities",
      "no_live_resources_prompts_apps_claim"
    ],
    runtimeTest: [
      "plans MCP resources prompts and interactive apps client maturity without live publication",
      "blocks MCP client maturity assessment for unknown clients"
    ],
    worker: [
      'app.post("/mcp/client-maturity/plan"',
      "createMcpClientMaturityPlan",
      "getMcpClientMaturityCapabilities",
      "requested_feature"
    ],
    workerTest: [
      "plans MCP resources prompts and interactive apps client maturity without live publication",
      "POST /mcp/client-maturity/plan"
    ]
  };

  for (const [fileKey, tokens] of Object.entries(requiredByFile)) {
    const text = value[fileKey];

    for (const token of tokens) {
      if (!text.includes(token)) {
        errors.push(`${fileKey} missing token: ${token}`);
      }
    }
  }

  return errors;
}

function validateTracker(tracker) {
  const errors = [];

  if (!tracker.includes("- [x] MCP resources/prompts 或交互式 MCP Apps")) {
    errors.push("tracker must mark MCP resources/prompts or Apps maturity item complete");
  }

  if (!tracker.includes("npm run check:mcp-client-maturity")) {
    errors.push("tracker MCP client maturity row must reference check:mcp-client-maturity");
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
