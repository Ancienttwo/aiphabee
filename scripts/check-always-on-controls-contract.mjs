#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/always-on-controls.contract.json";
const packageJsonPath = "package.json";
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_market_calendar",
  "get_quote_snapshot",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_financial_ratios",
  "search_announcements",
  "get_announcement",
  "screen_securities",
  "compare_securities",
  "calculate_returns_risk",
  "get_event_timeline",
  "get_data_lineage",
  "get_entitlements"
];
const requiredEnvelopeFields = ["ok", "request_id", "as_of", "market_status", "provenance", "usage"];
const requiredClaimLabels = ["fact", "calculation", "inference", "unknown"];
const requiredEvidenceStrengthValues = ["strong", "medium", "weak", "unknown"];
const requiredGatewayChannels = ["web", "mcp", "api", "export"];
const requiredEvalMetrics = [
  "fact_accuracy",
  "calculation_accuracy",
  "citation_accuracy",
  "correct_refusal_rate"
];
const requiredBudgetDimensions = ["steps", "credits", "rows", "tokens", "wall_clock_ms"];
const requiredChecks = [
  "registered_p0_tool_outputs_have_standard_envelope",
  "golden_tool_fixtures_have_provenance_and_usage",
  "answer_contract_requires_claim_labels_and_evidence_strength",
  "gateway_channels_default_deny",
  "mcp_web_rights_do_not_imply_redistribution",
  "tool_enforcement_registered_schema_bound_no_sql_no_url",
  "eval_v1_metric_coverage_present",
  "ci_runs_golden_regression_hook",
  "budget_policy_has_dimensions_and_graceful_stop"
];
const requiredCoveredTrackerItems = [
  "A1.standard_response_envelope_consistent_for_registered_p0_tools",
  "A1.answer_claim_labels_fact_calculation_inference_unknown",
  "A1.evidence_strength_uses_categorical_values",
  "A2.default_deny_for_unconfirmed_rights",
  "A2.web_rights_do_not_imply_mcp_redistribution",
  "A3.tool_allowlist_blocks_arbitrary_sql_url_unregistered_tools",
  "A4.eval_v1_covers_fact_calculation_citation_refusal",
  "A4.golden_regression_hook_is_ci_resident",
  "A5.single_run_budget_stop_policy"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const linked = {
  answerEvidence: readJson("deploy/agent/answer-evidence-contract.contract.json"),
  budget: readJson("deploy/agent/budget-stop-policy.contract.json"),
  evalV1: readJson("deploy/observability/eval-v1.contract.json"),
  gateway: readJson("deploy/gateway/access.contract.json"),
  mcpEndpoint: readJson("deploy/mcp/endpoint.contract.json"),
  p0Catalog: readJson("deploy/tools/p0-tool-catalog.contract.json"),
  toolEnforcement: readJson("deploy/agent/tool-enforcement.contract.json"),
  toolManifest: readJson("tests/golden/tools/manifest.json"),
  toolSchemas: readJson("deploy/tools/tool-schemas.contract.json")
};
const ciWorkflow = readText(".github/workflows/ci.yml");
const errors = validateContract(contract, packageJson, linked, ciWorkflow);

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
    checked_items: contract.covered_tracker_items.length,
    p0_tool_count: requiredTools.length,
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

function validateContract(value, packageValue, linkedContracts, ciText) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.always-on-controls-closeout.v0") {
    errors.push("version must match always-on controls closeout version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.tracker_section !== "docs/AiphaBee_Sprint_Tracker_v1.0.md#A") {
    errors.push("tracker_section must point to §A");
  }

  for (const field of ["frontend", "live_data_access", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (value.p0_tool_count !== requiredTools.length) {
    errors.push(`p0_tool_count must be ${requiredTools.length}`);
  }

  errors.push(
    ...validateStringArray(
      value.covered_tracker_items,
      requiredCoveredTrackerItems,
      "covered_tracker_items"
    )
  );
  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(...validateLinkedFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateToolSchemas(linkedContracts.toolSchemas));
  errors.push(...validateToolGoldenFixtures(linkedContracts.toolManifest));
  errors.push(...validateP0Catalog(linkedContracts.p0Catalog));
  errors.push(...validateAnswerEvidence(linkedContracts.answerEvidence));
  errors.push(...validateGatewayDefaultDeny(linkedContracts.gateway));
  errors.push(...validateMcpEndpoint(linkedContracts.mcpEndpoint));
  errors.push(...validateToolEnforcement(linkedContracts.toolEnforcement));
  errors.push(...validateEvalV1(linkedContracts.evalV1));
  errors.push(...validateBudget(linkedContracts.budget));
  errors.push(...validateCiWorkflow(ciText));
  errors.push(...validateNoSecrets({ contract: value, linkedContracts }));

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (value.scripts["check:always-on-controls"] !== "node scripts/check-always-on-controls-contract.mjs") {
    errors.push("package.json must define check:always-on-controls");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:always-on-controls")
  ) {
    errors.push("package.json check script must include check:always-on-controls");
  }

  return errors;
}

function validateToolSchemas(value) {
  if (!isRecord(value) || !isRecord(value.schemas)) {
    return ["tool schema contract must expose schemas"];
  }

  const errors = [];

  if (value.standard_response_envelope !== true) {
    errors.push("tool schemas must require the standard response envelope");
  }

  errors.push(
    ...validateStringArray(value.required_envelope_fields, requiredEnvelopeFields, "required_envelope_fields")
  );

  for (const toolName of requiredTools) {
    const schema = value.schemas[toolName]?.output;
    if (!isRecord(schema)) {
      errors.push(`missing output schema for ${toolName}`);
      continue;
    }

    errors.push(...validateStringArray(schema.required, [...requiredEnvelopeFields, "data"], `${toolName}.output.required`));

    const dataProperties = schema.properties?.data?.properties;
    if (!isRecord(dataProperties)) {
      errors.push(`${toolName}.output.data.properties missing`);
      continue;
    }

    if (dataProperties.toolName?.const !== toolName) {
      errors.push(`${toolName}.data.toolName const must match tool name`);
    }

    if (dataProperties.liveDataAccess?.const !== false) {
      errors.push(`${toolName}.data.liveDataAccess must be false`);
    }
  }

  if (Object.keys(value.schemas).length !== requiredTools.length) {
    errors.push(`tool schema contract must contain exactly ${requiredTools.length} schemas`);
  }

  return errors;
}

function validateToolGoldenFixtures(value) {
  if (!isRecord(value) || !Array.isArray(value.samples)) {
    return ["tool golden manifest must expose samples"];
  }

  const errors = [];
  const seen = new Set();

  value.samples.forEach((sample, index) => {
    if (!isRecord(sample)) {
      errors.push(`tool samples[${index}] must be an object`);
      return;
    }

    if (typeof sample.tool_name === "string") {
      seen.add(sample.tool_name);
    }

    const fixturePath = sample.fixture_path;
    if (typeof fixturePath !== "string" || !existsSync(resolve(process.cwd(), fixturePath))) {
      errors.push(`tool samples[${index}] fixture_path must exist`);
      return;
    }

    const fixture = readJson(fixturePath);
    const response = fixture.expected_response;
    if (!isRecord(response)) {
      errors.push(`${fixturePath} expected_response must be an object`);
      return;
    }

    for (const field of requiredEnvelopeFields) {
      if (!Object.hasOwn(response, field)) {
        errors.push(`${fixturePath} missing envelope field ${field}`);
      }
    }

    if (!Array.isArray(response.provenance) || response.provenance.length === 0) {
      errors.push(`${fixturePath} provenance must be non-empty`);
    } else {
      response.provenance.forEach((record, recordIndex) => {
        if (!isRecord(record)) {
          errors.push(`${fixturePath} provenance[${recordIndex}] must be an object`);
          return;
        }

        for (const field of ["source", "source_record_id", "data_version", "methodology_version"]) {
          if (typeof record[field] !== "string" || record[field].length === 0) {
            errors.push(`${fixturePath} provenance[${recordIndex}].${field} must be a non-empty string`);
          }
        }
      });
    }

    if (!isRecord(response.usage)) {
      errors.push(`${fixturePath} usage must be an object`);
    } else {
      for (const field of ["cached", "credits", "rows"]) {
        if (!Object.hasOwn(response.usage, field)) {
          errors.push(`${fixturePath} usage missing ${field}`);
        }
      }
    }
  });

  for (const toolName of requiredTools) {
    if (!seen.has(toolName)) {
      errors.push(`tool golden manifest missing ${toolName}`);
    }
  }

  if (value.samples.length !== requiredTools.length) {
    errors.push(`tool golden manifest must contain exactly ${requiredTools.length} samples`);
  }

  return errors;
}

function validateP0Catalog(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["P0 catalog contract must be an object"];
  }

  for (const field of ["p0_tool_count", "registry_tool_count", "tool_schema_pairs", "mcp_validated_tools", "golden_fixture_count"]) {
    if (value[field] !== requiredTools.length) {
      errors.push(`P0 catalog ${field} must be ${requiredTools.length}`);
    }
  }

  errors.push(...validateStringArray(value.required_tools, requiredTools, "p0_catalog.required_tools"));
  errors.push(
    ...validateStringArray(
      value.unified_surfaces,
      ["tool_schemas", "golden_fixtures", "agent_tool_enforcement", "mcp_usage_envelope"],
      "p0_catalog.unified_surfaces"
    )
  );

  return errors;
}

function validateAnswerEvidence(value) {
  if (!isRecord(value)) {
    return ["answer evidence contract must be an object"];
  }

  const errors = [];

  errors.push(...validateStringArray(value.required_claim_labels, requiredClaimLabels, "required_claim_labels"));

  if (!isRecord(value.evidence_strength)) {
    errors.push("evidence_strength must be an object");
  } else {
    errors.push(
      ...validateStringArray(
        value.evidence_strength.allowed_values,
        requiredEvidenceStrengthValues,
        "evidence_strength.allowed_values"
      )
    );

    if (value.evidence_strength.confidence_score_display !== false) {
      errors.push("evidence strength must not expose confidence_score_display");
    }
  }

  return errors;
}

function validateGatewayDefaultDeny(value) {
  if (!isRecord(value)) {
    return ["gateway access contract must be an object"];
  }

  const errors = [];

  if (value.default_rights_status !== "default_deny") {
    errors.push("gateway default_rights_status must be default_deny");
  }

  const channelStatus = new Map(
    Array.isArray(value.channels)
      ? value.channels.filter(isRecord).map((channel) => [channel.name, channel.status])
      : []
  );

  for (const channel of requiredGatewayChannels) {
    if (channelStatus.get(channel) !== "default_deny") {
      errors.push(`gateway channel ${channel} must be default_deny`);
    }
  }

  return errors;
}

function validateMcpEndpoint(value) {
  if (!isRecord(value)) {
    return ["MCP endpoint contract must be an object"];
  }

  const errors = [];

  if (value.default_deny !== true) {
    errors.push("MCP endpoint default_deny must be true");
  }

  if (value.web_rights_do_not_imply_mcp !== true) {
    errors.push("MCP endpoint must state web_rights_do_not_imply_mcp");
  }

  if (value.mcp_api_redistribution_rights_confirmed !== false) {
    errors.push("MCP redistribution rights must remain unconfirmed");
  }

  return errors;
}

function validateToolEnforcement(value) {
  if (!isRecord(value)) {
    return ["tool enforcement contract must be an object"];
  }

  const errors = [];

  if (value.registered_tool_count !== requiredTools.length) {
    errors.push(`tool enforcement registered_tool_count must be ${requiredTools.length}`);
  }

  for (const field of ["registered_tools_only", "schema_bound", "permission_aware", "versioned_tools"]) {
    if (value[field] !== true) {
      errors.push(`tool enforcement ${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.required_checks,
      ["registered", "schema_bound", "no_arbitrary_sql", "no_arbitrary_url", "read_only_no_live_data"],
      "tool_enforcement.required_checks"
    )
  );
  errors.push(
    ...validateStringArray(value.forbidden_tool_names, ["sql.query", "http.fetch"], "tool_enforcement.forbidden_tool_names")
  );

  return errors;
}

function validateEvalV1(value) {
  if (!isRecord(value) || !Array.isArray(value.metrics)) {
    return ["eval v1 contract must include metrics"];
  }

  const metricIds = value.metrics
    .filter(isRecord)
    .map((metric) => metric.metric_id)
    .filter((metricId) => typeof metricId === "string");

  return validateStringArray(metricIds, requiredEvalMetrics, "eval_v1.metrics");
}

function validateBudget(value) {
  if (!isRecord(value)) {
    return ["budget contract must be an object"];
  }

  const errors = [];

  errors.push(...validateStringArray(value.budget_dimensions, requiredBudgetDimensions, "budget_dimensions"));

  if (!isRecord(value.graceful_stop)) {
    errors.push("budget graceful_stop must be an object");
  } else {
    for (const field of ["returns_partial_result", "returns_continue_cost", "does_not_throw_for_valid_budget_exhaustion"]) {
      if (value.graceful_stop[field] !== true) {
        errors.push(`budget graceful_stop.${field} must be true`);
      }
    }
  }

  return errors;
}

function validateCiWorkflow(value) {
  const errors = [];

  if (!/Golden Regression Hook/u.test(value)) {
    errors.push("CI workflow must include Golden Regression Hook step");
  }

  if (!/npm run test:golden/u.test(value)) {
    errors.push("CI workflow must run npm run test:golden");
  }

  return errors;
}

function validateLinkedFiles(paths) {
  if (!Array.isArray(paths)) {
    return ["linked_contracts must be an array"];
  }

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${String(path)}`);
}

function validateStringArray(value, expected, path) {
  if (!Array.isArray(value)) {
    return [`${path} must be an array`];
  }

  const actual = value.filter((item) => typeof item === "string");
  const errors = [];

  for (const item of expected) {
    if (!actual.includes(item)) {
      errors.push(`${path} must include ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract must not contain secret-like value matching ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(code);
}
