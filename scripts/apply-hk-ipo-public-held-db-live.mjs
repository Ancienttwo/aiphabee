#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APPLY_VERSION = "2026-06-28.hk-ipo-public-held-db-apply-live.v0";
const route = "/ingest/hk-ipo-public/held-db-apply";
const headerValue = "hk-ipo-public-held-db-apply-live-v1";
const adapterScript = "scripts/extract-hk-ipo-public-observations.mjs";
const packetScript = "scripts/reconcile-hk-ipo-public-observations.mjs";
const captureScript = "scripts/capture-hk-ipo-public-raw-snapshots.mjs";
const storageScript = "scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs";
const args = process.argv.slice(2);
const endpoint = optionValue("--endpoint") ?? process.env.AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_ENDPOINT ?? "http://127.0.0.1:8797";
const remote = args.includes("--remote");
const check = args.includes("--check");
const errors = [];

const adapterPayload = runJsonScript(adapterScript, ["--live"]);
const packet = runJsonScript(packetScript, ["--live", "--packet"]);
const capturePlan = runJsonScript(captureScript, ["--live"]);
const storagePlan = runJsonScript(storageScript, ["--live"]);
const applyPayload = buildApplyPayload({ adapterPayload, capturePlan, packet, storagePlan });
const validationErrors = validateApplyPayload(applyPayload, adapterPayload, packet, capturePlan, storagePlan);
errors.push(...validationErrors);

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: "live",
      remote,
      status: "invalid_hk_ipo_public_held_db_apply_live",
      summary: summarizeApplyPayload(applyPayload),
      version: APPLY_VERSION
    },
    1
  );
}

if (!remote) {
  emit(
    {
      mode: "live",
      remote,
      remote_requires_flag: "--remote",
      status: "ready_no_write",
      summary: summarizeApplyPayload(applyPayload),
      version: APPLY_VERSION
    },
    0
  );
}

const objectStoreWriteSummary = await persistRawSnapshots(storagePlan, applyPayload);
applyPayload.object_store_write_summary = objectStoreWriteSummary;
refreshApplyPacketHash(applyPayload);

if (objectStoreWriteSummary.status !== "ok") {
  emit(
    {
      mode: "live",
      remote,
      status: "object_store_write_failed",
      summary: {
        ...summarizeApplyPayload(applyPayload),
        object_store_write_summary: objectStoreWriteSummary
      },
      version: APPLY_VERSION
    },
    1
  );
}

const applyResult = await postApplyPayload(applyPayload);
emit(
  {
    mode: "live",
    remote,
    response_hash: applyResult.response_hash,
    route: `POST ${route}`,
    status: applyResult.status,
    summary: {
      ...summarizeApplyPayload(applyPayload),
      object_store_write_summary: objectStoreWriteSummary,
      remote_apply: applyResult.summary
    },
    version: APPLY_VERSION
  },
  applyResult.status === "ok" ? 0 : 1
);

function buildApplyPayload({ adapterPayload: adapterValue, capturePlan: captureValue, packet: packetValue, storagePlan: storageValue }) {
  const observations = (adapterValue.runs ?? []).flatMap((run) => run.observations ?? []);
  const observationIds = new Set(observations.map((observation) => observation.observation_id));
  const sourceIds = unique(observations.map((observation) => observation.source_id)).sort();
  const securityCodes = unique(observations.map((observation) => observation.security_code)).sort();
  const sourceRecordIds = unique(observations.map((observation) => observation.source_record_id)).sort();
  const captureByRequestId = new Map((captureValue.raw_snapshot_captures ?? []).map((row) => [row.raw_snapshot_request_id, row]));
  const storageByRequestId = new Map((storageValue.raw_snapshot_storage_refs ?? []).map((row) => [row.raw_snapshot_request_id, row]));
  const rawSnapshotIdByObservationId = new Map();

  for (const request of packetValue.raw_snapshot_requests ?? []) {
    const storageRef = storageByRequestId.get(request.request_id);
    for (const observationId of request.observation_ids ?? []) {
      rawSnapshotIdByObservationId.set(observationId, storageRef?.raw_snapshot_id ?? null);
    }
  }

  const planSeed = {
    adapter_version: adapterValue.adapter_version,
    mode: "live",
    observation_hash: stableHash(observations),
    packet_hash: stableHash({
      raw_snapshot_requests: packetValue.raw_snapshot_requests,
      reconciliation_rows: packetValue.reconciliation_rows,
      summary: packetValue.summary,
      supplement_candidate_rows: packetValue.supplement_candidate_rows
    }),
    packet_version: packetValue.packet_version,
    raw_snapshot_capture_hash: stableHash(captureValue.raw_snapshot_captures ?? []),
    raw_snapshot_storage_hash: stableHash(storageValue.raw_snapshot_storage_refs ?? []),
    source_ids: sourceIds,
    source_record_ids: sourceRecordIds
  };
  const planHash = stableHash(planSeed).slice(0, 24);
  const sourceBatchId = `rsb_hk_ipo_public_${planHash}`;
  const dataVersion = `dv_hk_ipo_public_${planHash}`;
  const sourceRunId = `sr_hk_ipo_public_${planHash}`;
  const observedAt = latestIso(observations.map((observation) => observation.observed_at)) ?? packetValue.generated_at;

  const rawSnapshotRows = (packetValue.raw_snapshot_requests ?? []).map((request) => {
    const capture = captureByRequestId.get(request.request_id);
    const storageRef = storageByRequestId.get(request.request_id);
    const payloadEnvelope = storageRef?.payload_envelope ?? {};
    return {
      data_version: dataVersion,
      methodology_version: packetValue.packet_version,
      payload: payloadEnvelope,
      payload_hash_sha256: storageRef?.payload_envelope_hash_sha256 ?? null,
      quality_state: "HOLD",
      raw_snapshot_id: storageRef?.raw_snapshot_id ?? capture?.raw_snapshot_id,
      received_at: capture?.captured_at ?? observedAt,
      record_kind: "hk_ipo_public_source_record",
      source_batch_id: sourceBatchId,
      source_record_id: request.source_record_id
    };
  });

  const observationRows = observations.map((observation) => ({
    confidence: observation.confidence ?? null,
    conflict_status: observation.conflict_status ?? "unreconciled",
    data_version: dataVersion,
    field_name: observation.field_name,
    field_value: observation.field_value,
    field_value_type: observation.field_value_type,
    locator: observation.locator,
    locator_hash: stableHash(observation.locator),
    observation_id: observation.observation_id,
    observed_at: observation.observed_at,
    provider: observation.provider,
    quality_state: "HOLD",
    raw_snapshot_id: rawSnapshotIdByObservationId.get(observation.observation_id) ?? null,
    raw_snapshot_required: true,
    reconciled_with_hkex: false,
    security_code: observation.security_code,
    source_id: observation.source_id,
    source_record_id: observation.source_record_id,
    source_run_id: sourceRunId,
    source_url: observation.source_url
  }));

  const reconciliationRows = (packetValue.reconciliation_rows ?? []).map((row) => ({
    canonical_candidate: row.canonical_candidate ?? null,
    confidence: row.confidence,
    conflict_requires_manual_review: row.conflict_requires_manual_review === true,
    data_version: dataVersion,
    fact_name: row.fact_name,
    hkex_evidence_ids: row.hkex_evidence_ids ?? [],
    promotes_fact: false,
    quality_state: "HOLD",
    raw_snapshot_request_ids: row.raw_snapshot_request_ids ?? [],
    raw_snapshot_required: true,
    reason: row.reason,
    reconciliation_row_id: row.row_id,
    security_code: row.security_code,
    source_ids: row.source_ids ?? [],
    source_observation_ids: row.source_observation_ids ?? [],
    source_run_id: sourceRunId,
    status: row.status
  }));

  const supplementRows = (packetValue.supplement_candidate_rows ?? []).map((row) => ({
    data_version: dataVersion,
    field_name: row.field_name,
    field_value_type: row.field_value_type,
    promotes_fact: false,
    quality_state: "HOLD",
    raw_snapshot_required: true,
    reason: row.reason,
    security_code: row.security_code,
    source_id: row.source_id,
    source_observation_id: row.source_observation_id,
    source_record_id: row.source_record_id,
    source_run_id: sourceRunId,
    status: "candidate",
    supplement_candidate_id: row.row_id
  }));

  const material = {
    data_version: dataVersion,
    row_group_hashes: {
      data_version_batch: stableHash([{ data_version: dataVersion, release_state: "held", source_batch_id: sourceBatchId }]),
      hk_ipo_public_observation: stableHash(observationRows),
      hk_ipo_public_reconciliation_row: stableHash(reconciliationRows),
      hk_ipo_public_source_run: stableHash([{ source_run_id: sourceRunId }]),
      hk_ipo_public_supplement_candidate: stableHash(supplementRows),
      raw_snapshot: stableHash(rawSnapshotRows),
      raw_source_batch: stableHash([{ source_batch_id: sourceBatchId }])
    },
    source_batch_id: sourceBatchId,
    source_run_id: sourceRunId,
    version: APPLY_VERSION
  };

  return {
    apply_plan_id: `hk_ipo_public_apply_plan_${planHash}`,
    data_version: dataVersion,
    mode: "live",
    object_store_write_summary: {
      payload_body_output_count: 0,
      remote_object_store_write_count: 0,
      status: "not_started",
      writes_database_count: 0
    },
    packet_hash: prefixedHash("packet", material),
    packet_kind: "hk_ipo_public_held_db_apply_packet",
    row_groups: {
      data_version_batch: [
        {
          data_version: dataVersion,
          methodology_version: packetValue.packet_version,
          release_state: "held",
          rights_policy_version: "default_deny",
          source_batch_id: sourceBatchId
        }
      ],
      hk_ipo_public_observation: observationRows,
      hk_ipo_public_reconciliation_row: reconciliationRows,
      hk_ipo_public_source_run: [
        {
          adapter_version: adapterValue.adapter_version,
          data_version: dataVersion,
          live_network_writes: false,
          observation_count: observationRows.length,
          packet_version: packetValue.packet_version,
          reconciliation_row_count: reconciliationRows.length,
          security_count: securityCodes.length,
          source_batch_id: sourceBatchId,
          source_ids: sourceIds,
          source_mode: "live",
          source_run_id: sourceRunId,
          status: "held",
          supplement_candidate_count: supplementRows.length,
          writes_serving_tables: false
        }
      ],
      hk_ipo_public_supplement_candidate: supplementRows,
      raw_snapshot: rawSnapshotRows,
      raw_source_batch: [
        {
          checksum_sha256: prefixedHash("sha256", {
            packet_summary: packetValue.summary,
            source_record_ids: sourceRecordIds
          }),
          received_at: observedAt,
          row_count: observations.length,
          source_batch_id: sourceBatchId,
          source_dataset: "hk_ipo_public_observation",
          source_name: "hk_ipo_public_sources",
          source_rights_status: "default_deny"
        }
      ]
    },
    source_batch_id: sourceBatchId,
    source_run_id: sourceRunId,
    version: APPLY_VERSION
  };
}

async function persistRawSnapshots(storageValue, payload) {
  const objectPlans = storageValue.raw_snapshot_object_write_plans ?? [];
  const payloads = await loadPayloads(objectPlans);
  const writeResults = [];
  for (const objectPlan of objectPlans) {
    const payloadText = payloads.get(sourceKeyFor(objectPlan));
    if (typeof payloadText !== "string") {
      writeResults.push({ object_key_hash: objectPlan.object_key_hash, status: "missing_payload" });
      continue;
    }
    const currentObjectPlan = objectPlanForCurrentPayload(objectPlan, payloadText);
    applyCurrentPayloadEnvelope(payload, objectPlan, currentObjectPlan);
    writeResults.push(putR2Object(currentObjectPlan, payloadText));
  }
  const failed = writeResults.filter((result) => result.status !== "passed");
  return {
    failed_write_count: failed.length,
    object_key_count: objectPlans.length,
    payload_body_output_count: 0,
    payload_hash_match_count: writeResults.filter((result) => result.payload_hash_matched === true).length,
    remote_object_store_write_count: writeResults.filter((result) => result.status === "passed").length,
    status: failed.length === 0 ? "ok" : "failed",
    value_hashes: writeResults.map((result) => result.value_hash).filter(Boolean),
    writes_database_count: 0,
    writes_repo_file_count: 0
  };
}

function applyCurrentPayloadEnvelope(payload, originalObjectPlan, currentObjectPlan) {
  for (const row of payload.row_groups.raw_snapshot) {
    if (
      row.payload?.source_id !== originalObjectPlan.source_id ||
      row.payload?.source_url !== originalObjectPlan.source_url
    ) {
      continue;
    }
    const envelope = {
      ...row.payload,
      object_key: currentObjectPlan.object_key,
      object_key_hash: currentObjectPlan.object_key_hash,
      payload_bytes: currentObjectPlan.payload_bytes,
      payload_hash_sha256: currentObjectPlan.payload_hash_sha256
    };
    row.payload = envelope;
    row.payload_hash_sha256 = prefixedHash("sha256", envelope);
  }
}

function objectPlanForCurrentPayload(objectPlan, payloadText) {
  const payloadHash = prefixedHash("sha256", payloadText);
  const objectKey = objectKeyForCurrentPayload(objectPlan.source_id, payloadHash);
  return {
    ...objectPlan,
    object_key: objectKey,
    object_key_hash: prefixedHash("object_key", objectKey),
    payload_bytes: Buffer.byteLength(payloadText, "utf8"),
    payload_hash_sha256: payloadHash
  };
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

function refreshApplyPacketHash(payload) {
  const material = {
    data_version: payload.data_version,
    row_group_hashes: {
      data_version_batch: stableHash(payload.row_groups.data_version_batch),
      hk_ipo_public_observation: stableHash(payload.row_groups.hk_ipo_public_observation),
      hk_ipo_public_reconciliation_row: stableHash(payload.row_groups.hk_ipo_public_reconciliation_row),
      hk_ipo_public_source_run: stableHash(payload.row_groups.hk_ipo_public_source_run),
      hk_ipo_public_supplement_candidate: stableHash(payload.row_groups.hk_ipo_public_supplement_candidate),
      raw_snapshot: stableHash(payload.row_groups.raw_snapshot),
      raw_source_batch: stableHash(payload.row_groups.raw_source_batch)
    },
    source_batch_id: payload.source_batch_id,
    source_run_id: payload.source_run_id,
    version: APPLY_VERSION
  };
  payload.packet_hash = prefixedHash("packet", material);
}

async function loadPayloads(objectPlans) {
  const payloads = new Map();
  for (const sourceKey of unique(objectPlans.map(sourceKeyFor))) {
    const [, sourceUrl] = sourceKey.split(/:(.+)/u);
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AiphaBeeHeldDbApply/0.1"
      },
      signal: AbortSignal.timeout(20000)
    });
    if (response.status !== 200) {
      errors.push(`${sourceKey} expected HTTP 200, got ${response.status}`);
      continue;
    }
    payloads.set(sourceKey, await response.text());
  }
  return payloads;
}

function putR2Object(objectPlan, payloadText) {
  const dir = mkdtempSync(join(tmpdir(), "aiphabee-hk-ipo-held-r2-"));
  const putPath = join(dir, "payload.html");
  const objectPath = `${objectPlan.bucket_hint}/${objectPlan.object_key}`;
  const valueHash = prefixedHash("sha256", payloadText);
  try {
    writeFileSync(putPath, payloadText);
    runWrangler(["r2", "object", "put", objectPath, "--file", putPath, "--remote", "--force"]);
    return {
      object_key_hash: objectPlan.object_key_hash,
      payload_hash_matched: valueHash === objectPlan.payload_hash_sha256,
      status: "passed",
      value_hash: valueHash
    };
  } catch (error) {
    return {
      detail_hash: prefixedHash("detail", error instanceof Error ? error.message : String(error)),
      object_key_hash: objectPlan.object_key_hash,
      status: "failed",
      value_hash: valueHash
    };
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}

async function postApplyPayload(payload) {
  const token = process.env.AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN?.trim() ?? "";
  if (token.length < 16) {
    return {
      response_hash: null,
      status: "missing_apply_token",
      summary: {}
    };
  }
  const response = await fetch(`${endpoint}${route}`, {
    body: JSON.stringify(payload),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-aiphabee-smoke": headerValue,
      "x-request-id": `req-hk-ipo-public-held-db-apply-${randomUUID()}`
    },
    method: "POST"
  });
  const text = await response.text();
  const body = JSON.parse(text);
  const result = body.held_db_apply_result ?? {};
  return {
    response_hash: prefixedHash("sha256", text),
    status: response.ok && body.status === "ok" ? "ok" : "failed",
    summary: {
      data_version_hash: result.data_version_hash,
      detail_hash: result.detail_hash,
      error_code: result.error_code,
      failure_code: result.failure_code,
      failure_stage: result.failure_stage,
      http_status: response.status,
      inserted_or_updated_rows: result.inserted_or_updated_rows,
      object_store_write_count: result.object_store_write_count,
      query_hash: result.query_hash,
      release_state: result.release_state,
      selected_rows: result.selected_rows,
      status: result.status,
      writes_serving_tables: result.writes_serving_tables
    }
  };
}

function validateApplyPayload(payload, adapterValue, packetValue, captureValue, storageValue) {
  const validationErrors = [];
  const serialized = JSON.stringify(payload);
  const summary = summarizeApplyPayload(payload);
  if (adapterValue.status !== "ok") validationErrors.push("adapter payload failed");
  if (packetValue.packet_kind !== "hk_ipo_public_reconciliation_packet") validationErrors.push("packet kind mismatch");
  if (captureValue.status !== "ok") validationErrors.push("capture plan failed");
  if (storageValue.status !== "ok") validationErrors.push("storage plan failed");
  if (summary.total_row_count <= 0 || summary.total_row_count > 5000) validationErrors.push("unexpected total row count");
  if (summary.raw_snapshot_row_count !== storageValue.summary?.payload_envelope_count) {
    validationErrors.push("raw snapshot count must match payload envelopes");
  }
  if (summary.observation_row_count !== (adapterValue.runs ?? []).flatMap((run) => run.observations ?? []).length) {
    validationErrors.push("observation row count mismatch");
  }
  if (summary.reconciliation_row_count !== (packetValue.reconciliation_rows ?? []).length) {
    validationErrors.push("reconciliation row count mismatch");
  }
  if (summary.supplement_candidate_row_count !== (packetValue.supplement_candidate_rows ?? []).length) {
    validationErrors.push("supplement row count mismatch");
  }
  for (const row of payload.row_groups.hk_ipo_public_reconciliation_row) {
    if (!["low", "medium", "high"].includes(String(row.confidence ?? ""))) {
      validationErrors.push("reconciliation row confidence must be low, medium, or high");
    }
    if (typeof row.reason !== "string" || row.reason.trim().length === 0) {
      validationErrors.push("reconciliation row reason must be present");
    }
    if (!Array.isArray(row.source_ids) || row.source_ids.length === 0) {
      validationErrors.push("reconciliation row source_ids must be present");
    }
    if (!Array.isArray(row.source_observation_ids) || row.source_observation_ids.length === 0) {
      validationErrors.push("reconciliation row source_observation_ids must be present");
    }
    if (!Array.isArray(row.raw_snapshot_request_ids)) {
      validationErrors.push("reconciliation row raw_snapshot_request_ids must be an array");
    }
    if (!Array.isArray(row.hkex_evidence_ids)) {
      validationErrors.push("reconciliation row hkex_evidence_ids must be an array");
    }
  }
  for (const row of payload.row_groups.hk_ipo_public_supplement_candidate) {
    if (typeof row.reason !== "string" || row.reason.trim().length === 0) {
      validationErrors.push("supplement row reason must be present");
    }
  }
  if (/<html|<body|__NUXT__|<script|<\/script>/iu.test(serialized)) {
    validationErrors.push("apply payload must not include raw HTML");
  }
  if (/postgres(?:ql)?:\/\/|Bearer\s+[A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9_-]{20,}/iu.test(serialized)) {
    validationErrors.push("apply payload must not include secrets");
  }
  return validationErrors;
}

function summarizeApplyPayload(payload) {
  return {
    data_version: payload.data_version,
    mode: payload.mode,
    object_store_write_summary: payload.object_store_write_summary,
    packet_hash: payload.packet_hash,
    raw_snapshot_row_count: payload.row_groups.raw_snapshot.length,
    observation_row_count: payload.row_groups.hk_ipo_public_observation.length,
    reconciliation_row_count: payload.row_groups.hk_ipo_public_reconciliation_row.length,
    source_batch_id_hash: prefixedHash("source_batch_id", payload.source_batch_id),
    source_run_id_hash: prefixedHash("source_run_id", payload.source_run_id),
    supplement_candidate_row_count: payload.row_groups.hk_ipo_public_supplement_candidate.length,
    total_row_count: Object.values(payload.row_groups).reduce((sum, rows) => sum + rows.length, 0),
    version: payload.version,
    writes_database: remote,
    writes_files: false
  };
}

function sourceKeyFor(objectPlan) {
  return `${objectPlan.source_id}:${objectPlan.source_url}`;
}

function safeKeyPart(value) {
  return String(value ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "unknown";
}

function latestIso(values) {
  const timestamps = values.map((value) => Date.parse(value)).filter(Number.isFinite);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function runJsonScript(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.status !== 0) {
    errors.push(`${script} failed`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    errors.push(`${script} did not emit JSON`);
    return { status: "invalid_json" };
  }
}

function runWrangler(commandArgs) {
  const result = spawnSync("npx", ["wrangler", ...commandArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error("wrangler r2 command failed");
  }
}

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function prefixedHash(prefix, value) {
  return `${prefix}:${stableHash(value)}`;
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null))];
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
