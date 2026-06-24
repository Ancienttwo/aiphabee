#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["scripts/ingest-ipo-mdb.mjs", "--dry-run", "--manifest"],
  {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 16
  }
);

if (result.status !== 0) {
  console.log(
    JSON.stringify(
      {
        error: result.stderr || result.stdout,
        status: "ipo_etl_manifest_failed"
      },
      null,
      2
    )
  );
  process.exit(1);
}

const errors = [];
let manifest;

try {
  manifest = JSON.parse(result.stdout);
} catch (error) {
  console.log(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error),
        stdout: result.stdout,
        status: "ipo_etl_manifest_invalid_json"
      },
      null,
      2
    )
  );
  process.exit(1);
}

if (manifest.dry_run !== true) {
  errors.push("manifest dry_run must be true");
}

if (manifest.db_writes !== false) {
  errors.push("manifest db_writes must be false");
}

if (manifest.expected_newipo_table_count !== 18) {
  errors.push("manifest must preserve the 18-table NewIPO2.mdb physical table set");
}

if (manifest.referenced_code_table_count !== 6) {
  errors.push("manifest must preserve 6 referenced code tables");
}

if (!Array.isArray(manifest.expected_newipo_tables)) {
  errors.push("expected_newipo_tables must be an array");
} else {
  const names = manifest.expected_newipo_tables.map((table) => table.name);
  for (const required of ["NewIPOInfo", "CompanySummary", "Plan_Info", "LockUpPeriod", "ClawBack"]) {
    if (!names.includes(required)) {
      errors.push(`missing expected table ${required}`);
    }
  }
}

if (manifest.tools?.mdb_tools_ready === true && manifest.status === "dry_run_complete") {
  if (manifest.schema_diff?.status !== "match") {
    errors.push(`schema diff must match actual MDB tables, got ${manifest.schema_diff?.status ?? "missing"}`);
  }
}

if (manifest.write_plan?.data_version_release_state !== "held") {
  errors.push("write plan must default data_version release state to held");
}

if (manifest.write_plan?.remote_held_ingest_requires_explicit_target !== true) {
  errors.push("write plan must require explicit target for remote held ingest");
}

if (manifest.write_plan?.production_write_allowed !== false) {
  errors.push("write plan must not allow production write");
}

if (manifest.write_plan?.runtime_source_of_truth !== "postgres") {
  errors.push("write plan must declare Postgres as the runtime source of truth");
}

if (manifest.write_plan?.supplier_inflow !== "mdb") {
  errors.push("write plan must declare MDB as supplier inflow only");
}

if (manifest.tools?.mdb_tools_ready === true && manifest.code_schema_diff?.status !== "match") {
  errors.push(`referenced code-table diff must match, got ${manifest.code_schema_diff?.status ?? "missing"}`);
}

if (!["dry_run_complete", "blocked_missing_mdb_tools", "dry_run_fixture_missing"].includes(manifest.status)) {
  errors.push(`unexpected manifest status ${manifest.status}`);
}

if (errors.length > 0) {
  console.log(JSON.stringify({ errors, status: "invalid_ipo_etl_manifest" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      mdb_tools_ready: manifest.tools.mdb_tools_ready,
      status: "ok",
      upstream_status: manifest.status
    },
    null,
    2
  )
);
