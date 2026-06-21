#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/cloudflare/bindings.contract.json";
const requiredTypes = [
  "worker",
  "workflow",
  "queue",
  "cron",
  "durable_object",
  "r2",
  "kv",
  "d1",
  "ai_gateway",
  "hyperdrive"
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
    bindings: contract.bindings.length,
    planned: contract.bindings.filter((binding) => !binding.provisioned).length,
    provisioned: contract.bindings.filter((binding) => binding.provisioned).length,
    status: "ok",
    types: requiredTypes.length
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

  if (value.status !== "planned") {
    errors.push("status must be planned until all resources are provisioned");
  }

  if (!Array.isArray(value.bindings)) {
    errors.push("bindings must be an array");
    return errors;
  }

  const seenNames = new Set();
  const typeCounts = new Map();

  value.bindings.forEach((binding, index) => {
    if (!isRecord(binding)) {
      errors.push(`bindings[${index}] must be an object`);
      return;
    }

    for (const field of ["name", "type", "purpose", "required_by_sprint", "smoke_test"]) {
      if (typeof binding[field] !== "string" || binding[field].length === 0) {
        errors.push(`bindings[${index}].${field} must be a non-empty string`);
      }
    }

    if (typeof binding.provisioned !== "boolean") {
      errors.push(`bindings[${index}].provisioned must be boolean`);
    }

    if (typeof binding.name === "string") {
      if (seenNames.has(binding.name)) {
        errors.push(`bindings[${index}].name is duplicated`);
      }

      seenNames.add(binding.name);
    }

    if (typeof binding.type === "string") {
      typeCounts.set(binding.type, (typeCounts.get(binding.type) ?? 0) + 1);
    }

    for (const forbiddenField of ["id", "secret", "token", "value"]) {
      if (Object.prototype.hasOwnProperty.call(binding, forbiddenField)) {
        errors.push(`bindings[${index}] must not contain ${forbiddenField}`);
      }
    }
  });

  for (const type of requiredTypes) {
    if (!typeCounts.has(type)) {
      errors.push(`missing required binding type ${type}`);
    }
  }

  const unknownTypes = [...typeCounts.keys()].filter(
    (type) => !requiredTypes.includes(type)
  );

  if (unknownTypes.length > 0) {
    errors.push(`unknown binding types: ${unknownTypes.join(", ")}`);
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
