#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/ingest/hk-ipo-public-held-db-apply-smoke.contract.json";
const sourceContractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const packagePath = "package.json";
const workerPath = "apps/worker/src/index.ts";
const testPath = "apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts";
const applyPacketScript = "scripts/plan-hk-ipo-public-held-db-apply-packet.mjs";
const expectedVersion = "2026-06-28.hk-ipo-public-held-db-apply-smoke.v0";
const expectedScript = "node scripts/check-hk-ipo-public-held-db-apply-smoke-contract.mjs";
const expectedRoute = "POST /ingest/hk-ipo-public/held-db-apply-smoke";
const expectedHeaderValue = "hk-ipo-public-held-db-apply-v1";
const expectedTokenBinding = "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN";
const requiredTables = [
  "core.raw_source_batch",
  "core.data_version_batch",
  "core.raw_snapshot",
  "core.hk_ipo_public_source_run",
  "core.hk_ipo_public_observation",
  "core.hk_ipo_public_reconciliation_row",
  "core.hk_ipo_public_supplement_candidate"
];
const blockedTables = [
  "core.ipo_offering",
  "core.ipo_timetable_event",
  "core.ipo_narrative",
  "core.ipo_cornerstone"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const sourceContract = readJson(sourceContractPath);
const packageJson = readJson(packagePath);
const workerSource = readText(workerPath);
const testSource = readText(testPath);
const errors = [
  ...validateContract(contract),
  ...validateSourceContract(sourceContract),
  ...validatePackage(packageJson),
  ...validateWorkerSource(workerSource),
  ...validateTestSource(testSource),
  ...validateNoSecrets(contract),
  ...validateNoSecrets(sourceContract.held_db_apply_smoke ?? {})
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
    tables: contract.target_tables,
    token_binding: contract.smoke_token_binding
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["held DB apply smoke contract must be an object"];
  }

  const expectedFields = {
    apply_packet_script: applyPacketScript,
    checker: "scripts/check-hk-ipo-public-held-db-apply-smoke-contract.mjs",
    hyperdrive_binding: "AIPHABEE_HYPERDRIVE",
    package_script: "npm run check:hk-ipo-public-held-db-apply-smoke",
    provider: "planetscale_postgres",
    route: expectedRoute,
    smoke_token_binding: expectedTokenBinding,
    source_contract: sourceContractPath,
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

  errors.push(...validateSmokeHeader(value.smoke_header, "smoke_header"));
  errors.push(...validateStringArray(value.target_tables, requiredTables, "target_tables"));
  errors.push(...validateStringArray(value.blocked_tables, blockedTables, "blocked_tables"));
  errors.push(
    ...validateStringArray(
      value.response_fields,
      [
        "inserted_rows",
        "selected_rows",
        "deleted_rows",
        "cleanup_verified",
        "data_version_hash",
        "source_run_id_hash",
        "raw_snapshot_id_hash",
        "readback_hash",
        "query_hash"
      ],
      "response_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "production_observation_persistence",
        "serving_table_writes",
        "fact_promotion",
        "data_version_release",
        "third_party_canonical_truth"
      ],
      "not_claimed"
    )
  );

  for (const field of [
    "actual_hyperdrive_execution",
    "single_transaction",
    "insert_smoke",
    "select_readback",
    "delete_cleanup",
    "synthetic_only",
    "hash_only_response"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "production_observation_persistence",
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version",
    "third_party_observations_are_canonical"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(...validateSafeOutputPolicy(value.safe_output_policy, "safe_output_policy"));
  errors.push(...validateVerification(value.verification));

  return errors;
}

function validateSourceContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["source contract must be an object"];
  }

  const smoke = value.held_db_apply_smoke;
  if (!isRecord(smoke)) {
    return ["source contract must include held_db_apply_smoke"];
  }

  const expectedFields = {
    aggregate_check_command: "npm run check:hk-ipo-public-sources",
    checker: "scripts/check-hk-ipo-public-held-db-apply-smoke-contract.mjs",
    contract: contractPath,
    hyperdrive_binding: "AIPHABEE_HYPERDRIVE",
    input_apply_packet_script: applyPacketScript,
    package_script: "npm run check:hk-ipo-public-held-db-apply-smoke",
    provider: "planetscale_postgres",
    route: expectedRoute,
    smoke_token_binding: expectedTokenBinding,
    test_file: testPath,
    unit_test_command: "npm run test -- apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts",
    version: expectedVersion,
    worker_entrypoint: workerPath
  };

  for (const [field, expected] of Object.entries(expectedFields)) {
    if (smoke[field] !== expected) {
      errors.push(`source contract held_db_apply_smoke.${field} must be ${expected}`);
    }
  }

  errors.push(...validateSmokeHeader(smoke.smoke_header, "source contract held_db_apply_smoke.smoke_header"));
  errors.push(
    ...validateStringArray(smoke.target_tables, requiredTables, "source contract held_db_apply_smoke.target_tables")
  );
  errors.push(
    ...validateStringArray(smoke.blocked_tables, blockedTables, "source contract held_db_apply_smoke.blocked_tables")
  );

  for (const field of [
    "actual_hyperdrive_execution",
    "single_transaction",
    "insert_smoke",
    "select_readback",
    "delete_cleanup",
    "synthetic_only",
    "hash_only_response"
  ]) {
    if (smoke[field] !== true) {
      errors.push(`source contract held_db_apply_smoke.${field} must be true`);
    }
  }

  for (const field of [
    "production_observation_persistence",
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version",
    "third_party_observations_are_canonical"
  ]) {
    if (smoke[field] !== false) {
      errors.push(`source contract held_db_apply_smoke.${field} must remain false`);
    }
  }

  errors.push(...validateSafeOutputPolicy(smoke.safe_output_policy, "source contract held_db_apply_smoke.safe_output_policy"));

  return errors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];

  if (scripts["check:hk-ipo-public-held-db-apply-smoke"] !== expectedScript) {
    errors.push(`package.json check:hk-ipo-public-held-db-apply-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const packetIndex = rootCheck.indexOf("npm run check:hk-ipo-public-held-db-apply-packet");
  const smokeIndex = rootCheck.indexOf("npm run check:hk-ipo-public-held-db-apply-smoke");
  const accountRuntimeIndex = rootCheck.indexOf("npm run check:account-runtime");

  if (smokeIndex < 0) {
    errors.push("root check must include check:hk-ipo-public-held-db-apply-smoke");
  }

  if (packetIndex < 0 || smokeIndex < packetIndex) {
    errors.push("root check must run held DB apply smoke after held DB apply packet");
  }

  if (accountRuntimeIndex < 0 || smokeIndex > accountRuntimeIndex) {
    errors.push("root check must run held DB apply smoke before account runtime checks");
  }

  return errors;
}

function validateWorkerSource(source) {
  const errors = [];

  for (const text of [
    expectedTokenBinding,
    "HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_ROUTE",
    "HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_HEADER_VALUE",
    "runHkIpoPublicHeldDbApplySmoke",
    "insert into core.raw_source_batch",
    "insert into core.data_version_batch",
    "insert into core.raw_snapshot",
    "insert into core.hk_ipo_public_source_run",
    "insert into core.hk_ipo_public_observation",
    "insert into core.hk_ipo_public_reconciliation_row",
    "insert into core.hk_ipo_public_supplement_candidate",
    "delete from core.hk_ipo_public_supplement_candidate",
    "delete from core.hk_ipo_public_reconciliation_row",
    "delete from core.hk_ipo_public_observation",
    "delete from core.hk_ipo_public_source_run",
    "delete from core.raw_snapshot",
    "delete from core.data_version_batch",
    "delete from core.raw_source_batch",
    "production_promotion_enabled: false",
    "writes_serving_tables: false",
    "hk_ipo_public_held_rows_insert_select_delete",
    "hashRuntimeSmokeString(dataVersion)"
  ]) {
    if (!source.includes(text)) {
      errors.push(`worker source must include ${text}`);
    }
  }

  for (const blockedTable of blockedTables) {
    if (source.includes(`insert into ${blockedTable}`) || source.includes(`delete from ${blockedTable}`)) {
      errors.push(`worker source must not write ${blockedTable}`);
    }
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    expectedTokenBinding,
    expectedHeaderValue,
    "mock-hk-ipo-held-db-connection",
    "insert into core.raw_source_batch",
    "insert into core.data_version_batch",
    "insert into core.raw_snapshot",
    "insert into core.hk_ipo_public_source_run",
    "insert into core.hk_ipo_public_observation",
    "insert into core.hk_ipo_public_reconciliation_row",
    "insert into core.hk_ipo_public_supplement_candidate",
    "delete from core.hk_ipo_public_supplement_candidate",
    "delete from core.hk_ipo_public_reconciliation_row",
    "delete from core.hk_ipo_public_observation",
    "delete from core.hk_ipo_public_source_run",
    "delete from core.raw_snapshot",
    "delete from core.data_version_batch",
    "delete from core.raw_source_batch",
    "not.toContain(rawSourceBatchId)",
    "not.toContain(rawSourceRecordId)",
    "not.toContain(rawSourceRunId)",
    "not.toContain(rawObservationId)",
    "not.toContain(\"https://www.aastocks.com\")",
    "not.toContain(\"09999.HK\")"
  ]) {
    if (!source.includes(text)) {
      errors.push(`test source must include ${text}`);
    }
  }

  return errors;
}

function validateSmokeHeader(value, label) {
  const errors = [];

  if (!isRecord(value)) {
    return [`${label} must be an object`];
  }

  if (value.name !== "x-aiphabee-smoke") {
    errors.push(`${label}.name must be x-aiphabee-smoke`);
  }

  if (value.value !== expectedHeaderValue) {
    errors.push(`${label}.value must be ${expectedHeaderValue}`);
  }

  return errors;
}

function validateSafeOutputPolicy(value, label) {
  const errors = [];

  if (!isRecord(value)) {
    return [`${label} must be an object`];
  }

  for (const field of [
    "no_database_url",
    "no_password",
    "no_secret",
    "no_raw_payload",
    "no_sql_text",
    "counts_and_hashes_only"
  ]) {
    if (value[field] !== true) {
      errors.push(`${label}.${field} must be true`);
    }
  }

  return errors;
}

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const errors = [];
  const expectedCommands = {
    aggregate_public_source_check: "npm run check:hk-ipo-public-sources",
    contract_check: "npm run check:hk-ipo-public-held-db-apply-smoke",
    unit_test: "npm run test -- apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts"
  };

  for (const [field, command] of Object.entries(expectedCommands)) {
    if (value[field] !== command) {
      errors.push(`verification.${field} must be ${command}`);
    }
  }

  return errors;
}

function validateStringArray(value, expected, label) {
  const errors = [];

  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  for (const item of expected) {
    if (!value.includes(item)) {
      errors.push(`${label} missing ${item}`);
    }
  }

  if (value.length !== expected.length) {
    errors.push(`${label} must contain exactly ${expected.length} items`);
  }

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(text)) {
      errors.push(`contract contains forbidden secret-like text: ${pattern}`);
    }
  }

  return errors;
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(path), "utf8");
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
