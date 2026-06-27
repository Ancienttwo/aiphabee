#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const APPLY_PACKET_VERSION = "2026-06-28.hk-ipo-public-held-db-apply-packet.v0";
const applyPlannerScript = "scripts/plan-hk-ipo-public-observation-apply.mjs";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const args = process.argv.slice(2);
const live = args.includes("--live");
const check = args.includes("--check");
const errors = [];

const contract = readJson(contractPath);
const applyPlan = runJsonScript(applyPlannerScript, [live ? "--live" : "--fixtures"]);

if (applyPlan.status !== "ok") errors.push(`apply planner returned ${applyPlan.status}`);

const packet = buildApplyPacket(applyPlan);
if (check) {
  errors.push(...validateApplyPacket(packet, applyPlan, contract));
}

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      packet: summarizePacket(packet),
      status: "invalid_hk_ipo_public_held_db_apply_packet",
      version: APPLY_PACKET_VERSION
    },
    1
  );
}

emit(check ? summarizePacket(packet) : packet, 0);

function buildApplyPacket(plan) {
  const statementPackets = (plan.statement_plan ?? []).map((statement) => buildStatementPacket(statement, plan));
  const targetTables = unique(statementPackets.map((statement) => statement.target_table));
  const rawSnapshotRows = plan.row_groups?.raw_snapshot ?? [];
  const summary = {
    payload_body_output_count: countPayloadBodyOutput(statementPackets, rawSnapshotRows),
    parameter_hash_count: statementPackets.filter((statement) => Boolean(statement.parameter_hash)).length,
    raw_snapshot_row_count: rawSnapshotRows.length,
    ready_raw_snapshot_payload_count: rawSnapshotRows.filter((row) => row.ready_for_sql_payload === true).length,
    ready_statement_count: statementPackets.filter((statement) => statement.ready_for_sql === true).length,
    remote_apply_count: 0,
    row_group_hash_count: statementPackets.filter((statement) => Boolean(statement.row_group_hash)).length,
    source_apply_plan_deferred_raw_snapshot_count: plan.summary?.deferred_raw_snapshot_count ?? null,
    source_external_raw_snapshot_ref_count: plan.summary?.external_raw_snapshot_ref_count ?? null,
    sql_text_output_count: 0,
    statement_count: statementPackets.length,
    target_table_count: targetTables.length,
    total_row_count: statementPackets.reduce((total, statement) => total + statement.row_count, 0),
    unresolved_source_observation_count: plan.summary?.unresolved_source_observation_count ?? null,
    writes_database_count: 0
  };
  const material = {
    apply_plan_id: plan.plan_id,
    data_version: plan.data_version,
    input_apply_plan_version: plan.version,
    mode: live ? "live" : "fixtures",
    source_batch_id: plan.source_batch_id,
    source_run_id: plan.source_run_id,
    statement_packets: statementPackets,
    summary,
    target_tables: targetTables,
    version: APPLY_PACKET_VERSION
  };

  return {
    applies_remote_database: false,
    apply_plan_id: plan.plan_id,
    canonical_source: "hkex_news",
    data_version: plan.data_version,
    emits_payload_text: false,
    emits_sql_text: false,
    executes_sql: false,
    generated_at: new Date().toISOString(),
    input_apply_plan_version: plan.version,
    mode: live ? "live" : "fixtures",
    packet_hash: prefixedHash("packet", material),
    packet_kind: "hk_ipo_public_held_db_apply_packet",
    parameterized_statements: true,
    promotes_facts: false,
    provider: "planetscale_postgres",
    source_batch_id: plan.source_batch_id,
    source_run_id: plan.source_run_id,
    statement_packets: statementPackets,
    status: "ok",
    stores_raw_html_in_repo: false,
    summary,
    target_tables: targetTables,
    version: APPLY_PACKET_VERSION,
    writes_database: false,
    writes_files: false
  };
}

function buildStatementPacket(statement, plan) {
  const rowGroup = rowGroupByStatementId(statement.statement_id);
  const rows = rowGroup ? plan.row_groups?.[rowGroup] ?? [] : [];
  const rowHashes = rows.map((row) => row.row_hash).filter(Boolean);
  const material = {
    apply_plan_id: plan.plan_id,
    parameter_keys: statement.parameter_keys ?? [],
    row_group: rowGroup,
    row_hashes: rowHashes,
    statement_id: statement.statement_id,
    target_table: statement.target_table
  };

  return {
    applies_remote_database: false,
    blocker: statement.blocker ?? null,
    operation: statement.operation,
    parameter_count: (statement.parameter_keys ?? []).length,
    parameter_hash: prefixedHash("parameters", material),
    parameter_keys: statement.parameter_keys ?? [],
    payload_body_output: false,
    ready_for_sql: statement.ready_for_sql === true,
    row_count: statement.row_count ?? 0,
    row_count_from_group: rows.length,
    row_group: rowGroup,
    row_group_hash: prefixedHash("row_group", { row_group: rowGroup, row_hashes: rowHashes }),
    sql_text_emitted: false,
    statement_id: statement.statement_id,
    statement_packet_id: `hkipo_db_apply_${stableHash(material).slice(0, 24)}`,
    target_table: statement.target_table,
    writes_database: false
  };
}

function validateApplyPacket(packet, plan, value) {
  const validationErrors = [];
  const contract = value.held_db_apply_packet;

  validationErrors.push(...validateContract(contract));

  if (packet.version !== APPLY_PACKET_VERSION) validationErrors.push("held DB apply packet version mismatch");
  if (packet.packet_kind !== "hk_ipo_public_held_db_apply_packet") validationErrors.push("packet kind mismatch");
  if (packet.provider !== "planetscale_postgres") validationErrors.push("provider must be planetscale_postgres");
  if (packet.canonical_source !== "hkex_news") validationErrors.push("canonical_source must be hkex_news");
  for (const field of [
    "applies_remote_database",
    "emits_payload_text",
    "emits_sql_text",
    "executes_sql",
    "promotes_facts",
    "stores_raw_html_in_repo",
    "writes_database",
    "writes_files"
  ]) {
    if (packet[field] !== false) validationErrors.push(`${field} must be false`);
  }
  if (packet.parameterized_statements !== true) {
    validationErrors.push("packet must use parameterized statement descriptors");
  }
  for (const field of [
    "applies_remote_database",
    "emits_sql_text",
    "executes_sql",
    "promotes_facts",
    "stores_raw_html_in_repo",
    "writes_database",
    "writes_files"
  ]) {
    if (plan[field] !== false) validationErrors.push(`source apply plan ${field} must be false`);
  }
  if (plan.summary?.deferred_raw_snapshot_count !== 0) {
    validationErrors.push("source apply plan must not retain deferred raw snapshot rows");
  }
  if (plan.summary?.ready_raw_snapshot_payload_count !== packet.summary.raw_snapshot_row_count) {
    validationErrors.push("raw snapshot row count must match source ready payload count");
  }
  if (packet.summary.statement_count !== (contract?.statement_ids ?? []).length) {
    validationErrors.push("statement_count must match contract statement_ids length");
  }
  if (packet.summary.ready_statement_count !== packet.summary.statement_count) {
    validationErrors.push("all statement packets must be ready for SQL");
  }
  if (packet.summary.target_table_count !== (contract?.target_tables ?? []).length) {
    validationErrors.push("target_table_count must match contract target_tables length");
  }
  if (packet.summary.raw_snapshot_row_count !== packet.summary.ready_raw_snapshot_payload_count) {
    validationErrors.push("all raw snapshot rows must have SQL-ready external payload envelopes");
  }
  for (const field of [
    "payload_body_output_count",
    "sql_text_output_count",
    "remote_apply_count",
    "writes_database_count",
    "unresolved_source_observation_count",
    "source_apply_plan_deferred_raw_snapshot_count"
  ]) {
    if (packet.summary[field] !== 0) validationErrors.push(`summary.${field} must be 0`);
  }
  for (const statementId of contract?.statement_ids ?? []) {
    if (!packet.statement_packets.some((statement) => statement.statement_id === statementId)) {
      validationErrors.push(`packet missing statement ${statementId}`);
    }
  }
  for (const table of contract?.target_tables ?? []) {
    if (!packet.target_tables.includes(table)) {
      validationErrors.push(`packet missing target table ${table}`);
    }
  }
  for (const statement of packet.statement_packets) {
    if (statement.writes_database !== false) validationErrors.push(`${statement.statement_id} writes_database must be false`);
    if (statement.applies_remote_database !== false) {
      validationErrors.push(`${statement.statement_id} applies_remote_database must be false`);
    }
    if (statement.sql_text_emitted !== false) validationErrors.push(`${statement.statement_id} sql_text_emitted must be false`);
    if (statement.payload_body_output !== false) validationErrors.push(`${statement.statement_id} payload_body_output must be false`);
    if (statement.ready_for_sql !== true) validationErrors.push(`${statement.statement_id} must be ready_for_sql`);
    if (statement.row_count !== statement.row_count_from_group) {
      validationErrors.push(`${statement.statement_id} row_count must match row group length`);
    }
    if (statement.parameter_count !== statement.parameter_keys.length) {
      validationErrors.push(`${statement.statement_id} parameter_count mismatch`);
    }
    if (!/^[a-z_]+:[a-f0-9]{64}$/u.test(statement.parameter_hash)) {
      validationErrors.push(`${statement.statement_id} parameter_hash must be prefixed sha256 material`);
    }
    if (!/^[a-z_]+:[a-f0-9]{64}$/u.test(statement.row_group_hash)) {
      validationErrors.push(`${statement.statement_id} row_group_hash must be prefixed sha256 material`);
    }
  }
  for (const row of plan.row_groups?.raw_snapshot ?? []) {
    if (row.payload_body_included !== false) {
      validationErrors.push(`${row.raw_snapshot_request_id} raw snapshot row must not include payload body`);
    }
    if (row.ready_for_sql_payload !== true || row.ready_for_sql !== true) {
      validationErrors.push(`${row.raw_snapshot_request_id} raw snapshot row must be SQL payload ready`);
    }
  }
  if (containsForbiddenOutput(packet)) {
    validationErrors.push("packet output contains forbidden raw payload, secret, URL, or SQL text material");
  }

  return validationErrors;
}

function validateContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["held_db_apply_packet must be an object"];
  }
  if (value.version !== APPLY_PACKET_VERSION) validationErrors.push("held_db_apply_packet.version mismatch");
  if (value.script !== "scripts/plan-hk-ipo-public-held-db-apply-packet.mjs") {
    validationErrors.push("held_db_apply_packet.script mismatch");
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-db-apply-packet") {
    validationErrors.push("held_db_apply_packet.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-held-db-apply-packet") {
    validationErrors.push("held_db_apply_packet.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-held-db-apply-packet.mjs --live --check") {
    validationErrors.push("held_db_apply_packet.live_command mismatch");
  }
  if (value.input_apply_plan_script !== applyPlannerScript) {
    validationErrors.push(`held_db_apply_packet.input_apply_plan_script must be ${applyPlannerScript}`);
  }
  if (value.provider !== "planetscale_postgres") validationErrors.push("held_db_apply_packet.provider mismatch");
  if (value.packet_kind !== "hk_ipo_public_held_db_apply_packet") {
    validationErrors.push("held_db_apply_packet.packet_kind mismatch");
  }
  for (const field of [
    "writes_database",
    "writes_files",
    "executes_sql",
    "emits_sql_text",
    "emits_payload_text",
    "applies_remote_database",
    "stores_raw_html_in_repo",
    "promotes_facts"
  ]) {
    if (value[field] !== false) validationErrors.push(`held_db_apply_packet.${field} must be false`);
  }
  if (value.parameterized_statements !== true) {
    validationErrors.push("held_db_apply_packet.parameterized_statements must be true");
  }
  for (const table of expectedTargetTables()) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_db_apply_packet.target_tables missing ${table}`);
    }
  }
  for (const statementId of expectedStatementIds()) {
    if (!value.statement_ids?.includes(statementId)) {
      validationErrors.push(`held_db_apply_packet.statement_ids missing ${statementId}`);
    }
  }
  for (const field of [
    "statement_count",
    "ready_statement_count",
    "target_table_count",
    "total_row_count",
    "raw_snapshot_row_count",
    "ready_raw_snapshot_payload_count",
    "payload_body_output_count",
    "sql_text_output_count",
    "remote_apply_count",
    "writes_database_count",
    "unresolved_source_observation_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`held_db_apply_packet.required_summary_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_db_apply_packet.safe_output_policy must be an object");
  } else {
    for (const field of ["no_database_url", "no_password", "no_secret", "no_sql_text", "no_payload_body", "counts_and_hashes_only"]) {
      if (policy[field] !== true) validationErrors.push(`held_db_apply_packet.safe_output_policy.${field} must be true`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "held_db_apply_packet.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_db_apply_packet.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_db_apply_packet.promotion_guards.${field} must be true`);
    }
  }

  return validationErrors;
}

function summarizePacket(packet) {
  return {
    applies_remote_database: packet.applies_remote_database,
    apply_plan_id: packet.apply_plan_id,
    data_version: packet.data_version,
    emits_payload_text: packet.emits_payload_text,
    emits_sql_text: packet.emits_sql_text,
    executes_sql: packet.executes_sql,
    mode: packet.mode,
    packet_hash: packet.packet_hash,
    packet_kind: packet.packet_kind,
    parameterized_statements: packet.parameterized_statements,
    promotes_facts: packet.promotes_facts,
    provider: packet.provider,
    statement_packets: packet.statement_packets.map((statement) => ({
      operation: statement.operation,
      parameter_count: statement.parameter_count,
      ready_for_sql: statement.ready_for_sql,
      row_count: statement.row_count,
      row_count_from_group: statement.row_count_from_group,
      row_group_hash: statement.row_group_hash,
      statement_id: statement.statement_id,
      statement_packet_id: statement.statement_packet_id,
      target_table: statement.target_table
    })),
    status: packet.status,
    summary: packet.summary,
    target_tables: packet.target_tables,
    version: packet.version,
    writes_database: packet.writes_database,
    writes_files: packet.writes_files
  };
}

function rowGroupByStatementId(statementId) {
  return {
    upsert_core_data_version_batch: "data_version_batch",
    upsert_core_hk_ipo_public_observation: "hk_ipo_public_observation",
    upsert_core_hk_ipo_public_reconciliation_row: "hk_ipo_public_reconciliation_row",
    upsert_core_hk_ipo_public_source_run: "hk_ipo_public_source_run",
    upsert_core_hk_ipo_public_supplement_candidate: "hk_ipo_public_supplement_candidate",
    upsert_core_raw_snapshot: "raw_snapshot",
    upsert_core_raw_source_batch: "raw_source_batch"
  }[statementId];
}

function countPayloadBodyOutput(statementPackets, rawSnapshotRows) {
  return (
    statementPackets.filter((statement) => statement.payload_body_output !== false).length +
    rawSnapshotRows.filter((row) => row.payload_body_included !== false).length
  );
}

function containsForbiddenOutput(value) {
  const serialized = JSON.stringify(value);
  return [
    /<html/iu,
    /<body/iu,
    /__NUXT__/u,
    /<script/iu,
    /<\/script>/iu,
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

function expectedStatementIds() {
  return [
    "upsert_core_raw_source_batch",
    "upsert_core_data_version_batch",
    "upsert_core_hk_ipo_public_source_run",
    "upsert_core_raw_snapshot",
    "upsert_core_hk_ipo_public_observation",
    "upsert_core_hk_ipo_public_reconciliation_row",
    "upsert_core_hk_ipo_public_supplement_candidate"
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

function unique(values) {
  return [...new Set(values)];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
