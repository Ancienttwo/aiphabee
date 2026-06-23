#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/market-data/hk-data-domains-cross-market.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const migrationPath = "supabase/migrations/20260622009000_hk_data_domains_cross_market_scaffold.sql";
const packageJsonPath = "package.json";
const runtimeSourcePath = "packages/market-domain-runtime/src/index.ts";
const runtimeTestPath = "packages/market-domain-runtime/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredPhase4Items = [
  "更多港股数据域",
  "跨市场对照",
  "point_in_time_methodology",
  "rights_matrix_default_deny"
];
const requiredDomains = [
  "ipo_pipeline",
  "index_constituents",
  "stock_connect_flow",
  "short_selling",
  "ownership_disclosure",
  "warrants_cbbc",
  "sector_industry_classification",
  "corporate_calendar",
  "dividend_calendar"
];
const requiredMarkets = ["HK", "CN_A", "US", "SG"];
const requiredMappingTypes = [
  "dual_listing",
  "adr_equivalence",
  "stock_connect_eligibility",
  "industry_classification",
  "currency_normalization",
  "trading_calendar_alignment",
  "corporate_action_alignment"
];
const requiredMethodologyFields = [
  "published_at",
  "effective_at",
  "ingested_at",
  "data_version",
  "methodology_version"
];
const requiredTables = [
  "aiphabee_core.hk_data_domain_coverage",
  "aiphabee_core.cross_market_security_mapping",
  "aiphabee_audit.market_domain_coverage_event",
  "aiphabee_governance.hk_data_domain_cross_market_contract"
];
const requiredOutputFields = [
  "coverage_contract",
  "data_domains",
  "cross_market",
  "rights",
  "validation"
];
const requiredBlockedStatuses = [
  "blocked_missing_context",
  "blocked_rights_matrix_required",
  "blocked_unsupported_domain",
  "blocked_unsupported_mapping",
  "blocked_unsupported_market"
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
    domains: contract.hk_data_domains.length,
    route: contract.route,
    status: "ok",
    comparison_markets: contract.comparison_markets
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

  if (value.version !== "2026-06-22.phase4.hk-data-domains-cross-market-scaffold.v0") {
    errors.push("version must match HK data domains cross-market scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/market-domain-runtime") {
    errors.push("package must be @aiphabee/market-domain-runtime");
  }

  if (value.runtime_route !== "GET /market-data/domains/runtime") {
    errors.push("runtime_route must be GET /market-data/domains/runtime");
  }

  if (value.route !== "POST /market-data/domains/cross-market/plan") {
    errors.push("route must be POST /market-data/domains/cross-market/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_data_access",
    "persistent_writes",
    "sql_emitted",
    "external_redistribution_allowed",
    "mcp_redistribution_allowed",
    "export_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
  );
  errors.push(...validateStringArray(value.hk_data_domains, requiredDomains, "hk_data_domains"));
  errors.push(...validateStringArray(value.comparison_markets, requiredMarkets, "comparison_markets"));
  errors.push(...validateStringArray(value.mapping_types, requiredMappingTypes, "mapping_types"));
  errors.push(
    ...validateStringArray(
      value.methodology_fields_required,
      requiredMethodologyFields,
      "methodology_fields_required"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validateStringArray(value.blocked_statuses, requiredBlockedStatuses, "blocked_statuses"));
  errors.push(...validateSecurityContract(value.security_contract));
  errors.push(...validateIntegrationRoutes(value.integration_routes));
  errors.push(...validateDatabaseMigration(databaseValue));
  errors.push(...validateMigrationText(sourceFilesValue.migration));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSensitiveLiterals(value));

  return errors;
}

function validateSecurityContract(value) {
  if (!isRecord(value)) {
    return ["security_contract must be an object"];
  }

  const errors = [];

  for (const field of [
    "rights_matrix_required",
    "field_authorization_required",
    "default_deny_until_authorized",
    "point_in_time_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`security_contract.${field} must be true`);
    }
  }

  for (const field of [
    "live_partner_data_loaded",
    "raw_partner_payload_included",
    "external_redistribution_allowed",
    "mcp_redistribution_allowed",
    "export_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`security_contract.${field} must be false`);
    }
  }

  return errors;
}

function validateIntegrationRoutes(value) {
  if (!isRecord(value)) {
    return ["integration_routes must be an object"];
  }

  const expected = {
    analytics_compare: "POST /analytics/compare-securities",
    data_gateway: "POST /gateway/exports/plan",
    market_calendar: "POST /tools/get-market-calendar",
    plan: "POST /market-data/domains/cross-market/plan",
    runtime: "GET /market-data/domains/runtime",
    security_resolution: "POST /tools/resolve-security"
  };
  const errors = [];

  for (const [field, route] of Object.entries(expected)) {
    if (value[field] !== route) {
      errors.push(`integration_routes.${field} must be ${route}`);
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
    (item) =>
      isRecord(item) &&
      item.file === "supabase/migrations/20260622009000_hk_data_domains_cross_market_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database migrations contract must include HK data domains cross-market scaffold migration"];
  }

  errors.push(...validateStringArray(migration.tables, requiredTables, "migration.tables"));

  if (migration.default_rights_status !== "default_deny") {
    errors.push("HK data domains cross-market migration must preserve default_deny");
  }

  if (migration.market_data !== false) {
    errors.push("HK data domains cross-market migration market_data must be false");
  }

  return errors;
}

function validateMigrationText(value) {
  const errors = [];

  for (const token of [
    "create table if not exists aiphabee_core.hk_data_domain_coverage",
    "create table if not exists aiphabee_core.cross_market_security_mapping",
    "create table if not exists aiphabee_audit.market_domain_coverage_event",
    "create table if not exists aiphabee_governance.hk_data_domain_cross_market_contract",
    "default 'default_deny'",
    "point_in_time_required boolean not null default true",
    "live_data_loaded boolean not null default false",
    "live_mapping_enabled boolean not null default false",
    "external_redistribution_allowed boolean not null default false",
    "mcp_redistribution_allowed boolean not null default false"
  ]) {
    if (!value.includes(token)) {
      errors.push(`migration must include ${token}`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:hk-data-domains-cross-market"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-hk-data-domains-cross-market-contract.mjs")
  ) {
    errors.push("check:hk-data-domains-cross-market must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:hk-data-domains-cross-market")) {
    errors.push("root check script must include check:hk-data-domains-cross-market");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    runtime: [
      "MARKET_DOMAIN_RUNTIME_VERSION",
      "createHkDataDomainsCrossMarketPlan",
      "getHkDataDomainsCrossMarketCapabilities",
      "getMarketDomainRuntimeCapabilities",
      "blocked_rights_matrix_required",
      "stock_connect_flow"
    ],
    runtimeTest: [
      "reports runtime capabilities without live market data or writes",
      "plans expanded HK data domains and cross-market comparison coverage",
      "blocks planning until rights matrix context is present"
    ],
    worker: [
      'app.get("/market-data/domains/runtime"',
      'app.post("/market-data/domains/cross-market/plan"',
      "createHkDataDomainsCrossMarketPlan",
      "getMarketDomainRuntimeCapabilities",
      "rights_matrix_version"
    ],
    workerTest: [
      "serves market domain runtime capabilities without live data access",
      "plans HK data domain coverage and cross-market mappings without writes",
      "blocks HK data domain planning without a rights matrix"
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

  if (!tracker.includes("- [x] 更多港股数据域与跨市场对照")) {
    errors.push("tracker must mark HK data domains cross-market phase4 item complete");
  }

  if (!tracker.includes("npm run check:hk-data-domains-cross-market")) {
    errors.push("tracker HK data domains row must reference check:hk-data-domains-cross-market");
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

function validateNoSensitiveLiterals(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract contains forbidden sensitive-like pattern ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
