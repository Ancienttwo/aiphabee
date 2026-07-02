#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const migrationPath = "deploy/database/migrations/20260624001000_ipo_pipeline_foundation.sql";
const sql = readFileSync(resolve(root, migrationPath), "utf8");
const lowerSql = sql.toLowerCase();
const errors = [];

const requiredTables = [
  "aiphabee_core.vendor_code",
  "aiphabee_core.ipo_offering",
  "aiphabee_core.ipo_narrative",
  "aiphabee_core.ipo_timetable_event",
  "aiphabee_core.ipo_offer_statistic",
  "aiphabee_core.ipo_cornerstone",
  "aiphabee_core.ipo_pool",
  "aiphabee_core.ipo_clawback_tier",
  "aiphabee_core.ipo_allotment_result",
  "aiphabee_core.ipo_allotment_summary",
  "aiphabee_core.ipo_parties",
  "aiphabee_core.ipo_corporate_info",
  "aiphabee_core.ipo_lockup",
  "aiphabee_core.ipo_application_share",
  "aiphabee_core.ipo_pipeline_application",
  "aiphabee_core.ipo_research_signal",
  "aiphabee_governance.ipo_contract"
];
const requiredRecordKinds = [
  "ipo_overview",
  "ipo_summary",
  "ipo_timetable",
  "ipo_offer_statistics",
  "ipo_cornerstone",
  "ipo_pool",
  "ipo_clawback",
  "ipo_allotment",
  "ipo_application",
  "ipo_pipeline",
  "ipo_lockup"
];

for (const table of requiredTables) {
  expectIncludes(`create table if not exists ${table}`, `${table} table`);
}

for (const recordKind of requiredRecordKinds) {
  expectIncludes(`'${recordKind}'`, `${recordKind} raw record kind`);
}

expectIncludes("'ipo_pipeline'", "serving_dataset ipo_pipeline domain");
expectIncludes("default_data_rights_status text not null check (default_data_rights_status = 'default_deny')", "governance default deny");
expectIncludes("market_data_loaded boolean not null default false check (market_data_loaded = false)", "market data disabled");
expectIncludes("live_serving_reads boolean not null default false check (live_serving_reads = false)", "live serving disabled");
expectIncludes("export_allowed boolean not null default false", "export disabled");
expectIncludes("mcp_redistribution_allowed boolean not null default false", "MCP redistribution disabled");
expectIncludes("'ipo_cornerstone.invest_amount'", "cornerstone amount field catalog");
expectIncludes("'blocked'", "blocked field status");
expectIncludes("source text not null default 'aiphabee_research'", "analysis signal separated");

if (/insert\s+into\s+core\.raw_snapshot/iu.test(sql)) {
  errors.push("migration must not load raw IPO source rows");
}

if (/newipo2\.mdb|codetable\.mdb/iu.test(sql)) {
  errors.push("migration must not embed MDB fixture paths or binary data");
}

if (errors.length > 0) {
  console.log(JSON.stringify({ errors, status: "invalid_ipo_schema_contract" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      migration: migrationPath,
      record_kind_count: requiredRecordKinds.length,
      serving_tables: requiredTables.length - 1,
      status: "ok"
    },
    null,
    2
  )
);

function expectIncludes(fragment, label) {
  if (!lowerSql.includes(fragment.toLowerCase())) {
    errors.push(`missing ${label}`);
  }
}
