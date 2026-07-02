#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/public-ops/publication-economics-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationFile =
  "deploy/database/migrations/20260622004000_publication_economics_release_gate_scaffold.sql";
const requiredChecks = [
  "public_status_page_scaffold_published",
  "help_center_manifest_published",
  "privacy_and_terms_publication_ready",
  "package_pricing_catalog_present",
  "unit_economics_positive_for_expected_usage",
  "live_publication_and_finance_writes_blocked"
];
const requiredOutputFields = [
  "docs_publication",
  "package_pricing",
  "unit_economics",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredTables = [
  "aiphabee_core.publication_economics_release_gate",
  "aiphabee_audit.publication_economics_drill_event",
  "aiphabee_governance.publication_economics_release_gate_contract"
];
const requiredLinkedContracts = [
  "deploy/public-ops/public-status-docs.contract.json",
  "deploy/support/request-id-investigation.contract.json",
  "deploy/account/package-pricing.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredBlockers = [
  "live_public_status_page_deployment_missing",
  "live_help_center_deployment_missing",
  "final_privacy_terms_legal_approval_missing",
  "live_pricing_provider_missing",
  "finance_unit_economics_signoff_missing",
  "frontend_public_release_surface_missing"
];
const requiredHelpTopics = [
  "account_billing",
  "mcp_connection",
  "data_quality",
  "usage_quota",
  "privacy_account",
  "incident_status"
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
const errors = validateContract(contract, databaseContract, packageJson);

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
    checks: contract.required_checks.length,
    route: contract.route,
    status: "ok",
    unit_economics_plans: contract.unit_economics.plans.length
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

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase3.publication-economics-release-gate-scaffold.v0") {
    errors.push("version must match publication economics release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/public-ops") {
    errors.push("package must be @aiphabee/public-ops");
  }

  if (value.runtime_route !== "GET /public/runtime") {
    errors.push("runtime_route must be GET /public/runtime");
  }

  if (value.route !== "POST /public/release-gates/publication-economics/plan") {
    errors.push("route must be POST /public/release-gates/publication-economics/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const [field, expected] of Object.entries({
    account_pricing_route: "GET /account/package-pricing",
    docs_route: "GET /public/docs",
    help_center_route: "GET /support/help-center",
    public_status_route: "GET /public/status"
  })) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  for (const field of [
    "frontend",
    "live_deployment_verified",
    "live_legal_approval",
    "live_finance_signoff",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validatePublicationArtifacts(value.publication_artifacts));
  errors.push(...validateUnitEconomics(value.unit_economics));
  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(value.linked_contracts, requiredLinkedContracts, "linked_contracts")
  );
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateLinkedContractFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validatePublicationArtifacts(value) {
  if (!isRecord(value)) {
    return ["publication_artifacts must be an object"];
  }

  const errors = [];

  errors.push(...validateStatusPage(value.status_page));
  errors.push(...validateDocuments(value.documents));
  errors.push(...validateHelpCenter(value.help_center));

  return errors;
}

function validateStatusPage(value) {
  if (!isRecord(value)) {
    return ["publication_artifacts.status_page must be an object"];
  }

  const errors = [];

  if (value.publication_status !== "local_scaffold_ready") {
    errors.push("status_page.publication_status must be local_scaffold_ready");
  }

  if (value.request_id_visible !== true) {
    errors.push("status_page.request_id_visible must be true");
  }

  if (value.live_incident_feed !== false) {
    errors.push("status_page.live_incident_feed must be false");
  }

  if (value.required_component !== "public_documentation") {
    errors.push("status_page.required_component must be public_documentation");
  }

  return errors;
}

function validateDocuments(value) {
  if (!Array.isArray(value)) {
    return ["publication_artifacts.documents must be an array"];
  }

  const errors = [];
  const documentsByKind = new Map(
    value
      .filter((document) => isRecord(document) && typeof document.kind === "string")
      .map((document) => [document.kind, document])
  );

  for (const kind of ["api_reference", "mcp_reference", "privacy_policy", "terms_of_service"]) {
    const document = documentsByKind.get(kind);

    if (!isRecord(document)) {
      errors.push(`documents must include ${kind}`);
      continue;
    }

    if (document.publication_status !== "local_draft_ready") {
      errors.push(`${kind} publication_status must be local_draft_ready`);
    }

    if (typeof document.path !== "string" || document.path.length === 0) {
      errors.push(`${kind} path must be a non-empty string`);
      continue;
    }

    if (!existsSync(resolve(process.cwd(), document.path))) {
      errors.push(`${document.path} must exist`);
    }

    if (kind === "privacy_policy" || kind === "terms_of_service") {
      if (document.legal_review_required !== true) {
        errors.push(`${kind} legal_review_required must be true`);
      }

      if (typeof document.required_section !== "string") {
        errors.push(`${kind} required_section must be a string`);
      } else {
        const markdown = readText(document.path);
        if (!markdown.includes(`## ${document.required_section}`)) {
          errors.push(`${document.path} must include section ${document.required_section}`);
        }
      }
    }
  }

  return errors;
}

function validateHelpCenter(value) {
  if (!isRecord(value)) {
    return ["publication_artifacts.help_center must be an object"];
  }

  const errors = [];

  if (value.path !== "docs/public/help-center.md") {
    errors.push("help_center.path must be docs/public/help-center.md");
  }

  if (!existsSync(resolve(process.cwd(), "docs/public/help-center.md"))) {
    errors.push("docs/public/help-center.md must exist");
  }

  if (value.topic_count !== 6) {
    errors.push("help_center.topic_count must be 6");
  }

  if (value.live_chat_enabled !== false) {
    errors.push("help_center.live_chat_enabled must be false");
  }

  errors.push(
    ...validateStringArray(value.required_topics, requiredHelpTopics, "help_center.required_topics")
  );

  return errors;
}

function validateUnitEconomics(value) {
  if (!isRecord(value)) {
    return ["unit_economics must be an object"];
  }

  const errors = [];

  if (value.source !== "docs/researches/AiphaBee_PRD_v1.0.md#15.5") {
    errors.push("unit_economics.source must point to PRD 15.5");
  }

  if (value.formula !== "subscription_and_overage_revenue_minus_direct_costs") {
    errors.push("unit_economics.formula must be subscription_and_overage_revenue_minus_direct_costs");
  }

  if (value.currency !== "HKD") {
    errors.push("unit_economics.currency must be HKD");
  }

  if (!isRecord(value.target_margin_bps)) {
    errors.push("unit_economics.target_margin_bps must be an object");
  } else {
    if (value.target_margin_bps.pro !== 7000) {
      errors.push("unit_economics.target_margin_bps.pro must be 7000");
    }

    if (value.target_margin_bps.developer !== 6000) {
      errors.push("unit_economics.target_margin_bps.developer must be 6000");
    }
  }

  if (!Array.isArray(value.plans)) {
    return [...errors, "unit_economics.plans must be an array"];
  }

  const plansByCode = new Map(
    value.plans
      .filter((plan) => isRecord(plan) && typeof plan.plan_code === "string")
      .map((plan) => [plan.plan_code, plan])
  );

  errors.push(...validateUnitEconomicsPlan(plansByCode.get("pro"), 22800, 5000, 7000, "pro"));
  errors.push(
    ...validateUnitEconomicsPlan(
      plansByCode.get("developer"),
      68800,
      10000,
      6000,
      "developer"
    )
  );

  return errors;
}

function validateUnitEconomicsPlan(value, expectedPriceMinor, expectedCredits, targetBps, name) {
  if (!isRecord(value)) {
    return [`unit_economics.plans must include ${name}`];
  }

  const errors = [];

  if (value.validation_price_minor !== expectedPriceMinor) {
    errors.push(`${name} validation_price_minor must be ${expectedPriceMinor}`);
  }

  if (value.expected_usage_credits !== expectedCredits) {
    errors.push(`${name} expected_usage_credits must be ${expectedCredits}`);
  }

  for (const field of [
    "total_direct_cost_minor",
    "contribution_margin_minor",
    "contribution_margin_ratio_bps"
  ]) {
    if (!Number.isInteger(value[field]) || value[field] <= 0) {
      errors.push(`${name}.${field} must be a positive integer`);
    }
  }

  if (value.contribution_margin_positive !== true) {
    errors.push(`${name}.contribution_margin_positive must be true`);
  }

  if (value.contribution_margin_ratio_bps < targetBps) {
    errors.push(`${name}.contribution_margin_ratio_bps must be at least ${targetBps}`);
  }

  if (value.validation_price_minor - value.total_direct_cost_minor !== value.contribution_margin_minor) {
    errors.push(`${name}.contribution_margin_minor must equal price minus direct cost`);
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_publication_economics_validation") {
    errors.push("release_gate.gate_status must be blocked_live_publication_economics_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["legal", "finance", "ops", "support"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validateLinkedContractFiles(paths) {
  const errors = [];

  if (!Array.isArray(paths)) {
    return ["linked_contracts must be an array"];
  }

  for (const path of paths) {
    if (typeof path !== "string") {
      errors.push("linked_contracts must contain only strings");
      continue;
    }

    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  if (
    value.scripts["check:publication-economics-release-gate"] !==
    "node scripts/check-publication-economics-release-gate-contract.mjs"
  ) {
    return ["package.json must define check:publication-economics-release-gate"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:publication-economics-release-gate")
  ) {
    return ["package.json check script must include check:publication-economics-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  if (!serialized.includes(migrationFile)) {
    errors.push(`database contract must include ${migrationFile}`);
  }

  for (const table of requiredTables) {
    if (!serialized.includes(table)) {
      errors.push(`database contract must include ${table}`);
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

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern}`);
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch {
    return "";
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
