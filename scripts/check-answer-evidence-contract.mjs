#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/answer-evidence-contract.contract.json";
const requiredOrderedSections = [
  "direct_answer",
  "data_status",
  "key_evidence",
  "explanation",
  "counter_evidence_risks",
  "sources_methods",
  "next_steps",
  "disclaimer"
];
const requiredClaimLabels = ["fact", "calculation", "inference", "unknown"];
const requiredEvidenceStrengthValues = ["strong", "medium", "weak", "unknown"];
const requiredEvidenceCardFields = [
  "card_id",
  "claim_id",
  "label",
  "source_record_id",
  "data_point",
  "document_location",
  "as_of",
  "data_version",
  "methodology_version",
  "currency",
  "unit",
  "evidence_strength",
  "warnings"
];
const requiredPlannedCardSources = [
  "get_quote_snapshot",
  "get_price_history",
  "get_financial_facts",
  "get_data_lineage"
];
const requiredValidationRules = [
  "require_ordered_answer_sections",
  "require_layer_label_per_claim",
  "require_evidence_card_ref_for_fact",
  "require_calculation_ref_for_calculation",
  "label_missing_data_unknown",
  "block_unsourced_specific_numbers"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

let contract;

try {
  contract = JSON.parse(readFileSync(resolve(process.cwd(), contractPath), "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: contractPath,
      status: "invalid_json"
    },
    1
  );
}

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
    ordered_sections: contract.ordered_sections,
    route: contract.route,
    status: "ok"
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.route !== "POST /agent/runs/plan") {
    errors.push("route must be POST /agent/runs/plan");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  for (const field of ["actual_tool_execution", "frontend", "frontend_rendering", "model_calls"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.contract_status !== "answer_evidence_contract_scaffold") {
    errors.push("contract_status must be answer_evidence_contract_scaffold");
  }

  if (value.evidence_card_payload !== "planned") {
    errors.push("evidence_card_payload must be planned");
  }

  errors.push(...validateExactStringArray(value.ordered_sections, requiredOrderedSections, "ordered_sections"));
  errors.push(
    ...validateStringArray(value.required_claim_labels, requiredClaimLabels, "required_claim_labels")
  );
  errors.push(
    ...validateStringArray(
      value.evidence_card_required_fields,
      requiredEvidenceCardFields,
      "evidence_card_required_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_planned_card_sources,
      requiredPlannedCardSources,
      "required_planned_card_sources"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_validation_rules,
      requiredValidationRules,
      "required_validation_rules"
    )
  );

  if (!isRecord(value.answer_structure_limits)) {
    errors.push("answer_structure_limits must be an object");
  } else {
    if (value.answer_structure_limits.min_direct_answer_sentences !== 2) {
      errors.push("answer_structure_limits.min_direct_answer_sentences must be 2");
    }

    if (value.answer_structure_limits.max_direct_answer_sentences !== 5) {
      errors.push("answer_structure_limits.max_direct_answer_sentences must be 5");
    }

    if (value.answer_structure_limits.min_key_evidence_items !== 3) {
      errors.push("answer_structure_limits.min_key_evidence_items must be 3");
    }

    if (value.answer_structure_limits.max_key_evidence_items !== 6) {
      errors.push("answer_structure_limits.max_key_evidence_items must be 6");
    }

    if (value.answer_structure_limits.max_next_steps !== 3) {
      errors.push("answer_structure_limits.max_next_steps must be 3");
    }

    if (
      value.answer_structure_limits.disclaimer_boundary !==
      "not_a_substitute_for_runtime_controls"
    ) {
      errors.push(
        "answer_structure_limits.disclaimer_boundary must be not_a_substitute_for_runtime_controls"
      );
    }
  }

  if (!isRecord(value.claim_label_rules)) {
    errors.push("claim_label_rules must be an object");
  } else {
    for (const field of [
      "calculation_requires_calculation_ref",
      "fact_requires_evidence_card",
      "inference_requires_evidence_strength",
      "text_labels_required",
      "ui_labels_required",
      "unknown_requires_missing_reason"
    ]) {
      if (value.claim_label_rules[field] !== true) {
        errors.push(`claim_label_rules.${field} must be true`);
      }
    }
  }

  if (!isRecord(value.evidence_strength)) {
    errors.push("evidence_strength must be an object");
  } else {
    if (value.evidence_strength.confidence_score_display !== false) {
      errors.push("evidence_strength.confidence_score_display must be false");
    }

    errors.push(
      ...validateStringArray(
        value.evidence_strength.allowed_values,
        requiredEvidenceStrengthValues,
        "evidence_strength.allowed_values"
      )
    );
  }

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

function validateExactStringArray(value, expectedValues, name) {
  const errors = validateStringArray(value, expectedValues, name);

  if (errors.length > 0) {
    return errors;
  }

  if (value.length !== expectedValues.length) {
    errors.push(`${name} must contain exactly ${expectedValues.length} entries`);
  }

  expectedValues.forEach((expectedValue, index) => {
    if (value[index] !== expectedValue) {
      errors.push(`${name}[${index}] must be ${expectedValue}`);
    }
  });

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
