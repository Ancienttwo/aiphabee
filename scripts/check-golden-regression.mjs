#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestRelativePath = "tests/golden/manifest.json";
const manifestPath = resolve(process.cwd(), manifestRelativePath);
const requireFixtures = process.argv.includes("--require-fixtures");

if (!existsSync(manifestPath)) {
  emit(
    {
      manifest: manifestRelativePath,
      message:
        "Golden regression hook is installed; fixture manifest is not committed yet.",
      status: "not_configured"
    },
    requireFixtures ? 1 : 0
  );
}

let manifest;

try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      manifest: manifestRelativePath,
      status: "invalid_json"
    },
    1
  );
}

const errors = validateManifest(manifest);

if (errors.length > 0) {
  emit(
    {
      errors,
      manifest: manifestRelativePath,
      status: "invalid_manifest"
    },
    1
  );
}

emit(
  {
    manifest: manifestRelativePath,
    sample_count: manifest.samples.length,
    status: "ok"
  },
  0
);

function validateManifest(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (!Array.isArray(value.samples) || value.samples.length === 0) {
    errors.push("samples must be a non-empty array");
    return errors;
  }

  const seenIds = new Set();
  const requiredFields = [
    "sample_id",
    "sample_type",
    "methodology_version",
    "quality_expectation"
  ];

  value.samples.forEach((sample, index) => {
    if (!isRecord(sample)) {
      errors.push(`samples[${index}] must be an object`);
      return;
    }

    for (const field of requiredFields) {
      if (typeof sample[field] !== "string" || sample[field].length === 0) {
        errors.push(`samples[${index}].${field} must be a non-empty string`);
      }
    }

    if (!isRecord(sample.expected_outputs)) {
      errors.push(`samples[${index}].expected_outputs must be an object`);
    }

    if (!Array.isArray(sample.source_records)) {
      errors.push(`samples[${index}].source_records must be an array`);
    }

    if (typeof sample.sample_id === "string") {
      if (seenIds.has(sample.sample_id)) {
        errors.push(`samples[${index}].sample_id is duplicated`);
      }

      seenIds.add(sample.sample_id);
    }
  });

  return errors;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
