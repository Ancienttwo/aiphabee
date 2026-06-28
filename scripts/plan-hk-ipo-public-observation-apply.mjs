#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const APPLY_PLAN_VERSION = "2026-06-28.hk-ipo-public-observation-apply-plan.v0";
const observationAdapterScript = "scripts/extract-hk-ipo-public-observations.mjs";
const reconciliationScript = "scripts/reconcile-hk-ipo-public-observations.mjs";
const schemaCheckerScript = "scripts/check-hk-ipo-public-observation-schema.mjs";
const captureScript = "scripts/capture-hk-ipo-public-raw-snapshots.mjs";
const storageScript = "scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const args = process.argv.slice(2);
const live = args.includes("--live");
const check = args.includes("--check");
const errors = [];

const contract = readJson(contractPath);
const adapterPayload = runJsonScript(observationAdapterScript, [live ? "--live" : "--fixtures"]);
const packet = runJsonScript(reconciliationScript, [live ? "--live" : "--fixtures", "--packet"]);
const schemaCheck = runJsonScript(schemaCheckerScript, []);
const capturePlan = runJsonScript(captureScript, [live ? "--live" : "--fixtures"]);
const storagePlan = runJsonScript(storageScript, [live ? "--live" : "--fixtures"]);

if (adapterPayload.status !== "ok") errors.push(`observation adapter returned ${adapterPayload.status}`);
if (packet.packet_kind !== "hk_ipo_public_reconciliation_packet") errors.push("reconciliation packet kind mismatch");
if (schemaCheck.status !== "ok") errors.push("schema preflight check failed");
if (capturePlan.status !== "ok") errors.push("raw snapshot capture plan failed");
if (storagePlan.status !== "ok") errors.push("raw snapshot storage plan failed");

const plan = buildApplyPlan({ adapterPayload, capturePlan, packet, storagePlan });
if (check) {
  errors.push(...validatePlan(plan, adapterPayload, packet, capturePlan, storagePlan, contract));
}

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      plan: summarizePlan(plan),
      status: "invalid_hk_ipo_public_observation_apply_plan",
      version: APPLY_PLAN_VERSION
    },
    1
  );
}

emit(check ? summarizePlan(plan) : plan, 0);

function buildApplyPlan({ adapterPayload, capturePlan, packet, storagePlan }) {
  const observations = adapterPayload.runs.flatMap((run) => run.observations ?? []);
  const observationIds = new Set(observations.map((observation) => observation.observation_id));
  const captureByRequestId = new Map((capturePlan.raw_snapshot_captures ?? []).map((row) => [row.raw_snapshot_request_id, row]));
  const storageByRequestId = new Map(
    (storagePlan.raw_snapshot_storage_refs ?? []).map((row) => [row.raw_snapshot_request_id, row])
  );
  const sourceIds = unique(observations.map((observation) => observation.source_id)).sort();
  const sourceRecordIds = unique(observations.map((observation) => observation.source_record_id)).sort();
  const planSeed = {
    adapter_version: adapterPayload.adapter_version,
    mode: live ? "live" : "fixtures",
    observation_hash: stableHash(observations),
    raw_snapshot_capture_hash: stableHash(capturePlan.raw_snapshot_captures ?? []),
    raw_snapshot_storage_hash: stableHash(storagePlan.raw_snapshot_storage_refs ?? []),
    packet_hash: stableHash({
      raw_snapshot_requests: packet.raw_snapshot_requests,
      reconciliation_rows: packet.reconciliation_rows,
      supplement_candidate_rows: packet.supplement_candidate_rows,
      summary: packet.summary
    }),
    packet_version: packet.packet_version,
    source_ids: sourceIds,
    source_record_ids: sourceRecordIds
  };
  const planHash = stableHash(planSeed).slice(0, 24);
  const sourceBatchId = `rsb_hk_ipo_public_${planHash}`;
  const dataVersion = `dv_hk_ipo_public_${planHash}`;
  const sourceRunId = `sr_hk_ipo_public_${planHash}`;
  const observedAt = latestIso(observations.map((observation) => observation.observed_at)) ?? packet.generated_at;
  const rawSnapshotRows = (packet.raw_snapshot_requests ?? []).map((request) => {
    const capture = captureByRequestId.get(request.request_id);
    const storageRef = storageByRequestId.get(request.request_id);
    const payloadEnvelope = storageRef?.payload_envelope ?? null;
    return {
      external_storage_object_key_hash: storageRef?.object_key_hash ?? null,
      operation: "upsert",
      payload_body_included: false,
      payload_bytes: storageRef?.payload_bytes ?? capture?.payload_bytes ?? 0,
      payload_envelope_hash_sha256: storageRef?.payload_envelope_hash_sha256 ?? null,
      payload_hash_sha256: storageRef?.payload_hash_sha256 ?? capture?.payload_hash_sha256 ?? null,
      planned_raw_snapshot_id: capture?.raw_snapshot_id ?? `raw_hk_ipo_public_${stableHash(request.request_id).slice(0, 24)}`,
      planned_payload_parameter_hash: payloadEnvelope ? prefixedHash("payload", payloadEnvelope) : null,
      raw_snapshot_capture_id: capture?.raw_snapshot_capture_id ?? null,
      raw_snapshot_request_id: request.request_id,
      ready_for_external_snapshot_store: capture?.ready_for_external_snapshot_store === true,
      ready_for_sql_payload: storageRef?.ready_for_sql_payload === true,
      ready_for_sql: storageRef?.ready_for_sql_payload === true,
      record_kind: "hk_ipo_public_source_record",
      row_hash: prefixedHash("row", {
        capture,
        data_version: dataVersion,
        payload_envelope: payloadEnvelope,
        record_kind: "hk_ipo_public_source_record",
        request,
        source_batch_id: sourceBatchId
      }),
      source_record_id: request.source_record_id,
      storage_binding: storageRef?.storage_binding ?? null,
      storage_ref_id: storageRef?.raw_snapshot_storage_ref_id ?? null,
      target_table: "core.raw_snapshot"
    };
  });
  const observationRows = observations.map((observation) => ({
    field_name: observation.field_name,
    field_value_hash: prefixedHash("value", observation.field_value),
    locator_hash: stableHash(observation.locator),
    observation_id: observation.observation_id,
    raw_snapshot_required: true,
    reconciled_with_hkex: false,
    row_hash: prefixedHash("row", {
      data_version: dataVersion,
      observation,
      source_run_id: sourceRunId
    }),
    security_code: observation.security_code,
    source_id: observation.source_id,
    source_record_id: observation.source_record_id,
    target_table: "core.hk_ipo_public_observation"
  }));
  const reconciliationRows = (packet.reconciliation_rows ?? []).map((row) => ({
    fact_name: row.fact_name,
    raw_snapshot_required: true,
    reconciliation_row_id: row.row_id,
    row_hash: prefixedHash("row", {
      data_version: dataVersion,
      row,
      source_run_id: sourceRunId
    }),
    security_code: row.security_code,
    source_observation_count: row.source_observation_ids.length,
    status: row.status,
    target_table: "core.hk_ipo_public_reconciliation_row"
  }));
  const supplementRows = (packet.supplement_candidate_rows ?? []).map((row) => ({
    field_name: row.field_name,
    raw_snapshot_required: true,
    row_hash: prefixedHash("row", {
      data_version: dataVersion,
      row,
      source_run_id: sourceRunId
    }),
    security_code: row.security_code,
    source_observation_id: row.source_observation_id,
    status: row.status,
    supplement_candidate_id: row.row_id,
    target_table: "core.hk_ipo_public_supplement_candidate"
  }));

  return {
    applies_remote_database: false,
    canonical_source: "hkex_news",
    data_version: dataVersion,
    emits_sql_text: false,
    executes_sql: false,
    generated_at: new Date().toISOString(),
    input_adapter_version: adapterPayload.adapter_version,
    input_packet_version: packet.packet_version,
    mode: live ? "live" : "fixtures",
    observed_at: observedAt,
    parameterized_statements: true,
    plan_id: `hk_ipo_public_apply_plan_${planHash}`,
    promotes_facts: false,
    row_groups: {
      data_version_batch: [
        redactedRow("core.data_version_batch", {
          data_version: dataVersion,
          methodology_version: packet.packet_version,
          release_state: "held",
          rights_policy_version: "default_deny",
          source_batch_id: sourceBatchId
        })
      ],
      hk_ipo_public_observation: observationRows,
      hk_ipo_public_reconciliation_row: reconciliationRows,
      hk_ipo_public_source_run: [
        redactedRow("core.hk_ipo_public_source_run", {
          adapter_version: adapterPayload.adapter_version,
          data_version: dataVersion,
          packet_version: packet.packet_version,
          source_batch_id: sourceBatchId,
          source_mode: live ? "live" : "fixtures",
          source_run_id: sourceRunId,
          status: "held"
        })
      ],
      hk_ipo_public_supplement_candidate: supplementRows,
      raw_snapshot: rawSnapshotRows,
      raw_source_batch: [
        redactedRow("core.raw_source_batch", {
          checksum_sha256: prefixedHash("sha256", {
            packet_summary: packet.summary,
            source_record_ids: sourceRecordIds
          }),
          received_at: observedAt,
          row_count: observations.length,
          source_batch_id: sourceBatchId,
          source_dataset: "hk_ipo_public_observation",
          source_name: "hk_ipo_public_sources",
          source_rights_status: "default_deny"
        })
      ]
    },
    source_batch_id: sourceBatchId,
    source_run_id: sourceRunId,
    statement_plan: [
      statement("upsert_core_raw_source_batch", "core.raw_source_batch", "upsert", 1, true, [
        "source_batch_id",
        "source_name",
        "source_dataset",
        "received_at",
        "source_rights_status",
        "checksum_sha256",
        "row_count"
      ]),
      statement("upsert_core_data_version_batch", "core.data_version_batch", "upsert", 1, true, [
        "data_version",
        "source_batch_id",
        "methodology_version",
        "rights_policy_version",
        "release_state"
      ]),
      statement("upsert_core_hk_ipo_public_source_run", "core.hk_ipo_public_source_run", "upsert", 1, true, [
        "source_run_id",
        "source_batch_id",
        "data_version",
        "adapter_version",
        "packet_version",
        "source_mode",
        "status",
        "source_ids",
        "security_count",
        "observation_count",
        "reconciliation_row_count",
        "supplement_candidate_count",
        "live_network_writes",
        "writes_serving_tables"
      ]),
      statement(
        "upsert_core_raw_snapshot",
        "core.raw_snapshot",
        "upsert",
        rawSnapshotRows.length,
        rawSnapshotRows.every((row) => row.ready_for_sql),
        [
          "raw_snapshot_id",
          "source_batch_id",
          "source_record_id",
          "record_kind",
          "payload",
          "payload_hash_sha256",
          "received_at",
          "quality_state",
          "data_version",
          "methodology_version"
        ],
        rawSnapshotRows.every((row) => row.ready_for_sql) ? null : "raw snapshot external storage reference required"
      ),
      statement(
        "upsert_core_hk_ipo_public_observation",
        "core.hk_ipo_public_observation",
        "upsert",
        observationRows.length,
        true,
        [
          "observation_id",
          "source_run_id",
          "source_id",
          "provider",
          "source_url",
          "observed_at",
          "source_record_id",
          "security_code",
          "field_name",
          "field_value",
          "field_value_type",
          "raw_snapshot_id",
          "raw_snapshot_required",
          "reconciled_with_hkex",
          "conflict_status",
          "confidence",
          "locator",
          "locator_hash",
          "data_version",
          "quality_state"
        ]
      ),
      statement(
        "upsert_core_hk_ipo_public_reconciliation_row",
        "core.hk_ipo_public_reconciliation_row",
        "upsert",
        reconciliationRows.length,
        true,
        [
          "reconciliation_row_id",
          "source_run_id",
          "security_code",
          "fact_name",
          "status",
          "canonical_candidate",
          "source_observation_ids",
          "source_ids",
          "raw_snapshot_request_ids",
          "hkex_evidence_ids",
          "confidence",
          "reason",
          "raw_snapshot_required",
          "conflict_requires_manual_review",
          "promotes_fact",
          "data_version",
          "quality_state"
        ]
      ),
      statement(
        "upsert_core_hk_ipo_public_supplement_candidate",
        "core.hk_ipo_public_supplement_candidate",
        "upsert",
        supplementRows.length,
        true,
        [
          "supplement_candidate_id",
          "source_run_id",
          "source_observation_id",
          "security_code",
          "source_id",
          "source_record_id",
          "field_name",
          "field_value_type",
          "status",
          "raw_snapshot_required",
          "promotes_fact",
          "reason",
          "data_version",
          "quality_state"
        ]
      )
    ],
    status: "ok",
    stores_raw_html_in_repo: false,
    summary: {
      data_version_batch_row_count: 1,
      captured_raw_snapshot_hash_count: rawSnapshotRows.filter((row) => Boolean(row.payload_hash_sha256)).length,
      deferred_raw_snapshot_count: rawSnapshotRows.filter((row) => !row.ready_for_sql).length,
      external_raw_snapshot_ref_count: rawSnapshotRows.filter((row) => Boolean(row.storage_ref_id)).length,
      observation_row_count: observationRows.length,
      ready_statement_count: 7,
      ready_raw_snapshot_payload_count: rawSnapshotRows.filter((row) => row.ready_for_sql_payload).length,
      reconciliation_row_count: reconciliationRows.length,
      source_batch_row_count: 1,
      source_run_row_count: 1,
      supplement_candidate_row_count: supplementRows.length,
      unresolved_source_observation_count: countUnresolvedReferences(packet, observationIds)
    },
    target_tables: [
      "core.raw_source_batch",
      "core.data_version_batch",
      "core.hk_ipo_public_source_run",
      "core.raw_snapshot",
      "core.hk_ipo_public_observation",
      "core.hk_ipo_public_reconciliation_row",
      "core.hk_ipo_public_supplement_candidate"
    ],
    version: APPLY_PLAN_VERSION,
    writes_database: false,
    writes_files: false
  };
}

function validatePlan(plan, adapterPayload, packet, capturePlan, storagePlan, value) {
  const validationErrors = [];
  const observations = adapterPayload.runs.flatMap((run) => run.observations ?? []);
  const observationIds = new Set(observations.map((observation) => observation.observation_id));
  if (plan.version !== APPLY_PLAN_VERSION) validationErrors.push("apply plan version mismatch");
  for (const field of [
    "applies_remote_database",
    "emits_sql_text",
    "executes_sql",
    "promotes_facts",
    "stores_raw_html_in_repo",
    "writes_database",
    "writes_files"
  ]) {
    if (plan[field] !== false) validationErrors.push(`${field} must be false`);
  }
  if (plan.parameterized_statements !== true) {
    validationErrors.push("apply plan must use parameterized statement descriptors");
  }
  if (plan.canonical_source !== "hkex_news") {
    validationErrors.push("apply plan canonical_source must be hkex_news");
  }
  if (schemaCheck.status !== "ok") {
    validationErrors.push("schema preflight must pass before apply planning");
  }
  if (capturePlan.status !== "ok") {
    validationErrors.push("raw snapshot capture plan must pass before apply planning");
  }
  if (storagePlan.status !== "ok") {
    validationErrors.push("raw snapshot storage plan must pass before apply planning");
  }
  for (const table of value.apply_planner?.target_tables ?? []) {
    if (!plan.target_tables.includes(table)) {
      validationErrors.push(`apply plan missing target table ${table}`);
    }
  }
  for (const statementId of value.apply_planner?.statement_ids ?? []) {
    if (!plan.statement_plan.some((item) => item.statement_id === statementId)) {
      validationErrors.push(`apply plan missing statement ${statementId}`);
    }
  }
  if (plan.summary.observation_row_count !== observations.length) {
    validationErrors.push("observation row count mismatch");
  }
  if (plan.summary.reconciliation_row_count !== packet.reconciliation_rows.length) {
    validationErrors.push("reconciliation row count mismatch");
  }
  if (plan.summary.supplement_candidate_row_count !== packet.supplement_candidate_rows.length) {
    validationErrors.push("supplement candidate row count mismatch");
  }
  if (plan.summary.deferred_raw_snapshot_count !== 0) {
    validationErrors.push("raw snapshot statement must not remain deferred after storage reference planning");
  }
  if (plan.summary.captured_raw_snapshot_hash_count !== capturePlan.summary?.payload_hash_count) {
    validationErrors.push("captured raw snapshot hash count mismatch");
  }
  if (plan.summary.captured_raw_snapshot_hash_count !== packet.raw_snapshot_requests.length) {
    validationErrors.push("each raw snapshot request must have a captured payload hash");
  }
  if (plan.summary.external_raw_snapshot_ref_count !== storagePlan.summary?.payload_envelope_count) {
    validationErrors.push("external raw snapshot ref count mismatch");
  }
  if (plan.summary.external_raw_snapshot_ref_count !== packet.raw_snapshot_requests.length) {
    validationErrors.push("each raw snapshot request must have an external storage reference");
  }
  if (plan.summary.ready_raw_snapshot_payload_count !== packet.raw_snapshot_requests.length) {
    validationErrors.push("each raw snapshot request must have a SQL-ready payload envelope");
  }
  if (plan.summary.unresolved_source_observation_count !== 0) {
    validationErrors.push("packet references observations not emitted by the adapter");
  }
  const rawSnapshotStatement = plan.statement_plan.find((item) => item.statement_id === "upsert_core_raw_snapshot");
  if (!rawSnapshotStatement || rawSnapshotStatement.ready_for_sql !== true) {
    validationErrors.push("raw snapshot insert must be SQL-ready with external payload envelope");
  }
  if (plan.statement_plan.some((item) => item.statement_id === "defer_core_raw_snapshot_until_payload_body_or_external_ref")) {
    validationErrors.push("apply plan must not keep raw snapshot deferral statement");
  }
  for (const row of plan.row_groups.raw_snapshot ?? []) {
    if (row.ready_for_sql !== true || row.ready_for_sql_payload !== true) {
      validationErrors.push(`${row.raw_snapshot_request_id} raw snapshot row must be SQL payload ready`);
    }
    if (row.payload_body_included !== false) {
      validationErrors.push(`${row.raw_snapshot_request_id} raw snapshot row must not include payload body`);
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(String(row.payload_envelope_hash_sha256))) {
      validationErrors.push(`${row.raw_snapshot_request_id} missing payload envelope hash`);
    }
    if (!row.storage_ref_id) {
      validationErrors.push(`${row.raw_snapshot_request_id} missing storage ref id`);
    }
  }
  for (const row of packet.reconciliation_rows ?? []) {
    for (const observationId of row.source_observation_ids ?? []) {
      if (!observationIds.has(observationId)) {
        validationErrors.push(`${row.row_id} references missing observation ${observationId}`);
      }
    }
    if (row.status === "agreement" && !row.raw_snapshot_required) {
      validationErrors.push(`${row.row_id} must require raw snapshot before promotion`);
    }
  }
  for (const row of packet.supplement_candidate_rows ?? []) {
    if (!observationIds.has(row.source_observation_id)) {
      validationErrors.push(`${row.row_id} references missing observation ${row.source_observation_id}`);
    }
    if (row.status !== "candidate" || row.raw_snapshot_required !== true) {
      validationErrors.push(`${row.row_id} must remain a raw-snapshot-gated candidate`);
    }
  }
  return validationErrors;
}

function statement(statementId, targetTable, operation, rowCount, readyForSql, parameterKeys, blocker) {
  return {
    blocker: blocker ?? null,
    operation,
    parameter_keys: parameterKeys,
    ready_for_sql: readyForSql,
    row_count: rowCount,
    statement_id: statementId,
    target_table: targetTable
  };
}

function redactedRow(targetTable, row) {
  return {
    row_hash: prefixedHash("row", row),
    target_table: targetTable
  };
}

function countUnresolvedReferences(packet, observationIds) {
  const referenced = [
    ...(packet.reconciliation_rows ?? []).flatMap((row) => row.source_observation_ids ?? []),
    ...(packet.supplement_candidate_rows ?? []).map((row) => row.source_observation_id)
  ];
  return referenced.filter((observationId) => !observationIds.has(observationId)).length;
}

function summarizePlan(plan) {
  return {
    applies_remote_database: plan.applies_remote_database,
    data_version: plan.data_version,
    emits_sql_text: plan.emits_sql_text,
    executes_sql: plan.executes_sql,
    mode: plan.mode,
    plan_id: plan.plan_id,
    promotes_facts: plan.promotes_facts,
    source_batch_id: plan.source_batch_id,
    source_run_id: plan.source_run_id,
    statement_plan: plan.statement_plan,
    status: plan.status,
    summary: plan.summary,
    target_tables: plan.target_tables,
    version: plan.version,
    writes_database: plan.writes_database,
    writes_files: plan.writes_files
  };
}

function runJsonScript(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
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

function latestIso(values) {
  const timestamps = values
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a);
  return timestamps.length > 0 ? new Date(timestamps[0]).toISOString() : null;
}

function prefixedHash(prefix, value) {
  return `${prefix}:${stableHash(value)}`;
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function unique(values) {
  return [...new Set(values)];
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
