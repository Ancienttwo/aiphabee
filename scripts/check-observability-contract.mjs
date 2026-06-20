#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/observability/events.contract.json";
const requiredEventTypes = ["run.audit", "run.eval"];
const requiredSinks = ["worker_console", "eval_store", "otlp_destination"];

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
    event_types: contract.event_types.length,
    sinks: contract.sinks.length,
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
    errors.push("status must be local_contract until provider sinks are provisioned");
  }

  if (!Array.isArray(value.event_types)) {
    errors.push("event_types must be an array");
    return errors;
  }

  const eventTypes = new Set();

  value.event_types.forEach((eventType, index) => {
    if (!isRecord(eventType)) {
      errors.push(`event_types[${index}] must be an object`);
      return;
    }

    if (typeof eventType.type !== "string") {
      errors.push(`event_types[${index}].type must be a string`);
    } else {
      eventTypes.add(eventType.type);
    }

    for (const field of ["required_fields", "forbidden_fields"]) {
      if (
        !Array.isArray(eventType[field]) ||
        eventType[field].some((item) => typeof item !== "string")
      ) {
        errors.push(`event_types[${index}].${field} must be a string array`);
      }
    }

    for (const forbidden of ["prompt", "api_key", "token", "secret", "password"]) {
      if (!eventType.forbidden_fields?.includes(forbidden)) {
        errors.push(`event_types[${index}] must forbid ${forbidden}`);
      }
    }
  });

  for (const type of requiredEventTypes) {
    if (!eventTypes.has(type)) {
      errors.push(`missing event type ${type}`);
    }
  }

  if (!Array.isArray(value.sinks)) {
    errors.push("sinks must be an array");
    return errors;
  }

  const sinks = new Set();

  value.sinks.forEach((sink, index) => {
    if (!isRecord(sink)) {
      errors.push(`sinks[${index}] must be an object`);
      return;
    }

    if (typeof sink.name !== "string") {
      errors.push(`sinks[${index}].name must be a string`);
    } else {
      sinks.add(sink.name);
    }

    if (!["wired", "planned"].includes(String(sink.status))) {
      errors.push(`sinks[${index}].status must be wired or planned`);
    }
  });

  for (const sink of requiredSinks) {
    if (!sinks.has(sink)) {
      errors.push(`missing sink ${sink}`);
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
