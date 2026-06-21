#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/numeric-lineage.contract.json";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const dataContractsPath = "packages/data-contracts/src/index.ts";
const requiredLineageFields = ["source", "source_record_id", "data_version", "methodology_version"];
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
const methodologyByTool = {
  calculate_returns_risk: "2026-06-21.phase2.returns-risk-scaffold.v0",
  compare_securities: "2026-06-21.phase2.compare-securities-scaffold.v0",
  get_announcement: "2026-06-21.phase2.get-announcement-scaffold.v0",
  get_corporate_actions: "2026-06-21.phase1.get-corporate-actions-tool-scaffold.v0",
  get_data_lineage: "2026-06-21.phase1.evidence-lineage-tools-scaffold.v0",
  get_entitlements: "2026-06-21.phase1.evidence-lineage-tools-scaffold.v0",
  get_event_timeline: "2026-06-21.phase3.get-event-timeline-tool-scaffold.v0",
  get_financial_facts: "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
  get_financial_ratios: "2026-06-21.phase2.financial-ratios-scaffold.v0",
  get_market_calendar: "2026-06-21.phase1.get-market-calendar-tool-scaffold.v0",
  get_price_history: "2026-06-21.phase1.get-price-history-tool-scaffold.v0",
  get_quote_snapshot: "2026-06-21.phase1.get-quote-snapshot-tool-scaffold.v0",
  get_security_profile: "2026-06-21.phase1.get-security-profile-tool-scaffold.v0",
  resolve_security: "2026-06-21.phase1.resolve-security-tool-scaffold.v0",
  screen_securities: "2026-06-21.phase2.screen-securities-scaffold.v0",
  search_announcements: "2026-06-21.phase2.search-announcements-scaffold.v0"
};
const requiredChecks = [
  "provenance_ref_requires_methodology_version",
  "tool_output_schemas_require_lineage_triad",
  "golden_manifest_source_records_include_lineage_triad",
  "golden_fixture_envelopes_include_lineage_triad",
  "answer_evidence_cards_require_lineage_triad",
  "numeric_source_guard_blocks_unmapped_numbers",
  "evidence_service_links_source_record_data_methodology"
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
const trackerText = readText(trackerPath);
const dataContractsSource = readText(dataContractsPath);
const linked = {
  answerEvidence: readJson("deploy/agent/answer-evidence-contract.contract.json"),
  evidenceLineage: readJson("deploy/tools/evidence-lineage.contract.json"),
  evidenceService: readJson("deploy/evidence/service.contract.json"),
  numericSourceGuard: readJson("deploy/agent/numeric-source-guard.contract.json"),
  toolManifest: readJson("tests/golden/tools/manifest.json"),
  toolSchemas: readJson("deploy/tools/tool-schemas.contract.json")
};

const errors = validateContract(contract, packageJson, trackerText, dataContractsSource, linked);

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
    lineage_fields: requiredLineageFields,
    p0_tool_count: requiredTools.length,
    status: "ok",
    tool_golden_samples: linked.toolManifest.samples.length
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

function validateContract(value, packageValue, trackerValue, dataContractsValue, linkedContracts) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.numeric-lineage-dat09.v0") {
    errors.push("version must match numeric lineage DAT-09 closeout version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.tracker_item !== "A1.DAT-09") {
    errors.push("tracker_item must be A1.DAT-09");
  }

  if (value.scope !== "registered_p0_tool_outputs_and_golden_fixtures") {
    errors.push("scope must be registered_p0_tool_outputs_and_golden_fixtures");
  }

  for (const field of ["frontend", "live_data_access", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (value.p0_tool_count !== requiredTools.length) {
    errors.push(`p0_tool_count must be ${requiredTools.length}`);
  }

  errors.push(...validateStringArray(value.required_lineage_fields, requiredLineageFields, "required_lineage_fields"));
  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(...validateLinkedFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateTracker(trackerValue));
  errors.push(...validateDataContracts(dataContractsValue));
  errors.push(...validateToolSchemas(linkedContracts.toolSchemas));
  errors.push(...validateToolGoldenManifest(linkedContracts.toolManifest));
  errors.push(...validateAnswerEvidence(linkedContracts.answerEvidence));
  errors.push(...validateNumericSourceGuard(linkedContracts.numericSourceGuard));
  errors.push(...validateEvidenceLineage(linkedContracts.evidenceLineage));
  errors.push(...validateEvidenceService(linkedContracts.evidenceService));
  errors.push(...validateNoSecrets({ contract: value, linkedContracts }));

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (value.scripts["check:numeric-lineage"] !== "node scripts/check-numeric-lineage-contract.mjs") {
    errors.push("package.json must define check:numeric-lineage");
  }

  if (typeof value.scripts.check !== "string" || !value.scripts.check.includes("npm run check:numeric-lineage")) {
    errors.push("package.json check script must include check:numeric-lineage");
  }

  return errors;
}

function validateTracker(value) {
  const errors = [];

  if (!/- \[x\] 任一对外数值都能映射到 `source_record_id` \+ `data_version` \+ `methodology_version`/u.test(value)) {
    errors.push("tracker A1 DAT-09 item must be checked");
  }

  if (!/npm run check:numeric-lineage/u.test(value)) {
    errors.push("tracker must mention npm run check:numeric-lineage");
  }

  if (!/\| DAT-09 来源\/血缘\/证据快照 \| P0 \| 1\.2 \| ☑ \|/u.test(value)) {
    errors.push("tracker traceability matrix must mark DAT-09 complete");
  }

  return errors;
}

function validateDataContracts(value) {
  const errors = [];
  const provenanceRefMatch = value.match(/interface ProvenanceRef\s*\{(?<body>[^}]+)\}/u);
  const provenanceRefBody = provenanceRefMatch?.groups?.body ?? "";

  if (!provenanceRefMatch) {
    errors.push("data-contracts must define ProvenanceRef");
  }

  if (/methodology_version\?:\s*string/u.test(provenanceRefBody)) {
    errors.push("ProvenanceRef.methodology_version must not be optional");
  }

  if (!/methodology_version:\s*string/u.test(provenanceRefBody)) {
    errors.push("ProvenanceRef.methodology_version must be required");
  }

  return errors;
}

function validateToolSchemas(value) {
  if (!isRecord(value) || !isRecord(value.schemas)) {
    return ["tool schema contract must expose schemas"];
  }

  const errors = [];

  if (value.numeric_lineage_required !== true) {
    errors.push("tool schema contract numeric_lineage_required must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_provenance_fields,
      requiredLineageFields,
      "tool_schemas.required_provenance_fields"
    )
  );

  for (const toolName of requiredTools) {
    const output = value.schemas[toolName]?.output;
    if (!isRecord(output)) {
      errors.push(`missing output schema for ${toolName}`);
      continue;
    }

    errors.push(...validateStringArray(output.required, ["data_version", "methodology_version"], `${toolName}.output.required`));

    const provenance = output.properties?.provenance;
    if (!isRecord(provenance) || provenance.type !== "array" || provenance.minItems !== 1) {
      errors.push(`${toolName}.output.provenance must be a non-empty array schema`);
    } else {
      errors.push(
        ...validateStringArray(
          provenance.items?.required,
          requiredLineageFields,
          `${toolName}.output.provenance.items.required`
        )
      );
    }

    const data = output.properties?.data;
    if (!isRecord(data)) {
      errors.push(`${toolName}.output.data schema missing`);
    } else {
      errors.push(...validateStringArray(data.required, ["data_version", "methodology_version"], `${toolName}.output.data.required`));

      if (data.properties?.methodology_version?.const !== methodologyByTool[toolName]) {
        errors.push(`${toolName}.output.data.methodology_version const must match registered methodology`);
      }
    }
  }

  if (Object.keys(value.schemas).length !== requiredTools.length) {
    errors.push(`tool schema contract must contain exactly ${requiredTools.length} schema pairs`);
  }

  return errors;
}

function validateToolGoldenManifest(value) {
  if (!isRecord(value) || !Array.isArray(value.samples)) {
    return ["tool golden manifest must expose samples"];
  }

  const errors = [];
  const seenTools = new Set();

  value.samples.forEach((sample, sampleIndex) => {
    if (!isRecord(sample)) {
      errors.push(`tool samples[${sampleIndex}] must be an object`);
      return;
    }

    const toolName = sample.tool_name;
    if (typeof toolName === "string") {
      seenTools.add(toolName);
    }

    if (typeof toolName !== "string" || !requiredTools.includes(toolName)) {
      errors.push(`tool samples[${sampleIndex}].tool_name must be a registered P0 tool`);
      return;
    }

    if (!Array.isArray(sample.source_records) || sample.source_records.length === 0) {
      errors.push(`${toolName}.source_records must be non-empty`);
      return;
    }

    sample.source_records.forEach((sourceRecord, sourceRecordIndex) => {
      errors.push(
        ...validateLineageRecord(
          sourceRecord,
          `${toolName}.source_records[${sourceRecordIndex}]`,
          methodologyByTool[toolName]
        )
      );
    });

    if (typeof sample.fixture_path !== "string" || !existsSync(resolve(process.cwd(), sample.fixture_path))) {
      errors.push(`${toolName}.fixture_path must exist`);
      return;
    }

    const fixture = readJson(sample.fixture_path);
    errors.push(...validateToolGoldenFixture(sample, fixture));
  });

  for (const toolName of requiredTools) {
    if (!seenTools.has(toolName)) {
      errors.push(`tool golden manifest missing ${toolName}`);
    }
  }

  if (value.samples.length !== requiredTools.length) {
    errors.push(`tool golden manifest must contain exactly ${requiredTools.length} samples`);
  }

  return errors;
}

function validateToolGoldenFixture(sample, fixture) {
  const errors = [];
  const toolName = sample.tool_name;
  const methodologyVersion = methodologyByTool[toolName];

  if (!isRecord(fixture) || !isRecord(fixture.expected_response)) {
    return [`${sample.fixture_path} expected_response must be an object`];
  }

  const response = fixture.expected_response;

  if (response.data_version !== sample.source_records[0]?.data_version) {
    errors.push(`${sample.fixture_path} expected_response.data_version must match manifest source record`);
  }

  if (response.methodology_version !== methodologyVersion) {
    errors.push(`${sample.fixture_path} expected_response.methodology_version must match registered methodology`);
  }

  if (!isRecord(response.data)) {
    errors.push(`${sample.fixture_path} expected_response.data must be an object`);
  } else {
    if (response.data.data_version !== response.data_version) {
      errors.push(`${sample.fixture_path} expected_response.data.data_version must match envelope`);
    }

    if (response.data.methodology_version !== methodologyVersion) {
      errors.push(`${sample.fixture_path} expected_response.data.methodology_version must match registered methodology`);
    }
  }

  if (!Array.isArray(response.provenance) || response.provenance.length === 0) {
    errors.push(`${sample.fixture_path} expected_response.provenance must be non-empty`);
    return errors;
  }

  for (const sourceRecord of sample.source_records) {
    const matchingResponseRecord = response.provenance.find(
      (record) => isRecord(record) && record.source_record_id === sourceRecord.source_record_id
    );

    if (!matchingResponseRecord) {
      errors.push(`${sample.fixture_path} provenance missing ${sourceRecord.source_record_id}`);
      continue;
    }

    errors.push(
      ...validateLineageRecord(
        matchingResponseRecord,
        `${sample.fixture_path}.provenance.${sourceRecord.source_record_id}`,
        methodologyVersion
      )
    );

    for (const field of ["data_version", "methodology_version"]) {
      if (matchingResponseRecord[field] !== sourceRecord[field]) {
        errors.push(`${sample.fixture_path} provenance ${field} must match manifest for ${sourceRecord.source_record_id}`);
      }
    }
  }

  return errors;
}

function validateAnswerEvidence(value) {
  if (!isRecord(value)) {
    return ["answer evidence contract must be an object"];
  }

  return validateStringArray(
    value.evidence_card_required_fields,
    ["source_record_id", "data_version", "methodology_version"],
    "answer_evidence.evidence_card_required_fields"
  );
}

function validateNumericSourceGuard(value) {
  if (!isRecord(value)) {
    return ["numeric source guard contract must be an object"];
  }

  const errors = [];

  if (value.answer_contract?.requires_source_record_ref !== true) {
    errors.push("numeric source guard must require source record refs");
  }

  if (value.answer_contract?.requires_calculation_ref !== true) {
    errors.push("numeric source guard must require calculation refs");
  }

  errors.push(
    ...validateStringArray(
      value.required_deterministic_calculation_fields,
      ["input_source", "methodology_version", "required_source_tools"],
      "numeric_source_guard.required_deterministic_calculation_fields"
    )
  );

  errors.push(
    ...validateStringArray(
      value.blocked_sources,
      ["model_memory", "training_data", "unverified_prompt", "unstated_source"],
      "numeric_source_guard.blocked_sources"
    )
  );

  return errors;
}

function validateEvidenceLineage(value) {
  if (!isRecord(value) || !Array.isArray(value.tools)) {
    return ["evidence lineage contract must expose tools"];
  }

  const tool = value.tools.find((item) => isRecord(item) && item.tool_name === "get_data_lineage");
  if (!isRecord(tool)) {
    return ["evidence lineage contract must include get_data_lineage"];
  }

  return validateStringArray(
    tool.required_lineage_fields,
    ["sourceRecordId", "dataVersion", "methodologyVersion"],
    "evidence_lineage.get_data_lineage.required_lineage_fields"
  );
}

function validateEvidenceService(value) {
  if (!isRecord(value)) {
    return ["evidence service contract must be an object"];
  }

  return validateStringArray(
    value.required_source_ref_fields,
    ["sourceRecordId", "dataVersion", "methodologyVersion"],
    "evidence_service.required_source_ref_fields"
  );
}

function validateLineageRecord(value, path, expectedMethodologyVersion) {
  const errors = [];

  if (!isRecord(value)) {
    return [`${path} must be an object`];
  }

  for (const field of requiredLineageFields) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      errors.push(`${path}.${field} must be a non-empty string`);
    }
  }

  if (value.methodology_version !== expectedMethodologyVersion) {
    errors.push(`${path}.methodology_version must be ${expectedMethodologyVersion}`);
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
