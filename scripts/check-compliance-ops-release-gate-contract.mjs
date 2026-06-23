#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/public-ops/compliance-ops-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationFile =
  "supabase/migrations/20260622001000_compliance_ops_release_gate_scaffold.sql";
const requiredChecks = [
  "type4_research_boundary_copy_reviewed",
  "marketing_copy_forbidden_advice_claims_absent",
  "kill_switch_safe_degradation_drill_planned",
  "incident_response_request_id_trace_drill_planned",
  "audit_export_contains_required_fields_and_excludes_sensitive_payloads",
  "public_status_incident_disclosure_surface_present"
];
const requiredOutputFields = [
  "compliance_boundary",
  "kill_switch_drill",
  "incident_response_drill",
  "audit_export_drill",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredTables = [
  "aiphabee_core.compliance_ops_release_gate",
  "aiphabee_audit.compliance_ops_drill_event",
  "aiphabee_governance.compliance_ops_release_gate_contract"
];
const requiredLinkedContracts = [
  "deploy/public-ops/public-status-docs.contract.json",
  "deploy/agent/kill-switch.contract.json",
  "deploy/support/request-id-investigation.contract.json",
  "deploy/observability/events.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredBlockers = [
  "external_compliance_legal_signoff_missing",
  "live_kill_switch_flag_source_missing",
  "live_incident_feed_missing",
  "live_audit_export_store_missing",
  "frontend_release_ops_ui_missing"
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

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase3.compliance-ops-release-gate-scaffold.v0") {
    errors.push("version must match compliance ops release gate scaffold version");
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

  if (value.route !== "POST /public/release-gates/compliance-ops/plan") {
    errors.push("route must be POST /public/release-gates/compliance-ops/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const [field, expected] of Object.entries({
    docs_route: "GET /public/docs",
    public_status_route: "GET /public/status",
    kill_switch_route: "POST /agent/kill-switch/plan",
    incident_response_route: "POST /support/request-id-investigation/plan",
    audit_event_contract: "deploy/observability/events.contract.json"
  })) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  for (const field of [
    "frontend",
    "live_compliance_signoff",
    "live_kill_switch_flag_source",
    "live_incident_feed",
    "live_audit_export_store",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validateComplianceBoundary(value.compliance_boundary));
  errors.push(...validateKillSwitchDrill(value.kill_switch_drill));
  errors.push(...validateIncidentResponseDrill(value.incident_response_drill));
  errors.push(...validateAuditExportDrill(value.audit_export_drill));
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

function validateComplianceBoundary(value) {
  if (!isRecord(value)) {
    return ["compliance_boundary must be an object"];
  }

  const errors = [];

  if (value.type4_written_opinion_required !== true) {
    errors.push("compliance_boundary.type4_written_opinion_required must be true");
  }

  if (value.external_legal_opinion_present !== false) {
    errors.push("compliance_boundary.external_legal_opinion_present must be false");
  }

  if (value.review_source !== "docs/researches/AiphaBee_PRD_v1.0.md#14.2") {
    errors.push("compliance_boundary.review_source must point to PRD 14.2");
  }

  errors.push(
    ...validateStringArray(
      value.allowed_terms,
      ["research", "analysis", "data_explanation", "研究", "分析", "数据解释"],
      "compliance_boundary.allowed_terms"
    )
  );
  errors.push(
    ...validateStringArray(
      value.forbidden_claims,
      [
        "stock_pick",
        "investment_advice",
        "buy_sell_recommendation",
        "position_sizing_advice",
        "suitability_conclusion",
        "guaranteed_return",
        "copy_trading"
      ],
      "compliance_boundary.forbidden_claims"
    )
  );
  errors.push(
    ...validateStringArray(
      value.reviewed_surfaces,
      ["product_pages", "prompts", "marketing_copy", "pricing"],
      "compliance_boundary.reviewed_surfaces"
    )
  );

  return errors;
}

function validateKillSwitchDrill(value) {
  if (!isRecord(value)) {
    return ["kill_switch_drill must be an object"];
  }

  const errors = [];

  for (const field of [
    "model_request_blocked",
    "tool_execution_blocked",
    "safe_degradation_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`kill_switch_drill.${field} must be true`);
    }
  }

  if (value.live_flag_reads !== false) {
    errors.push("kill_switch_drill.live_flag_reads must be false");
  }

  return errors;
}

function validateIncidentResponseDrill(value) {
  if (!isRecord(value)) {
    return ["incident_response_drill must be an object"];
  }

  const errors = [];

  for (const field of [
    "request_id_trace_required",
    "public_status_component_source_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`incident_response_drill.${field} must be true`);
    }
  }

  for (const field of [
    "sensitive_content_released",
    "live_log_reads",
    "live_billing_provider_reads"
  ]) {
    if (value[field] !== false) {
      errors.push(`incident_response_drill.${field} must be false`);
    }
  }

  return errors;
}

function validateAuditExportDrill(value) {
  if (!isRecord(value)) {
    return ["audit_export_drill must be an object"];
  }

  const errors = [];

  if (value.export_format !== "jsonl") {
    errors.push("audit_export_drill.export_format must be jsonl");
  }

  for (const field of ["sensitive_payload_released", "live_log_reads"]) {
    if (value[field] !== false) {
      errors.push(`audit_export_drill.${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.required_fields,
      [
        "event_id",
        "event_type",
        "request_id",
        "run_id",
        "route",
        "event_version",
        "outcome",
        "audit.data_version",
        "audit.methodology_version",
        "audit.denied_tools",
        "audit.requested_tools"
      ],
      "audit_export_drill.required_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.forbidden_fields,
      [
        "raw_prompt",
        "generated_answer",
        "oauth_access_token",
        "session_secret",
        "payment_identifier",
        "direct_contact"
      ],
      "audit_export_drill.forbidden_fields"
    )
  );

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_compliance_ops_validation") {
    errors.push("release_gate.gate_status must be blocked_live_compliance_ops_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["security", "compliance", "legal", "ops"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validatePackageScript(packageValue) {
  if (!isRecord(packageValue) || !isRecord(packageValue.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (
    packageValue.scripts["check:compliance-ops-release-gate"] !==
    "node scripts/check-compliance-ops-release-gate-contract.mjs"
  ) {
    errors.push("package.json must define check:compliance-ops-release-gate");
  }

  if (
    typeof packageValue.scripts.check !== "string" ||
    !packageValue.scripts.check.includes("npm run check:compliance-ops-release-gate")
  ) {
    errors.push("package.json check script must include check:compliance-ops-release-gate");
  }

  return errors;
}

function validateDatabaseTables(databaseValue) {
  if (!isRecord(databaseValue) || !Array.isArray(databaseValue.migrations)) {
    return ["database migrations contract must include migrations"];
  }

  const migration = databaseValue.migrations.find(
    (entry) => isRecord(entry) && entry.file === migrationFile
  );
  if (!isRecord(migration)) {
    return [`database migrations contract must include ${migrationFile}`];
  }

  const errors = [];

  errors.push(...validateStringArray(migration.schemas, ["aiphabee_audit", "aiphabee_core", "aiphabee_governance"], "migration.schemas"));
  errors.push(...validateStringArray(migration.tables, requiredTables, "migration.tables"));

  if (migration.market_data !== false) {
    errors.push("migration.market_data must be false");
  }

  if (migration.default_rights_status !== "default_deny") {
    errors.push("migration.default_rights_status must be default_deny");
  }

  if (!existsSync(resolve(process.cwd(), migrationFile))) {
    errors.push(`${migrationFile} must exist`);
  }

  return errors;
}

function validateLinkedContractFiles(paths) {
  if (!Array.isArray(paths)) {
    return ["linked_contracts must be an array"];
  }

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked contract missing: ${String(path)}`);
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
