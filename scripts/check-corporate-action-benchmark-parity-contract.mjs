#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/corporate-action-benchmark-parity.contract.json";
const packageJsonPath = "package.json";
const corporateActionsSourcePath = "packages/corporate-actions/src/index.ts";
const corporateActionsTestPath = "packages/corporate-actions/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredSources = ["partner_reference", "public_exchange_reference"];
const requiredLinkedContracts = [
  "deploy/tools/get-corporate-actions.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredOutputFields = [
  "benchmarkFixtureVersion",
  "caseResults",
  "engineVersion",
  "failures",
  "livePartnerData",
  "liveServingReads",
  "methodologyVersion",
  "passed",
  "passedCount",
  "sampleCount",
  "sourceCounts",
  "sqlEmitted",
  "status",
  "version"
];
const requiredCaseFields = [
  "caseId",
  "instrumentId",
  "source",
  "sourceRecordId",
  "benchmarkRecordId",
  "actionTypes",
  "expected",
  "actual",
  "delta",
  "tolerance",
  "status"
];
const requiredAdjustmentOutputs = ["splitAdjustedClose", "totalReturnAdjustedClose"];
const requiredActionTypes = ["split", "consolidation", "dividend"];
const requiredTables = [
  "core.corporate_action",
  "core.adjustment_methodology",
  "core.price_adjustment_factor",
  "governance.corporate_action_adjustment_contract"
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
  corporateActions: readText(corporateActionsSourcePath),
  corporateActionsTest: readText(corporateActionsTestPath),
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
    sample_count: contract.minimum_complex_cases,
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
    "2026-06-22.phase1.corporate-action-benchmark-parity-scaffold.v0",
    "version"
  );
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(errors, value.package, "@aiphabee/corporate-actions", "package");
  expectEqual(errors, value.runtime_route, "GET /data/runtime", "runtime_route");
  expectEqual(errors, value.route, "GET /data/corporate-actions/benchmark-parity", "route");
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");
  expectEqual(
    errors,
    value.benchmark_fixture_version,
    "corporate-action-benchmark-parity@partner-public-v0",
    "benchmark_fixture_version"
  );
  expectEqual(errors, value.minimum_complex_cases, 20, "minimum_complex_cases");

  for (const field of [
    "frontend",
    "live_data_access",
    "live_partner_data",
    "live_serving_reads",
    "persistent_writes",
    "sql_emitted"
  ]) {
    expectEqual(errors, value[field], false, field);
  }

  expectArray(errors, value.covered_prd_items, ["DAT-04"], "covered_prd_items");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");
  for (const path of requiredLinkedContracts) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }
  expectArray(errors, value.supported_sources, requiredSources, "supported_sources");
  expectArray(
    errors,
    value.required_output_fields,
    requiredOutputFields,
    "required_output_fields"
  );
  expectArray(errors, value.required_case_fields, requiredCaseFields, "required_case_fields");
  expectArray(
    errors,
    value.required_adjustment_outputs,
    requiredAdjustmentOutputs,
    "required_adjustment_outputs"
  );
  expectArray(errors, value.required_action_types, requiredActionTypes, "required_action_types");
  expectArray(errors, value.tables, requiredTables, "tables");
  errors.push(...validateExpectedSourceCounts(value.expected_source_counts));
  errors.push(...validatePackage(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateExpectedSourceCounts(value) {
  if (!isRecord(value)) {
    return ["expected_source_counts must be an object"];
  }

  const errors = [];
  expectEqual(errors, value.partner_reference, 10, "expected_source_counts.partner_reference");
  expectEqual(
    errors,
    value.public_exchange_reference,
    10,
    "expected_source_counts.public_exchange_reference"
  );
  return errors;
}

function validatePackage(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const checkCommand =
    "node scripts/check-corporate-action-benchmark-parity-contract.mjs";

  if (scripts["check:corporate-action-benchmark-parity"] !== checkCommand) {
    errors.push("package.json scripts.check:corporate-action-benchmark-parity mismatch");
  }

  if (!String(scripts.check ?? "").includes("npm run check:corporate-action-benchmark-parity")) {
    errors.push("package.json scripts.check must include check:corporate-action-benchmark-parity");
  }

  return errors;
}

function validateSourceTokens(sourceFilesValue) {
  const errors = [];
  const benchmarkBlock = extractBenchmarkBlock(sourceFilesValue.corporateActions);
  const partnerCases = countToken(benchmarkBlock, 'source: "partner_reference"');
  const publicCases = countToken(benchmarkBlock, 'source: "public_exchange_reference"');
  const caseCount = countToken(benchmarkBlock, "caseId:");

  if (caseCount !== 20) {
    errors.push(`CORPORATE_ACTION_BENCHMARK_CASES must include 20 cases, found ${caseCount}`);
  }
  if (partnerCases !== 10) {
    errors.push(`partner benchmark case count must be 10, found ${partnerCases}`);
  }
  if (publicCases !== 10) {
    errors.push(`public benchmark case count must be 10, found ${publicCases}`);
  }

  for (const token of [
    "CORPORATE_ACTION_BENCHMARK_PARITY_VERSION",
    "CORPORATE_ACTION_BENCHMARK_FIXTURE_VERSION",
    "getCorporateActionBenchmarkParityCapabilities",
    "runCorporateActionBenchmarkParityGate",
    "createCorporateActionBenchmarkCaseResult",
    "minimumComplexCases: 20"
  ]) {
    if (!sourceFilesValue.corporateActions.includes(token)) {
      errors.push(`corporate actions source missing ${token}`);
    }
  }

  for (const token of [
    "runCorporateActionBenchmarkParityGate",
    "getCorporateActionBenchmarkParityCapabilities",
    "sampleCount).toBe(20)",
    "partner_reference: 10",
    "public_exchange_reference: 10"
  ]) {
    if (!sourceFilesValue.corporateActionsTest.includes(token)) {
      errors.push(`corporate actions test missing ${token}`);
    }
  }

  for (const token of [
    'app.get("/data/corporate-actions/benchmark-parity"',
    "getCorporateActionBenchmarkParityCapabilities",
    "runCorporateActionBenchmarkParityGate",
    "benchmark_parity"
  ]) {
    if (!sourceFilesValue.worker.includes(token)) {
      errors.push(`worker source missing ${token}`);
    }
  }

  for (const token of [
    "/data/corporate-actions/benchmark-parity",
    "CorporateActionBenchmarkParityBody",
    "sampleCount).toBe(20)",
    "partner_reference: 10"
  ]) {
    if (!sourceFilesValue.workerTest.includes(token)) {
      errors.push(`worker test missing ${token}`);
    }
  }

  if (!/^\|\s+DAT-04\b.*\|\s*☑\s*\|/mu.test(sourceFilesValue.tracker)) {
    errors.push("DAT-04 must be checked in §M traceability matrix");
  }
  if (!sourceFilesValue.tracker.includes("corporate-action-benchmark-parity-scaffold")) {
    errors.push("tracker must mention corporate-action-benchmark-parity-scaffold");
  }

  return errors;
}

function extractBenchmarkBlock(text) {
  const start = text.indexOf("export const CORPORATE_ACTION_BENCHMARK_CASES");
  const end = text.indexOf("\n];", start);

  if (start === -1 || end === -1 || end <= start) {
    return "";
  }

  return text.slice(start, end);
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

function countToken(text, token) {
  return text.split(token).length - 1;
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
