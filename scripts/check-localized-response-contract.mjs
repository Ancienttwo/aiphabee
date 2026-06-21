#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/localized-response.contract.json";
const requiredLocales = ["zh-Hant", "zh-Hans", "en"];
const requiredDepths = ["newbie", "professional"];
const requiredInvariantFields = [
  "currency",
  "data_values",
  "evidence_card_refs",
  "methodology_versions",
  "source_record_ids",
  "units"
];
const requiredLocaleInvariantFields = [
  ...requiredInvariantFields,
  "numeric_precision"
];
const requiredGlossaryTerms = [
  "free_cash_flow",
  "operating_profit",
  "roe",
  "total_return_adjusted",
  "abnormal_return"
];
const requiredValidationRules = [
  "require_locale_in_zh_hant_zh_hans_en",
  "preserve_numeric_values_across_locale_switch",
  "preserve_source_record_ids_across_locale_switch",
  "preserve_methodology_versions_across_locale_switch",
  "preserve_conclusion_and_evidence_across_response_depth",
  "require_bilingual_financial_terms",
  "require_methodology_note_for_financial_terms"
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
    locales: contract.supported_locales,
    route: contract.route,
    status: "ok",
    terms: contract.required_glossary_terms.length
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

  for (const field of ["actual_tool_execution", "frontend", "model_calls"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.capability_status !== "localized_response_contract_scaffold") {
    errors.push("capability_status must be localized_response_contract_scaffold");
  }

  errors.push(...validateExactStringArray(value.supported_locales, requiredLocales, "supported_locales"));
  errors.push(
    ...validateExactStringArray(
      value.supported_response_depths,
      requiredDepths,
      "supported_response_depths"
    )
  );
  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_1_items,
      ["AGT-11", "AGT-12", "financial_terminology_localization", "prd_12_4"],
      "covered_sprint_3_1_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_validation_rules,
      requiredValidationRules,
      "required_validation_rules"
    )
  );

  if (value.default_locale !== "zh-Hant") {
    errors.push("default_locale must be zh-Hant");
  }

  if (value.default_response_depth !== "professional") {
    errors.push("default_response_depth must be professional");
  }

  errors.push(
    ...validateBooleanRecord(
      value.locale_switch_invariant,
      requiredLocaleInvariantFields,
      "locale_switch_invariant"
    )
  );
  errors.push(
    ...validateBooleanRecord(
      value.response_depth_invariant,
      requiredInvariantFields,
      "response_depth_invariant"
    )
  );
  errors.push(...validateResponseDepthPolicy(value.response_depth_policy));
  errors.push(...validateTerminologyPolicy(value.terminology_policy));
  errors.push(...validateGlossaryTerms(value.required_glossary_terms));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateResponseDepthPolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["response_depth_policy must be an object"];
  }

  for (const field of [
    "newbie_adds_examples",
    "newbie_requires_plain_language_definition",
    "professional_can_show_raw_formula_and_source_fields"
  ]) {
    if (value[field] !== true) {
      errors.push(`response_depth_policy.${field} must be true`);
    }
  }

  return errors;
}

function validateTerminologyPolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["terminology_policy must be an object"];
  }

  for (const field of [
    "bilingual_terms_required",
    "same_glossary_for_all_locales",
    "unknown_terms_use_source_label"
  ]) {
    if (value[field] !== true) {
      errors.push(`terminology_policy.${field} must be true`);
    }
  }

  return errors;
}

function validateGlossaryTerms(value) {
  const errors = [];

  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    return ["required_glossary_terms must be an object array"];
  }

  const termIds = new Set(value.map((item) => item.metric_id));

  for (const term of requiredGlossaryTerms) {
    if (!termIds.has(term)) {
      errors.push(`required_glossary_terms must include ${term}`);
    }
  }

  for (const [index, term] of value.entries()) {
    for (const field of ["metric_id", "zh_hant", "zh_hans", "en"]) {
      if (typeof term[field] !== "string" || term[field].length === 0) {
        errors.push(`required_glossary_terms[${index}].${field} must be a non-empty string`);
      }
    }

    for (const field of ["methodology_note_required", "source_record_required_when_numeric"]) {
      if (term[field] !== true) {
        errors.push(`required_glossary_terms[${index}].${field} must be true`);
      }
    }
  }

  return errors;
}

function validateBooleanRecord(value, requiredFields, name) {
  const errors = [];

  if (!isRecord(value)) {
    return [`${name} must be an object`];
  }

  for (const field of requiredFields) {
    if (value[field] !== true) {
      errors.push(`${name}.${field} must be true`);
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
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern}`);
    }
  }

  return errors;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
