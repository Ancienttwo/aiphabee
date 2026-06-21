#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/run-tool-audit-fields.contract.json";
const eventContractPath = "deploy/observability/events.contract.json";
const packageJsonPath = "package.json";
const observabilitySourcePath = "packages/observability/src/index.ts";
const observabilityTestPath = "packages/observability/src/index.test.ts";
const workerPath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";

const requiredRunAuditFields = [
  "user_id",
  "workspace_id",
  "requested_tools",
  "denied_tools",
  "tool_versions",
  "tool_call_count",
  "tool_calls",
  "data_version",
  "methodology_version",
  "model_provider",
  "model_id",
  "model_version",
  "model_tier",
  "model_calls",
  "input_tokens",
  "output_tokens",
  "total_tokens",
  "estimated_cost_usd",
  "credits",
  "latency_ms",
  "output_hash"
];
const requiredToolCallFields = [
  "tool_name",
  "tool_version",
  "status",
  "data_version",
  "methodology_version",
  "model_provider",
  "model_id",
  "model_version",
  "input_tokens",
  "output_tokens",
  "total_tokens",
  "estimated_cost_usd",
  "latency_ms",
  "output_hash"
];
const requiredToolCallStatuses = ["planned_no_execution", "denied_pre_execution"];
const requiredWorkerRoutes = [
  "POST /agent/runs/dry-run",
  "POST /agent/runs/plan",
  "POST /agent/workflows/tasks/plan"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const eventContract = readJson(eventContractPath);
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  observability: readText(observabilitySourcePath),
  observabilityTest: readText(observabilityTestPath),
  tracker: readText(trackerPath),
  worker: readText(workerPath),
  workerTest: readText(workerTestPath)
};

const errors = validateContract(contract, eventContract, packageJson, sourceFiles);

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
    fields: contract.required_run_audit_fields.length,
    route_count: contract.worker_routes.length,
    status: "ok",
    tool_call_fields: contract.required_tool_call_fields.length
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

function validateContract(value, eventValue, packageValue, sourceFilesValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.run-tool-audit-fields-closeout.v0") {
    errors.push("version must match run-tool audit field closeout version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/observability") {
    errors.push("package must be @aiphabee/observability");
  }

  if (value.event_contract !== eventContractPath) {
    errors.push(`event_contract must be ${eventContractPath}`);
  }

  if (value.event_type !== "run.audit") {
    errors.push("event_type must be run.audit");
  }

  for (const field of [
    "model_calls",
    "actual_tool_execution",
    "live_tool_execution",
    "live_ai_gateway_logs",
    "persistent_audit_sink"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this local closeout`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.worker_routes,
      requiredWorkerRoutes,
      "worker_routes"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_run_audit_fields,
      requiredRunAuditFields,
      "required_run_audit_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_call_fields,
      requiredToolCallFields,
      "required_tool_call_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_call_statuses,
      requiredToolCallStatuses,
      "required_tool_call_statuses"
    )
  );
  errors.push(...validateLinkedFiles([value.event_contract]));
  errors.push(...validateEventContract(eventValue));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(value, sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateEventContract(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.event_types)) {
    return ["event contract must include event_types"];
  }

  const auditEvent = value.event_types.find(
    (eventType) => isRecord(eventType) && eventType.type === "run.audit"
  );

  if (!isRecord(auditEvent)) {
    return ["event contract must include run.audit"];
  }

  errors.push(
    ...validateStringArray(
      auditEvent.audit_required_fields,
      requiredRunAuditFields,
      "event_contract run.audit audit_required_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      auditEvent.tool_call_required_fields,
      requiredToolCallFields,
      "event_contract run.audit tool_call_required_fields"
    )
  );

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:run-tool-audit-fields"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-run-tool-audit-fields-contract.mjs")
  ) {
    errors.push("check:run-tool-audit-fields must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:run-tool-audit-fields")) {
    errors.push("root check script must include check:run-tool-audit-fields");
  }

  return errors;
}

function validateSourceTokens(value, sourceFilesValue) {
  const errors = [];
  const requiredByFile = {
    observability: [
      "AuditToolCallTelemetry",
      "AuditToolVersion",
      "createAuditToolCalls",
      "createStableAuditHash",
      "tool_versions",
      "tool_calls",
      "user_id",
      "workspace_id",
      "model_version",
      "input_tokens",
      "estimated_cost_usd",
      "latency_ms",
      "output_hash"
    ],
    observabilityTest: [
      "creates audit and eval events without prompt content",
      "denied_pre_execution",
      "tool_versions",
      "tool_calls",
      "user_internal_alpha",
      "workspace_research"
    ],
    worker: [
      "createAgentTelemetryIdentity",
      "createTelemetryToolVersions",
      "skeleton.run_context.user.user_id",
      "skeleton.run_context.workspace.workspace_id",
      "skeleton.run_context.toolset.tools",
      "plan.run_context.toolset.tools",
      "plan.tool_loop_plan.run_context.toolset.tools",
      "user_local_dry_run",
      "workspace_local_dry_run"
    ],
    workerTest: [
      "creates an agent dry-run skeleton",
      "run.audit",
      "tool_versions",
      "tool_calls",
      "model_version",
      "user_internal_alpha",
      "workspace_research"
    ]
  };

  for (const [fileKey, tokens] of Object.entries(requiredByFile)) {
    const text = sourceFilesValue[fileKey];

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

  errors.push(
    ...validateStringArray(
      value.required_source_tokens,
      requiredByFile.observability,
      "required_source_tokens"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_worker_tokens,
      requiredByFile.worker,
      "required_worker_tokens"
    )
  );
  errors.push(
    ...validateStringArray(value.required_tests, requiredByFile.workerTest, "required_tests")
  );

  return errors;
}

function validateTrackerSync(tracker) {
  const errors = [];

  if (!tracker.includes("- [x] 每 run/tool-call 审计字段齐全")) {
    errors.push("tracker must mark the A5 run/tool-call audit field item complete");
  }

  if (!tracker.includes("npm run check:run-tool-audit-fields")) {
    errors.push("tracker A5 row must reference check:run-tool-audit-fields");
  }

  if (!tracker.includes("- [ ] AI Gateway 接管模型调用日志/成本/限流/缓存/fallback")) {
    errors.push("tracker must keep the live AI Gateway audit/log item unchecked");
  }

  return errors;
}

function validateLinkedFiles(paths) {
  if (!Array.isArray(paths)) {
    return ["linked files must be an array"];
  }

  return paths
    .filter((path) => typeof path === "string" && !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${path}`);
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
