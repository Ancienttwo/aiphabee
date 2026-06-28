#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const PREFLIGHT_VERSION = "2026-06-28.hk-ipo-public-held-promotion-preflight.v0";
const reviewPacketScript = "scripts/plan-hk-ipo-public-held-review-packet.mjs";
const readbackScript = "scripts/check-hk-ipo-public-held-db-readback.mjs";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const args = process.argv.slice(2);
const live = args.includes("--live");
const fixtures = args.includes("--fixtures") || !live;
const check = args.includes("--check");
const reviewFile = optionValue("--review-file") ?? process.env.AIPHABEE_HK_IPO_PUBLIC_HELD_REVIEW_FILE;
const readbackFile = optionValue("--readback-file") ?? process.env.AIPHABEE_HK_IPO_PUBLIC_HELD_DB_READBACK_FILE;
const errors = [];

const contract = readJson(contractPath);
const reviewPacket = reviewFile ? readJson(reviewFile) : runJsonScript(reviewPacketScript, [live ? "--live" : "--fixtures", "--check"]);
if (reviewPacket.status !== "ok") errors.push(`review packet returned ${reviewPacket.status}`);

const readbackPayload = readbackFile ? readJson(readbackFile) : fixtures ? syntheticReadback(reviewPacket) : null;
const readbackSummary = readbackPayload ? normalizeReadbackSummary(readbackPayload) : null;
const readbackErrors = readbackSummary ? validateReadbackSummary(readbackSummary, reviewPacket) : [];
const preflight = buildPreflight(reviewPacket, readbackSummary, readbackErrors);

if (check) {
  errors.push(...validatePreflight(preflight, contract));
}
if (readbackErrors.length > 0) errors.push(...readbackErrors.map((error) => `readback: ${error}`));

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      preflight: summarizePreflight(preflight),
      status: "invalid_hk_ipo_public_held_promotion_preflight",
      version: PREFLIGHT_VERSION
    },
    1
  );
}

emit(check ? summarizePreflight(preflight) : preflight, 0);

function buildPreflight(review, readback, readbackValidationErrors) {
  const readbackSupplied = Boolean(readback);
  const readbackVerified = readbackSupplied && readbackValidationErrors.length === 0;
  const gates = [
    {
      evidence_hash: prefixedHash("gate", {
        packet_hash: review.packet_hash,
        review_status: review.review_status,
        total_row_count: review.summary?.total_row_count
      }),
      gate_id: "held_review_packet_ready",
      required: true,
      status: review.status === "ok" && review.review_status === "ready_for_manual_review" ? "pass" : "blocked"
    },
    {
      evidence_hash: prefixedHash("gate", {
        data_version_hash: readback?.data_version_hash ?? null,
        object_store_missing_count: readback?.object_store_missing_count ?? null,
        readback_hash: readback?.readback_hash ?? null,
        selected_rows: readback?.selected_rows ?? null
      }),
      expected_release_state: "held",
      expected_row_count: review.summary?.total_row_count ?? null,
      gate_id: "held_db_readback_verified",
      readback_supplied: readbackSupplied,
      readback_validation_error_count: readbackValidationErrors.length,
      required: true,
      status: readbackVerified ? "pass" : "blocked"
    },
    {
      evidence_hash: prefixedHash("gate", {
        manual_review_acceptance_supplied: false,
        packet_hash: review.packet_hash
      }),
      gate_id: "manual_review_acceptance_required",
      required: true,
      status: "manual_required"
    },
    {
      blocked_tables: blockedServingTables(),
      evidence_hash: prefixedHash("gate", {
        blocked_tables: blockedServingTables(),
        review_packet_hash: review.packet_hash
      }),
      gate_id: "serving_promotion_blocked",
      required: true,
      status: "blocked"
    }
  ];
  const status = readbackVerified ? "blocked_pending_manual_review" : "blocked_missing_held_db_readback";
  const summary = {
    blocked_gate_count: gates.filter((gate) => gate.status === "blocked").length,
    held_db_readback_verified: readbackVerified,
    manual_gate_count: gates.filter((gate) => gate.status === "manual_required").length,
    object_store_missing_count: readback?.object_store_missing_count ?? null,
    object_store_readback_count: readback?.object_store_readback_count ?? null,
    pass_gate_count: gates.filter((gate) => gate.status === "pass").length,
    promotion_gate_count: gates.length,
    raw_snapshot_payload_leak_count: readback?.raw_snapshot_payload_leak_count ?? null,
    readback_selected_rows: readback?.selected_rows ?? null,
    review_total_row_count: review.summary?.total_row_count ?? null,
    writes_database_count: 0,
    writes_object_store_count: 0,
    writes_serving_table_count: 0
  };
  const material = {
    gates,
    mode: live ? "live" : "fixtures",
    readback_hash: readback?.readback_hash ?? null,
    review_packet_hash: review.packet_hash,
    status,
    summary,
    version: PREFLIGHT_VERSION
  };

  return {
    automation_release_allowed: false,
    blocked_tables: blockedServingTables(),
    counts_and_hashes_only: true,
    data_version: review.data_version,
    data_version_hash: prefixedHash("sha256", review.data_version ?? ""),
    emits_payload_text: false,
    emits_sql_text: false,
    executes_sql: false,
    held_db_readback_status: readbackVerified ? "verified" : "missing_or_invalid",
    input_readback_version: readbackPayloadVersion(readbackPayload),
    input_review_packet_version: review.version,
    manual_review_acceptance_supplied: false,
    manual_review_required: true,
    mode: live ? "live" : "fixtures",
    packet_hash: prefixedHash("promotion_preflight", material),
    packet_kind: "hk_ipo_public_held_promotion_preflight",
    preflight_gates: gates,
    promotes_facts: false,
    promotion_execution_allowed: false,
    promotion_status: "blocked_pending_manual_review",
    provider: "planetscale_postgres",
    readback_hash: readback?.readback_hash ?? null,
    readback_required: true,
    releases_data_version: false,
    review_packet_hash: review.packet_hash,
    review_status: review.review_status,
    status,
    stores_raw_html_in_repo: false,
    summary,
    target_tables: expectedTargetTables(),
    third_party_observations_are_canonical: false,
    version: PREFLIGHT_VERSION,
    writes_database: false,
    writes_files: false,
    writes_object_store: false,
    writes_serving_tables: false
  };
}

function validatePreflight(packet, value) {
  const validationErrors = [];
  const contract = value.held_promotion_preflight;
  validationErrors.push(...validateContract(contract));

  if (packet.version !== PREFLIGHT_VERSION) validationErrors.push("held promotion preflight version mismatch");
  if (packet.packet_kind !== "hk_ipo_public_held_promotion_preflight") validationErrors.push("packet kind mismatch");
  if (packet.provider !== "planetscale_postgres") validationErrors.push("provider must be planetscale_postgres");
  if (packet.review_status !== "ready_for_manual_review") validationErrors.push("review_status mismatch");
  if (packet.promotion_status !== "blocked_pending_manual_review") validationErrors.push("promotion_status mismatch");
  if (!["blocked_missing_held_db_readback", "blocked_pending_manual_review"].includes(packet.status)) {
    validationErrors.push("preflight status must stay blocked until manual review acceptance exists");
  }
  for (const field of ["manual_review_required", "readback_required", "counts_and_hashes_only"]) {
    if (packet[field] !== true) validationErrors.push(`${field} must be true`);
  }
  for (const field of [
    "automation_release_allowed",
    "emits_payload_text",
    "emits_sql_text",
    "executes_sql",
    "manual_review_acceptance_supplied",
    "promotes_facts",
    "promotion_execution_allowed",
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
  for (const gateId of contract?.required_preflight_gates ?? []) {
    if (!packet.preflight_gates.some((gate) => gate.gate_id === gateId)) {
      validationErrors.push(`packet missing preflight gate ${gateId}`);
    }
  }
  for (const field of contract?.required_summary_fields ?? []) {
    if (!Object.hasOwn(packet.summary, field)) validationErrors.push(`packet summary missing ${field}`);
  }
  if (packet.summary.manual_gate_count < 1) validationErrors.push("preflight must retain manual gate");
  if (packet.summary.blocked_gate_count < 1) validationErrors.push("preflight must retain blocked promotion gate");
  if (packet.summary.writes_database_count !== 0) validationErrors.push("writes_database_count must be 0");
  if (packet.summary.writes_object_store_count !== 0) validationErrors.push("writes_object_store_count must be 0");
  if (packet.summary.writes_serving_table_count !== 0) validationErrors.push("writes_serving_table_count must be 0");
  for (const table of contract?.target_tables ?? []) {
    if (!packet.target_tables.includes(table)) validationErrors.push(`packet missing target table ${table}`);
  }
  for (const table of contract?.blocked_tables ?? []) {
    if (!packet.blocked_tables.includes(table)) validationErrors.push(`packet missing blocked table ${table}`);
  }
  if (containsForbiddenOutput(packet)) {
    validationErrors.push("preflight output contains forbidden raw payload, secret, URL, security code, or SQL text material");
  }
  return validationErrors;
}

function validateContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["held_promotion_preflight must be an object"];
  for (const [field, expected] of Object.entries({
    input_readback_script: readbackScript,
    input_review_packet_script: reviewPacketScript,
    package_script: "npm run check:hk-ipo-public-held-promotion-preflight",
    packet_kind: "hk_ipo_public_held_promotion_preflight",
    provider: "planetscale_postgres",
    review_status: "ready_for_manual_review",
    script: "scripts/plan-hk-ipo-public-held-promotion-preflight.mjs",
    version: PREFLIGHT_VERSION
  })) {
    if (value[field] !== expected) validationErrors.push(`held_promotion_preflight.${field} must be ${expected}`);
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-held-promotion-preflight") {
    validationErrors.push("held_promotion_preflight.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs --live --check") {
    validationErrors.push("held_promotion_preflight.live_command mismatch");
  }
  if (
    value.live_with_readback_command !==
    "node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs --live --review-file <review_json> --readback-file <readback_json> --check"
  ) {
    validationErrors.push("held_promotion_preflight.live_with_readback_command mismatch");
  }
  if (value.review_file_supported !== true) {
    validationErrors.push("held_promotion_preflight.review_file_supported must be true");
  }
  if (value.promotion_status !== "blocked_pending_manual_review") {
    validationErrors.push("held_promotion_preflight.promotion_status mismatch");
  }
  for (const field of ["manual_review_required", "manual_review_acceptance_required", "readback_required", "counts_and_hashes_only"]) {
    if (value[field] !== true) validationErrors.push(`held_promotion_preflight.${field} must be true`);
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
    "promotion_execution_allowed",
    "releases_data_version",
    "third_party_observations_are_canonical"
  ]) {
    if (value[field] !== false) validationErrors.push(`held_promotion_preflight.${field} must be false`);
  }
  for (const table of expectedTargetTables()) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_promotion_preflight.target_tables missing ${table}`);
    }
  }
  for (const table of blockedServingTables()) {
    if (!value.blocked_tables?.includes(table)) {
      validationErrors.push(`held_promotion_preflight.blocked_tables missing ${table}`);
    }
  }
  for (const gateId of [
    "held_review_packet_ready",
    "held_db_readback_verified",
    "manual_review_acceptance_required",
    "serving_promotion_blocked"
  ]) {
    if (!value.required_preflight_gates?.includes(gateId)) {
      validationErrors.push(`held_promotion_preflight.required_preflight_gates missing ${gateId}`);
    }
  }
  for (const field of [
    "promotion_gate_count",
    "pass_gate_count",
    "manual_gate_count",
    "blocked_gate_count",
    "held_db_readback_verified",
    "review_total_row_count",
    "readback_selected_rows",
    "object_store_missing_count",
    "object_store_readback_count",
    "raw_snapshot_payload_leak_count",
    "writes_database_count",
    "writes_object_store_count",
    "writes_serving_table_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`held_promotion_preflight.required_summary_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_promotion_preflight.safe_output_policy must be an object");
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
      if (policy[field] !== true) validationErrors.push(`held_promotion_preflight.safe_output_policy.${field} must be true`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) return [...validationErrors, "held_promotion_preflight.promotion_guards must be an object"];
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) validationErrors.push(`held_promotion_preflight.promotion_guards.${field} must be false`);
  }
  for (const field of ["manual_review_acceptance_required", "source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) validationErrors.push(`held_promotion_preflight.promotion_guards.${field} must be true`);
  }
  return validationErrors;
}

function validateReadbackSummary(summary, review) {
  const validationErrors = [];
  const tableCounts = isRecord(summary.table_counts) ? summary.table_counts : {};
  const expectedTableCounts = {
    data_version_batch: review.summary?.data_version_batch_row_count ?? 1,
    hk_ipo_public_observation: review.summary?.observation_row_count ?? null,
    hk_ipo_public_reconciliation_row: review.summary?.reconciliation_row_count ?? null,
    hk_ipo_public_source_run: review.summary?.source_run_row_count ?? 1,
    hk_ipo_public_supplement_candidate: review.summary?.supplement_candidate_row_count ?? null,
    raw_snapshot: review.summary?.raw_snapshot_row_count ?? null,
    raw_source_batch: review.summary?.source_batch_row_count ?? 1
  };
  const expectedDataVersionHash = prefixedHash("sha256", review.data_version ?? "");
  if (summary.status && summary.status !== "ok") validationErrors.push("readback summary status must be ok");
  if (summary.http_status !== undefined && Number(summary.http_status) !== 200) {
    validationErrors.push("readback http_status must be 200");
  }
  if (summary.release_state !== "held") validationErrors.push("readback release_state must be held");
  if (summary.writes_serving_tables !== false) validationErrors.push("readback writes_serving_tables must be false");
  if (Number(summary.selected_rows ?? -1) !== Number(review.summary?.total_row_count ?? -2)) {
    validationErrors.push("readback selected_rows must match review total rows");
  }
  if (Number(summary.payload_envelope_count ?? -1) !== Number(review.summary?.raw_snapshot_row_count ?? -2)) {
    validationErrors.push("readback payload_envelope_count must match raw snapshot rows");
  }
  if (Number(summary.raw_snapshot_payload_leak_count ?? -1) !== 0) {
    validationErrors.push("readback raw_snapshot_payload_leak_count must be 0");
  }
  if (Number(summary.object_store_missing_count ?? -1) !== 0) {
    validationErrors.push("readback object_store_missing_count must be 0");
  }
  if (Number(summary.object_store_readback_count ?? 0) < 1) {
    validationErrors.push("readback object_store_readback_count must be positive");
  }
  if (summary.object_key_count !== undefined && Number(summary.object_store_readback_count ?? -1) !== Number(summary.object_key_count)) {
    validationErrors.push("readback object_store_readback_count must match object_key_count");
  }
  if (summary.data_version_hash !== expectedDataVersionHash) {
    validationErrors.push("readback data_version_hash must match review data_version");
  }
  for (const [table, expectedCount] of Object.entries(expectedTableCounts)) {
    if (expectedCount !== null && Number(tableCounts[table] ?? -1) !== Number(expectedCount)) {
      validationErrors.push(`readback table_counts.${table} must be ${expectedCount}`);
    }
  }
  return validationErrors;
}

function normalizeReadbackSummary(value) {
  if (isRecord(value.summary)) return value.summary;
  if (isRecord(value.held_db_readback_result)) return value.held_db_readback_result;
  return value;
}

function syntheticReadback(review) {
  return {
    summary: {
      data_version_hash: prefixedHash("sha256", review.data_version ?? ""),
      object_key_count: Math.max(1, Math.min(2, Number(review.summary?.raw_snapshot_row_count ?? 1))),
      object_store_missing_count: 0,
      object_store_readback_count: Math.max(1, Math.min(2, Number(review.summary?.raw_snapshot_row_count ?? 1))),
      payload_envelope_count: review.summary?.raw_snapshot_row_count ?? 0,
      raw_snapshot_payload_leak_count: 0,
      readback_hash: prefixedHash("sha256", {
        data_version: review.data_version,
        fixture: "hk_ipo_public_held_promotion_preflight"
      }),
      release_state: "held",
      selected_rows: review.summary?.total_row_count ?? 0,
      status: "ok",
      table_counts: {
        data_version_batch: review.summary?.data_version_batch_row_count ?? 1,
        hk_ipo_public_observation: review.summary?.observation_row_count ?? 0,
        hk_ipo_public_reconciliation_row: review.summary?.reconciliation_row_count ?? 0,
        hk_ipo_public_source_run: review.summary?.source_run_row_count ?? 1,
        hk_ipo_public_supplement_candidate: review.summary?.supplement_candidate_row_count ?? 0,
        raw_snapshot: review.summary?.raw_snapshot_row_count ?? 0,
        raw_source_batch: review.summary?.source_batch_row_count ?? 1
      },
      writes_serving_tables: false
    },
    version: "fixture.synthetic-held-db-readback.v0"
  };
}

function summarizePreflight(packet) {
  return {
    automation_release_allowed: packet.automation_release_allowed,
    blocked_tables: packet.blocked_tables,
    counts_and_hashes_only: packet.counts_and_hashes_only,
    data_version_hash: packet.data_version_hash,
    emits_payload_text: packet.emits_payload_text,
    emits_sql_text: packet.emits_sql_text,
    executes_sql: packet.executes_sql,
    held_db_readback_status: packet.held_db_readback_status,
    manual_review_acceptance_supplied: packet.manual_review_acceptance_supplied,
    manual_review_required: packet.manual_review_required,
    mode: packet.mode,
    packet_hash: packet.packet_hash,
    packet_kind: packet.packet_kind,
    preflight_gates: packet.preflight_gates,
    promotes_facts: packet.promotes_facts,
    promotion_execution_allowed: packet.promotion_execution_allowed,
    promotion_status: packet.promotion_status,
    readback_hash: packet.readback_hash,
    releases_data_version: packet.releases_data_version,
    review_packet_hash: packet.review_packet_hash,
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

function readbackPayloadVersion(value) {
  return isRecord(value) ? value.version ?? null : null;
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function prefixedHash(prefix, value) {
  return `${prefix}:${stableHash(value)}`;
}

function stableHash(value) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
