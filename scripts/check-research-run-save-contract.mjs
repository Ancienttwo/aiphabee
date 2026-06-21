#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/research/research-run-save.contract.json";
const requiredSprintItems = [
  "RES-01",
  "saved_research_run",
  "question_snapshot",
  "tool_input_snapshot",
  "evidence_snapshot",
  "model_prompt_version_snapshot"
];
const requiredTables = [
  "core.research_run",
  "core.research_run_tool_call",
  "core.research_run_evidence_snapshot",
  "core.research_run_model_snapshot"
];
const requiredInputFields = [
  "question",
  "tool_calls",
  "evidence_records",
  "model_version",
  "prompt_version"
];
const requiredOutputFields = [
  "research_run_id",
  "snapshot_id",
  "question_snapshot",
  "tool_input_snapshot",
  "evidence_snapshot",
  "model_snapshot",
  "schema_validation",
  "replay_seed",
  "persistence_plan",
  "immutable_report_snapshot"
];
const requiredQuestionFields = ["question", "question_hash"];
const requiredToolInputFields = [
  "tool_call_id",
  "tool_name",
  "tool_version",
  "request_id",
  "input_schema_id",
  "output_schema_id",
  "input_snapshot",
  "input_hash",
  "data_version",
  "methodology_version"
];
const requiredEvidenceFields = [
  "evidence_record_id",
  "source_record_ids",
  "data_version",
  "methodology_version",
  "document_location"
];
const requiredModelFields = [
  "model_provider",
  "model_version",
  "prompt_version",
  "prompt_template_id"
];
const requiredReplayFields = [
  "snapshot_id",
  "replay_route",
  "replay_status",
  "deterministic_replay_ready"
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

  if (value.version !== "2026-06-21.phase2.research-run-save-scaffold.v0") {
    errors.push("version must match research run save scaffold version");
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

  if (value.route !== "POST /research/runs/save/plan") {
    errors.push("route must be POST /research/runs/save/plan");
  }

  if (value.tool_name !== "save_research_run") {
    errors.push("tool_name must be save_research_run");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "live_db_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of ["immutable_report_snapshot", "replay_seed_ready"]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_2_items,
      requiredSprintItems,
      "covered_sprint_2_2_items"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
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
    ...validateStringArray(
      value.question_snapshot_fields,
      requiredQuestionFields,
      "question_snapshot_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.tool_input_snapshot_fields,
      requiredToolInputFields,
      "tool_input_snapshot_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.evidence_snapshot_fields,
      requiredEvidenceFields,
      "evidence_snapshot_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.model_snapshot_fields,
      requiredModelFields,
      "model_snapshot_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.replay_seed_fields,
      requiredReplayFields,
      "replay_seed_fields"
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
