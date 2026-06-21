#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const manifestRelativePath = "tests/golden/manifest.json";
const toolManifestRelativePath = "tests/golden/tools/manifest.json";
const manifestPath = resolve(process.cwd(), manifestRelativePath);
const toolManifestPath = resolve(process.cwd(), toolManifestRelativePath);
const goldenRoot = resolve(process.cwd(), "tests/golden");
const toolGoldenRoot = resolve(process.cwd(), "tests/golden/tools");
const requireFixtures = process.argv.includes("--require-fixtures");
const REQUIRED_TOOL_GOLDEN_TOOLS = [
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

const QUALITY_RULES = [
  {
    id: "QK-001",
    run: runPrimaryKeyRule
  },
  {
    id: "QT-001",
    run: runTimeIntegrityRule
  },
  {
    id: "QT-002",
    run: runPointInTimeRule
  },
  {
    id: "QU-001",
    run: runFinancialUnitRule
  },
  {
    id: "QP-001",
    run: runPriceOhlcRule
  },
  {
    id: "QP-002",
    run: runPriceVolumeRule
  },
  {
    id: "QA-001",
    run: runCorporateActionRule
  },
  {
    id: "QF-001",
    run: runFinancialIdentityRule
  },
  {
    id: "QF-002",
    run: runRestatementRule
  },
  {
    id: "QE-001",
    run: runLifecycleRule
  },
  {
    id: "QE-002",
    run: runDualListingRule
  },
  {
    id: "QL-001",
    run: runLineageRule
  }
];

if (!existsSync(manifestPath)) {
  emit(
    {
      manifest: manifestRelativePath,
      message:
        "Golden regression hook is installed; fixture manifest is not committed yet.",
      status: "not_configured"
    },
    requireFixtures ? 1 : 0
  );
}

const manifestResult = readJsonFile(manifestPath, manifestRelativePath);

if (!manifestResult.ok) {
  emit(
    {
      error: manifestResult.error,
      manifest: manifestRelativePath,
      status: "invalid_json"
    },
    1
  );
}

const manifest = manifestResult.value;
const manifestErrors = validateManifest(manifest);

if (manifestErrors.length > 0) {
  emit(
    {
      errors: manifestErrors,
      manifest: manifestRelativePath,
      status: "invalid_manifest"
    },
    1
  );
}

const fixtureResults = validateAndRunFixtures(manifest);
const toolFixtureResults = validateToolGoldenFixtures();

if (fixtureResults.errors.length > 0 || toolFixtureResults.errors.length > 0) {
  emit(
    {
      errors: [...fixtureResults.errors, ...toolFixtureResults.errors],
      manifest: manifestRelativePath,
      status: "invalid_fixtures"
    },
    1
  );
}

emit(
  {
    manifest: manifestRelativePath,
    quality_rule_count: QUALITY_RULES.length,
    sample_count: manifest.samples.length,
    states: countStates(fixtureResults.samples),
    tool_sample_count: toolFixtureResults.samples.length,
    tool_tools: toolFixtureResults.samples.map((sample) => sample.tool_name).sort(),
    status: "ok"
  },
  0
);

function validateToolGoldenFixtures() {
  const errors = [];
  const samples = [];

  if (!existsSync(toolManifestPath)) {
    if (requireFixtures) {
      errors.push(`${toolManifestRelativePath}: tool golden manifest is required`);
    }

    return { errors, samples };
  }

  const manifestResult = readJsonFile(toolManifestPath, toolManifestRelativePath);

  if (!manifestResult.ok) {
    return {
      errors: [`${toolManifestRelativePath}: ${manifestResult.error}`],
      samples
    };
  }

  const toolManifest = manifestResult.value;
  errors.push(...validateToolManifest(toolManifest));

  if (errors.length > 0) {
    return { errors, samples };
  }

  toolManifest.samples.forEach((sample, index) => {
    const samplePrefix = `tool_samples[${index}] ${sample.sample_id}`;
    const fixturePath = resolve(process.cwd(), sample.fixture_path);

    if (!isPathInside(toolGoldenRoot, fixturePath)) {
      errors.push(`${samplePrefix}: fixture_path must stay under tests/golden/tools`);
      return;
    }

    if (!existsSync(fixturePath)) {
      errors.push(`${samplePrefix}: fixture_path does not exist`);
      return;
    }

    const fixtureResult = readJsonFile(fixturePath, sample.fixture_path);

    if (!fixtureResult.ok) {
      errors.push(`${samplePrefix}: invalid fixture JSON: ${fixtureResult.error}`);
      return;
    }

    errors.push(...validateToolFixture(sample, fixtureResult.value, samplePrefix));

    samples.push({
      sample_id: sample.sample_id,
      tool_name: sample.tool_name
    });
  });

  return { errors, samples };
}

function validateToolManifest(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["tool golden manifest must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("tool golden manifest version must be a non-empty string");
  }

  if (!Array.isArray(value.samples) || value.samples.length === 0) {
    errors.push("tool golden manifest samples must be a non-empty array");
    return errors;
  }

  const seenIds = new Set();
  const toolNames = new Set();

  value.samples.forEach((sample, index) => {
    if (!isRecord(sample)) {
      errors.push(`tool_samples[${index}] must be an object`);
      return;
    }

    for (const field of [
      "sample_id",
      "tool_name",
      "fixture_path",
      "input_schema_id",
      "output_schema_id",
      "expected_status"
    ]) {
      if (typeof sample[field] !== "string" || sample[field].length === 0) {
        errors.push(`tool_samples[${index}].${field} must be a non-empty string`);
      }
    }

    if (!Array.isArray(sample.source_records) || sample.source_records.length === 0) {
      errors.push(`tool_samples[${index}].source_records must be a non-empty array`);
    }

    if (typeof sample.sample_id === "string") {
      if (seenIds.has(sample.sample_id)) {
        errors.push(`tool_samples[${index}].sample_id is duplicated`);
      }

      seenIds.add(sample.sample_id);
    }

    if (typeof sample.tool_name === "string") {
      toolNames.add(sample.tool_name);

      if (sample.input_schema_id !== `tool.${sample.tool_name}.input.v0`) {
        errors.push(`tool_samples[${index}].input_schema_id must match tool name`);
      }

      if (sample.output_schema_id !== `tool.${sample.tool_name}.output.v0`) {
        errors.push(`tool_samples[${index}].output_schema_id must match tool name`);
      }
    }
  });

  for (const toolName of REQUIRED_TOOL_GOLDEN_TOOLS) {
    if (!toolNames.has(toolName)) {
      errors.push(`tool golden manifest must include ${toolName}`);
    }
  }

  return errors;
}

function validateToolFixture(sample, fixture, samplePrefix) {
  const errors = [];

  if (!isRecord(fixture)) {
    return [`${samplePrefix}: fixture must be an object`];
  }

  if (fixture.sample_id !== sample.sample_id) {
    errors.push(`${samplePrefix}: fixture sample_id must match manifest`);
  }

  if (fixture.tool_name !== sample.tool_name) {
    errors.push(`${samplePrefix}: fixture tool_name must match manifest`);
  }

  if (fixture.input_schema_id !== sample.input_schema_id) {
    errors.push(`${samplePrefix}: input_schema_id must match manifest`);
  }

  if (fixture.output_schema_id !== sample.output_schema_id) {
    errors.push(`${samplePrefix}: output_schema_id must match manifest`);
  }

  if (!isRecord(fixture.request)) {
    errors.push(`${samplePrefix}: request must be an object`);
  }

  const response = fixture.expected_response;

  if (!isRecord(response)) {
    errors.push(`${samplePrefix}: expected_response must be an object`);
    return errors;
  }

  for (const field of [
    "ok",
    "request_id",
    "as_of",
    "market_status",
    "provenance",
    "usage",
    "data"
  ]) {
    if (!(field in response)) {
      errors.push(`${samplePrefix}: expected_response.${field} is required`);
    }
  }

  if (response.ok !== true) {
    errors.push(`${samplePrefix}: expected_response.ok must be true`);
  }

  if (!Array.isArray(response.provenance) || response.provenance.length === 0) {
    errors.push(`${samplePrefix}: expected_response.provenance must be non-empty`);
  }

  if (!isRecord(response.usage)) {
    errors.push(`${samplePrefix}: expected_response.usage must be an object`);
  }

  if (!isRecord(response.data)) {
    errors.push(`${samplePrefix}: expected_response.data must be an object`);
    return errors;
  }

  if (response.data.toolName !== sample.tool_name) {
    errors.push(`${samplePrefix}: expected_response.data.toolName must match tool`);
  }

  if (response.data.status !== sample.expected_status) {
    errors.push(`${samplePrefix}: expected_response.data.status must match expected_status`);
  }

  if (response.data.liveDataAccess !== false) {
    errors.push(`${samplePrefix}: expected_response.data.liveDataAccess must be false`);
  }

  const manifestSourceRecordIds = new Set(
    sample.source_records
      .filter(isRecord)
      .map((record) => record.source_record_id)
      .filter((value) => typeof value === "string")
  );
  const responseSourceRecordIds = new Set(
    response.provenance
      .filter(isRecord)
      .map((record) => record.source_record_id)
      .filter((value) => typeof value === "string")
  );

  for (const sourceRecordId of manifestSourceRecordIds) {
    if (!responseSourceRecordIds.has(sourceRecordId)) {
      errors.push(`${samplePrefix}: response provenance missing ${sourceRecordId}`);
    }
  }

  return errors;
}

function validateManifest(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (
    typeof value.quality_rules_version !== "string" ||
    value.quality_rules_version.length === 0
  ) {
    errors.push("quality_rules_version must be a non-empty string");
  }

  if (!Array.isArray(value.samples) || value.samples.length === 0) {
    errors.push("samples must be a non-empty array");
    return errors;
  }

  const seenIds = new Set();
  const requiredFields = [
    "sample_id",
    "sample_type",
    "methodology_version",
    "quality_expectation",
    "fixture_path"
  ];

  value.samples.forEach((sample, index) => {
    if (!isRecord(sample)) {
      errors.push(`samples[${index}] must be an object`);
      return;
    }

    for (const field of requiredFields) {
      if (typeof sample[field] !== "string" || sample[field].length === 0) {
        errors.push(`samples[${index}].${field} must be a non-empty string`);
      }
    }

    if (!isRecord(sample.expected_outputs)) {
      errors.push(`samples[${index}].expected_outputs must be an object`);
    } else if (
      "failed_rule_ids" in sample.expected_outputs &&
      !Array.isArray(sample.expected_outputs.failed_rule_ids)
    ) {
      errors.push(
        `samples[${index}].expected_outputs.failed_rule_ids must be an array when present`
      );
    }

    if (!Array.isArray(sample.source_records)) {
      errors.push(`samples[${index}].source_records must be an array`);
    } else {
      sample.source_records.forEach((sourceRecord, sourceRecordIndex) => {
        if (!isRecord(sourceRecord)) {
          errors.push(
            `samples[${index}].source_records[${sourceRecordIndex}] must be an object`
          );
          return;
        }

        for (const field of ["source", "source_record_id", "data_version"]) {
          if (
            typeof sourceRecord[field] !== "string" ||
            sourceRecord[field].length === 0
          ) {
            errors.push(
              `samples[${index}].source_records[${sourceRecordIndex}].${field} must be a non-empty string`
            );
          }
        }
      });
    }

    if (
      typeof sample.quality_expectation === "string" &&
      normalizeState(sample.quality_expectation) === undefined
    ) {
      errors.push(
        `samples[${index}].quality_expectation must be pass, warn, hold, or reject_raw`
      );
    }

    if (typeof sample.sample_id === "string") {
      if (seenIds.has(sample.sample_id)) {
        errors.push(`samples[${index}].sample_id is duplicated`);
      }

      seenIds.add(sample.sample_id);
    }
  });

  return errors;
}

function validateAndRunFixtures(manifest) {
  const errors = [];
  const samples = [];

  manifest.samples.forEach((sample, index) => {
    const samplePrefix = `samples[${index}] ${sample.sample_id}`;
    const fixturePath = resolve(process.cwd(), sample.fixture_path);

    if (!isPathInside(goldenRoot, fixturePath)) {
      errors.push(`${samplePrefix}: fixture_path must stay under tests/golden`);
      return;
    }

    if (!existsSync(fixturePath)) {
      errors.push(`${samplePrefix}: fixture_path does not exist`);
      return;
    }

    const fixtureResult = readJsonFile(fixturePath, sample.fixture_path);

    if (!fixtureResult.ok) {
      errors.push(`${samplePrefix}: invalid fixture JSON: ${fixtureResult.error}`);
      return;
    }

    const fixture = fixtureResult.value;
    const validationErrorCount = errors.length;
    errors.push(...validateFixture(sample, fixture, samplePrefix));

    if (errors.length > validationErrorCount) {
      return;
    }

    const ruleResults = QUALITY_RULES.map((rule) => rule.run(sample, fixture));
    const actualState = aggregateState(ruleResults);
    const expectedState = normalizeState(sample.quality_expectation);
    const failedRuleIds = ruleResults
      .filter((result) => result.state !== "PASS")
      .map((result) => result.rule_id);

    if (actualState !== expectedState) {
      errors.push(
        `${samplePrefix}: expected quality state ${expectedState}, got ${actualState}`
      );
    }

    const expectedOutputs = sample.expected_outputs;

    if (
      typeof expectedOutputs.quality_state === "string" &&
      normalizeState(expectedOutputs.quality_state) !== actualState
    ) {
      errors.push(
        `${samplePrefix}: expected_outputs.quality_state does not match ${actualState}`
      );
    }

    if (Array.isArray(expectedOutputs.failed_rule_ids)) {
      const expectedFailedRuleIds = [...expectedOutputs.failed_rule_ids].sort();
      const actualFailedRuleIds = [...failedRuleIds].sort();

      if (!arraysEqual(expectedFailedRuleIds, actualFailedRuleIds)) {
        errors.push(
          `${samplePrefix}: failed_rule_ids expected ${expectedFailedRuleIds.join(
            ","
          )}, got ${actualFailedRuleIds.join(",")}`
        );
      }
    }

    if (
      actualState === "HOLD" &&
      expectedOutputs.error_code !== "DATA_QUALITY_HOLD"
    ) {
      errors.push(
        `${samplePrefix}: HOLD samples must expect DATA_QUALITY_HOLD`
      );
    }

    if (
      actualState !== "HOLD" &&
      typeof expectedOutputs.error_code === "string"
    ) {
      errors.push(`${samplePrefix}: non-HOLD samples must not set error_code`);
    }

    errors.push(...validateFixtureAssertions(fixture, ruleResults, samplePrefix));

    samples.push({
      failed_rule_ids: failedRuleIds,
      sample_id: sample.sample_id,
      sample_type: sample.sample_type,
      quality_state: actualState
    });
  });

  return { errors, samples };
}

function validateFixture(sample, fixture, samplePrefix) {
  const errors = [];

  if (!isRecord(fixture)) {
    return [`${samplePrefix}: fixture must be an object`];
  }

  if (fixture.sample_id !== sample.sample_id) {
    errors.push(`${samplePrefix}: fixture sample_id must match manifest`);
  }

  if (!Array.isArray(fixture.records) || fixture.records.length === 0) {
    errors.push(`${samplePrefix}: fixture.records must be a non-empty array`);
  }

  if (!Array.isArray(fixture.assertions) || fixture.assertions.length === 0) {
    errors.push(`${samplePrefix}: fixture.assertions must be a non-empty array`);
  }

  return errors;
}

function validateFixtureAssertions(fixture, ruleResults, samplePrefix) {
  const errors = [];
  const ruleResultById = new Map(
    ruleResults.map((result) => [result.rule_id, result])
  );

  fixture.assertions.forEach((assertion, index) => {
    if (!isRecord(assertion)) {
      errors.push(`${samplePrefix}: assertions[${index}] must be an object`);
      return;
    }

    if (typeof assertion.rule_id !== "string") {
      errors.push(`${samplePrefix}: assertions[${index}].rule_id is required`);
      return;
    }

    const result = ruleResultById.get(assertion.rule_id);

    if (result === undefined) {
      errors.push(`${samplePrefix}: unknown rule ${assertion.rule_id}`);
      return;
    }

    const expectedState = normalizeState(assertion.expected_state);

    if (expectedState === undefined) {
      errors.push(
        `${samplePrefix}: assertions[${index}].expected_state is invalid`
      );
      return;
    }

    if (result.state !== expectedState) {
      errors.push(
        `${samplePrefix}: ${assertion.rule_id} expected ${expectedState}, got ${result.state}`
      );
    }
  });

  return errors;
}

function runPrimaryKeyRule(_sample, fixture) {
  const seen = new Set();
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record)) {
      return true;
    }

    if (
      typeof record.record_id !== "string" ||
      record.record_id.length === 0 ||
      typeof record.record_type !== "string" ||
      record.record_type.length === 0
    ) {
      return true;
    }

    if (seen.has(record.record_id)) {
      return true;
    }

    seen.add(record.record_id);
    return false;
  });

  return ruleResult(
    "QK-001",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "record identifiers are present and unique"
      : "record identifiers are missing or duplicated"
  );
}

function runTimeIntegrityRule(_sample, fixture) {
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record)) {
      return true;
    }

    if (
      typeof record.published_at === "string" &&
      typeof record.ingested_at === "string" &&
      parseTime(record.published_at) > parseTime(record.ingested_at)
    ) {
      return true;
    }

    if (
      typeof record.valid_from === "string" &&
      typeof record.valid_to === "string" &&
      parseDate(record.valid_from) > parseDate(record.valid_to)
    ) {
      return true;
    }

    return false;
  });

  return ruleResult(
    "QT-001",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "time ordering is coherent"
      : "published/ingested or validity interval ordering is invalid"
  );
}

function runPointInTimeRule(sample, fixture) {
  const expectedOutputs = sample.expected_outputs;

  if (
    typeof expectedOutputs.user_as_of !== "string" ||
    !Array.isArray(expectedOutputs.expected_visible_record_ids)
  ) {
    return ruleResult("QT-002", "PASS", "no point-in-time assertion required");
  }

  const userAsOf = parseTime(expectedOutputs.user_as_of);
  const visibleRecordIds = fixture.records
    .filter(
      (record) =>
        isRecord(record) &&
        typeof record.record_id === "string" &&
        typeof record.published_at === "string" &&
        parseTime(record.published_at) <= userAsOf
    )
    .map((record) => record.record_id)
    .sort();
  const expectedVisibleRecordIds = [
    ...expectedOutputs.expected_visible_record_ids
  ].sort();

  return ruleResult(
    "QT-002",
    arraysEqual(visibleRecordIds, expectedVisibleRecordIds) ? "PASS" : "HOLD",
    arraysEqual(visibleRecordIds, expectedVisibleRecordIds)
      ? "point-in-time visibility matches expected records"
      : "point-in-time visibility leaked or omitted records"
  );
}

function runFinancialUnitRule(_sample, fixture) {
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record) || record.record_type !== "financial_statement") {
      return false;
    }

    return (
      typeof record.currency !== "string" ||
      typeof record.unit !== "string" ||
      typeof record.scale !== "number" ||
      typeof record.accounting_standard !== "string"
    );
  });

  return ruleResult(
    "QU-001",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "financial currency, unit, scale, and accounting standard are present"
      : "financial currency, unit, scale, or accounting standard is missing"
  );
}

function runPriceOhlcRule(_sample, fixture) {
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record) || record.record_type !== "price_bar") {
      return false;
    }

    const open = record.open;
    const high = record.high;
    const low = record.low;
    const close = record.close;

    return (
      ![open, high, low, close].every(isFiniteNumber) ||
      open < 0 ||
      high < 0 ||
      low < 0 ||
      close < 0 ||
      low > high ||
      low > open ||
      low > close ||
      high < open ||
      high < close
    );
  });

  return ruleResult(
    "QP-001",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "OHLC values are internally coherent"
      : "OHLC values are internally inconsistent"
  );
}

function runPriceVolumeRule(_sample, fixture) {
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record) || record.record_type !== "price_bar") {
      return false;
    }

    return (
      (typeof record.volume === "number" && record.volume < 0) ||
      (typeof record.turnover === "number" && record.turnover < 0)
    );
  });

  return ruleResult(
    "QP-002",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "price volume and turnover are non-negative"
      : "price volume or turnover is negative"
  );
}

function runCorporateActionRule(_sample, fixture) {
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record) || record.record_type !== "corporate_action") {
      return false;
    }

    if (
      (record.action_type !== "split" &&
        record.action_type !== "consolidation") ||
      !isFiniteNumber(record.split_factor) ||
      record.split_factor <= 0
    ) {
      return true;
    }

    if (
      isFiniteNumber(record.pre_action_close) &&
      isFiniteNumber(record.expected_adjusted_close)
    ) {
      const tolerance = isFiniteNumber(record.tolerance) ? record.tolerance : 0;
      const adjustedClose = record.pre_action_close / record.split_factor;
      return Math.abs(adjustedClose - record.expected_adjusted_close) > tolerance;
    }

    return false;
  });

  return ruleResult(
    "QA-001",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "corporate action factor reconciles expected adjusted values"
      : "corporate action factor does not reconcile expected adjusted values"
  );
}

function runFinancialIdentityRule(_sample, fixture) {
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record) || record.record_type !== "financial_statement") {
      return false;
    }

    const facts = record.facts;

    if (!isRecord(facts)) {
      return true;
    }

    if (
      !isFiniteNumber(facts.assets) ||
      !isFiniteNumber(facts.liabilities) ||
      !isFiniteNumber(facts.equity)
    ) {
      return true;
    }

    const tolerance = isFiniteNumber(record.tolerance) ? record.tolerance : 0;
    return (
      Math.abs(facts.assets - (facts.liabilities + facts.equity)) > tolerance
    );
  });

  return ruleResult(
    "QF-001",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "financial identity reconciles within tolerance"
      : "financial identity does not reconcile within tolerance"
  );
}

function runRestatementRule(_sample, fixture) {
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record) || record.record_type !== "financial_statement") {
      return false;
    }

    if (record.is_restatement !== true) {
      return false;
    }

    return (
      typeof record.prior_version_id !== "string" ||
      record.prior_version_id.length === 0 ||
      typeof record.restatement_reason !== "string" ||
      record.restatement_reason.length === 0
    );
  });

  return ruleResult(
    "QF-002",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "restatements link to prior versions and reasons"
      : "restatement metadata is incomplete"
  );
}

function runLifecycleRule(_sample, fixture) {
  const lifecycleTypes = new Set([
    "identifier_history",
    "listing_lifecycle",
    "security_master"
  ]);
  const invalidRecord = fixture.records.find((record) => {
    if (!isRecord(record) || !lifecycleTypes.has(record.record_type)) {
      return false;
    }

    if (typeof record.valid_from !== "string") {
      return true;
    }

    if (
      record.record_type === "identifier_history" &&
      (typeof record.symbol !== "string" ||
        typeof record.exchange !== "string" ||
        typeof record.instrument_id !== "string")
    ) {
      return true;
    }

    return false;
  });

  return ruleResult(
    "QE-001",
    invalidRecord === undefined ? "PASS" : "HOLD",
    invalidRecord === undefined
      ? "security lifecycle and identifier intervals are explicit"
      : "security lifecycle or identifier interval metadata is incomplete"
  );
}

function runDualListingRule(_sample, fixture) {
  const dualListingRecords = fixture.records.filter(
    (record) => isRecord(record) && record.record_type === "dual_listing"
  );

  const invalidRecord = dualListingRecords.find(
    (record) =>
      typeof record.listing_id !== "string" ||
      typeof record.venue !== "string" ||
      typeof record.currency !== "string" ||
      typeof record.instrument_id !== "string"
  );

  if (invalidRecord !== undefined) {
    return ruleResult(
      "QE-002",
      "HOLD",
      "dual listing venue, currency, identifier, or instrument is missing"
    );
  }

  const missingFxSource = dualListingRecords.find(
    (record) => typeof record.fx_rate_source !== "string"
  );

  return ruleResult(
    "QE-002",
    missingFxSource === undefined ? "PASS" : "WARN",
    missingFxSource === undefined
      ? "dual listing currency and FX mapping are explicit"
      : "dual listing is explicit but needs FX source review"
  );
}

function runLineageRule(sample, fixture) {
  const sourceRecordIds = new Set(
    sample.source_records
      .filter(isRecord)
      .map((record) => record.source_record_id)
      .filter((value) => typeof value === "string")
  );

  if (sourceRecordIds.size !== sample.source_records.length) {
    return ruleResult(
      "QL-001",
      "HOLD",
      "source records must include source_record_id values"
    );
  }

  const missingLineage = fixture.records.find(
    (record) =>
      !isRecord(record) ||
      typeof record.source_record_id !== "string" ||
      !sourceRecordIds.has(record.source_record_id)
  );

  return ruleResult(
    "QL-001",
    missingLineage === undefined ? "PASS" : "HOLD",
    missingLineage === undefined
      ? "fixture records trace to manifest source records"
      : "fixture record lineage is missing from manifest source records"
  );
}

function readJsonFile(path, displayPath) {
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync(path, "utf8"))
    };
  } catch (error) {
    return {
      error: `${displayPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      ok: false
    };
  }
}

function aggregateState(ruleResults) {
  const states = new Set(ruleResults.map((result) => result.state));

  if (states.has("REJECT_RAW")) {
    return "REJECT_RAW";
  }

  if (states.has("HOLD")) {
    return "HOLD";
  }

  if (states.has("WARN")) {
    return "WARN";
  }

  return "PASS";
}

function countStates(samples) {
  return samples.reduce(
    (accumulator, sample) => {
      accumulator[sample.quality_state.toLowerCase()] += 1;
      return accumulator;
    },
    {
      hold: 0,
      pass: 0,
      reject_raw: 0,
      warn: 0
    }
  );
}

function normalizeState(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toUpperCase();

  if (
    normalized === "PASS" ||
    normalized === "WARN" ||
    normalized === "HOLD" ||
    normalized === "REJECT_RAW"
  ) {
    return normalized;
  }

  return undefined;
}

function ruleResult(ruleId, state, message) {
  return {
    message,
    rule_id: ruleId,
    state
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function parseTime(value) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return Number.POSITIVE_INFINITY;
  }

  return time;
}

function parseDate(value) {
  return parseTime(`${value}T00:00:00Z`);
}

function arraysEqual(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function isPathInside(root, candidate) {
  const relativePath = relative(root, candidate);
  return relativePath.length === 0 || !relativePath.startsWith("..");
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
