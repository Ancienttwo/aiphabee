#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/gateway/access.contract.json";
const requiredChannels = ["web", "mcp", "api", "export"];
const requiredGuards = [
  "channel_rights_default_deny",
  "field_redaction",
  "workspace_entitlement_default_deny",
  "plan_entitlement",
  "export_entitlement",
  "row_limit",
  "time_range_limit",
  "quality_hold",
  "serving_quality_release_isolation",
  "serving_read_default_deny",
  "cache_key_versioning",
  "provenance_required",
  "usage_preview"
];
const requiredErrorCodes = [
  "DATA_NOT_LICENSED",
  "DATA_QUALITY_HOLD",
  "OUT_OF_RANGE",
  "TOO_MANY_ROWS"
];
const requiredRoutes = ["GET /gateway/runtime", "POST /gateway/access-check"];

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
    channels: contract.channels.length,
    guards: contract.required_guards.length,
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
    errors.push("status must be local_contract until live data access exists");
  }

  if (value.default_rights_status !== "default_deny") {
    errors.push("default_rights_status must be default_deny");
  }

  if (value.live_data_access !== false) {
    errors.push("live_data_access must be false in this scaffold");
  }

  if (value.market_data_surfaces !== false) {
    errors.push("market_data_surfaces must be false in this scaffold");
  }

  if (value.mcp_redistribution_surfaces !== false) {
    errors.push("mcp_redistribution_surfaces must be false in this scaffold");
  }

  errors.push(...validateChannels(value.channels));
  errors.push(...validateStringArray(value.required_guards, requiredGuards, "required_guards"));
  errors.push(...validateStringArray(value.error_codes, requiredErrorCodes, "error_codes"));
  errors.push(...validateStringArray(value.runtime_routes, requiredRoutes, "runtime_routes"));
  errors.push(...validateLimits(value.limits));
  errors.push(...validateCacheKey(value.cache_key_fields));
  errors.push(...validateNoSecretLikeValues(value));

  return errors;
}

function validateChannels(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["channels must be an array"];
  }

  const channels = new Map();

  value.forEach((channel, index) => {
    if (!isRecord(channel)) {
      errors.push(`channels[${index}] must be an object`);
      return;
    }

    if (typeof channel.name !== "string") {
      errors.push(`channels[${index}].name must be a string`);
    } else {
      channels.set(channel.name, channel);
    }

    if (channel.status !== "default_deny") {
      errors.push(`channels[${index}].status must be default_deny`);
    }
  });

  for (const channel of requiredChannels) {
    if (!channels.has(channel)) {
      errors.push(`missing channel ${channel}`);
    }
  }

  return errors;
}

function validateLimits(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["limits must be an object"];
  }

  if (typeof value.max_rows !== "number" || value.max_rows < 1 || value.max_rows > 5000) {
    errors.push("limits.max_rows must be between 1 and 5000");
  }

  if (
    typeof value.max_window_days !== "number" ||
    value.max_window_days < 1 ||
    value.max_window_days > 366
  ) {
    errors.push("limits.max_window_days must be between 1 and 366");
  }

  return errors;
}

function validateCacheKey(value) {
  return validateStringArray(
    value,
    [
      "dataset",
      "channel",
      "plan",
      "workspace_id",
      "allowed_fields",
      "export_requested",
      "data_version",
      "rights_policy_version",
      "methodology_version",
      "time_range"
    ],
    "cache_key_fields"
  );
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

function validateNoSecretLikeValues(value) {
  const serialized = JSON.stringify(value);
  const patterns = [
    /sk-[A-Za-z0-9_-]+/u,
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]+/u,
    /gh[pousr]_[A-Za-z0-9_]+/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ];

  return patterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
