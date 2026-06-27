#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

class MemoryR2Bucket {
  #values = new Map();

  put(key, value) {
    this.#values.set(key, value);
  }

  get(key) {
    return this.#values.get(key) ?? null;
  }

  delete(key) {
    this.#values.delete(key);
  }
}

const WRITER_VERSION = "2026-06-28.hk-ipo-public-raw-snapshot-r2-writer-smoke.v0";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const cloudflareContractPath = "deploy/cloudflare/resource-smoke-readiness.contract.json";
const fixturePath = "skills/hkex-news-crawl-qa/evals/public-source-observation-fixtures.json";
const storageScript = "scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs";
const args = process.argv.slice(2);
const live = args.includes("--live");
const remote = args.includes("--remote");
const check = args.includes("--check");
const dryRun = args.includes("--dry-run");
const errors = [];

const contract = readJson(contractPath);
const cloudflareContract = readJson(cloudflareContractPath);

if (dryRun) {
  emit(
    {
      fixture_command: "npm run check:hk-ipo-public-raw-snapshot-r2-writer",
      live_command: "node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --check",
      mode: "dry_run",
      remote_command: "node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --remote --check",
      remote_requires_flag: "--remote",
      status: "ready_no_network",
      version: WRITER_VERSION
    },
    0
  );
}

const storagePlan = runJsonScript(storageScript, [live ? "--live" : "--fixtures"]);
if (storagePlan.status !== "ok") {
  errors.push("raw snapshot storage plan failed");
}

const writerPlan = await buildWriterPlan({ cloudflareContract, contract, storagePlan });
if (check) {
  errors.push(...validateWriterPlan(writerPlan, storagePlan, contract, cloudflareContract));
}

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      plan: summarizeWriterPlan(writerPlan),
      remote,
      status: "invalid_hk_ipo_public_raw_snapshot_r2_writer_smoke",
      version: WRITER_VERSION
    },
    1
  );
}

emit(check ? summarizeWriterPlan(writerPlan) : writerPlan, 0);

async function buildWriterPlan({ cloudflareContract: cloudflareValue, contract: value, storagePlan: plan }) {
  const writerContract = value.raw_snapshot_r2_writer_smoke ?? {};
  const bucketName =
    writerContract.bucket_hint ??
    cloudflareValue.partial_provisioning?.resource_names?.r2_bucket ??
    "aiphabee-artifacts";
  const storageObjectPlans = plan.raw_snapshot_object_write_plans ?? [];
  const payloadBySourceKey = await loadPayloads(storageObjectPlans);
  const objectPlans = live
    ? objectPlansForCurrentPayloads(storageObjectPlans, payloadBySourceKey)
    : storageObjectPlans;
  const objectWriteResults = [];
  const mockBucket = new MemoryR2Bucket();

  for (const objectPlan of objectPlans) {
    const sourceKey = sourceKeyFor(objectPlan);
    const payloadText = payloadBySourceKey.get(sourceKey);
    if (typeof payloadText !== "string") {
      objectWriteResults.push(failedObjectResult(objectPlan, "payload_source_missing", "payload source missing"));
      continue;
    }

    const payloadHash = prefixedHash("sha256", payloadText);
    const payloadBytes = Buffer.byteLength(payloadText, "utf8");
    if (payloadHash !== objectPlan.payload_hash_sha256) {
      objectWriteResults.push(
        failedObjectResult(objectPlan, "payload_hash_mismatch", "payload hash did not match storage plan", {
          payload_bytes: payloadBytes,
          value_hash: payloadHash
        })
      );
      continue;
    }

    const result = remote
      ? smokeRemoteR2Object({ bucketName, objectPlan, payloadText })
      : smokeMockR2Object({ bucket: mockBucket, objectPlan, payloadText });
    objectWriteResults.push(result);
  }

  const failedCount = objectWriteResults.filter((result) => result.status !== "passed").length;

  return {
    canonical_source: "hkex_news",
    default_remote_object_store_writes: false,
    emits_payload_text: false,
    generated_at: new Date().toISOString(),
    mode: live ? "live" : "fixtures",
    object_write_results: objectWriteResults,
    promotes_facts: false,
    remote_object_store_writes: remote,
    remote_requires_flag: "--remote",
    source_storage_version: plan.version,
    status: failedCount === 0 ? "ok" : "failed",
    storage_binding: plan.storage_binding,
    storage_target: plan.storage_target,
    stores_raw_html_in_repo: false,
    summary: {
      cleanup_delete_count: objectWriteResults.filter((result) => result.cleanup_status === "deleted").length,
      failed_write_count: failedCount,
      mock_object_store_write_count: remote ? 0 : objectWriteResults.filter((result) => result.status === "passed").length,
      object_key_count: objectPlans.length,
      payload_body_output_count: 0,
      payload_hash_match_count: objectWriteResults.filter((result) => result.payload_hash_matched).length,
      readback_count: objectWriteResults.filter((result) => result.readback_status === "matched").length,
      remote_object_store_write_count: remote ? objectWriteResults.filter((result) => result.status === "passed").length : 0,
      storage_ref_count: plan.summary?.payload_envelope_count ?? 0,
      write_attempt_count: objectWriteResults.length,
      writes_database_count: 0,
      writes_repo_file_count: 0
    },
    target_binding: "AIPHABEE_ARTIFACTS",
    target_bucket_hint: bucketName,
    version: WRITER_VERSION,
    writes_database: false,
    writes_repo_files: false
  };
}

async function loadPayloads(objectPlans) {
  if (!live) {
    const fixtures = readJson(fixturePath);
    return new Map(
      (fixtures.fixtures ?? []).map((fixture) => [`${fixture.source_id}:${fixture.source_url}`, fixture.html])
    );
  }

  const uniqueSourceKeys = [...new Set(objectPlans.map(sourceKeyFor))];
  const payloads = new Map();
  for (const sourceKey of uniqueSourceKeys) {
    const [, sourceUrl] = sourceKey.split(/:(.+)/u);
    const response = await fetchText(sourceUrl);
    if (response.status_code !== 200) {
      errors.push(`${sourceKey} expected HTTP 200, got ${response.status_code}`);
      continue;
    }
    payloads.set(sourceKey, response.text);
  }
  return payloads;
}

function smokeMockR2Object({ bucket, objectPlan, payloadText }) {
  const valueHash = prefixedHash("sha256", payloadText);

  bucket.put(objectPlan.object_key, payloadText);
  const readValue = bucket.get(objectPlan.object_key);
  const readbackHash = readValue === null ? null : prefixedHash("sha256", readValue);
  bucket.delete(objectPlan.object_key);

  return {
    binding_name: "AIPHABEE_ARTIFACTS",
    cleanup_status: bucket.get(objectPlan.object_key) === null ? "deleted" : "not_deleted",
    content_type: objectPlan.content_type,
    object_key_hash: prefixedHash("object_key", objectPlan.object_key),
    operation_count: 3,
    payload_bytes: Buffer.byteLength(payloadText, "utf8"),
    payload_body_output: false,
    payload_hash_matched: valueHash === objectPlan.payload_hash_sha256,
    readback_hash: readbackHash,
    readback_status: readbackHash === objectPlan.payload_hash_sha256 ? "matched" : "mismatch",
    remote_object_store_write: false,
    source_id: objectPlan.source_id,
    status: readbackHash === objectPlan.payload_hash_sha256 ? "passed" : "failed",
    surface: "hk_ipo_public_raw_snapshot_r2_writer_mock",
    value_hash: valueHash,
    writes_database: false,
    writes_repo_files: false
  };
}

function smokeRemoteR2Object({ bucketName, objectPlan, payloadText }) {
  const dir = mkdtempSync(join(tmpdir(), "aiphabee-hk-ipo-r2-writer-"));
  const putPath = join(dir, "put.html");
  const getPath = join(dir, "get.html");
  const remoteWriteKey = smokeRemoteObjectKeyFor(objectPlan.object_key);
  const objectPath = `${bucketName}/${remoteWriteKey}`;
  const valueHash = prefixedHash("sha256", payloadText);

  try {
    writeFileSync(putPath, payloadText);
    runWrangler(["r2", "object", "put", objectPath, "--file", putPath, "--remote", "--force"]);
    runWrangler(["r2", "object", "get", objectPath, "--file", getPath, "--remote"]);
    const readValue = readFileSync(getPath, "utf8");
    const readbackHash = prefixedHash("sha256", readValue);
    runWrangler(["r2", "object", "delete", objectPath, "--remote"]);

    return {
      binding_name: "AIPHABEE_ARTIFACTS",
      cleanup_status: "deleted",
      content_type: objectPlan.content_type,
      object_key_hash: prefixedHash("object_key", objectPlan.object_key),
      operation_count: 3,
      payload_bytes: Buffer.byteLength(payloadText, "utf8"),
      payload_body_output: false,
      payload_hash_matched: valueHash === objectPlan.payload_hash_sha256,
      readback_hash: readbackHash,
      readback_status: readbackHash === objectPlan.payload_hash_sha256 ? "matched" : "mismatch",
      remote_write_key_hash: prefixedHash("object_key", remoteWriteKey),
      remote_object_store_write: true,
      source_id: objectPlan.source_id,
      status: readbackHash === objectPlan.payload_hash_sha256 ? "passed" : "failed",
      surface: "hk_ipo_public_raw_snapshot_r2_writer_remote",
      value_hash: valueHash,
      writes_database: false,
      writes_repo_files: false
    };
  } catch (error) {
    runWrangler(["r2", "object", "delete", objectPath, "--remote"], { allowFailure: true });
    return failedObjectResult(
      objectPlan,
      "r2_remote_command_failed",
      error instanceof Error ? error.message : String(error),
      {
        remote_object_store_write: true,
        value_hash: valueHash
      }
    );
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}

function smokeRemoteObjectKeyFor(plannedObjectKey) {
  return [
    "hk-ipo-public",
    "raw-snapshot-writer-smoke",
    `${stableHash(plannedObjectKey)}.html`
  ].join("/");
}

function failedObjectResult(objectPlan, failureCode, detail, extra = {}) {
  return {
    binding_name: "AIPHABEE_ARTIFACTS",
    cleanup_status: "not_started",
    content_type: objectPlan.content_type ?? null,
    detail_hash: prefixedHash("detail", detail),
    failure_code: failureCode,
    object_key_hash: objectPlan.object_key_hash ?? null,
    operation_count: 0,
    payload_body_output: false,
    payload_hash_matched: false,
    readback_status: "not_read",
    remote_object_store_write: false,
    source_id: objectPlan.source_id ?? null,
    status: "failed",
    surface: remote ? "hk_ipo_public_raw_snapshot_r2_writer_remote" : "hk_ipo_public_raw_snapshot_r2_writer_mock",
    writes_database: false,
    writes_repo_files: false,
    ...extra
  };
}

function objectPlansForCurrentPayloads(objectPlans, payloadBySourceKey) {
  return objectPlans.map((objectPlan) => {
    const payloadText = payloadBySourceKey.get(sourceKeyFor(objectPlan));
    if (typeof payloadText !== "string") {
      return objectPlan;
    }
    const payloadHash = prefixedHash("sha256", payloadText);
    const objectKey = objectKeyForCurrentPayload(objectPlan.source_id, payloadHash);
    return {
      ...objectPlan,
      object_key: objectKey,
      object_key_hash: prefixedHash("object_key", objectKey),
      payload_bytes: Buffer.byteLength(payloadText, "utf8"),
      payload_hash_sha256: payloadHash
    };
  });
}

function objectKeyForCurrentPayload(sourceId, payloadHash) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    "hk-ipo-public",
    "raw-snapshots",
    safeKeyPart(sourceId),
    date,
    `${String(payloadHash).replace(/^sha256:/u, "")}.html`
  ].join("/");
}

function safeKeyPart(value) {
  return String(value ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "unknown";
}

function validateWriterPlan(plan, storagePlan, value, cloudflareValue) {
  const validationErrors = [];
  const writerContract = value.raw_snapshot_r2_writer_smoke ?? {};
  const expectedBucket = cloudflareValue.partial_provisioning?.resource_names?.r2_bucket ?? "aiphabee-artifacts";

  if (writerContract.version !== WRITER_VERSION) validationErrors.push("raw_snapshot_r2_writer_smoke.version mismatch");
  if (writerContract.script !== "scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.script mismatch");
  }
  if (writerContract.input_storage_script !== storageScript) {
    validationErrors.push(`raw_snapshot_r2_writer_smoke.input_storage_script must be ${storageScript}`);
  }
  if (writerContract.storage_binding !== "AIPHABEE_ARTIFACTS") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.storage_binding must be AIPHABEE_ARTIFACTS");
  }
  if (writerContract.bucket_hint !== expectedBucket) {
    validationErrors.push("raw_snapshot_r2_writer_smoke.bucket_hint must match Cloudflare R2 resource name");
  }
  for (const field of [
    "writes_database",
    "writes_repo_files",
    "emits_payload_text",
    "stores_raw_html_in_repo",
    "promotes_facts",
    "default_remote_object_store_writes"
  ]) {
    if (plan[field] !== false) validationErrors.push(`writer plan ${field} must be false`);
    if (writerContract[field] !== false) validationErrors.push(`raw_snapshot_r2_writer_smoke.${field} must be false`);
  }
  if (writerContract.remote_object_store_writes_requires_remote_flag !== true) {
    validationErrors.push("raw_snapshot_r2_writer_smoke.remote_object_store_writes_requires_remote_flag must be true");
  }
  if (writerContract.delete_after_readback !== true) {
    validationErrors.push("raw_snapshot_r2_writer_smoke.delete_after_readback must be true");
  }
  if (plan.status !== "ok") validationErrors.push("writer plan must pass");
  if (plan.summary.object_key_count !== (storagePlan.raw_snapshot_object_write_plans ?? []).length) {
    validationErrors.push("writer object key count mismatch");
  }
  if (plan.summary.storage_ref_count !== storagePlan.summary?.payload_envelope_count) {
    validationErrors.push("writer storage ref count mismatch");
  }
  if (plan.summary.write_attempt_count !== plan.summary.object_key_count) {
    validationErrors.push("writer must attempt each unique object key");
  }
  if (plan.summary.payload_hash_match_count !== plan.summary.object_key_count) {
    validationErrors.push("writer payload hash match count mismatch");
  }
  if (plan.summary.readback_count !== plan.summary.object_key_count) {
    validationErrors.push("writer readback count mismatch");
  }
  if (plan.summary.cleanup_delete_count !== plan.summary.object_key_count) {
    validationErrors.push("writer cleanup count mismatch");
  }
  if (plan.summary.payload_body_output_count !== 0) validationErrors.push("writer must not output payload body");
  if (plan.summary.writes_database_count !== 0) validationErrors.push("writer must not write database");
  if (plan.summary.writes_repo_file_count !== 0) validationErrors.push("writer must not write repo files");
  if (!remote && plan.summary.remote_object_store_write_count !== 0) {
    validationErrors.push("non-remote writer check must not write remote object store");
  }
  if (remote && plan.summary.remote_object_store_write_count !== plan.summary.object_key_count) {
    validationErrors.push("remote writer check must write each object key before cleanup");
  }
  for (const row of plan.object_write_results ?? []) {
    if (row.status !== "passed") validationErrors.push(`${row.object_key_hash} writer smoke failed`);
    if (row.payload_body_output !== false) validationErrors.push(`${row.object_key_hash} must not output payload body`);
    if (row.writes_database !== false || row.writes_repo_files !== false) {
      validationErrors.push(`${row.object_key_hash} must not write database or repo files`);
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(String(row.value_hash))) {
      validationErrors.push(`${row.object_key_hash} missing value hash`);
    }
    if (containsRawPayloadText(row)) {
      validationErrors.push(`${row.object_key_hash} includes raw payload text`);
    }
  }
  return validationErrors;
}

function summarizeWriterPlan(plan) {
  return {
    canonical_source: plan.canonical_source,
    default_remote_object_store_writes: plan.default_remote_object_store_writes,
    emits_payload_text: plan.emits_payload_text,
    mode: plan.mode,
    promotes_facts: plan.promotes_facts,
    remote_object_store_writes: plan.remote_object_store_writes,
    remote_requires_flag: plan.remote_requires_flag,
    status: plan.status,
    storage_binding: plan.storage_binding,
    storage_target: plan.storage_target,
    stores_raw_html_in_repo: plan.stores_raw_html_in_repo,
    summary: plan.summary,
    target_binding: plan.target_binding,
    target_bucket_hint: plan.target_bucket_hint,
    version: plan.version,
    writes_database: plan.writes_database,
    writes_repo_files: plan.writes_repo_files
  };
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AiphaBeePublicRawSnapshotWriter/0.1"
      },
      signal: AbortSignal.timeout(20000)
    });
    return {
      status_code: response.status,
      text: await response.text()
    };
  } catch (error) {
    return {
      status_code: 0,
      text: `FETCH_ERROR:${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function runJsonScript(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  if (result.status !== 0) {
    errors.push(`${script} failed: ${result.stderr || result.stdout}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    errors.push(`${script} did not emit JSON`);
    return { status: "invalid_json" };
  }
}

function runWrangler(wranglerArgs, options = {}) {
  const result = spawnSync("npx", ["wrangler", ...wranglerArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: options.input ?? undefined,
    maxBuffer: 8 * 1024 * 1024
  });
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(result.stderr || result.stdout || `wrangler failed: ${wranglerArgs.join(" ")}`);
  }
  return result;
}

function sourceKeyFor(value) {
  return `${value.source_id}:${value.source_url}`;
}

function containsRawPayloadText(value) {
  return /<html|<body|__NUXT__|<script|<\/script>/iu.test(JSON.stringify(value));
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

function prefixedHash(prefix, value) {
  return `${prefix}:${stableHash(value)}`;
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
