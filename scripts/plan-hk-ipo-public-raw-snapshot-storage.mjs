#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const STORAGE_VERSION = "2026-06-28.hk-ipo-public-raw-snapshot-storage.v0";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const captureScript = "scripts/capture-hk-ipo-public-raw-snapshots.mjs";
const args = process.argv.slice(2);
const live = args.includes("--live");
const check = args.includes("--check");
const errors = [];

const contract = readJson(contractPath);
const capturePlan = runJsonScript(captureScript, [live ? "--live" : "--fixtures"]);

if (capturePlan.status !== "ok") {
  errors.push("raw snapshot capture plan failed");
}

const storagePlan = buildStoragePlan({ capturePlan, contract });
if (check) {
  errors.push(...validateStoragePlan(storagePlan, capturePlan, contract));
}

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      plan: summarizeStoragePlan(storagePlan),
      status: "invalid_hk_ipo_public_raw_snapshot_storage",
      version: STORAGE_VERSION
    },
    1
  );
}

emit(check ? summarizeStoragePlan(storagePlan) : storagePlan, 0);

function buildStoragePlan({ capturePlan: plan, contract: value }) {
  const storageContract = value.raw_snapshot_storage ?? {};
  const storageBinding = storageContract.storage_binding ?? "AIPHABEE_ARTIFACTS";
  const bucketHint = storageContract.bucket_hint ?? "aiphabee-artifacts";
  const captures = plan.raw_snapshot_captures ?? [];
  const objectWritePlanByKey = new Map();
  const rawSnapshotStorageRefs = captures.map((capture) => {
    const objectKey = objectKeyFor(capture);
    const envelope = payloadEnvelopeFor(capture, {
      bucketHint,
      objectKey,
      storageBinding
    });
    const objectWritePlan = {
      bucket_hint: bucketHint,
      content_type: capture.content_type,
      object_key: objectKey,
      object_key_hash: prefixedHash("object_key", objectKey),
      payload_body_included: false,
      payload_bytes: capture.payload_bytes,
      payload_hash_sha256: capture.payload_hash_sha256,
      raw_html_included: false,
      source_id: capture.source_id,
      source_url: capture.source_url,
      storage_binding: storageBinding,
      storage_target: "external_raw_snapshot_store",
      store_kind: "cloudflare_r2_artifact_binding",
      writes_files: false,
      writes_object_store: false
    };
    objectWritePlanByKey.set(objectKey, objectWritePlan);
    return {
      bucket_hint: bucketHint,
      content_type: capture.content_type,
      object_key: objectKey,
      object_key_hash: prefixedHash("object_key", objectKey),
      payload_body_included: false,
      payload_bytes: capture.payload_bytes,
      payload_envelope: envelope,
      payload_envelope_hash_sha256: prefixedHash("sha256", envelope),
      payload_hash_sha256: capture.payload_hash_sha256,
      provider: capture.provider,
      raw_html_included: false,
      raw_snapshot_capture_id: capture.raw_snapshot_capture_id,
      raw_snapshot_id: capture.raw_snapshot_id,
      raw_snapshot_request_id: capture.raw_snapshot_request_id,
      raw_snapshot_storage_ref_id: `rssr_hk_ipo_public_${stableHash({
        object_key: objectKey,
        raw_snapshot_capture_id: capture.raw_snapshot_capture_id
      }).slice(0, 24)}`,
      ready_for_object_store_write: capture.ready_for_external_snapshot_store === true,
      ready_for_sql_payload: capture.ready_for_external_snapshot_store === true,
      record_kind: "hk_ipo_public_source_record",
      source_id: capture.source_id,
      source_record_id: capture.source_record_id,
      source_url: capture.source_url,
      storage_binding: storageBinding,
      storage_target: "external_raw_snapshot_store",
      store_kind: "cloudflare_r2_artifact_binding",
      target_table: "core.raw_snapshot",
      writes_database: false,
      writes_files: false,
      writes_object_store: false
    };
  });
  const objectWritePlans = [...objectWritePlanByKey.values()].sort((left, right) =>
    left.object_key.localeCompare(right.object_key)
  );

  return {
    canonical_source: "hkex_news",
    capture_version: plan.version,
    emits_payload_text: false,
    generated_at: new Date().toISOString(),
    mode: live ? "live" : "fixtures",
    promotes_facts: false,
    raw_snapshot_object_write_plans: objectWritePlans,
    raw_snapshot_storage_refs: rawSnapshotStorageRefs,
    status: "ok",
    storage_binding: storageBinding,
    storage_target: "external_raw_snapshot_store",
    stores_raw_html_in_repo: false,
    summary: {
      capture_count: captures.length,
      missing_payload_envelope_count: rawSnapshotStorageRefs.filter((row) => !row.payload_envelope).length,
      object_key_count: objectWritePlans.length,
      payload_bodies_emitted_count: rawSnapshotStorageRefs.filter((row) => row.payload_body_included).length,
      payload_envelope_count: rawSnapshotStorageRefs.length,
      payload_envelope_hash_count: rawSnapshotStorageRefs.filter((row) => Boolean(row.payload_envelope_hash_sha256)).length,
      raw_snapshot_request_count: captures.length,
      ready_for_object_store_write_count: rawSnapshotStorageRefs.filter((row) => row.ready_for_object_store_write).length,
      ready_for_sql_payload_count: rawSnapshotStorageRefs.filter((row) => row.ready_for_sql_payload).length,
      raw_html_included_count: rawSnapshotStorageRefs.filter((row) => row.raw_html_included).length,
      writes_object_store_count: rawSnapshotStorageRefs.filter((row) => row.writes_object_store).length
    },
    target_table: "core.raw_snapshot",
    version: STORAGE_VERSION,
    writes_database: false,
    writes_files: false,
    writes_object_store: false
  };
}

function payloadEnvelopeFor(capture, { bucketHint, objectKey, storageBinding }) {
  return {
    bucket_hint: bucketHint,
    captured_at: capture.captured_at,
    content_type: capture.content_type,
    object_key: objectKey,
    object_key_hash: prefixedHash("object_key", objectKey),
    payload_body_included: false,
    payload_bytes: capture.payload_bytes,
    payload_hash_sha256: capture.payload_hash_sha256,
    raw_html_included: false,
    raw_snapshot_capture_id: capture.raw_snapshot_capture_id,
    raw_snapshot_request_id: capture.raw_snapshot_request_id,
    source_id: capture.source_id,
    source_record_id: capture.source_record_id,
    source_url: capture.source_url,
    storage_binding: storageBinding,
    storage_target: "external_raw_snapshot_store",
    store_kind: "cloudflare_r2_artifact_binding",
    version: STORAGE_VERSION
  };
}

function validateStoragePlan(plan, capturePlan, value) {
  const validationErrors = [];
  const captures = capturePlan.raw_snapshot_captures ?? [];
  const storageContract = value.raw_snapshot_storage ?? {};
  const captureIds = new Set(captures.map((capture) => capture.raw_snapshot_capture_id));
  const requestIds = new Set(captures.map((capture) => capture.raw_snapshot_request_id));
  const objectKeys = new Set();

  if (storageContract.version !== STORAGE_VERSION) {
    validationErrors.push("raw_snapshot_storage.version mismatch");
  }
  if (storageContract.script !== "scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs") {
    validationErrors.push("raw_snapshot_storage.script mismatch");
  }
  if (storageContract.input_capture_script !== captureScript) {
    validationErrors.push(`raw_snapshot_storage.input_capture_script must be ${captureScript}`);
  }
  if (storageContract.storage_binding !== plan.storage_binding) {
    validationErrors.push("raw_snapshot_storage.storage_binding mismatch");
  }
  for (const field of [
    "writes_database",
    "writes_files",
    "writes_object_store",
    "stores_raw_html_in_repo",
    "emits_payload_text",
    "promotes_facts"
  ]) {
    if (plan[field] !== false) validationErrors.push(`storage plan ${field} must be false`);
    if (storageContract[field] !== false) validationErrors.push(`raw_snapshot_storage.${field} must be false`);
  }
  if (plan.version !== STORAGE_VERSION) validationErrors.push("storage plan version mismatch");
  if (plan.canonical_source !== "hkex_news") validationErrors.push("storage plan canonical_source must be hkex_news");
  if (plan.target_table !== "core.raw_snapshot") validationErrors.push("storage plan target_table must be core.raw_snapshot");
  if (plan.summary.capture_count !== captures.length) validationErrors.push("storage capture count mismatch");
  if (plan.summary.raw_snapshot_request_count !== captures.length) validationErrors.push("storage request count mismatch");
  if (plan.summary.payload_envelope_count !== captures.length) validationErrors.push("storage envelope count mismatch");
  if (plan.summary.payload_envelope_hash_count !== captures.length) validationErrors.push("storage envelope hash count mismatch");
  if (plan.summary.ready_for_sql_payload_count !== captures.length) validationErrors.push("storage must make each capture SQL payload ready");
  if (plan.summary.ready_for_object_store_write_count !== captures.length) {
    validationErrors.push("storage must make each capture object-store-write ready");
  }
  if (plan.summary.payload_bodies_emitted_count !== 0) validationErrors.push("storage plan must not emit payload body");
  if (plan.summary.raw_html_included_count !== 0) validationErrors.push("storage plan must not include raw HTML");
  if (plan.summary.writes_object_store_count !== 0) validationErrors.push("storage plan must not write object store");
  if (plan.summary.missing_payload_envelope_count !== 0) validationErrors.push("storage plan missing payload envelope");

  for (const row of plan.raw_snapshot_storage_refs ?? []) {
    objectKeys.add(row.object_key);
    if (!captureIds.has(row.raw_snapshot_capture_id)) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} references missing capture`);
    }
    if (!requestIds.has(row.raw_snapshot_request_id)) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} references missing request`);
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(String(row.payload_hash_sha256))) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} missing payload hash`);
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(String(row.payload_envelope_hash_sha256))) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} missing envelope hash`);
    }
    if (row.payload_bytes <= 0) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} must include positive payload bytes`);
    }
    if (row.payload_body_included !== false || row.raw_html_included !== false) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} must not include raw payload`);
    }
    if (row.ready_for_sql_payload !== true) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} must be SQL payload ready`);
    }
    if (row.writes_database !== false || row.writes_files !== false || row.writes_object_store !== false) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} must remain no-write`);
    }
    if (containsRawPayloadText(row)) {
      validationErrors.push(`${row.raw_snapshot_storage_ref_id} includes raw payload text`);
    }
    for (const field of [
      "storage_target",
      "storage_binding",
      "object_key",
      "payload_hash_sha256",
      "payload_bytes",
      "content_type",
      "source_url",
      "payload_body_included"
    ]) {
      if (!Object.hasOwn(row.payload_envelope ?? {}, field)) {
        validationErrors.push(`${row.raw_snapshot_storage_ref_id}.payload_envelope missing ${field}`);
      }
    }
  }
  if (plan.summary.object_key_count !== objectKeys.size) {
    validationErrors.push("object key count mismatch");
  }
  if ((plan.raw_snapshot_object_write_plans ?? []).length !== objectKeys.size) {
    validationErrors.push("object write plan count mismatch");
  }
  for (const objectPlan of plan.raw_snapshot_object_write_plans ?? []) {
    if (objectPlan.writes_object_store !== false || objectPlan.writes_files !== false) {
      validationErrors.push(`${objectPlan.object_key_hash} object plan must remain no-write`);
    }
    if (objectPlan.payload_body_included !== false || objectPlan.raw_html_included !== false) {
      validationErrors.push(`${objectPlan.object_key_hash} object plan must not include payload body`);
    }
    if (containsRawPayloadText(objectPlan)) {
      validationErrors.push(`${objectPlan.object_key_hash} object plan includes raw payload text`);
    }
  }

  return validationErrors;
}

function summarizeStoragePlan(plan) {
  return {
    canonical_source: plan.canonical_source,
    emits_payload_text: plan.emits_payload_text,
    mode: plan.mode,
    promotes_facts: plan.promotes_facts,
    status: plan.status,
    storage_binding: plan.storage_binding,
    storage_target: plan.storage_target,
    stores_raw_html_in_repo: plan.stores_raw_html_in_repo,
    summary: plan.summary,
    target_table: plan.target_table,
    version: plan.version,
    writes_database: plan.writes_database,
    writes_files: plan.writes_files,
    writes_object_store: plan.writes_object_store
  };
}

function objectKeyFor(capture) {
  const date = isoDate(capture.captured_at) ?? "unknown-date";
  const payloadHash = String(capture.payload_hash_sha256 ?? "missing").replace(/^sha256:/u, "");
  return [
    "hk-ipo-public",
    "raw-snapshots",
    safeKeyPart(capture.source_id),
    date,
    `${payloadHash}.html`
  ].join("/");
}

function isoDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null;
}

function safeKeyPart(value) {
  return String(value ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "unknown";
}

function containsRawPayloadText(value) {
  return /<html|<body|__NUXT__|<script|<\/script>/iu.test(JSON.stringify(value));
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
