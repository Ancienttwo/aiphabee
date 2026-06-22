#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/evidence/live-db-write-smoke.contract.json";
const packagePath = "package.json";
const testPath = "apps/worker/src/evidence-live-db-write-smoke.test.ts";
const workerPath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.evidence-live-db-write-smoke.v0";
const expectedScript = "node scripts/check-evidence-live-db-write-smoke-contract.mjs";
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const testSource = readText(testPath);
const workerSource = readText(workerPath);
const errors = [
  ...validateContract(contract),
  ...validatePackage(packageJson),
  ...validateTestSource(testSource),
  ...validateWorkerSource(workerSource),
  ...validateNoSecrets(contract)
];

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
    route: contract.route,
    status: "ok",
    tables: contract.tables
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["evidence live DB write smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-evidence-live-db-write-smoke-contract.mjs",
    default_rights_status: "default_deny",
    hyperdrive_binding: "AIPHABEE_HYPERDRIVE",
    route: "POST /evidence/records/live-db-smoke",
    sample_tool_name: "get_quote_snapshot",
    smoke_token_binding: "AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN",
    status: "local_contract",
    test_file: testPath,
    version: expectedVersion,
    worker_entrypoint: workerPath
  };

  for (const [field, expected] of Object.entries(expectedFields)) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  if (!isRecord(value.smoke_header)) {
    errors.push("smoke_header must be an object");
  } else {
    if (value.smoke_header.name !== "x-aiphabee-smoke") {
      errors.push("smoke_header.name must be x-aiphabee-smoke");
    }

    if (value.smoke_header.value !== "evidence-lineage-live-db-v1") {
      errors.push("smoke_header.value must be evidence-lineage-live-db-v1");
    }
  }

  errors.push(
    ...validateStringArray(
      value.tables,
      ["core.evidence_record", "core.evidence_source_ref"],
      "tables"
    )
  );

  for (const field of [
    "live_db_writes",
    "insert_smoke",
    "select_readback",
    "delete_cleanup",
    "transactional_rollback_on_failure",
    "hash_only_response"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of ["partner_source_rows", "frontend", "production_evidence_persistence"]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "partner_source_rows",
        "production_evidence_persistence",
        "data_owner_source_row_signoff",
        "frontend"
      ],
      "not_claimed"
    )
  );
  errors.push(...validateVerification(value.verification));

  return errors;
}

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const errors = [];
  const expectedCommands = {
    contract_check: "npm run check:evidence-live-db-write-smoke",
    readiness_check: "npm run check:tool-route-replay-readiness",
    unit_test: "npm run test -- apps/worker/src/evidence-live-db-write-smoke.test.ts"
  };

  for (const [field, command] of Object.entries(expectedCommands)) {
    if (value[field] !== command) {
      errors.push(`verification.${field} must be ${command}`);
    }
  }

  return errors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];

  if (scripts["check:evidence-live-db-write-smoke"] !== expectedScript) {
    errors.push(`package.json check:evidence-live-db-write-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const smokeIndex = rootCheck.indexOf("npm run check:evidence-live-db-write-smoke");
  const readinessIndex = rootCheck.indexOf("npm run check:tool-route-replay-readiness");

  if (smokeIndex < 0) {
    errors.push("root check must include check:evidence-live-db-write-smoke");
  }

  if (readinessIndex < 0 || smokeIndex > readinessIndex) {
    errors.push("root check must run evidence live DB write smoke before tool route replay readiness");
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN",
    "evidence-lineage-live-db-v1",
    "missing_hyperdrive_binding",
    "inserted_rows",
    "deleted_rows",
    "source_ref_hashes",
    "mock-hyperdrive-connection-string",
    "not.toContain(rawEvidenceRecordId)",
    "not.toContain(rawSourceRecordId)"
  ]) {
    if (!source.includes(text)) {
      errors.push(`test source must include ${text}`);
    }
  }

  return errors;
}

function validateWorkerSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN",
    "EVIDENCE_LIVE_DB_SMOKE_ROUTE",
    "EVIDENCE_LIVE_DB_SMOKE_HEADER_VALUE",
    "isEvidenceLiveDbWriteSmokeAuthorized",
    "runEvidenceLiveDbWriteSmoke",
    "insert into core.evidence_record",
    "insert into core.evidence_source_ref",
    "delete from core.evidence_source_ref",
    "delete from core.evidence_record",
    "evidence_record_source_ref_insert_select_delete",
    "hashRuntimeSmokeString(evidenceRecord.evidenceRecordId)"
  ]) {
    if (!source.includes(text)) {
      errors.push(`worker source must include ${text}`);
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

  if (new Set(value).size !== value.length) {
    errors.push(`${name} must not contain duplicates`);
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
