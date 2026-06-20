#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/observability/events.contract.json";
const envSchemaPath = "deploy/env/env.schema.json";
const bindingsContractPath = "deploy/cloudflare/bindings.contract.json";
const requiredEventTypes = ["run.audit", "run.eval"];
const requiredSinks = ["worker_console", "eval_store", "otlp_destination"];
const requiredOtlpEnv = [
  "OTLP_EXPORTER_OTLP_ENDPOINT",
  "OTLP_EXPORTER_OTLP_HEADERS"
];
const evalStoreBindingName = "AIPHABEE_EVAL_STORE";

let contract;
let envSchema;
let bindingsContract;

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

try {
  envSchema = JSON.parse(readFileSync(resolve(process.cwd(), envSchemaPath), "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: envSchemaPath,
      status: "invalid_json"
    },
    1
  );
}

try {
  bindingsContract = JSON.parse(
    readFileSync(resolve(process.cwd(), bindingsContractPath), "utf8")
  );
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: bindingsContractPath,
      status: "invalid_json"
    },
    1
  );
}

const errors = validateContract(contract, envSchema, bindingsContract);

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
    eval_store_binding: evalStoreBindingName,
    event_types: contract.event_types.length,
    sinks: contract.sinks.length,
    status: "ok"
  },
  0
);

function validateContract(value, envValue, bindingValue) {
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
  let evalStoreSink;
  let otlpSink;
  let workerConsoleSink;

  value.sinks.forEach((sink, index) => {
    if (!isRecord(sink)) {
      errors.push(`sinks[${index}] must be an object`);
      return;
    }

    if (typeof sink.name !== "string") {
      errors.push(`sinks[${index}].name must be a string`);
    } else {
      sinks.add(sink.name);

      if (sink.name === "eval_store") {
        evalStoreSink = sink;
      } else if (sink.name === "otlp_destination") {
        otlpSink = sink;
      } else if (sink.name === "worker_console") {
        workerConsoleSink = sink;
      }
    }

    if (!["wired", "planned"].includes(String(sink.status))) {
      errors.push(`sinks[${index}].status must be wired or planned`);
    }

    if (Object.prototype.hasOwnProperty.call(sink, "live_export_enabled")) {
      if (typeof sink.live_export_enabled !== "boolean") {
        errors.push(`sinks[${index}].live_export_enabled must be boolean`);
      }
    }
  });

  for (const sink of requiredSinks) {
    if (!sinks.has(sink)) {
      errors.push(`missing sink ${sink}`);
    }
  }

  errors.push(...validateWorkerConsoleSink(workerConsoleSink));
  errors.push(...validateEvalStoreSink(evalStoreSink, bindingValue));
  errors.push(...validateOtlpSink(otlpSink, envValue));

  return errors;
}

function validateWorkerConsoleSink(sink) {
  const errors = [];

  if (!isRecord(sink)) {
    return ["worker_console sink must be present"];
  }

  if (sink.status !== "wired") {
    errors.push("worker_console sink must be wired");
  }

  if (sink.live_export_enabled !== false) {
    errors.push("worker_console live_export_enabled must be false");
  }

  return errors;
}

function validateEvalStoreSink(sink, bindingValue) {
  const errors = [];

  if (!isRecord(sink)) {
    return ["eval_store sink must be present"];
  }

  if (sink.status !== "planned") {
    errors.push("eval_store must remain planned until a real binding is provisioned");
  }

  if (sink.binding_name !== evalStoreBindingName) {
    errors.push(`eval_store.binding_name must be ${evalStoreBindingName}`);
  }

  if (sink.binding_type !== "d1") {
    errors.push("eval_store.binding_type must be d1");
  }

  if (sink.persistent !== true) {
    errors.push("eval_store.persistent must be true");
  }

  if (sink.writes_enabled !== false) {
    errors.push("eval_store.writes_enabled must be false until live smoke passes");
  }

  if (
    typeof sink.schema_version !== "string" ||
    !sink.schema_version.includes("eval-store")
  ) {
    errors.push("eval_store.schema_version must name the eval-store schema");
  }

  const binding = findBinding(bindingValue, evalStoreBindingName);

  if (!binding) {
    errors.push(`missing Cloudflare binding ${evalStoreBindingName}`);
  } else {
    if (binding.type !== "d1") {
      errors.push(`${evalStoreBindingName} binding type must be d1`);
    }

    if (binding.provisioned !== false) {
      errors.push(`${evalStoreBindingName} must remain unprovisioned in this slice`);
    }
  }

  return errors;
}

function validateOtlpSink(sink, envValue) {
  const errors = [];

  if (!isRecord(sink)) {
    return ["otlp_destination sink must be present"];
  }

  if (sink.status !== "planned") {
    errors.push("otlp_destination must remain planned until live export is configured");
  }

  if (sink.protocol !== "otlp_http") {
    errors.push("otlp_destination.protocol must be otlp_http");
  }

  if (sink.live_export_enabled !== false) {
    errors.push("otlp_destination.live_export_enabled must be false");
  }

  if (!Array.isArray(sink.required_env)) {
    errors.push("otlp_destination.required_env must be an array");
  } else {
    for (const envName of requiredOtlpEnv) {
      if (!sink.required_env.includes(envName)) {
        errors.push(`otlp_destination.required_env must include ${envName}`);
      }
    }
  }

  const envVariables = new Map(
    Array.isArray(envValue?.variables)
      ? envValue.variables
          .filter(isRecord)
          .map((variable) => [variable.name, variable])
      : []
  );

  for (const envName of requiredOtlpEnv) {
    const variable = envVariables.get(envName);

    if (!variable) {
      errors.push(`env schema missing ${envName}`);
      continue;
    }

    if (envName === "OTLP_EXPORTER_OTLP_HEADERS" && variable.secret !== true) {
      errors.push(`${envName} must be marked secret`);
    }
  }

  return errors;
}

function findBinding(value, name) {
  if (!Array.isArray(value?.bindings)) {
    return undefined;
  }

  return value.bindings.find(
    (binding) => isRecord(binding) && binding.name === name
  );
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
