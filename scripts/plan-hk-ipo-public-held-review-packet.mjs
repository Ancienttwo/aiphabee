#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const REVIEW_PACKET_VERSION = "2026-06-28.hk-ipo-public-held-review-packet.v0";
const applyPlannerScript = "scripts/plan-hk-ipo-public-observation-apply.mjs";
const heldDbApplyPacketScript = "scripts/plan-hk-ipo-public-held-db-apply-packet.mjs";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const args = process.argv.slice(2);
const live = args.includes("--live");
const check = args.includes("--check");
const errors = [];

const contract = readJson(contractPath);
const applyPlan = runJsonScript(applyPlannerScript, [live ? "--live" : "--fixtures"]);
const applyPacket = runJsonScript(heldDbApplyPacketScript, [live ? "--live" : "--fixtures"]);

if (applyPlan.status !== "ok") errors.push(`apply planner returned ${applyPlan.status}`);
if (applyPacket.status !== "ok") errors.push(`held DB apply packet returned ${applyPacket.status}`);

const packet = buildReviewPacket(applyPlan, applyPacket);
if (check) {
  errors.push(...validateReviewPacket(packet, applyPlan, applyPacket, contract));
}

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      packet: summarizePacket(packet),
      status: "invalid_hk_ipo_public_held_review_packet",
      version: REVIEW_PACKET_VERSION
    },
    1
  );
}

emit(check ? summarizePacket(packet) : packet, 0);

function buildReviewPacket(plan, apply) {
  const heldTableReviewItems = (apply.statement_packets ?? []).map((statement) => ({
    row_count: statement.row_count,
    row_group: statement.row_group,
    row_group_hash: statement.row_group_hash,
    statement_id: statement.statement_id,
    target_table: statement.target_table
  }));
  const reviewGates = buildReviewGates(plan, apply, heldTableReviewItems);
  const summary = {
    blocked_promotion_gate_count: reviewGates.filter((gate) => gate.status === "blocked").length,
    data_version_batch_row_count: plan.summary?.data_version_batch_row_count ?? null,
    held_table_count: heldTableReviewItems.length,
    manual_gate_count: reviewGates.filter((gate) => gate.status === "manual_required").length,
    observation_row_count: plan.summary?.observation_row_count ?? null,
    pass_gate_count: reviewGates.filter((gate) => gate.status === "pass").length,
    payload_body_output_count: apply.summary?.payload_body_output_count ?? null,
    raw_snapshot_row_count: apply.summary?.raw_snapshot_row_count ?? null,
    readback_required_count: reviewGates.filter((gate) => gate.gate_id === "held_db_readback_required").length,
    ready_raw_snapshot_payload_count: apply.summary?.ready_raw_snapshot_payload_count ?? null,
    reconciliation_row_count: plan.summary?.reconciliation_row_count ?? null,
    review_gate_count: reviewGates.length,
    source_batch_row_count: plan.summary?.source_batch_row_count ?? null,
    source_run_row_count: plan.summary?.source_run_row_count ?? null,
    sql_text_output_count: apply.summary?.sql_text_output_count ?? null,
    supplement_candidate_row_count: plan.summary?.supplement_candidate_row_count ?? null,
    total_row_count: apply.summary?.total_row_count ?? null,
    unresolved_source_observation_count: plan.summary?.unresolved_source_observation_count ?? null,
    writes_database_count: apply.summary?.writes_database_count ?? null,
    writes_object_store_count: 0,
    writes_serving_table_count: 0
  };
  const material = {
    apply_packet_hash: apply.packet_hash,
    apply_plan_id: plan.plan_id,
    data_version: plan.data_version,
    held_table_review_items: heldTableReviewItems,
    input_apply_packet_version: apply.version,
    input_apply_plan_version: plan.version,
    mode: live ? "live" : "fixtures",
    reviewGates,
    source_batch_id: plan.source_batch_id,
    source_run_id: plan.source_run_id,
    summary,
    version: REVIEW_PACKET_VERSION
  };

  return {
    apply_packet_hash: apply.packet_hash,
    apply_plan_id: plan.plan_id,
    automation_release_allowed: false,
    blocked_tables: blockedServingTables(),
    canonical_source: "hkex_news",
    counts_and_hashes_only: true,
    data_version: plan.data_version,
    emits_payload_text: false,
    emits_sql_text: false,
    executes_sql: false,
    generated_at: new Date().toISOString(),
    held_table_review_items: heldTableReviewItems,
    input_apply_packet_version: apply.version,
    input_apply_plan_version: plan.version,
    manual_review_required: true,
    mode: live ? "live" : "fixtures",
    packet_hash: prefixedHash("review_packet", material),
    packet_kind: "hk_ipo_public_held_review_packet",
    promotes_facts: false,
    promotion_status: "blocked_pending_manual_review",
    provider: "planetscale_postgres",
    readback_required: true,
    releases_data_version: false,
    requires_db_readback: true,
    requires_object_store_readback: true,
    review_gates: reviewGates,
    review_status: "ready_for_manual_review",
    source_batch_id: plan.source_batch_id,
    source_run_id: plan.source_run_id,
    status: "ok",
    stores_raw_html_in_repo: false,
    summary,
    target_tables: apply.target_tables ?? [],
    third_party_observations_are_canonical: false,
    version: REVIEW_PACKET_VERSION,
    writes_database: false,
    writes_files: false,
    writes_object_store: false,
    writes_serving_tables: false
  };
}

function buildReviewGates(plan, apply, heldTableReviewItems) {
  const totalRowCount = apply.summary?.total_row_count ?? 0;
  const rawSnapshotRowCount = apply.summary?.raw_snapshot_row_count ?? 0;
  const readyRawSnapshotPayloadCount = apply.summary?.ready_raw_snapshot_payload_count ?? 0;
  const unresolvedObservationCount = plan.summary?.unresolved_source_observation_count ?? null;

  return [
    {
      evidence_hash: prefixedHash("gate", {
        packet_hash: apply.packet_hash,
        statement_count: apply.summary?.statement_count,
        target_table_count: apply.summary?.target_table_count,
        totalRowCount
      }),
      gate_id: "held_db_apply_packet_ready",
      required: true,
      row_count: totalRowCount,
      status: "pass",
      target_table_count: apply.summary?.target_table_count ?? null
    },
    {
      evidence_hash: prefixedHash("gate", {
        rawSnapshotRowCount,
        readyRawSnapshotPayloadCount
      }),
      gate_id: "raw_snapshot_payload_envelopes_ready",
      payload_body_output_count: apply.summary?.payload_body_output_count ?? null,
      raw_snapshot_row_count: rawSnapshotRowCount,
      ready_raw_snapshot_payload_count: readyRawSnapshotPayloadCount,
      required: true,
      status: rawSnapshotRowCount === readyRawSnapshotPayloadCount ? "pass" : "blocked"
    },
    {
      evidence_hash: prefixedHash("gate", {
        data_version: plan.data_version,
        held_table_hashes: heldTableReviewItems.map((item) => item.row_group_hash)
      }),
      gate_id: "held_db_readback_required",
      required: true,
      expected_release_state: "held",
      expected_row_count: totalRowCount,
      expected_raw_snapshot_ref_count: rawSnapshotRowCount,
      status: "manual_required"
    },
    {
      evidence_hash: prefixedHash("gate", {
        data_version: plan.data_version,
        unresolvedObservationCount
      }),
      gate_id: "manual_reviewer_required",
      required: true,
      reviewer_scope: "held_public_observation_rows_and_reconciliation_conflicts",
      status: "manual_required"
    },
    {
      blocked_tables: blockedServingTables(),
      evidence_hash: prefixedHash("gate", {
        blocked_tables: blockedServingTables(),
        data_version: plan.data_version
      }),
      gate_id: "serving_promotion_blocked",
      required: true,
      status: "blocked"
    }
  ];
}

function validateReviewPacket(packet, plan, apply, value) {
  const validationErrors = [];
  const contract = value.held_review_packet;

  validationErrors.push(...validateContract(contract));

  if (packet.version !== REVIEW_PACKET_VERSION) validationErrors.push("held review packet version mismatch");
  if (packet.packet_kind !== "hk_ipo_public_held_review_packet") validationErrors.push("packet kind mismatch");
  if (packet.provider !== "planetscale_postgres") validationErrors.push("provider must be planetscale_postgres");
  if (packet.canonical_source !== "hkex_news") validationErrors.push("canonical_source must be hkex_news");
  if (packet.review_status !== "ready_for_manual_review") validationErrors.push("review_status mismatch");
  if (packet.promotion_status !== "blocked_pending_manual_review") validationErrors.push("promotion_status mismatch");
  for (const field of [
    "manual_review_required",
    "readback_required",
    "requires_db_readback",
    "requires_object_store_readback",
    "counts_and_hashes_only"
  ]) {
    if (packet[field] !== true) validationErrors.push(`${field} must be true`);
  }
  for (const field of [
    "automation_release_allowed",
    "emits_payload_text",
    "emits_sql_text",
    "executes_sql",
    "promotes_facts",
    "releases_data_version",
    "stores_raw_html_in_repo",
    "third_party_observations_are_canonical",
    "writes_database",
    "writes_files",
    "writes_object_store",
    "writes_serving_tables"
  ]) {
    if (packet[field] !== false) validationErrors.push(`${field} must be false`);
  }
  if (packet.input_apply_plan_version !== plan.version) {
    validationErrors.push("input_apply_plan_version must match source apply plan");
  }
  if (packet.input_apply_packet_version !== apply.version) {
    validationErrors.push("input_apply_packet_version must match held DB apply packet");
  }
  if (packet.apply_packet_hash !== apply.packet_hash) validationErrors.push("apply_packet_hash mismatch");
  if (packet.summary.total_row_count !== apply.summary?.total_row_count) {
    validationErrors.push("summary.total_row_count must match held DB apply packet");
  }
  if (packet.summary.raw_snapshot_row_count !== apply.summary?.raw_snapshot_row_count) {
    validationErrors.push("summary.raw_snapshot_row_count must match held DB apply packet");
  }
  if (packet.summary.ready_raw_snapshot_payload_count !== apply.summary?.ready_raw_snapshot_payload_count) {
    validationErrors.push("summary.ready_raw_snapshot_payload_count must match held DB apply packet");
  }
  for (const field of [
    "observation_row_count",
    "reconciliation_row_count",
    "supplement_candidate_row_count",
    "unresolved_source_observation_count"
  ]) {
    if (packet.summary[field] !== plan.summary?.[field]) {
      validationErrors.push(`summary.${field} must match source apply plan`);
    }
  }
  for (const field of [
    "payload_body_output_count",
    "sql_text_output_count",
    "unresolved_source_observation_count",
    "writes_database_count",
    "writes_object_store_count",
    "writes_serving_table_count"
  ]) {
    if (packet.summary[field] !== 0) validationErrors.push(`summary.${field} must be 0`);
  }
  for (const table of contract?.target_tables ?? []) {
    if (!packet.target_tables.includes(table)) validationErrors.push(`packet missing target table ${table}`);
  }
  for (const table of contract?.blocked_tables ?? []) {
    if (!packet.blocked_tables.includes(table)) validationErrors.push(`packet missing blocked table ${table}`);
  }
  for (const gateId of contract?.required_review_gates ?? []) {
    if (!packet.review_gates.some((gate) => gate.gate_id === gateId)) {
      validationErrors.push(`packet missing review gate ${gateId}`);
    }
  }
  for (const field of contract?.required_summary_fields ?? []) {
    if (!Object.hasOwn(packet.summary, field)) validationErrors.push(`packet summary missing ${field}`);
  }
  if (packet.summary.pass_gate_count < 2) validationErrors.push("packet must include at least two passing prerequisite gates");
  if (packet.summary.manual_gate_count < 2) validationErrors.push("packet must include manual gates");
  if (packet.summary.blocked_promotion_gate_count < 1) validationErrors.push("packet must block serving promotion");
  for (const item of packet.held_table_review_items) {
    if (!/^[a-z_]+:[a-f0-9]{64}$/u.test(item.row_group_hash)) {
      validationErrors.push(`${item.statement_id} row_group_hash must be prefixed sha256 material`);
    }
  }
  if (containsForbiddenOutput(packet)) {
    validationErrors.push("packet output contains forbidden raw payload, secret, URL, security code, or SQL text material");
  }

  return validationErrors;
}

function validateContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["held_review_packet must be an object"];

  if (value.version !== REVIEW_PACKET_VERSION) validationErrors.push("held_review_packet.version mismatch");
  if (value.script !== "scripts/plan-hk-ipo-public-held-review-packet.mjs") {
    validationErrors.push("held_review_packet.script mismatch");
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-review-packet") {
    validationErrors.push("held_review_packet.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-held-review-packet") {
    validationErrors.push("held_review_packet.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-held-review-packet.mjs --live --check") {
    validationErrors.push("held_review_packet.live_command mismatch");
  }
  if (value.input_apply_plan_script !== applyPlannerScript) {
    validationErrors.push(`held_review_packet.input_apply_plan_script must be ${applyPlannerScript}`);
  }
  if (value.input_apply_packet_script !== heldDbApplyPacketScript) {
    validationErrors.push(`held_review_packet.input_apply_packet_script must be ${heldDbApplyPacketScript}`);
  }
  if (value.provider !== "planetscale_postgres") validationErrors.push("held_review_packet.provider mismatch");
  if (value.packet_kind !== "hk_ipo_public_held_review_packet") {
    validationErrors.push("held_review_packet.packet_kind mismatch");
  }
  if (value.review_status !== "ready_for_manual_review") validationErrors.push("held_review_packet.review_status mismatch");
  if (value.promotion_status !== "blocked_pending_manual_review") {
    validationErrors.push("held_review_packet.promotion_status mismatch");
  }
  for (const field of [
    "manual_review_required",
    "requires_db_readback",
    "requires_object_store_readback",
    "counts_and_hashes_only"
  ]) {
    if (value[field] !== true) validationErrors.push(`held_review_packet.${field} must be true`);
  }
  for (const field of [
    "automation_release_allowed",
    "writes_database",
    "writes_files",
    "writes_object_store",
    "writes_serving_tables",
    "executes_sql",
    "emits_sql_text",
    "emits_payload_text",
    "stores_raw_html_in_repo",
    "promotes_facts",
    "releases_data_version",
    "third_party_observations_are_canonical"
  ]) {
    if (value[field] !== false) validationErrors.push(`held_review_packet.${field} must be false`);
  }
  for (const table of expectedTargetTables()) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_review_packet.target_tables missing ${table}`);
    }
  }
  for (const table of blockedServingTables()) {
    if (!value.blocked_tables?.includes(table)) {
      validationErrors.push(`held_review_packet.blocked_tables missing ${table}`);
    }
  }
  for (const gateId of [
    "held_db_apply_packet_ready",
    "raw_snapshot_payload_envelopes_ready",
    "held_db_readback_required",
    "manual_reviewer_required",
    "serving_promotion_blocked"
  ]) {
    if (!value.required_review_gates?.includes(gateId)) {
      validationErrors.push(`held_review_packet.required_review_gates missing ${gateId}`);
    }
  }
  for (const field of [
    "total_row_count",
    "raw_snapshot_row_count",
    "ready_raw_snapshot_payload_count",
    "observation_row_count",
    "reconciliation_row_count",
    "supplement_candidate_row_count",
    "review_gate_count",
    "pass_gate_count",
    "manual_gate_count",
    "blocked_promotion_gate_count",
    "payload_body_output_count",
    "sql_text_output_count",
    "writes_database_count",
    "writes_object_store_count",
    "writes_serving_table_count",
    "unresolved_source_observation_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`held_review_packet.required_summary_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_review_packet.safe_output_policy must be an object");
  } else {
    for (const field of [
      "no_database_url",
      "no_password",
      "no_secret",
      "no_source_url",
      "no_security_code",
      "no_raw_payload",
      "no_sql_text",
      "counts_and_hashes_only"
    ]) {
      if (policy[field] !== true) validationErrors.push(`held_review_packet.safe_output_policy.${field} must be true`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) return [...validationErrors, "held_review_packet.promotion_guards must be an object"];
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_review_packet.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_review_packet.promotion_guards.${field} must be true`);
    }
  }

  return validationErrors;
}

function summarizePacket(packet) {
  return {
    apply_packet_hash: packet.apply_packet_hash,
    apply_plan_id: packet.apply_plan_id,
    automation_release_allowed: packet.automation_release_allowed,
    blocked_tables: packet.blocked_tables,
    counts_and_hashes_only: packet.counts_and_hashes_only,
    data_version: packet.data_version,
    emits_payload_text: packet.emits_payload_text,
    emits_sql_text: packet.emits_sql_text,
    executes_sql: packet.executes_sql,
    manual_review_required: packet.manual_review_required,
    mode: packet.mode,
    packet_hash: packet.packet_hash,
    packet_kind: packet.packet_kind,
    promotes_facts: packet.promotes_facts,
    promotion_status: packet.promotion_status,
    provider: packet.provider,
    releases_data_version: packet.releases_data_version,
    requires_db_readback: packet.requires_db_readback,
    requires_object_store_readback: packet.requires_object_store_readback,
    review_gates: packet.review_gates,
    review_status: packet.review_status,
    status: packet.status,
    summary: packet.summary,
    target_tables: packet.target_tables,
    third_party_observations_are_canonical: packet.third_party_observations_are_canonical,
    version: packet.version,
    writes_database: packet.writes_database,
    writes_files: packet.writes_files,
    writes_object_store: packet.writes_object_store,
    writes_serving_tables: packet.writes_serving_tables
  };
}

function containsForbiddenOutput(value) {
  const serialized = JSON.stringify(value);
  return [
    /<html/iu,
    /<body/iu,
    /__NUXT__/u,
    /<script/iu,
    /<\/script>/iu,
    /https?:\/\//iu,
    /source_url/iu,
    /security_code/iu,
    /postgres(?:ql)?:\/\//iu,
    /database_url/iu,
    /password/iu,
    /secret/iu,
    /Bearer\s+[A-Za-z0-9._-]{20,}/u,
    /gh[pousr]_[A-Za-z0-9_]{20,}/u,
    /sk-[A-Za-z0-9_-]{20,}/u
  ].some((pattern) => pattern.test(serialized));
}

function expectedTargetTables() {
  return [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.hk_ipo_public_source_run",
    "core.raw_snapshot",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ];
}

function blockedServingTables() {
  return [
    "core.ipo_offering",
    "core.ipo_timetable_event",
    "core.ipo_narrative",
    "core.ipo_cornerstone"
  ];
}

function runJsonScript(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
