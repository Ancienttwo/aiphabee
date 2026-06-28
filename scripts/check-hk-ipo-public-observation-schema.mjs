#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const publicSourcesContractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packagePath = "package.json";
const migrationPath = "supabase/migrations/20260628001000_hk_ipo_public_observation_preflight.sql";
const packetCommand = ["scripts/reconcile-hk-ipo-public-observations.mjs", "--fixtures", "--packet", "--check"];
const expectedVersion = "2026-06-28.hk-ipo-public-observation-preflight.v0";
const expectedTables = [
  "aiphabee_core.hk_ipo_public_source_run",
  "aiphabee_core.hk_ipo_public_observation",
  "aiphabee_core.hk_ipo_public_reconciliation_row",
  "aiphabee_core.hk_ipo_public_supplement_candidate",
  "aiphabee_governance.hk_ipo_public_observation_contract"
];
const expectedIndexes = [
  "hk_ipo_public_source_run_version_status_idx",
  "hk_ipo_public_observation_code_field_idx",
  "hk_ipo_public_observation_source_record_idx",
  "hk_ipo_public_observation_value_json_gin",
  "hk_ipo_public_reconciliation_status_idx",
  "hk_ipo_public_supplement_candidate_status_idx"
];
const expectedRecordKinds = [
  "hk_ipo_public_source_record",
  "hk_ipo_public_observation",
  "hk_ipo_public_reconciliation_packet"
];
const errors = [];

const publicSourcesContract = readJson(publicSourcesContractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson(packagePath);
const sql = readText(migrationPath);
const lowerSql = sql.toLowerCase();

validateContract(publicSourcesContract.schema_preflight);
validateDatabaseContract(databaseContract);
validatePackage(packageJson);
validateSql(sql, lowerSql);
validatePacketOutput();

if (errors.length > 0) {
  emit(
    {
      errors,
      migration: migrationPath,
      status: "invalid_hk_ipo_public_observation_schema"
    },
    1
  );
}

emit(
  {
    migration: migrationPath,
    packet_command: `${process.execPath} ${packetCommand.join(" ")}`,
    record_kinds: expectedRecordKinds.length,
    status: "ok",
    tables: expectedTables.length
  },
  0
);

function validateContract(value) {
  if (!isRecord(value)) {
    errors.push("schema_preflight must be an object");
    return;
  }
  if (value.version !== expectedVersion) {
    errors.push("schema_preflight.version mismatch");
  }
  if (value.migration !== migrationPath) {
    errors.push(`schema_preflight.migration must be ${migrationPath}`);
  }
  if (value.checker !== "scripts/check-hk-ipo-public-observation-schema.mjs") {
    errors.push("schema_preflight.checker mismatch");
  }
  if (value.package_script !== "npm run check:hk-ipo-public-observation-schema") {
    errors.push("schema_preflight.package_script mismatch");
  }
  if (value.database_contract !== databaseContractPath) {
    errors.push(`schema_preflight.database_contract must be ${databaseContractPath}`);
  }
  for (const field of [
    "writes_database",
    "applies_remote_database",
    "loads_public_web_data",
    "stores_raw_html_in_repo",
    "promotes_facts"
  ]) {
    if (value[field] !== false) {
      errors.push(`schema_preflight.${field} must be false`);
    }
  }
  if (value.canonical_source !== "hkex_news") {
    errors.push("schema_preflight.canonical_source must be hkex_news");
  }
  for (const table of expectedTables) {
    if (!value.persistent_tables?.includes(table)) {
      errors.push(`schema_preflight.persistent_tables missing ${table}`);
    }
  }
  for (const recordKind of expectedRecordKinds) {
    if (!value.raw_snapshot_record_kinds?.includes(recordKind)) {
      errors.push(`schema_preflight.raw_snapshot_record_kinds missing ${recordKind}`);
    }
  }
  for (const foreignKey of [
    "aiphabee_core.raw_source_batch(source_batch_id)",
    "aiphabee_core.raw_snapshot(raw_snapshot_id)",
    "aiphabee_core.data_version_batch(data_version)"
  ]) {
    if (!value.required_foreign_keys?.includes(foreignKey)) {
      errors.push(`schema_preflight.required_foreign_keys missing ${foreignKey}`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    errors.push("schema_preflight.promotion_guards must be an object");
    return;
  }
  const requiredFalse = [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ];
  for (const field of requiredFalse) {
    if (guards[field] !== false) {
      errors.push(`schema_preflight.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      errors.push(`schema_preflight.promotion_guards.${field} must be true`);
    }
  }
}

function validateDatabaseContract(value) {
  if (!isRecord(value)) {
    errors.push("database contract must be an object");
    return;
  }
  const migration = value.migrations?.find((item) => item.file === migrationPath);
  if (!migration) {
    errors.push(`database contract missing migration ${migrationPath}`);
    return;
  }
  if (migration.market_data !== false) {
    errors.push("schema migration must keep market_data=false");
  }
  if (migration.default_rights_status !== "default_deny") {
    errors.push("schema migration must keep default_rights_status=default_deny");
  }
  for (const table of expectedTables) {
    if (!migration.tables?.includes(table)) {
      errors.push(`database migration contract missing table ${table}`);
    }
  }
  for (const indexName of expectedIndexes) {
    if (!migration.indexes?.includes(indexName)) {
      errors.push(`database migration contract missing index ${indexName}`);
    }
  }
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  if (
    scripts["check:hk-ipo-public-observation-schema"] !==
    "node scripts/check-hk-ipo-public-observation-schema.mjs"
  ) {
    errors.push("package.json must expose check:hk-ipo-public-observation-schema");
  }
  if (!String(scripts.check ?? "").includes("npm run check:hk-ipo-public-observation-schema")) {
    errors.push("root check must include check:hk-ipo-public-observation-schema");
  }
}

function validateSql(rawSql, sqlText) {
  for (const schema of ["aiphabee_core", "aiphabee_governance"]) {
    if (!sqlText.includes(`create schema if not exists ${schema}`)) {
      errors.push(`migration must create schema ${schema}`);
    }
  }
  for (const table of expectedTables) {
    if (!sqlText.includes(`create table if not exists ${table}`)) {
      errors.push(`migration must create table ${table}`);
    }
  }
  for (const indexName of expectedIndexes) {
    if (!sqlText.includes(`create index if not exists ${indexName}`)) {
      errors.push(`migration must create index ${indexName}`);
    }
  }
  for (const recordKind of expectedRecordKinds) {
    if (!sqlText.includes(`'${recordKind}'`)) {
      errors.push(`migration must allow raw_snapshot record kind ${recordKind}`);
    }
  }
  for (const fragment of [
    "source_batch_id text not null references aiphabee_core.raw_source_batch(source_batch_id)",
    "raw_snapshot_id text references aiphabee_core.raw_snapshot(raw_snapshot_id)",
    "data_version text not null references aiphabee_core.data_version_batch(data_version)",
    "third_party_observations_are_canonical boolean not null default false check",
    "source_attribution_required boolean not null default true check",
    "raw_snapshot_required_before_promotion boolean not null default true check",
    "default_data_rights_status text not null default 'default_deny' check",
    "writes_serving_tables_allowed boolean not null default false check",
    "automation_release_allowed boolean not null default false check",
    "raw_html_repo_storage_allowed boolean not null default false check",
    "export_allowed boolean not null default false check",
    "mcp_redistribution_allowed boolean not null default false check",
    "live_network_writes boolean not null default false check",
    "writes_serving_tables boolean not null default false check",
    "promotes_fact boolean not null default false check"
  ]) {
    if (!sqlText.includes(fragment)) {
      errors.push(`migration missing fragment: ${fragment}`);
    }
  }
  if (/insert\s+into\s+core\./iu.test(rawSql)) {
    errors.push("schema migration must not insert rows into core tables");
  }
  if (/https?:\/\/|newipo2\.mdb|codetable\.mdb/iu.test(rawSql)) {
    errors.push("schema migration must not embed source URLs or MDB paths");
  }
}

function validatePacketOutput() {
  const result = spawnSync(process.execPath, packetCommand, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    errors.push("reconciliation packet check did not emit JSON");
    return;
  }
  if (result.status !== 0 || parsed.status !== "ok") {
    errors.push("reconciliation packet fixture check failed");
    for (const error of parsed.errors ?? []) errors.push(error);
  }
  if (parsed.packet_kind !== "hk_ipo_public_reconciliation_packet") {
    errors.push("reconciliation packet kind mismatch");
  }
  if ((parsed.summary?.raw_snapshot_request_count ?? 0) < 1) {
    errors.push("reconciliation packet must include raw snapshot requests");
  }
  if ((parsed.summary?.reconciliation_row_count ?? 0) < 1) {
    errors.push("reconciliation packet must include reconciliation rows");
  }
  if ((parsed.summary?.supplement_candidate_row_count ?? 0) < 1) {
    errors.push("reconciliation packet must include supplement candidate rows");
  }
  if (parsed.writes_database !== false || parsed.writes_files !== false || parsed.promotes_facts !== false) {
    errors.push("reconciliation packet must remain no-write and no-promotion");
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

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
      },
      1
    );
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
