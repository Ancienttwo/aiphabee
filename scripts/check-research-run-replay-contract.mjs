#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/research/research-run-replay.contract.json";
const requiredSprintItems = [
  "RES-02",
  "research_run_replay",
  "data_model_parameter_diff",
  "old_report_immutable"
];
const requiredInputFields = ["saved_run", "current_run"];
const requiredOutputFields = [
  "saved_snapshot_id",
  "replay_snapshot_id",
  "diff_summary",
  "diffs",
  "old_report",
  "replay_execution",
  "current_run_plan"
];
const requiredDiffCategories = ["data", "model", "parameters"];
const requiredDataDiffFields = [
  "changed",
  "previous_evidence_hash",
  "current_evidence_hash",
  "previous_source_record_ids",
  "current_source_record_ids",
  "changed_source_record_ids",
  "data_version_changed",
  "changed_data_versions"
];
const requiredModelDiffFields = [
  "changed",
  "previous_model_provider",
  "current_model_provider",
  "previous_model_version",
  "current_model_version",
  "previous_prompt_version",
  "current_prompt_version",
  "model_provider_changed",
  "model_version_changed",
  "prompt_version_changed",
  "prompt_template_changed"
];
const requiredParameterDiffFields = [
  "changed",
  "previous_parameter_hash",
  "current_parameter_hash",
  "previous_parameters",
  "current_parameters",
  "changed_keys",
  "added_keys",
  "removed_keys",
  "tool_input_changed",
  "question_changed"
];
const requiredOldReportFields = [
  "preserved_snapshot_id",
  "immutable_report_snapshot",
  "mutation_allowed",
  "silent_rewrite_allowed"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const errors = validateContract(contract);

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
    tool_name: contract.tool_name
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

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.research-run-replay-scaffold.v0") {
    errors.push("version must match research run replay scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/research-runtime") {
    errors.push("package must be @aiphabee/research-runtime");
  }

  if (value.runtime_route !== "GET /research/runtime") {
    errors.push("runtime_route must be GET /research/runtime");
  }

  if (value.route !== "POST /research/runs/replay/plan") {
    errors.push("route must be POST /research/runs/replay/plan");
  }

  if (value.tool_name !== "replay_research_run") {
    errors.push("tool_name must be replay_research_run");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_db_writes",
    "live_model_calls",
    "live_tool_execution",
    "sql_emitted",
    "old_report_mutation_allowed",
    "silent_rewrite_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.immutable_report_snapshot !== true) {
    errors.push("immutable_report_snapshot must be true");
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_2_items,
      requiredSprintItems,
      "covered_sprint_2_2_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_input_fields,
      requiredInputFields,
      "required_input_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.diff_categories, requiredDiffCategories, "diff_categories")
  );
  errors.push(
    ...validateStringArray(value.data_diff_fields, requiredDataDiffFields, "data_diff_fields")
  );
  errors.push(
    ...validateStringArray(
      value.model_diff_fields,
      requiredModelDiffFields,
      "model_diff_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.parameter_diff_fields,
      requiredParameterDiffFields,
      "parameter_diff_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.old_report_fields,
      requiredOldReportFields,
      "old_report_fields"
    )
  );
  errors.push(...validateNoSecrets(value));

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
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
