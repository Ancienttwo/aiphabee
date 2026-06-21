#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const schemaPath = resolve(root, "deploy/env/env.schema.json");
const templatePaths = [
  "deploy/env/.env.example",
  "deploy/env/dev.env.example",
  "deploy/env/staging.env.example",
  "deploy/env/prod.env.example"
];

let schema;

try {
  schema = JSON.parse(readFileSync(schemaPath, "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: "deploy/env/env.schema.json",
      status: "invalid_schema_json"
    },
    1
  );
}

const errors = validateSchema(schema);
const expectedNames = schema.variables.map((variable) => variable.name);

for (const relativePath of templatePaths) {
  errors.push(...validateTemplate(relativePath, expectedNames));
}

if (errors.length > 0) {
  emit(
    {
      errors,
      status: "invalid_env_contract"
    },
    1
  );
}

emit(
  {
    files: templatePaths.length,
    secret_variables: schema.variables.filter((variable) => variable.secret)
      .length,
    status: "ok",
    variables: schema.variables.length
  },
  0
);

function validateSchema(value) {
  const schemaErrors = [];

  if (!isRecord(value)) {
    return ["schema must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    schemaErrors.push("schema.version must be a non-empty string");
  }

  if (!Array.isArray(value.variables) || value.variables.length === 0) {
    schemaErrors.push("schema.variables must be a non-empty array");
    return schemaErrors;
  }

  const seen = new Set();

  value.variables.forEach((variable, index) => {
    if (!isRecord(variable)) {
      schemaErrors.push(`variables[${index}] must be an object`);
      return;
    }

    if (typeof variable.name !== "string" || !/^[A-Z0-9_]+$/.test(variable.name)) {
      schemaErrors.push(`variables[${index}].name must be UPPER_SNAKE_CASE`);
    } else if (seen.has(variable.name)) {
      schemaErrors.push(`variables[${index}].name is duplicated`);
    } else {
      seen.add(variable.name);
    }

    if (typeof variable.secret !== "boolean") {
      schemaErrors.push(`variables[${index}].secret must be boolean`);
    }

    if (
      !Array.isArray(variable.environments) ||
      variable.environments.join(",") !== "dev,staging,prod"
    ) {
      schemaErrors.push(
        `variables[${index}].environments must be ["dev","staging","prod"]`
      );
    }
  });

  return schemaErrors;
}

function validateTemplate(relativePath, expectedNames) {
  const templateErrors = [];
  const body = readFileSync(resolve(root, relativePath), "utf8");
  const entries = [];

  body.split(/\r?\n/u).forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      templateErrors.push(`${relativePath}:${index + 1} must use KEY= format`);
      return;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);

    if (value.length > 0) {
      templateErrors.push(`${relativePath}:${index + 1} must not contain a value`);
    }

    entries.push(key);
  });

  const seen = new Set();

  for (const entry of entries) {
    if (seen.has(entry)) {
      templateErrors.push(`${relativePath} contains duplicate ${entry}`);
    }

    seen.add(entry);
  }

  const sortedEntries = [...entries].sort();
  const sortedExpected = [...expectedNames].sort();

  if (sortedEntries.join("\n") !== sortedExpected.join("\n")) {
    templateErrors.push(`${relativePath} does not match env.schema.json`);
  }

  return templateErrors;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
