#!/usr/bin/env node
import { randomUUID, createHash } from "node:crypto";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/ingest/hk-ipo-public-held-db-readback.contract.json";
const sourceContractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const packagePath = "package.json";
const workerPath = "apps/worker/src/index.ts";
const testPath = "apps/worker/src/hk-ipo-public-held-db-readback.test.ts";
const wranglerPath = "apps/worker/wrangler.jsonc";
const expectedVersion = "2026-06-28.hk-ipo-public-held-db-readback.v0";
const expectedRoute = "POST /ingest/hk-ipo-public/held-db-readback";
const expectedHeaderValue = "hk-ipo-public-held-db-readback-v1";
const expectedTokenBinding = "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN";
const expectedScript = "node scripts/check-hk-ipo-public-held-db-readback.mjs --check";
const route = "/ingest/hk-ipo-public/held-db-readback";
const args = process.argv.slice(2);
const remote = args.includes("--remote");
const endpoint = optionValue("--endpoint") ?? process.env.AIPHABEE_HK_IPO_PUBLIC_HELD_DB_READBACK_ENDPOINT ?? "http://127.0.0.1:8798";

const contract = readJson(contractPath);
const sourceContract = readJson(sourceContractPath);
const packageJson = readJson(packagePath);
const workerSource = readText(workerPath);
const testSource = readText(testPath);
const wranglerSource = readText(wranglerPath);
const errors = [
  ...validateContract(contract),
  ...validateSourceContract(sourceContract),
  ...validatePackage(packageJson),
  ...validateWorkerSource(workerSource),
  ...validateTestSource(testSource),
  ...validateWranglerSource(wranglerSource),
  ...validateNoSecrets(contract),
  ...validateNoSecrets(sourceContract.held_db_readback ?? {})
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_contract",
      version: expectedVersion
    },
    1
  );
}

if (!remote) {
  emit(
    {
      mode: "local_contract",
      remote_requires_flag: "--remote",
      route: expectedRoute,
      status: "ok",
      version: expectedVersion
    },
    0
  );
}

const token = process.env.AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN?.trim() ?? "";
if (token.length < 16) {
  emit(
    {
      route: expectedRoute,
      status: "missing_apply_token",
      token_binding: expectedTokenBinding,
      version: expectedVersion
    },
    1
  );
}

const response = await fetch(`${endpoint}${route}`, {
  body: JSON.stringify({
    mode: "latest",
    object_store_readback: true
  }),
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-aiphabee-smoke": expectedHeaderValue,
    "x-request-id": `req-hk-ipo-public-held-db-readback-${randomUUID()}`
  },
  method: "POST"
});
const text = await response.text();
const body = JSON.parse(text);
const result = body.held_db_readback_result ?? {};

emit(
  {
    mode: "remote",
    response_hash: prefixedHash("sha256", text),
    route: expectedRoute,
    status: response.ok && body.status === "ok" ? "ok" : "failed",
    summary: {
      data_version_hash: result.data_version_hash,
      detail_hash: result.detail_hash,
      failure_code: result.failure_code,
      failure_stage: result.failure_stage,
      http_status: response.status,
      object_key_count: result.object_key_count,
      object_store_missing_count: result.object_store_missing_count,
      object_store_readback_count: result.object_store_readback_count,
      payload_envelope_count: result.payload_envelope_count,
      raw_snapshot_payload_leak_count: result.raw_snapshot_payload_leak_count,
      readback_hash: result.readback_hash,
      release_state: result.release_state,
      selected_rows: result.selected_rows,
      source_batch_id_hash: result.source_batch_id_hash,
      source_run_id_hash: result.source_run_id_hash,
      status: result.status,
      table_counts: result.table_counts,
      writes_serving_tables: result.writes_serving_tables
    },
    version: expectedVersion
  },
  response.ok && body.status === "ok" ? 0 : 1
);

function validateContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["held DB readback contract must be an object"];

  const expectedFields = {
    checker: "scripts/check-hk-ipo-public-held-db-readback.mjs",
    hyperdrive_binding: "AIPHABEE_HYPERDRIVE",
    object_store_binding: "AIPHABEE_ARTIFACTS",
    package_script: "npm run check:hk-ipo-public-held-db-readback",
    provider: "planetscale_postgres",
    route: expectedRoute,
    source_contract: sourceContractPath,
    status: "local_contract",
    token_binding: expectedTokenBinding,
    version: expectedVersion,
    worker_entrypoint: workerPath
  };

  for (const [field, expected] of Object.entries(expectedFields)) {
    if (value[field] !== expected) validationErrors.push(`${field} must be ${expected}`);
  }

  validationErrors.push(...validateSmokeHeader(value.smoke_header, "smoke_header"));
  validationErrors.push(...validateStringArray(value.target_tables, requiredTables(), "target_tables"));
  validationErrors.push(
    ...validateStringArray(
      value.blocked_tables,
      ["aiphabee_core.ipo_offering", "aiphabee_core.ipo_timetable_event", "aiphabee_core.ipo_narrative", "aiphabee_core.ipo_cornerstone"],
      "blocked_tables"
    )
  );
  validationErrors.push(
    ...validateStringArray(
      value.response_fields,
      [
        "selected_rows",
        "table_counts",
        "payload_envelope_count",
        "raw_snapshot_payload_leak_count",
        "object_key_count",
        "object_store_readback_count",
        "object_store_missing_count",
        "data_version_hash",
        "source_batch_id_hash",
        "source_run_id_hash",
        "readback_hash",
        "query_hash"
      ],
      "response_fields"
    )
  );
  validationErrors.push(...validateSafeOutputPolicy(value.safe_output_policy, "safe_output_policy"));

  for (const field of [
    "read_only_database",
    "latest_live_held_default",
    "specific_run_supported",
    "r2_object_existence_readback",
    "hash_only_response"
  ]) {
    if (value[field] !== true) validationErrors.push(`${field} must be true`);
  }
  for (const field of [
    "writes_database",
    "writes_object_store",
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version",
    "emits_raw_payload"
  ]) {
    if (value[field] !== false) validationErrors.push(`${field} must be false`);
  }

  return validationErrors;
}

function validateSourceContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["source contract must be an object"];
  const readback = value.held_db_readback;
  if (!isRecord(readback)) return ["source contract must include held_db_readback"];

  for (const [field, expected] of Object.entries({
    checker: "scripts/check-hk-ipo-public-held-db-readback.mjs",
    contract: contractPath,
    hyperdrive_binding: "AIPHABEE_HYPERDRIVE",
    object_store_binding: "AIPHABEE_ARTIFACTS",
    package_script: "npm run check:hk-ipo-public-held-db-readback",
    route: expectedRoute,
    token_binding: expectedTokenBinding,
    version: expectedVersion,
    worker_entrypoint: workerPath
  })) {
    if (readback[field] !== expected) {
      validationErrors.push(`source contract held_db_readback.${field} must be ${expected}`);
    }
  }

  validationErrors.push(...validateSmokeHeader(readback.smoke_header, "source contract held_db_readback.smoke_header"));
  validationErrors.push(
    ...validateStringArray(readback.target_tables, requiredTables(), "source contract held_db_readback.target_tables")
  );

  return validationErrors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const validationErrors = [];
  if (scripts["check:hk-ipo-public-held-db-readback"] !== expectedScript) {
    validationErrors.push(`package.json check:hk-ipo-public-held-db-readback must be ${expectedScript}`);
  }
  const rootCheck = String(scripts.check ?? "");
  const smokeIndex = rootCheck.indexOf("npm run check:hk-ipo-public-held-db-apply-smoke");
  const readbackIndex = rootCheck.indexOf("npm run check:hk-ipo-public-held-db-readback");
  const accountRuntimeIndex = rootCheck.indexOf("npm run check:account-runtime");
  if (readbackIndex < 0) validationErrors.push("root check must include check:hk-ipo-public-held-db-readback");
  if (smokeIndex < 0 || readbackIndex < smokeIndex) {
    validationErrors.push("root check must run held DB readback after held DB apply smoke");
  }
  if (accountRuntimeIndex < 0 || readbackIndex > accountRuntimeIndex) {
    validationErrors.push("root check must run held DB readback before account runtime checks");
  }
  return validationErrors;
}

function validateWorkerSource(source) {
  const validationErrors = [];
  for (const text of [
    "HK_IPO_PUBLIC_HELD_DB_READBACK_ROUTE",
    "HK_IPO_PUBLIC_HELD_DB_READBACK_HEADER_VALUE",
    "runHkIpoPublicHeldDbReadback",
    "hk_ipo_public_live_held_rows_readback",
    "select distinct payload->>'object_key'",
    "runtimeR2ObjectExists",
    "production_promotion_enabled: false",
    "writes_serving_tables: false"
  ]) {
    if (!source.includes(text)) validationErrors.push(`worker source must include ${text}`);
  }
  return validationErrors;
}

function validateTestSource(source) {
  const validationErrors = [];
  for (const text of [
    expectedHeaderValue,
    "mock-hk-ipo-held-readback-connection",
    "object_store_readback_count: 1",
    "not.toContain(\"hk-ipo-public/raw-snapshots\")"
  ]) {
    if (!source.includes(text)) validationErrors.push(`test source must include ${text}`);
  }
  return validationErrors;
}

function validateWranglerSource(source) {
  const validationErrors = [];
  if (!source.includes("\"binding\": \"AIPHABEE_ARTIFACTS\"")) {
    validationErrors.push("wrangler config must bind AIPHABEE_ARTIFACTS");
  }
  if (!source.includes("\"bucket_name\": \"aiphabee-artifacts\"")) {
    validationErrors.push("wrangler config must bind aiphabee-artifacts bucket");
  }
  return validationErrors;
}

function validateSmokeHeader(value, label) {
  const validationErrors = [];
  if (!isRecord(value)) return [`${label} must be an object`];
  if (value.name !== "x-aiphabee-smoke") validationErrors.push(`${label}.name must be x-aiphabee-smoke`);
  if (value.value !== expectedHeaderValue) validationErrors.push(`${label}.value must be ${expectedHeaderValue}`);
  return validationErrors;
}

function validateSafeOutputPolicy(value, label) {
  const validationErrors = [];
  if (!isRecord(value)) return [`${label} must be an object`];
  for (const field of [
    "no_database_url",
    "no_password",
    "no_secret",
    "no_raw_payload",
    "no_raw_html",
    "no_source_url",
    "no_security_code",
    "counts_and_hashes_only"
  ]) {
    if (value[field] !== true) validationErrors.push(`${label}.${field} must be true`);
  }
  return validationErrors;
}

function validateStringArray(value, expected, label) {
  const validationErrors = [];
  if (!Array.isArray(value)) return [`${label} must be an array`];
  for (const item of expected) {
    if (!value.includes(item)) validationErrors.push(`${label} missing ${item}`);
  }
  if (value.length !== expected.length) {
    validationErrors.push(`${label} must contain exactly ${expected.length} items`);
  }
  return validationErrors;
}

function requiredTables() {
  return [
    "aiphabee_core.raw_source_batch",
    "aiphabee_core.data_version_batch",
    "aiphabee_core.raw_snapshot",
    "aiphabee_core.hk_ipo_public_source_run",
    "aiphabee_core.hk_ipo_public_observation",
    "aiphabee_core.hk_ipo_public_reconciliation_row",
    "aiphabee_core.hk_ipo_public_supplement_candidate"
  ];
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  return [
    /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
    /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
    /Bearer\s+[A-Za-z0-9._-]{20,}/u,
    /gh[pousr]_[A-Za-z0-9_]{20,}/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ].flatMap((pattern) => (pattern.test(text) ? [`forbidden secret-like pattern ${pattern}`] : []));
}

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
        status: "read_failed"
      },
      1
    );
  }
}

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function prefixedHash(prefix, value) {
  return `${prefix}:${createHash("sha256").update(String(value)).digest("hex")}`;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
