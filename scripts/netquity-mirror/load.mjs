#!/usr/bin/env node
// Bulk-loads the Netquity vendor mdb tables into the PostgreSQL mirror schema created by
// generate-schema.mjs. Streams mdb-export output directly into `psql \copy` (never buffers
// a whole export in memory) so the 150-200MB files (Biography, CompProfile2) are safe.
//
// Usage:
//   node scripts/netquity-mirror/load.mjs [--only <mdbname>] [--allow-db-write]
//     [--concurrency N] [--source-dir <dir>] [--database-url <url>] [--allow-remote]
//
// Default (no --allow-db-write) is a dry run: prints the table plan with source row counts
// and touches no database. Write mode (--allow-db-write) resolves the database URL from
// --database-url or NETQUITY_DATABASE_URL only (no LOCAL_DATABASE_URL/DATABASE_URL fallback --
// see lib.mjs resolveWriteDatabaseUrl) and refuses a non-local host unless --allow-remote is
// also passed (remote apply is Phase 2 of plans/plan-netquity-pg-mirror.md).

import {
  buildPsqlConnection,
  fail,
  installFailSafetyNet,
  listMdbFiles,
  parseArgs,
  parseCopyRowCount,
  pgTableNameFor,
  preflightMdbTools,
  progress,
  readMdbRowCount,
  readMdbTableNames,
  resolveSourceDir,
  resolveWriteDatabaseUrl,
  runReplaceAllCopy
} from "./lib.mjs";

// fail() throws (rather than process.exit()-ing directly) so that any try/finally cleanup up the
// call stack still runs; this script has no such cleanup (no tmpdir is ever created), so this is
// purely a safety net restoring fail()'s old "clean message, exit 1" behavior instead of an
// uncaught-exception stack trace dump. See lib.mjs installFailSafetyNet / NetquityFailError.
installFailSafetyNet();

const args = parseArgs(process.argv.slice(2), {
  boolean: ["allow-db-write", "allow-remote"],
  string: ["source-dir", "database-url", "only", "concurrency"]
});

preflightMdbTools();

const sourceDir = resolveSourceDir(args);
const writeMode = args.allowDbWrite === true;
const concurrency = args.concurrency === undefined ? 1 : Number.parseInt(args.concurrency, 10);
if (!Number.isInteger(concurrency) || concurrency < 1) {
  fail(`--concurrency must be a positive integer, got: ${args.concurrency}`);
}

let mdbFiles = listMdbFiles(sourceDir);
if (args.only !== undefined) {
  const wanted = args.only.toLowerCase();
  mdbFiles = mdbFiles.filter((file) => file.baseName.toLowerCase() === wanted);
  if (mdbFiles.length === 0) {
    fail(`--only ${args.only} matched no .mdb file in ${sourceDir}`);
  }
}

const plan = [];
for (const file of mdbFiles) {
  for (const mdbTable of readMdbTableNames(file.absPath)) {
    plan.push({
      absPath: file.absPath,
      fileName: file.fileName,
      mdbTable,
      pgTable: pgTableNameFor(mdbTable),
      schema: file.schemaName
    });
  }
}

progress(
  "netquity-load",
  `plan: ${plan.length} table(s) across ${mdbFiles.length} .mdb file(s); write_mode=${writeMode}; concurrency=${concurrency}`
);

if (!writeMode) {
  for (const item of plan) {
    const sourceRows = readMdbRowCount(item.absPath, item.mdbTable);
    console.log(`${item.schema}.${item.pgTable}\tsource=${item.fileName}:${item.mdbTable}\tsource_rows=${sourceRows}`);
  }
  progress("netquity-load", "dry run complete (pass --allow-db-write to load into the database)");
  process.exit(0);
}

const databaseUrl = resolveWriteDatabaseUrl(args);
const { psqlArgv, psqlEnv } = buildPsqlConnection(databaseUrl);

const results = [];

await runWithConcurrency(plan, concurrency, async (item) => {
  const result = await loadTable(psqlArgv, psqlEnv, item);
  results.push(result);
  const status = result.ok ? "OK" : "FAILED";
  const errorSuffix = result.ok ? "" : ` error=${JSON.stringify(result.error)}`;
  progress(
    "netquity-load",
    `${status} ${item.schema}.${item.pgTable} source_rows=${result.sourceRows} loaded_rows=${result.loadedRows ?? "-"} duration_ms=${result.durationMs}${errorSuffix}`
  );
});

const failures = results.filter((result) => !result.ok);
const summary = {
  failed_tables: failures.length,
  failures: failures.map((failure) => ({
    error: failure.error,
    schema: failure.schema,
    table: failure.pgTable
  })),
  status: failures.length === 0 ? "ok" : "failed",
  tables: results.length,
  total_loaded_rows: results.reduce((sum, result) => sum + (result.loadedRows ?? 0), 0),
  total_source_rows: results.reduce((sum, result) => sum + (result.sourceRows ?? 0), 0)
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}

async function runWithConcurrency(items, limit, worker) {
  let cursor = 0;
  async function lane() {
    while (cursor < items.length) {
      const current = items[cursor];
      cursor += 1;
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => lane()));
}

// Every table load.mjs processes uses the replace_all recipe (lib.mjs runReplaceAllCopy) --
// this bootstrap loader predates strategies.json's per-table mode distinction (that is
// update.mjs's job); load.mjs always truncates and reloads the whole file.
async function loadTable(psqlArgv, psqlEnv, item) {
  const startedAt = Date.now();
  const sourceRows = readMdbRowCount(item.absPath, item.mdbTable);

  const result = await runReplaceAllCopy({
    absPath: item.absPath,
    expectedRowCount: sourceRows,
    mdbTable: item.mdbTable,
    pgTable: item.pgTable,
    psqlArgv,
    psqlEnv,
    schema: item.schema
  });

  return {
    durationMs: result.durationMs,
    error: result.error,
    loadedRows: parseCopyRowCount(result.psqlStdout),
    ok: result.ok,
    pgTable: item.pgTable,
    schema: item.schema,
    sourceRows
  };
}
