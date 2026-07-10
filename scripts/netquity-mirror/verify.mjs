#!/usr/bin/env node
// Verifies the PostgreSQL Netquity mirror against the vendor .mdb source of truth: inventory
// pinning (DDL table set vs. --source-dir .mdb table set, exact bidirectional equality), row
// counts, column name/type/order/nullability parity, key parity (PRIMARY KEY, or -- for the
// evidence-backed exceptions in scripts/netquity-mirror/pk-demotions.json -- a UNIQUE
// constraint of the same columns; expected type/columns come from the generated DDL), a single
// streaming data-parity pass per table (NULL counts + numeric sums), and a Chinese-text byte
// round-trip sample for three designated tables. Writes
// _ops/netquity-mirror/out/parity-report.{json,md} and exits 0 iff every loaded table passes
// every check.
//
// Usage:
//   node scripts/netquity-mirror/verify.mjs [--database-url <url>] [--source-dir <dir>]
//     [--migration-file <path>] [--out <dir>]
//   node scripts/netquity-mirror/verify.mjs --mode daily --drop-dir <dir> [--skip-unresolved]
//     [--database-url <url>] [--migration-file <path>]
//   node scripts/netquity-mirror/verify.mjs --self-test
//
// --self-test exercises the streaming CSV tokenizer against fixtures (escape-pair chunk-boundary
// splits, quoted-vs-unquoted NULL-sentinel collision) with no database, mdbtools, or source
// files required; exits 0/1. See scripts/netquity-mirror/README.md.
//
// --mode daily is scope-limited parity for a drop dir update.mjs has already applied (bootstrap
// mode, above, is unchanged): for every table found in the drop dir --
//   - replace_all tables get the exact same full-table check bootstrap mode runs (verifyTable);
//     after a replace_all, the whole table should equal the whole delivered file.
//   - upsert_only tables: the file is read in full and its own per-column aggregates (row count,
//     per-column non-null counts, numeric sums) are compared against the DB rows matched by
//     primary key (a parallel-unnest() virtual join over the file's own PK values -- no temp
//     table/second connection needed), not the whole table (which may hold older history the
//     file no longer carries).
//   - window_replace tables: the file's in-window rows (window_column between that schema's own
//     DataPeriod [start,end]) are aggregate-compared against the DB's in-window rows the same
//     way bootstrap does full tables; the file's out-of-window/NULL-window rows are not
//     re-asserted against the window (that is a legitimate, reported warning at update.mjs write
//     time, not a verify failure) but their key/full-row coverage in the DB is checked -- a
//     staged row silently missing from the DB entirely is still a real failure.
//   - unresolved tables are skipped with --skip-unresolved (same meaning as update.mjs's write
//     mode: refused otherwise).

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";
import {
  assertKeySetsMatch,
  buildPsqlConnection,
  CANONICAL_MIGRATION_FILE,
  commandAvailable,
  dedupCandidates,
  fail,
  listMdbFiles,
  loadStrategies,
  OPS_SCHEMA_NAME,
  parseArgs,
  parseDelSecFile,
  parseMigrationTables,
  pgTableNameFor,
  preflightMdbTools,
  progress,
  quoteIdentifier,
  quoteQualifiedIdentifier,
  readMdbRowCount,
  readMdbTableNames,
  resolveDatabaseUrl,
  resolveDataPeriodWindow,
  resolveDropDirCandidates,
  resolveSourceDir,
  resolveStrategiesPath,
  runCli,
  runPsqlScript
} from "./lib.mjs";

const { Client } = pg;

const TYPE_MAP = {
  "DOUBLE PRECISION": "double precision",
  DATE: "date",
  INTEGER: "integer",
  REAL: "real",
  "TIMESTAMP WITHOUT TIME ZONE": "timestamp without time zone",
  TEXT: "text",
  VARCHAR: "character varying"
};
// DOUBLE PRECISION mirrors Access "Double" (64-bit; effectively lossless through this pipeline,
// empirically confirmed exact or within 1e-9 on real data). REAL mirrors Access "Single" (32-bit,
// ~7 significant decimal digits / ~6e-8 native relative precision) -- summing thousands of
// already-lossy float4 values in a different order (JS sequential vs. Postgres's aggregate) can
// legitimately diverge beyond 1e-9 purely from that native precision limit, empirically observed
// up to ~1.4e-8 on real vendor data with no underlying corruption. 1e-6 keeps ~2 orders of
// magnitude of margin above that observed noise floor while still catching genuine data loss.
const DOUBLE_RELATIVE_EPSILON = 1e-9;
const REAL_RELATIVE_EPSILON = 1e-6;
const NULL_SENTINEL = "NULL";
const SAMPLE_ROW_TARGET = 3;
const CHINESE_ROUND_TRIP_TABLES = new Set(["nq_biography.biography", "nq_compinfo.compinfo", "nq_codetable.areacode"]);
const DEL_SEC_KEY = `${OPS_SCHEMA_NAME}.del_sec`;

// Temp table used by the daily-mode row-level checks (verifyReplaceAllRowLevel/
// verifyUpsertRowLevel/verifyWindowRowLevel). Declared here, at module top, rather than next to
// those functions further down the file: the `await runCli(...)` dispatch below is itself
// top-level code that runs immediately (this is the same temporal-dead-zone class of bug
// documented in update.mjs -- a `const` declared after the top-level code that reaches it via
// mainDaily() is still uninitialized when that code actually runs, since module evaluation is a
// single top-to-bottom pass and wrapping the call in runCli() does not change when it executes).
const VERIFY_TMP_TABLE = quoteIdentifier("tmp_netquity_verify");

const args = parseArgs(process.argv.slice(2), {
  boolean: ["self-test", "skip-unresolved"],
  string: ["database-url", "source-dir", "migration-file", "out", "mode", "drop-dir"]
});

// fail() throws (rather than process.exit()-ing directly) so that mainDaily()'s own
// try/finally tmpdir cleanup still runs on failure; runCli() is the top-level catch that turns
// an uncaught NetquityFailError (message already printed by fail()) or any other error into
// process.exitCode = 1 once that cleanup has completed. main()/mainDaily() still call
// process.exit() directly on their own normal (non-throwing) completion, same as before.
await runCli(async () => {
  if (args.selfTest === true) {
    runSelfTest();
  } else if (args.mode === undefined) {
    await main();
  } else if (args.mode === "daily") {
    await mainDaily();
  } else {
    fail(`Unknown --mode "${args.mode}" (expected "daily", or omit --mode entirely for the bootstrap check)`);
  }
});

async function main() {
  preflightMdbTools();
  const sourceDir = resolveSourceDir(args);
  const databaseUrl = resolveDatabaseUrl(args);
  const migrationPath = resolve(process.cwd(), args.migrationFile ?? CANONICAL_MIGRATION_FILE);
  const outDir = resolve(process.cwd(), args.out ?? "_ops/netquity-mirror/out");
  mkdirSync(outDir, { recursive: true });

  const migrationSql = readFileSync(migrationPath, "utf8");
  const ddlTables = parseMigrationTables(migrationSql);
  const ddlByKey = new Map(ddlTables.map((table) => [`${table.schema}.${table.table}`, table]));

  const mdbFiles = listMdbFiles(sourceDir);

  // Inventory pinning, file/schema level: every schema the DDL expects (besides nq_ops, which is
  // hand-authored, not derived from any .mdb) must have a source .mdb file, and vice versa.
  // Missing/extra files here would otherwise silently narrow or widen the per-table loop below
  // without ever being reported.
  const results = [];
  const ddlSchemas = new Set(ddlTables.map((table) => table.schema).filter((schema) => schema !== OPS_SCHEMA_NAME));
  const sourceSchemas = new Set(mdbFiles.map((file) => file.schemaName));
  for (const schema of ddlSchemas) {
    if (!sourceSchemas.has(schema)) {
      results.push({
        checks: {},
        key: `${schema}.*`,
        status: "fail",
        summary: `schema present in generated migration DDL but no source .mdb file found for it in ${sourceDir}`
      });
      progress("netquity-verify", `FAIL ${schema}.* schema in DDL has no source .mdb file`);
    }
  }
  for (const schema of sourceSchemas) {
    if (!ddlSchemas.has(schema)) {
      results.push({
        checks: {},
        key: `${schema}.*`,
        status: "fail",
        summary: "source .mdb file present but its schema is missing from the generated migration DDL"
      });
      progress("netquity-verify", `FAIL ${schema}.* source .mdb file has no schema in DDL`);
    }
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const seenDdlKeys = new Set();
  try {
    for (const file of mdbFiles) {
      for (const mdbTable of readMdbTableNames(file.absPath)) {
        const pgTable = pgTableNameFor(mdbTable);
        const key = `${file.schemaName}.${pgTable}`;
        const ddl = ddlByKey.get(key);
        if (!ddl) {
          results.push({
            checks: {},
            key,
            status: "fail",
            summary: "source .mdb table has no counterpart in the generated migration DDL"
          });
          progress("netquity-verify", `FAIL ${key} table not found in generated migration DDL`);
          continue;
        }
        seenDdlKeys.add(key);
        const result = await verifyTable(client, file.absPath, mdbTable, ddl);
        results.push(result);
        progress("netquity-verify", `${result.status.toUpperCase()} ${key} ${result.summary}`);
      }
    }

    // Inventory pinning, table level (reverse direction): a DDL table (other than nq_ops.del_sec,
    // which has no vendor .mdb source by design) that no source .mdb table ever matched is either
    // a stale DDL entry or a table that disappeared from a later vendor delivery -- fail closed
    // rather than silently never checking it.
    for (const [key] of ddlByKey) {
      if (key === DEL_SEC_KEY || seenDdlKeys.has(key)) continue;
      results.push({
        checks: {},
        key,
        status: "fail",
        summary: "DDL table has no corresponding source .mdb table (stale DDL entry, or a table removed from the vendor delivery)"
      });
      progress("netquity-verify", `FAIL ${key} DDL table has no corresponding source .mdb table`);
    }

    const delSecDdl = ddlByKey.get(DEL_SEC_KEY);
    if (!delSecDdl) {
      results.push({ checks: {}, key: DEL_SEC_KEY, status: "fail", summary: `${DEL_SEC_KEY} missing from generated migration DDL` });
      progress("netquity-verify", `FAIL ${DEL_SEC_KEY} missing from generated migration DDL`);
    } else {
      const structural = await verifyStructuralOnly(client, delSecDdl);
      results.push(structural);
      progress("netquity-verify", `${structural.status.toUpperCase()} ${DEL_SEC_KEY} ${structural.summary}`);
    }
  } finally {
    await client.end();
  }

  const failing = results.filter((result) => result.status === "fail");
  const skipped = results.filter((result) => result.status === "skipped");
  const passing = results.filter((result) => result.status === "pass");

  const report = {
    database_url_host: safeHost(databaseUrl),
    generated_at: new Date().toISOString(),
    migration_file: args.migrationFile ?? CANONICAL_MIGRATION_FILE,
    source_dir: sourceDir,
    status: failing.length === 0 ? "pass" : "fail",
    tables: results,
    totals: {
      failed: failing.length,
      passed: passing.length,
      skipped: skipped.length,
      total: results.length
    }
  };

  writeFileSync(resolve(outDir, "parity-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(resolve(outDir, "parity-report.md"), renderMarkdown(report));

  console.log(
    JSON.stringify(
      {
        failed: failing.length,
        out_dir: outDir,
        passed: passing.length,
        skipped: skipped.length,
        status: report.status,
        total: results.length
      },
      null,
      2
    )
  );

  process.exit(report.status === "pass" ? 0 : 1);
}

// ---------------------------------------------------------------------------
// --mode daily: scope-limited parity for a drop dir update.mjs has already applied. Bootstrap
// mode above is untouched; this reuses lib.mjs's drop-dir resolution (the same
// resolveDropDirCandidates/dedupCandidates/resolveDataPeriodWindow update.mjs uses, so both
// scripts resolve/dedup a --drop-dir and read a schema's DataPeriod window identically) and
// calls the existing verifyTable() unchanged for replace_all tables. upsert_only/window_replace
// get new, self-contained checks below (verifyUpsertScope/verifyWindowScope) rather than
// threading new parameters through verifyDataParity, so the bootstrap path's tested behavior is
// not altered by this addition.
// ---------------------------------------------------------------------------

async function mainDaily() {
  preflightMdbTools();
  if (!commandAvailable("unzip")) {
    fail("Missing required command on PATH: unzip (needed to resolve .zip drop-dir entries)");
  }
  if (!args.dropDir) {
    fail("Missing required flag --drop-dir <dir> for --mode daily");
  }
  const dropDir = resolve(process.cwd(), args.dropDir);
  const skipUnresolved = args.skipUnresolved === true;
  const databaseUrl = resolveDatabaseUrl(args);
  const migrationPath = resolve(process.cwd(), args.migrationFile ?? CANONICAL_MIGRATION_FILE);
  const outDir = resolve(process.cwd(), args.out ?? "_ops/netquity-mirror/out");
  mkdirSync(outDir, { recursive: true });

  const strategiesPath = resolveStrategiesPath(import.meta.url);
  const strategies = loadStrategies(strategiesPath);
  const strategyByKey = new Map(strategies.map((entry) => [`${entry.schema}.${entry.table}`, entry]));

  const migrationSql = readFileSync(migrationPath, "utf8");
  const ddlTables = parseMigrationTables(migrationSql).filter(
    (table) => !(table.schema === OPS_SCHEMA_NAME && table.table === "del_sec")
  );
  const ddlByKey = new Map(ddlTables.map((table) => [`${table.schema}.${table.table}`, table]));
  const knownSchemas = new Set(ddlTables.map((table) => table.schema));

  // Same bookkeeping-integrity check update.mjs runs, independently reproduced here rather than
  // assumed: strategies.json and the migration DDL must name exactly the same 172 vendor tables,
  // both directions. Runs before the drop dir is even read (and therefore before any DB
  // connection), so a strategies.json/DDL drift introduced after an update.mjs release is still
  // caught by verify, not silently trusted.
  assertKeySetsMatch(new Set(strategyByKey.keys()), new Set(ddlByKey.keys()), "strategies.json", `migration DDL (${migrationPath})`);

  const results = [];
  const tmpRoots = [];
  try {
    const { candidates, delSecFiles } = resolveDropDirCandidates(dropDir, tmpRoots, "netquity-verify-daily");

    // Pre-parse (fail closed on the first malformed line, same grammar update.mjs's writer
    // enforces) before touching the database at all -- mirrors update.mjs's own
    // parse-before-any-write ordering.
    const delSecRows = [];
    for (const filePath of delSecFiles) {
      const parsed = parseDelSecFile(filePath);
      if (parsed.issues.length > 0) {
        fail(`del_sec_*.dat parse error(s):\n${parsed.issues.join("\n")}`);
      }
      delSecRows.push(...parsed.rows);
    }

    const unknown = candidates.filter((candidate) => !knownSchemas.has(candidate.schemaName));
    if (unknown.length > 0) {
      fail(
        `Unknown vendor file(s) in ${dropDir}:\n` +
          unknown.map((candidate) => `  ${candidate.sourceLabel} (resolved schema "${candidate.schemaName}" is not in the migration DDL)`).join("\n")
      );
    }

    const resolvedSchemas = dedupCandidates(candidates, "netquity-verify-daily");

    const planItems = [];
    const unresolvedEncountered = [];
    for (const [schemaName, schemaEntry] of resolvedSchemas) {
      const mdbTableNames = readMdbTableNames(schemaEntry.candidate.absPath);
      schemaEntry.tableNameMap = new Map(mdbTableNames.map((name) => [pgTableNameFor(name), name]));

      for (const mdbTableName of mdbTableNames) {
        const pgTable = pgTableNameFor(mdbTableName);
        const key = `${schemaName}.${pgTable}`;
        const strategy = strategyByKey.get(key);
        if (!strategy) {
          fail(`Delivered table ${key} (source: ${schemaEntry.candidate.sourceLabel}) has no scripts/netquity-mirror/strategies.json entry.`);
        }
        if (strategy.mode === "unresolved") {
          unresolvedEncountered.push(key);
          continue;
        }
        const ddl = ddlByKey.get(key);
        if (!ddl) fail(`Internal error: ${key} has a strategy but no parsed DDL entry.`);
        planItems.push({
          absPath: schemaEntry.candidate.absPath,
          ddl,
          key,
          mdbTable: mdbTableName,
          mode: strategy.mode,
          schemaName,
          windowColumn: strategy.window_column ?? null
        });
      }
    }

    if (unresolvedEncountered.length > 0) {
      if (!skipUnresolved) {
        fail(
          `${unresolvedEncountered.length} delivered table(s) have mode "unresolved" -- refusing to verify. Pass --skip-unresolved to skip them:\n` +
            unresolvedEncountered.map((key) => `  ${key}`).join("\n")
        );
      }
      progress("netquity-verify-daily", `skipping ${unresolvedEncountered.length} unresolved table(s): ${unresolvedEncountered.join(", ")}`);
    }

    const windowPeriodsBySchema = new Map();
    for (const item of planItems) {
      if (item.mode !== "window_replace" || windowPeriodsBySchema.has(item.schemaName)) continue;
      windowPeriodsBySchema.set(item.schemaName, resolveDataPeriodWindow(resolvedSchemas.get(item.schemaName)));
    }

    // Row-level checks (replace_all/upsert_only/window_replace) need an actual `\copy`, so they
    // run as self-contained psql scripts (lib.mjs runPsqlScript), not through a `pg` Client --
    // see the "Row-level (not aggregate) daily parity" comment above verifyReplaceAllRowLevel.
    // The del_sec coverage check is a single parameterized existence query with no file to
    // stage, so it uses a `pg` Client instead (both connect to the same databaseUrl).
    const { psqlArgv, psqlEnv } = buildPsqlConnection(databaseUrl);

    for (const item of planItems) {
      let result;
      if (item.mode === "replace_all") {
        result = await verifyReplaceAllRowLevel(psqlArgv, psqlEnv, item.absPath, item.mdbTable, item.ddl);
      } else if (item.mode === "upsert_only") {
        result = await verifyUpsertRowLevel(psqlArgv, psqlEnv, item.absPath, item.mdbTable, item.ddl);
      } else if (item.mode === "window_replace") {
        const period = windowPeriodsBySchema.get(item.schemaName);
        result = await verifyWindowRowLevel(psqlArgv, psqlEnv, item.absPath, item.mdbTable, item.ddl, item.windowColumn, period);
      } else {
        fail(`Internal error: unhandled mode "${item.mode}" for ${item.key}`);
      }
      results.push(result);
      progress("netquity-verify-daily", `${result.status.toUpperCase()} ${item.key} ${result.summary}`);
    }

    // del_sec coverage: always produces a real report entry when the drop contains del_sec
    // files, even if planItems is empty (a drop containing ONLY del_sec_*.dat files) -- so that
    // case still yields a meaningful, non-vacuous daily verify result instead of a trivial
    // total:0/status:pass.
    if (delSecFiles.length > 0) {
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      try {
        const result = await verifyDelSecCoverage(client, delSecRows);
        results.push(result);
        progress("netquity-verify-daily", `${result.status.toUpperCase()} ${result.key} ${result.summary}`);
      } finally {
        await client.end();
      }
    }
  } finally {
    for (const tmpRoot of tmpRoots) {
      try {
        rmSync(tmpRoot, { force: true, recursive: true });
      } catch {
        // best effort cleanup only
      }
    }
  }

  if (results.length === 0) {
    fail(
      `Daily verify produced no verifiable rows for ${dropDir}; refusing a vacuous pass (all delivered tables may have been skipped as unresolved).`
    );
  }

  const failing = results.filter((result) => result.status === "fail");
  const passing = results.filter((result) => result.status === "pass");

  const report = {
    drop_dir: dropDir,
    generated_at: new Date().toISOString(),
    mode: "daily",
    status: failing.length === 0 ? "pass" : "fail",
    tables: results,
    totals: { failed: failing.length, passed: passing.length, total: results.length }
  };

  writeFileSync(resolve(outDir, "parity-report-daily.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify({ failed: failing.length, out_dir: outDir, passed: passing.length, status: report.status, total: results.length }, null, 2)
  );

  process.exit(report.status === "pass" ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Row-level (not aggregate) daily parity: for every mode, the delivered file's rows are staged
// into a real TEMP table (LIKE target, columns only -- no defaults/constraints/indexes) via
// `\copy`, then compared against the target with bidirectional `EXCEPT ALL` (Postgres set
// difference; NULLs compare as equal to each other under EXCEPT/INTERSECT/UNION's row-comparison
// semantics, so no separate IS NOT DISTINCT FROM machinery is needed here) -- a genuine
// multiset/byte-for-byte comparison, not counts/sums. This requires an actual `\copy`, so these
// run as a single self-contained `psql` script per table (lib.mjs runPsqlScript) rather than
// through the read-only `pg` Client `main()`/mainDaily()'s del_sec check uses -- a `pg.Client`
// connection cannot itself issue `\copy` (that is a psql meta-command, not SQL) without the
// pg-copy-streams addon this repo does not depend on. VERIFY_TMP_TABLE itself is declared at
// module top, alongside DEL_SEC_KEY -- see the comment there.
// ---------------------------------------------------------------------------

function captureMdbExportCsv(absPath, mdbTable) {
  const result = spawnSync("mdb-export", ["-H", "-D", "%Y-%m-%d", "-T", "%Y-%m-%d %H:%M:%S", absPath, mdbTable], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 256
  });
  if (result.status !== 0) {
    fail(`mdb-export failed for ${mdbTable}: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

// Parses a `'<prefix><n>'` line out of psql's stdout -- the same "label a SELECT's own string
// concatenation" trick update.mjs's buildWindowReplaceSql uses for NETQUITY_OUT_OF_WINDOW, reused
// here for every row-level count this file needs back from a psql script's stdout.
function parsePrefixedInt(stdout, prefix) {
  const match = stdout.match(new RegExp(`${prefix}(\\d+)`, "u"));
  if (!match) {
    fail(`Internal error: expected to find "${prefix}<n>" in psql output but did not.\nstdout:\n${stdout.slice(0, 4000)}`);
  }
  return Number.parseInt(match[1], 10);
}

// replace_all, daily mode: bidirectional EXCEPT ALL between the staged file and the WHOLE target
// table. After a correct replace_all update the two must be identical multisets.
async function verifyReplaceAllRowLevel(psqlArgv, psqlEnv, absPath, mdbTable, ddl) {
  const key = `${ddl.schema}.${ddl.table}`;
  const qualifiedTable = quoteQualifiedIdentifier(ddl.schema, ddl.table);
  const colNames = ddl.columns.map((column) => quoteIdentifier(column.name)).join(", ");
  const csv = captureMdbExportCsv(absPath, mdbTable);

  const script = `begin;
create temp table ${VERIFY_TMP_TABLE} (like ${qualifiedTable}) on commit drop;
\\copy ${VERIFY_TMP_TABLE} from stdin with (format csv);
${csv}\\.
select 'NETQUITY_EXTRA_IN_FILE:' || count(*) from (select ${colNames} from ${VERIFY_TMP_TABLE} except all select ${colNames} from ${qualifiedTable}) x;
select 'NETQUITY_EXTRA_IN_DB:' || count(*) from (select ${colNames} from ${qualifiedTable} except all select ${colNames} from ${VERIFY_TMP_TABLE}) y;
commit;
`;
  const result = await runPsqlScript(script, psqlArgv, psqlEnv);
  if (!result.ok) {
    return { checks: {}, key, status: "fail", summary: result.error };
  }
  const extraInFile = parsePrefixedInt(result.stdout, "NETQUITY_EXTRA_IN_FILE:");
  const extraInDb = parsePrefixedInt(result.stdout, "NETQUITY_EXTRA_IN_DB:");
  const ok = extraInFile === 0 && extraInDb === 0;
  return {
    checks: { row_level: { extra_in_db: extraInDb, extra_in_file: extraInFile, ok } },
    key,
    status: ok ? "pass" : "fail",
    summary: ok ? "all checks passed (row-level, whole table)" : `row-level mismatch: extra_in_file=${extraInFile} extra_in_db=${extraInDb}`
  };
}

// upsert_only, daily mode: bidirectional EXCEPT ALL scoped to the staged key set -- the target
// side is `WHERE (<key cols>) IN (SELECT <key cols> FROM <staged temp table>)`, a plain SQL
// subquery now that the file is actually staged in the database (no unnest()/array-parameter
// trick needed, unlike an earlier aggregate-based version of this check). Historical target rows
// whose key is not in this delivery are correctly out of scope -- upsert_only never deletes.
async function verifyUpsertRowLevel(psqlArgv, psqlEnv, absPath, mdbTable, ddl) {
  const key = `${ddl.schema}.${ddl.table}`;
  if (ddl.key.type === "none" || ddl.key.columns.length === 0) {
    return { checks: {}, key, status: "fail", summary: "mode upsert_only but table has no key in the DDL to match rows by" };
  }
  const qualifiedTable = quoteQualifiedIdentifier(ddl.schema, ddl.table);
  const colNames = ddl.columns.map((column) => quoteIdentifier(column.name)).join(", ");
  const pkCols = ddl.key.columns.map((name) => quoteIdentifier(name)).join(", ");
  const csv = captureMdbExportCsv(absPath, mdbTable);

  const scopedTarget = `(select ${colNames} from ${qualifiedTable} where (${pkCols}) in (select ${pkCols} from ${VERIFY_TMP_TABLE}))`;

  const script = `begin;
create temp table ${VERIFY_TMP_TABLE} (like ${qualifiedTable}) on commit drop;
\\copy ${VERIFY_TMP_TABLE} from stdin with (format csv);
${csv}\\.
select 'NETQUITY_EXTRA_IN_FILE:' || count(*) from (select ${colNames} from ${VERIFY_TMP_TABLE} except all select ${colNames} from ${scopedTarget} s) x;
select 'NETQUITY_EXTRA_IN_DB:' || count(*) from (select ${colNames} from ${scopedTarget} s except all select ${colNames} from ${VERIFY_TMP_TABLE}) y;
commit;
`;
  const result = await runPsqlScript(script, psqlArgv, psqlEnv);
  if (!result.ok) {
    return { checks: {}, key, status: "fail", summary: result.error };
  }
  const extraInFile = parsePrefixedInt(result.stdout, "NETQUITY_EXTRA_IN_FILE:");
  const extraInDb = parsePrefixedInt(result.stdout, "NETQUITY_EXTRA_IN_DB:");
  const ok = extraInFile === 0 && extraInDb === 0;
  return {
    checks: { row_level_by_key: { extra_in_db: extraInDb, extra_in_file: extraInFile, ok } },
    key,
    status: ok ? "pass" : "fail",
    summary: ok
      ? "all checks passed (row-level, scoped to staged key set)"
      : `row-level mismatch (scoped to staged key set): extra_in_file=${extraInFile} extra_in_db=${extraInDb}`
  };
}

// window_replace, daily mode: bidirectional EXCEPT ALL for the in-window rows (mirrors
// update.mjs's post-insert gate, but full-row parity, not just a count), plus a full-row (not
// key-only) coverage check for out-of-window/NULL-window staged rows -- every one of them must
// match an IDENTICAL row somewhere in the whole (unscoped) target table, not merely share a key
// with one. Out-of-window/NULL presence itself is reported (mirroring update.mjs's own
// out-of-window warning, see buildWindowReplaceSql), never a failure by itself -- only a missing
// (uncovered) one is.
async function verifyWindowRowLevel(psqlArgv, psqlEnv, absPath, mdbTable, ddl, windowColumn, period) {
  const key = `${ddl.schema}.${ddl.table}`;
  const qualifiedTable = quoteQualifiedIdentifier(ddl.schema, ddl.table);
  const colNames = ddl.columns.map((column) => quoteIdentifier(column.name)).join(", ");
  const windowCol = quoteIdentifier(windowColumn);
  const { end, start } = period;
  const csv = captureMdbExportCsv(absPath, mdbTable);

  const inWindowFile = `(select ${colNames} from ${VERIFY_TMP_TABLE} where ${windowCol} between ${start} and ${end})`;
  const inWindowDb = `(select ${colNames} from ${qualifiedTable} where ${windowCol} between ${start} and ${end})`;
  const outOfWindowFile = `(select ${colNames} from ${VERIFY_TMP_TABLE} where ${windowCol} is null or not (${windowCol} between ${start} and ${end}))`;

  const script = `begin;
create temp table ${VERIFY_TMP_TABLE} (like ${qualifiedTable}) on commit drop;
\\copy ${VERIFY_TMP_TABLE} from stdin with (format csv);
${csv}\\.
select 'NETQUITY_OUT_OF_WINDOW:' || count(*) from ${VERIFY_TMP_TABLE} where ${windowCol} is null or not (${windowCol} between ${start} and ${end});
select 'NETQUITY_EXTRA_IN_FILE:' || count(*) from (${inWindowFile} except all ${inWindowDb}) x;
select 'NETQUITY_EXTRA_IN_DB:' || count(*) from (${inWindowDb} except all ${inWindowFile}) y;
select 'NETQUITY_OUT_OF_WINDOW_UNCOVERED:' || count(*) from (${outOfWindowFile} except all (select ${colNames} from ${qualifiedTable})) z;
commit;
`;
  const result = await runPsqlScript(script, psqlArgv, psqlEnv);
  if (!result.ok) {
    return { checks: {}, key, status: "fail", summary: result.error };
  }
  const outOfWindowCount = parsePrefixedInt(result.stdout, "NETQUITY_OUT_OF_WINDOW:");
  const extraInFile = parsePrefixedInt(result.stdout, "NETQUITY_EXTRA_IN_FILE:");
  const extraInDb = parsePrefixedInt(result.stdout, "NETQUITY_EXTRA_IN_DB:");
  const outOfWindowUncovered = parsePrefixedInt(result.stdout, "NETQUITY_OUT_OF_WINDOW_UNCOVERED:");
  const unsafeKeylessOutOfWindow = ddl.key.type === "none" && outOfWindowCount > 0;
  const ok =
    extraInFile === 0 &&
    extraInDb === 0 &&
    outOfWindowUncovered === 0 &&
    !unsafeKeylessOutOfWindow;

  return {
    checks: {
      in_window: { extra_in_db: extraInDb, extra_in_file: extraInFile, ok: extraInFile === 0 && extraInDb === 0 },
      out_of_window: {
        count: outOfWindowCount,
        keyless_unsafe: unsafeKeylessOutOfWindow,
        ok: outOfWindowUncovered === 0 && !unsafeKeylessOutOfWindow,
        uncovered: outOfWindowUncovered
      }
    },
    key,
    status: ok ? "pass" : "fail",
    summary: ok
      ? `all checks passed (in-window row-level match; out-of-window/NULL: ${outOfWindowCount} row(s), all covered)`
      : unsafeKeylessOutOfWindow
        ? `keyless window_replace has ${outOfWindowCount} out-of-window/NULL row(s); prior revisions cannot be matched safely`
        : `in-window extra_in_file=${extraInFile} extra_in_db=${extraInDb}; out-of-window uncovered=${outOfWindowUncovered}/${outOfWindowCount}`
  };
}

// del_sec_*.dat coverage: every (del_date, code) row parsed from the drop's del_sec_*.dat
// file(s) (lib.mjs parseDelSecFile, the same strict grammar update.mjs's writer uses) must exist
// in nq_ops.del_sec. A single parameterized query (parallel unnest() over the parsed rows' own
// columns, `pg` Client, no \copy/temp table needed -- these files are small, and the check is
// existence-only) rather than a psql script, since there is no file to stage as a DB relation
// here. Always produces a real, non-"skipped" report entry when del_sec files are present in the
// drop, so a drop containing ONLY del_sec files still yields a meaningful (non-empty) daily
// verify result instead of a vacuous total:0/pass.
async function verifyDelSecCoverage(client, delSecRows) {
  const delDates = delSecRows.map((row) => row.delDate);
  const codes = delSecRows.map((row) => row.code);
  const result = await client.query(
    `select count(*)::bigint as missing
       from unnest($1::date[], $2::text[]) as f(del_date, code)
      where not exists (select 1 from "nq_ops"."del_sec" d where d.del_date = f.del_date and d.code = f.code)`,
    [delDates, codes]
  );
  const missing = Number(result.rows[0].missing);
  return {
    checks: { coverage: { missing, ok: missing === 0, staged_rows: delSecRows.length } },
    key: DEL_SEC_KEY,
    status: missing === 0 ? "pass" : "fail",
    summary:
      missing === 0
        ? `all ${delSecRows.length} parsed del_sec row(s) found in ${DEL_SEC_KEY}`
        : `${missing} of ${delSecRows.length} parsed del_sec row(s) missing from ${DEL_SEC_KEY}`
  };
}

async function verifyTable(client, absPath, mdbTable, ddl) {
  const key = `${ddl.schema}.${ddl.table}`;
  const checks = {};

  const sourceRowCount = readMdbRowCount(absPath, mdbTable);
  const dbRowCountResult = await client.query(`select count(*)::bigint as n from "${ddl.schema}"."${ddl.table}"`);
  const dbRowCount = Number(dbRowCountResult.rows[0].n);
  checks.row_count = { db: dbRowCount, ok: sourceRowCount === dbRowCount, source: sourceRowCount };

  checks.columns = await verifyColumns(client, ddl);
  checks.key = await verifyKeyParity(client, ddl);

  const { dataParity, sampleRows } = await verifyDataParity(client, absPath, mdbTable, ddl);
  checks.data_parity = dataParity;

  if (CHINESE_ROUND_TRIP_TABLES.has(key)) {
    checks.chinese_round_trip = await verifyChineseRoundTrip(client, ddl, sampleRows);
  }

  const ok = Object.values(checks).every((check) => check.ok);
  return {
    checks,
    key,
    status: ok ? "pass" : "fail",
    summary: summarize(checks)
  };
}

async function verifyStructuralOnly(client, ddl) {
  const key = `${ddl.schema}.${ddl.table}`;
  const checks = {
    columns: await verifyColumns(client, ddl),
    key: await verifyKeyParity(client, ddl)
  };
  const ok = Object.values(checks).every((check) => check.ok);
  return {
    checks,
    key,
    status: ok ? "skipped" : "fail",
    summary: ok
      ? "structural only: no vendor .mdb source in Phase 1 (del_sec_*.dat lands in Phase 3)"
      : summarize(checks)
  };
}

async function verifyColumns(client, ddl) {
  const infoResult = await client.query(
    `select column_name, data_type, character_maximum_length, is_nullable
       from information_schema.columns
      where table_schema = $1 and table_name = $2
      order by ordinal_position`,
    [ddl.schema, ddl.table]
  );
  const issues = [];
  if (infoResult.rows.length !== ddl.columns.length) {
    issues.push(`column count mismatch: ddl=${ddl.columns.length} db=${infoResult.rows.length}`);
  }
  ddl.columns.forEach((expected, index) => {
    const actual = infoResult.rows[index];
    if (!actual) {
      issues.push(`missing db column at position ${index + 1}: ${expected.name}`);
      return;
    }
    if (actual.column_name !== expected.name) {
      issues.push(`name mismatch at position ${index + 1}: ddl=${expected.name} db=${actual.column_name}`);
    }
    const expectedType = TYPE_MAP[expected.type];
    if (!expectedType) {
      issues.push(`unmapped ddl type "${expected.type}" for column ${expected.name}`);
      return;
    }
    if (actual.data_type !== expectedType) {
      issues.push(`type mismatch for ${expected.name}: ddl=${expectedType} db=${actual.data_type}`);
    }
    if (expected.type === "VARCHAR" && Number(actual.character_maximum_length) !== expected.length) {
      issues.push(
        `length mismatch for ${expected.name}: ddl=${expected.length} db=${actual.character_maximum_length}`
      );
    }
    // Nullability parity: every column is expected NULLABLE except a true PRIMARY KEY member
    // (Postgres enforces NOT NULL on those unconditionally via attnotnull -- see
    // scripts/netquity-mirror/README.md "Deviation register"). A demoted table's UNIQUE key
    // columns, and every non-key column, are expected nullable. This is a permanent regression
    // check for the "ALTER TABLE ... DROP CONSTRAINT <x>_pkey does not revert attnotnull"
    // gotcha documented in tasks/notes/netquity-pg-mirror.notes.md -- a stale NOT NULL left
    // over from a since-dropped/demoted PRIMARY KEY must fail here, not surface only as a load
    // failure later.
    const expectedNotNull = ddl.key.type === "primary_key" && ddl.key.columns.includes(expected.name);
    const actualNotNull = actual.is_nullable === "NO";
    if (actualNotNull !== expectedNotNull) {
      issues.push(
        `nullability mismatch for ${expected.name}: expected ${expectedNotNull ? "NOT NULL (primary key member)" : "NULLABLE"}, db=${actualNotNull ? "NOT NULL" : "NULLABLE"}`
      );
    }
  });
  return { issues, ok: issues.length === 0 };
}

// Key parity: the expected key type (primary_key | unique | none) and columns come from the
// generated DDL, which encodes PK-vs-UNIQUE per scripts/netquity-mirror/pk-demotions.json (see
// lib.mjs parseTableKey). A demoted table must show the UNIQUE constraint with the exact column
// list in pg_catalog and no PRIMARY KEY; a non-demoted table must show the reverse.
async function verifyKeyParity(client, ddl) {
  const pkResult = await client.query(
    `select a.attname as column_name
       from pg_index i
       join pg_class t on t.oid = i.indrelid
       join pg_namespace n on n.oid = t.relnamespace
       join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      where n.nspname = $1 and t.relname = $2 and i.indisprimary
      order by array_position(i.indkey, a.attnum)`,
    [ddl.schema, ddl.table]
  );
  const uniqueResult = await client.query(
    `select a.attname as column_name
       from pg_constraint con
       join pg_attribute a on a.attrelid = con.conrelid
       join unnest(con.conkey) with ordinality as k(attnum, ord) on a.attnum = k.attnum
      where con.connamespace = $1::regnamespace and con.conrelid = ($1 || '.' || $2)::regclass
        and con.contype = 'u' and con.conname = $2 || '_key'
      order by k.ord`,
    [ddl.schema, ddl.table]
  );

  const dbPrimaryKey = pkResult.rows.map((row) => row.column_name);
  const dbUnique = uniqueResult.rows.map((row) => row.column_name);

  let dbType = "none";
  let dbColumns = [];
  if (dbPrimaryKey.length > 0) {
    dbType = "primary_key";
    dbColumns = dbPrimaryKey;
  } else if (dbUnique.length > 0) {
    dbType = "unique";
    dbColumns = dbUnique;
  }

  const ok = dbType === ddl.key.type && JSON.stringify(dbColumns) === JSON.stringify(ddl.key.columns);
  return {
    db: { columns: dbColumns, type: dbType },
    ddl: ddl.key,
    ok
  };
}

async function verifyDataParity(client, absPath, mdbTable, ddl) {
  const columns = ddl.columns;
  const sourceNonNull = columns.map(() => 0);
  const sourceIntegerSum = columns.map(() => 0n);
  const sourceFloatSum = columns.map(() => 0);
  const sampleRows = [];
  let sourceRowsSeen = 0;

  await streamMdbExportRows(absPath, mdbTable, (row) => {
    sourceRowsSeen += 1;
    if (sampleRows.length < SAMPLE_ROW_TARGET) {
      sampleRows.push(row);
    }
    for (let index = 0; index < columns.length; index += 1) {
      const field = row[index];
      if (field === undefined || isNullField(field)) continue;
      const raw = field.value;
      sourceNonNull[index] += 1;
      const type = columns[index].type;
      if (type === "INTEGER") {
        const parsed = safeParseInt(raw);
        if (parsed !== null) sourceIntegerSum[index] += parsed;
      } else if (type === "REAL" || type === "DOUBLE PRECISION") {
        const parsed = Number.parseFloat(raw);
        if (Number.isFinite(parsed)) sourceFloatSum[index] += parsed;
      }
    }
  });

  const selectParts = ["count(*)::bigint as total_rows"];
  columns.forEach((column, index) => {
    const alias = `c${index}`;
    selectParts.push(`count("${column.name}")::bigint as "${alias}_nonnull"`);
    if (column.type === "INTEGER") {
      selectParts.push(`sum("${column.name}")::bigint as "${alias}_sum"`);
    } else if (column.type === "REAL" || column.type === "DOUBLE PRECISION") {
      selectParts.push(`sum("${column.name}"::double precision)::double precision as "${alias}_sum"`);
    }
  });
  const dbResult = await client.query(
    `select ${selectParts.join(", ")} from "${ddl.schema}"."${ddl.table}"`
  );
  const dbRow = dbResult.rows[0];

  const issues = [];
  columns.forEach((column, index) => {
    const alias = `c${index}`;
    const dbNonNull = Number(dbRow[`${alias}_nonnull`]);
    if (dbNonNull !== sourceNonNull[index]) {
      issues.push(
        `non-null count mismatch for ${column.name}: source=${sourceNonNull[index]} db=${dbNonNull}`
      );
    }
    if (column.type === "INTEGER") {
      const dbSum = dbRow[`${alias}_sum`] === null ? 0n : BigInt(dbRow[`${alias}_sum`]);
      if (dbSum !== sourceIntegerSum[index]) {
        issues.push(`integer sum mismatch for ${column.name}: source=${sourceIntegerSum[index]} db=${dbSum}`);
      }
    } else if (column.type === "REAL" || column.type === "DOUBLE PRECISION") {
      const dbSum = dbRow[`${alias}_sum`] === null ? 0 : Number(dbRow[`${alias}_sum`]);
      const epsilon = column.type === "REAL" ? REAL_RELATIVE_EPSILON : DOUBLE_RELATIVE_EPSILON;
      if (!withinRelativeEpsilon(sourceFloatSum[index], dbSum, epsilon)) {
        issues.push(
          `float sum mismatch for ${column.name}: source=${sourceFloatSum[index]} db=${dbSum} epsilon=${epsilon}`
        );
      }
    }
  });

  return {
    dataParity: { issues, ok: issues.length === 0, sourceRowsSeen },
    sampleRows
  };
}

async function verifyChineseRoundTrip(client, ddl, sampleRows) {
  if (ddl.key.columns.length === 0) {
    return { ok: true, sampled: 0, skippedReason: "table has no primary key or unique key" };
  }
  const chineseColumns = ddl.columns.filter((column) => /^(chi|sim)/u.test(column.name));
  if (chineseColumns.length === 0) {
    return { ok: true, sampled: 0, skippedReason: "no chi*/sim* columns" };
  }
  const colIndex = new Map(ddl.columns.map((column, index) => [column.name, index]));
  const mismatches = [];

  for (const row of sampleRows) {
    const values = ddl.key.columns.map((keyColumn) => {
      const field = row[colIndex.get(keyColumn)];
      const column = ddl.columns[colIndex.get(keyColumn)];
      const value = isNullField(field) ? null : field.value;
      // Number() (not the BigInt-returning safeParseInt) -- these are query-param/report values,
      // not summation accumulators, and key integer codes are always well within safe-integer
      // range.
      return column.type === "INTEGER" && value !== null ? Number(value) : value;
    });
    // IS NOT DISTINCT FROM (not "=") -- a demoted table's UNIQUE key can legitimately hold NULL
    // in a key column (that is the whole point of the demotion), and "=" never matches NULL.
    const whereParts = ddl.key.columns.map((keyColumn, index) => `"${keyColumn}" IS NOT DISTINCT FROM $${index + 1}`);
    const selectCols = chineseColumns.map((column) => `"${column.name}"`).join(", ");
    const dbResult = await client.query(
      `select ${selectCols} from "${ddl.schema}"."${ddl.table}" where ${whereParts.join(" and ")}`,
      values
    );
    if (dbResult.rows.length === 0) {
      mismatches.push({ issue: "row not found in db", key_values: values });
      continue;
    }
    const dbRow = dbResult.rows[0];
    for (const column of chineseColumns) {
      const field = row[colIndex.get(column.name)];
      const sourceValue = isNullField(field) ? null : field.value;
      const dbValue = dbRow[column.name] === null ? null : String(dbRow[column.name]);
      if (sourceValue !== dbValue) {
        mismatches.push({ column: column.name, db: dbValue, key_values: values, source: sourceValue });
      }
    }
  }

  return { mismatches, ok: mismatches.length === 0, sampled: sampleRows.length };
}

// A row is an array of { value, wasQuoted } fields. wasQuoted distinguishes a genuine unquoted
// NULL_SENTINEL occurrence (mdb-export's -0 NULL marker for an actual NULL) from a quoted text
// value that merely happens to equal the sentinel string -- mdb-export always quotes text/varchar
// fields, so a real "NULL" piece of vendor text would arrive as `"NULL"`, not `NULL`. Only the
// unquoted form counts as NULL; see isNullField() below.
function createRowTokenizer(onRow) {
  let field = "";
  let fieldWasQuoted = false;
  let row = [];
  let inQuotes = false;
  // Node delivers stdout in ~64KB chunks. An escaped internal quote ("") in memo/text fields
  // (empirically present, e.g. Biography) can land exactly on a chunk boundary. Any run of
  // trailing quote characters at the end of a chunk is ambiguous (closing quote vs. escape-pair
  // halves) until more input is known, so the ENTIRE trailing run is carried into the next chunk
  // rather than guessing based on just the last character -- a single held-back quote is not
  // enough when 2+ quotes land exactly at the boundary (e.g. `X""` split as `X"` | `"...`).
  let carry = "";

  function pushField() {
    row.push({ value: field, wasQuoted: fieldWasQuoted });
    field = "";
    fieldWasQuoted = false;
  }

  function processChars(text) {
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (inQuotes) {
        if (char === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
        continue;
      }
      if (char === '"' && field === "") {
        inQuotes = true;
        fieldWasQuoted = true;
      } else if (char === ",") {
        pushField();
      } else if (char === "\n") {
        pushField();
        onRow(row);
        row = [];
      } else if (char === "\r") {
        // ignore; the paired \n (if any) performs the row break
      } else {
        field += char;
      }
    }
  }

  return {
    flush() {
      if (carry.length > 0) {
        processChars(carry);
        carry = "";
      }
      if (field.length > 0 || fieldWasQuoted || row.length > 0) {
        pushField();
        onRow(row);
      }
    },
    pushChunk(chunk) {
      const text = carry + chunk;
      let boundary = text.length;
      while (boundary > 0 && text[boundary - 1] === '"') boundary -= 1;
      processChars(text.slice(0, boundary));
      carry = text.slice(boundary);
    }
  };
}

function isNullField(field) {
  return !field.wasQuoted && field.value === NULL_SENTINEL;
}

function streamMdbExportRows(absPath, mdbTable, onRow) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(
      "mdb-export",
      ["-H", "-D", "%Y-%m-%d", "-T", "%Y-%m-%d %H:%M:%S", "-0", NULL_SENTINEL, absPath, mdbTable],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    child.stdout.setEncoding("utf8");

    const tokenizer = createRowTokenizer(onRow);
    child.stdout.on("data", (chunk) => tokenizer.pushChunk(chunk));

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      rejectPromise(new Error(`mdb-export spawn error for ${mdbTable}: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`mdb-export failed for ${mdbTable}: ${stderr.trim()}`));
        return;
      }
      tokenizer.flush();
      resolvePromise();
    });
  });
}

function safeParseInt(raw) {
  const normalized = raw.trim();
  if (!/^-?\d+$/u.test(normalized)) return null;
  try {
    return BigInt(normalized);
  } catch {
    return null;
  }
}

function withinRelativeEpsilon(a, b, epsilon) {
  if (a === b) return true;
  const diff = Math.abs(a - b);
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return diff / scale <= epsilon;
}

function summarize(checks) {
  const parts = [];
  for (const [name, check] of Object.entries(checks)) {
    if (!check.ok) parts.push(`${name}:FAIL`);
  }
  return parts.length === 0 ? "all checks passed" : parts.join(", ");
}

function safeHost(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return url.hostname === "" ? "local socket" : url.hostname;
  } catch {
    return "unknown";
  }
}

// Exercises createRowTokenizer() against fixtures with no database, mdbtools, or source files
// required. Two things this must prove:
//   1. An escaped-quote ("") pair straddling a forced chunk split, at EVERY possible split
//      offset of a sample row (not just one arbitrarily-chosen split point) -- this is what
//      pushChunk()'s "carry the whole trailing quote run" fix targets.
//   2. Quoted vendor text that happens to equal the NULL sentinel is not treated as NULL, while
//      an unquoted sentinel occurrence is -- this is what the wasQuoted field targets.
function runSelfTest() {
  const failures = [];

  const escapeRow = '1,"say ""hi"" now","plain",2\n';
  const expectedEscapeFields = [
    { value: "1", wasQuoted: false },
    { value: 'say "hi" now', wasQuoted: true },
    { value: "plain", wasQuoted: true },
    { value: "2", wasQuoted: false }
  ];
  const expectedEscapeJson = JSON.stringify([expectedEscapeFields]);

  for (let split = 1; split < escapeRow.length; split += 1) {
    const rows = [];
    const tokenizer = createRowTokenizer((row) => rows.push(row));
    tokenizer.pushChunk(escapeRow.slice(0, split));
    tokenizer.pushChunk(escapeRow.slice(split));
    tokenizer.flush();
    const actualJson = JSON.stringify(rows);
    if (actualJson !== expectedEscapeJson) {
      failures.push(`escape-pair split at offset ${split}/${escapeRow.length}: expected ${expectedEscapeJson}, got ${actualJson}`);
    }
  }

  {
    const rows = [];
    const tokenizer = createRowTokenizer((row) => rows.push(row));
    for (const char of escapeRow) tokenizer.pushChunk(char);
    tokenizer.flush();
    const actualJson = JSON.stringify(rows);
    if (actualJson !== expectedEscapeJson) {
      failures.push(`escape-pair all-1-char-chunks: expected ${expectedEscapeJson}, got ${actualJson}`);
    }
  }

  {
    const nullRow = `1,"${NULL_SENTINEL}",${NULL_SENTINEL},3\n`;
    const rows = [];
    const tokenizer = createRowTokenizer((row) => rows.push(row));
    tokenizer.pushChunk(nullRow);
    tokenizer.flush();
    const row = rows[0];
    if (!row || row.length !== 4) {
      failures.push(`null-sentinel fixture: expected 4 fields, got ${row ? row.length : "no row"}`);
    } else {
      if (isNullField(row[1])) {
        failures.push(`null-sentinel fixture: quoted "${NULL_SENTINEL}" text was incorrectly treated as NULL`);
      }
      if (!isNullField(row[2])) {
        failures.push(`null-sentinel fixture: unquoted ${NULL_SENTINEL} sentinel was not treated as NULL`);
      }
      if (row[0].value !== "1" || row[3].value !== "3") {
        failures.push(`null-sentinel fixture: surrounding fields corrupted: ${JSON.stringify(row)}`);
      }
    }

    // Same fixture, forced to 1-byte chunks, to prove the sentinel/quote distinction survives
    // chunk fragmentation too, not just a single whole-string push.
    const rows2 = [];
    const tokenizer2 = createRowTokenizer((r) => rows2.push(r));
    for (const char of nullRow) tokenizer2.pushChunk(char);
    tokenizer2.flush();
    const row2 = rows2[0];
    if (!row2 || row2.length !== 4 || isNullField(row2[1]) || !isNullField(row2[2])) {
      failures.push(`null-sentinel fixture (1-char chunks): expected same result as whole-string push, got ${JSON.stringify(row2)}`);
    }
  }

  if (failures.length > 0) {
    console.error("verify.mjs --self-test FAILED:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    `verify.mjs --self-test passed: ${escapeRow.length - 1} escape-pair split-offset checks, ` +
      "1 all-1-char-chunk escape-pair check, 2 null-sentinel checks (whole-string + 1-char-chunks)"
  );
  process.exit(0);
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Netquity mirror parity report");
  lines.push("");
  lines.push(`- Generated: ${report.generated_at}`);
  lines.push(`- Migration file: ${report.migration_file}`);
  lines.push(`- Database host: ${report.database_url_host}`);
  lines.push(`- Status: **${report.status.toUpperCase()}**`);
  lines.push(
    `- Totals: ${report.totals.total} tables, ${report.totals.passed} passed, ${report.totals.failed} failed, ${report.totals.skipped} skipped`
  );
  lines.push("");
  lines.push("| Table | Status | Summary |");
  lines.push("| --- | --- | --- |");
  for (const table of report.tables) {
    lines.push(`| ${table.key} | ${table.status} | ${table.summary ?? ""} |`);
  }
  lines.push("");
  const failing = report.tables.filter((table) => table.status === "fail");
  if (failing.length > 0) {
    lines.push("## Failure detail");
    lines.push("");
    for (const table of failing) {
      lines.push(`### ${table.key}`);
      lines.push("");
      lines.push("```json");
      lines.push(JSON.stringify(table.checks, null, 2));
      lines.push("```");
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}
