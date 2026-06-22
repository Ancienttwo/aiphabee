#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/sprint1-tool-route-replay.contract.json";
const manifestPath = "tests/golden/tools/manifest.json";
const packagePath = "package.json";
const testPath = "apps/worker/src/tool-route-replay.test.ts";
const workerPath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.tool-route-replay.v0";
const requiredRouteMap = {
  resolve_security: "/tools/resolve-security",
  get_security_profile: "/tools/get-security-profile",
  get_market_calendar: "/tools/get-market-calendar",
  get_quote_snapshot: "/tools/get-quote-snapshot",
  get_price_history: "/tools/get-price-history",
  get_corporate_actions: "/tools/get-corporate-actions",
  get_financial_facts: "/tools/get-financial-facts",
  get_financial_ratios: "/analytics/financial-ratios",
  search_announcements: "/documents/search-announcements",
  get_announcement: "/documents/get-announcement",
  screen_securities: "/analytics/screen-securities",
  compare_securities: "/analytics/compare-securities",
  calculate_returns_risk: "/analytics/returns-risk",
  get_event_timeline: "/tools/get-event-timeline",
  get_data_lineage: "/tools/get-data-lineage",
  get_entitlements: "/tools/get-entitlements"
};
const requiredTools = Object.keys(requiredRouteMap);
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const manifest = readJson(manifestPath);
const packageJson = readJson(packagePath);
const testSource = readText(testPath);
const workerSource = readText(workerPath);
const errors = [
  ...validateContract(contract),
  ...validateManifest(manifest),
  ...validatePackage(packageJson),
  ...validateTestSource(testSource),
  ...validateWorkerSource(workerSource),
  ...validateNoSecrets(contract)
];

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
    route_count: contract.route_count,
    status: "ok",
    tool_count: contract.p0_tool_count
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["tool route replay contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-tool-route-replay-contract.mjs",
    manifest: manifestPath,
    status: "local_contract",
    test_file: testPath,
    version: expectedVersion,
    worker_entrypoint: workerPath
  };

  for (const [field, expected] of Object.entries(expectedFields)) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  for (const field of ["p0_tool_count", "route_count", "golden_fixture_count"]) {
    if (value[field] !== requiredTools.length) {
      errors.push(`${field} must be ${requiredTools.length}`);
    }
  }

  for (const field of [
    "server_orchestrated_route_replay",
    "golden_vs_route_response_diff",
    "canonical_projection_replay"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "mcp_live_protocol_execution",
    "live_db_writes",
    "partner_source_rows",
    "frontend"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(...validateStringArray(value.validated_tools, requiredTools, "validated_tools"));
  errors.push(...validateRouteMap(value.route_map));
  errors.push(...validateNormalizationPolicy(value.normalization_policy));
  errors.push(...validateVerification(value.verification));
  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "mcp_live_protocol_execution",
        "live_db_writes",
        "partner_source_rows",
        "partner_approved_production_corpus"
      ],
      "not_claimed"
    )
  );

  return errors;
}

function validateRouteMap(value) {
  if (!isRecord(value)) {
    return ["route_map must be an object"];
  }

  const errors = [];

  for (const [toolName, route] of Object.entries(requiredRouteMap)) {
    if (value[toolName] !== route) {
      errors.push(`route_map.${toolName} must be ${route}`);
    }
  }

  if (Object.keys(value).length !== requiredTools.length) {
    errors.push(`route_map must contain exactly ${requiredTools.length} tools`);
  }

  return errors;
}

function validateNormalizationPolicy(value) {
  if (!isRecord(value)) {
    return ["normalization_policy must be an object"];
  }

  const errors = [];

  for (const field of [
    "dynamic_envelope_as_of",
    "runtime_capability_metadata",
    "data_version_keys",
    "usage_credits"
  ]) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      errors.push(`normalization_policy.${field} must be a non-empty string`);
    }
  }

  return errors;
}

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const expectedCommands = {
    contract_check: "npm run check:tool-route-replay",
    golden_fixture_check: "npm run test:golden",
    readiness_check: "npm run check:tool-route-replay-readiness",
    unit_test: "npm run test -- apps/worker/src/tool-route-replay.test.ts"
  };
  const errors = [];

  for (const [field, command] of Object.entries(expectedCommands)) {
    if (value[field] !== command) {
      errors.push(`verification.${field} must be ${command}`);
    }
  }

  return errors;
}

function validateManifest(value) {
  if (!isRecord(value) || !Array.isArray(value.samples)) {
    return ["golden manifest must expose samples"];
  }

  const errors = [];
  const tools = value.samples
    .filter(isRecord)
    .map((sample) => sample.tool_name)
    .filter((toolName) => typeof toolName === "string");

  errors.push(...validateStringArray(tools, requiredTools, "golden_manifest.tool_name"));

  if (tools.length !== requiredTools.length) {
    errors.push(`golden manifest must contain exactly ${requiredTools.length} samples`);
  }

  for (const sample of value.samples.filter(isRecord)) {
    if (typeof sample.fixture_path !== "string" || !existsSync(resolve(process.cwd(), sample.fixture_path))) {
      errors.push(`${sample.sample_id}.fixture_path must exist`);
      continue;
    }

    const fixture = readJson(sample.fixture_path);

    if (!isRecord(fixture.request)) {
      errors.push(`${sample.sample_id}.request must be an object`);
    }

    if (!isRecord(fixture.expected_response) || !isRecord(fixture.expected_response.data)) {
      errors.push(`${sample.sample_id}.expected_response.data must be an object`);
      continue;
    }

    if (fixture.expected_response.data.toolName !== sample.tool_name) {
      errors.push(`${sample.sample_id}.expected_response.data.toolName must match manifest tool`);
    }

    if (fixture.expected_response.data.liveDataAccess !== false) {
      errors.push(`${sample.sample_id}.expected_response.data.liveDataAccess must be false`);
    }
  }

  return errors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];

  if (scripts["check:tool-route-replay"] !== "node scripts/check-tool-route-replay-contract.mjs") {
    errors.push("package.json check:tool-route-replay must be node scripts/check-tool-route-replay-contract.mjs");
  }

  if (!String(scripts.check ?? "").includes("npm run check:tool-route-replay")) {
    errors.push("root check must include check:tool-route-replay");
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "app.request",
    "projectRouteResponseToGolden",
    "expected_response",
    "x-request-id",
    "Canonical"
  ]) {
    if (!source.includes(text)) {
      errors.push(`route replay test must include ${text}`);
    }
  }

  for (const route of Object.values(requiredRouteMap)) {
    if (!source.includes(route)) {
      errors.push(`route replay test must include ${route}`);
    }
  }

  return errors;
}

function validateWorkerSource(source) {
  const errors = [];

  for (const route of Object.values(requiredRouteMap)) {
    if (!source.includes(`"${route}"`)) {
      errors.push(`worker source must expose ${route}`);
    }
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

  if (new Set(value).size !== value.length) {
    errors.push(`${name} must not contain duplicates`);
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
