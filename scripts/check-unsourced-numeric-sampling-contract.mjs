#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/observability/unsourced-numeric-sampling.contract.json";
const evalContractPath = "deploy/observability/eval-v1.contract.json";
const postGenerationContractPath = "deploy/governance/post-generation-evidence-binding.contract.json";
const packageJsonPath = "package.json";
const agentRuntimePath = "packages/agent-runtime/src/index.ts";
const agentRuntimeTestPath = "packages/agent-runtime/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const governanceDocPath = "docs/governance/unsourced-numeric-sampling-gate.md";
const taskContractPath = "tasks/contracts/unsourced-numeric-sampling-gate.contract.md";
const taskNotesPath = "tasks/notes/unsourced-numeric-sampling-gate.notes.md";

const requiredSampleKinds = ["accepted_answer", "blocked_probe"];
const requiredReportFields = [
  "version",
  "validation_version",
  "status",
  "target_rate",
  "observed_rate",
  "accepted_sample_count",
  "blocked_probe_count",
  "detected_blocked_probe_count",
  "unsourced_claim_count",
  "samples",
  "eval_metric_source"
];
const requiredNotClaimed = [
  "production_live_sampling_complete",
  "live_model_output_sampling",
  "frontend_evidence_cards",
  "persistent_eval_writes",
  "partner_approved_production_corpus"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const evalContract = readJson(evalContractPath);
const postGenerationContract = readJson(postGenerationContractPath);
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  agentRuntime: readText(agentRuntimePath),
  agentRuntimeTest: readText(agentRuntimeTestPath),
  governanceDoc: readText(governanceDocPath),
  taskContract: readText(taskContractPath),
  taskNotes: readText(taskNotesPath),
  todos: readText(todosPath),
  tracker: readText(trackerPath)
};
const errors = validateContract(
  contract,
  evalContract,
  postGenerationContract,
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
    minimum_accepted_samples: contract.minimum_accepted_samples,
    route: contract.validator_route,
    status: "ok",
    target_rate: contract.target_rate
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
  evalContractValue,
  postGenerationContractValue,
  packageValue,
  sourceFilesValue
) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase4.unsourced-numeric-sampling-gate.v0") {
    errors.push("version must match unsourced numeric sampling gate version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.validator_route !== "POST /agent/runs/validate-answer") {
    errors.push("validator_route must be POST /agent/runs/validate-answer");
  }

  if (value.linked_eval_contract !== evalContractPath) {
    errors.push("linked_eval_contract must point to eval-v1 contract");
  }

  if (value.post_generation_contract !== postGenerationContractPath) {
    errors.push("post_generation_contract must point to post-generation contract");
  }

  if (value.sample_source !== "deterministic_fixture_corpus") {
    errors.push("sample_source must be deterministic_fixture_corpus");
  }

  if (value.minimum_accepted_samples !== 1000) {
    errors.push("minimum_accepted_samples must be 1000");
  }

  if (value.minimum_blocked_probes !== 3) {
    errors.push("minimum_blocked_probes must be 3");
  }

  if (value.target_rate !== 0.001) {
    errors.push("target_rate must be 0.001");
  }

  if (value.pass_operator !== "observed_rate_lt_target_rate") {
    errors.push("pass_operator must be observed_rate_lt_target_rate");
  }

  for (const field of [
    "model_calls",
    "actual_tool_execution",
    "live_evidence_binding",
    "persistent_writes",
    "sql_emitted",
    "frontend_rendering"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(value.required_sample_kinds, requiredSampleKinds, "required_sample_kinds")
  );
  errors.push(
    ...validateStringArray(
      value.required_report_fields,
      requiredReportFields,
      "required_report_fields"
    )
  );
  errors.push(...validateStringArray(value.not_claimed, requiredNotClaimed, "not_claimed"));
  errors.push(...validateEvalContract(evalContractValue));
  errors.push(...validatePostGenerationContract(postGenerationContractValue));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateDocs(sourceFilesValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateEvalContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["eval contract must be an object"];
  }

  if (value.package !== "@aiphabee/observability") {
    errors.push("eval contract package must be @aiphabee/observability");
  }

  if (value.unsourced_numeric_claim_target_rate !== 0.001) {
    errors.push("eval contract unsourced numeric target must be 0.001");
  }

  return errors;
}

function validatePostGenerationContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["post-generation contract must be an object"];
  }

  if (value.validator_route !== "POST /agent/runs/validate-answer") {
    errors.push("post-generation contract must expose validate-answer route");
  }

  if (value.post_generation_validation !== "local_deterministic") {
    errors.push("post-generation contract must be local_deterministic");
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be an object"];
  }

  if (
    value.scripts["check:unsourced-numeric-sampling"] !==
    "node scripts/check-unsourced-numeric-sampling-contract.mjs"
  ) {
    errors.push("package.json must define check:unsourced-numeric-sampling");
  }

  if (!String(value.scripts.check ?? "").includes("npm run check:unsourced-numeric-sampling")) {
    errors.push("root check must include check:unsourced-numeric-sampling");
  }

  return errors;
}

function validateSourceTokens(sourceFilesValue) {
  const errors = [];
  const runtimeTokens = [
    "UNSOURCED_NUMERIC_SAMPLING_VERSION",
    "UNSOURCED_NUMERIC_SAMPLING_TARGET_RATE = 0.001",
    "UNSOURCED_NUMERIC_SAMPLING_MIN_ACCEPTED_SAMPLES = 1000",
    "UNSOURCED_NUMERIC_SAMPLING_MIN_BLOCKED_PROBES = 3",
    "createUnsourcedNumericSamplingReport",
    "accepted_answer",
    "blocked_probe",
    "local_sampling_passed",
    "local_sampling_failed",
    "observedRate < UNSOURCED_NUMERIC_SAMPLING_TARGET_RATE",
    "eval_metric_source: \"eval_v1_unsourced_numeric_claims\""
  ];
  const testTokens = [
    "creates a deterministic unsourced numeric sampling report with eval v1 threshold",
    "fails deterministic unsourced numeric sampling at the strict eval v1 boundary",
    "Array.from({ length: 1000 }",
    "Array.from({ length: 999 }",
    "observed_rate: 0.001",
    "status: \"local_sampling_passed\"",
    "status: \"local_sampling_failed\""
  ];

  for (const token of runtimeTokens) {
    if (!sourceFilesValue.agentRuntime.includes(token)) {
      errors.push(`agent runtime missing ${token}`);
    }
  }

  for (const token of testTokens) {
    if (!sourceFilesValue.agentRuntimeTest.includes(token)) {
      errors.push(`agent runtime test missing ${token}`);
    }
  }

  return errors;
}

function validateDocs(sourceFilesValue) {
  const errors = [];
  const trackerTokens = [
    "check:unsourced-numeric-sampling",
    "production/live sampling",
    "- [ ] 「无来源具体金融数字」抽样 < 0.1%"
  ];
  const docTokens = [
    "deploy/observability/unsourced-numeric-sampling.contract.json",
    "npm run check:unsourced-numeric-sampling",
    "production/live sampling remains incomplete"
  ];

  for (const token of trackerTokens) {
    if (!sourceFilesValue.tracker.includes(token)) {
      errors.push(`tracker missing ${token}`);
    }
  }

  for (const [name, text] of [
    ["governance doc", sourceFilesValue.governanceDoc],
    ["task contract", sourceFilesValue.taskContract],
    ["task notes", sourceFilesValue.taskNotes],
    ["todos", sourceFilesValue.todos]
  ]) {
    for (const token of docTokens) {
      if (!text.includes(token)) {
        errors.push(`${name} missing ${token}`);
      }
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
      errors.push(`${name} missing ${requiredValue}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract must not contain secret-like value matching ${pattern}`);
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
