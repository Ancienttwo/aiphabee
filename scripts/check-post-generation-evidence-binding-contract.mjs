#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/post-generation-evidence-binding.contract.json";
const numericGuardContractPath = "deploy/agent/numeric-source-guard.contract.json";
const productGateContractPath = "deploy/agent/product-agent-release-gate.contract.json";
const packageJsonPath = "package.json";
const agentRuntimePath = "packages/agent-runtime/src/index.ts";
const agentRuntimeTestPath = "packages/agent-runtime/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";

const requiredValidationFields = [
  "status",
  "output_allowed",
  "blocked_claim_count",
  "numeric_claims",
  "failure_code",
  "validation_rules"
];
const requiredNumericClaimFields = [
  "claim_id",
  "text",
  "numeric_values",
  "financial_context",
  "binding_status",
  "missing_fields"
];
const requiredValidationRules = [
  "extract_post_generation_numeric_claims",
  "require_source_record_or_calculation_binding",
  "block_unsourced_financial_numbers",
  "mark_missing_numbers_unknown"
];
const requiredBindingRefs = ["evidence_card", "source_record", "deterministic_calculation"];
const requiredReleaseChecks = [
  "post_generation_unsourced_numeric_claim_blocked",
  "answer_contract_blocks_unsourced_numbers"
];
const requiredProbes = [
  "unsourced_financial_number_blocks_answer",
  "evidence_card_bound_number_allows_answer",
  "deterministic_calculation_bound_number_allows_answer"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const numericGuardContract = readJson(numericGuardContractPath);
const productGateContract = readJson(productGateContractPath);
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  agentRuntime: readText(agentRuntimePath),
  agentRuntimeTest: readText(agentRuntimeTestPath),
  tracker: readText(trackerPath),
  worker: readText(workerPath),
  workerTest: readText(workerTestPath)
};
const errors = validateContract(
  contract,
  numericGuardContract,
  productGateContract,
  packageJson,
  sourceFiles
);

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
    route: contract.validator_route,
    status: "ok",
    validation: contract.post_generation_validation
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

function validateContract(
  value,
  numericGuardValue,
  productGateValue,
  packageValue,
  sourceFilesValue
) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.post-generation-evidence-binding-closeout.v0") {
    errors.push("version must match post-generation evidence-binding closeout version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  if (value.plan_route !== "POST /agent/runs/plan") {
    errors.push("plan_route must be POST /agent/runs/plan");
  }

  if (value.validator_route !== "POST /agent/runs/validate-answer") {
    errors.push("validator_route must be POST /agent/runs/validate-answer");
  }

  if (value.product_gate_route !== "POST /agent/release-gates/product-agent/plan") {
    errors.push("product_gate_route must be POST /agent/release-gates/product-agent/plan");
  }

  for (const field of [
    "model_calls",
    "actual_tool_execution",
    "live_tool_execution",
    "live_evidence_binding",
    "frontend_rendering",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (value.post_generation_validation !== "local_deterministic") {
    errors.push("post_generation_validation must be local_deterministic");
  }

  if (value.failure_code !== "UNSOURCED_NUMERIC_CLAIM") {
    errors.push("failure_code must be UNSOURCED_NUMERIC_CLAIM");
  }

  errors.push(
    ...validateStringArray(
      value.required_validation_fields,
      requiredValidationFields,
      "required_validation_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_numeric_claim_fields,
      requiredNumericClaimFields,
      "required_numeric_claim_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.allowed_binding_refs, requiredBindingRefs, "allowed_binding_refs")
  );
  errors.push(
    ...validateStringArray(
      value.required_validation_rules,
      requiredValidationRules,
      "required_validation_rules"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_release_checks,
      requiredReleaseChecks,
      "required_release_checks"
    )
  );
  errors.push(...validateStringArray(value.required_probes, requiredProbes, "required_probes"));
  errors.push(...validateLinkedContracts(value.linked_contracts));
  errors.push(...validateNumericGuardContract(numericGuardValue));
  errors.push(...validateProductGateContract(productGateValue));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateNumericGuardContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["numeric source guard contract must be an object"];
  }

  if (value.post_generation_validation !== "local_deterministic") {
    errors.push("numeric source guard contract must require local_deterministic validation");
  }

  if (value.post_generation_validator_route !== "POST /agent/runs/validate-answer") {
    errors.push("numeric source guard contract must expose validate-answer route");
  }

  if (!isRecord(value.post_generation_evidence_binding)) {
    errors.push("numeric source guard contract must include post_generation_evidence_binding");
  } else {
    errors.push(
      ...validateStringArray(
        value.post_generation_evidence_binding.validation_rules,
        requiredValidationRules,
        "numeric source guard post-generation validation_rules"
      )
    );
  }

  return errors;
}

function validateProductGateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["product gate contract must be an object"];
  }

  errors.push(
    ...validateStringArray(value.required_checks, requiredReleaseChecks, "product gate checks")
  );

  if (isRecord(value.release_gate)) {
    if (value.release_gate.gate_status !== "blocked_live_evidence_binding") {
      errors.push("product gate must now block on live evidence binding");
    }

    if (
      Array.isArray(value.release_gate.blockers) &&
      value.release_gate.blockers.includes("actual_post_generation_numeric_extraction_missing")
    ) {
      errors.push("product gate blockers must not include actual_post_generation_numeric_extraction_missing");
    }
  } else {
    errors.push("product gate release_gate must be an object");
  }

  return errors;
}

function validatePackageScripts(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:post-generation-evidence-binding"];
  const check = value.scripts.check;

  const errors = [];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-post-generation-evidence-binding-contract.mjs")
  ) {
    errors.push("check:post-generation-evidence-binding must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:post-generation-evidence-binding")) {
    errors.push("root check script must include check:post-generation-evidence-binding");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    agentRuntime: [
      "validatePostGenerationEvidenceBinding",
      "AgentPostGenerationEvidenceBindingValidation",
      "post_generation_evidence_binding",
      "post_generation_unsourced_numeric_claim_blocked",
      "POST /agent/runs/validate-answer"
    ],
    agentRuntimeTest: [
      "validates post-generation numeric claims against evidence bindings",
      "blocked_unsourced_numeric_claim",
      "bound_evidence_card",
      "bound_calculation"
    ],
    worker: [
      'app.post("/agent/runs/validate-answer"',
      "normalizePostGenerationEvidenceBindingInput",
      "validatePostGenerationEvidenceBinding"
    ],
    workerTest: [
      "validates post-generation answer evidence binding over HTTP",
      "blocked_unsourced_numeric_claim",
      "bound_evidence_card"
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

  if (!tracker.includes("- [x] 生成后 evidence-binding 校验，拦截无来源金融数字（AGT-05）")) {
    errors.push("tracker must mark AGT-05 post-generation evidence-binding complete");
  }

  if (!tracker.includes("npm run check:post-generation-evidence-binding")) {
    errors.push("tracker AGT-05 row must reference check:post-generation-evidence-binding");
  }

  if (!tracker.includes("- [ ] 「无来源具体金融数字」抽样 < 0.1%")) {
    errors.push("tracker must keep production unsourced numeric sampling item unchecked");
  }

  return errors;
}

function validateLinkedContracts(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  return value
    .filter((path) => typeof path === "string" && !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked contract file missing: ${path}`);
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
