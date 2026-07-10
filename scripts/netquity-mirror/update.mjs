#!/usr/bin/env node
// Applies a daily/incremental Netquity vendor drop to the PostgreSQL mirror created by
// generate-schema.mjs and bootstrapped by load.mjs. Unlike load.mjs (which always truncates and
// reloads every table), update.mjs dispatches each table to the mode recorded for it in
// strategies.json: replace_all (identical to load.mjs's behavior), upsert_only (merge, no
// deletes), or window_replace (delete + reinsert only the [start,end] window named by that
// table's own DataPeriod control table). See scripts/netquity-mirror/README.md for the full
// mode reference and scripts/netquity-mirror/strategies.json for the per-table evidence.
//
// Usage:
//   node scripts/netquity-mirror/update.mjs --drop-dir <dir> [--allow-db-write]
//     [--skip-unresolved] [--database-url <url>] [--allow-remote]
//
// Default (no --allow-db-write) is a dry run: prints the per-table action plan (mode, resolved
// window where applicable, source row counts) and touches no database. Write mode resolves the
// database URL the same way load.mjs does (--database-url or NETQUITY_DATABASE_URL only, no
// LOCAL_DATABASE_URL/DATABASE_URL fallback; non-local hosts refused without --allow-remote --
// see lib.mjs resolveWriteDatabaseUrl).
//
// The drop dir may contain .mdb files, .zip files (resolved by their INNER .mdb filename -- a
// vendor .zip's own basename does not have to match the schema it contains, e.g. a stale
// ETFData.zip whose inner file is ETFData2.mdb), and del_sec_*.dat files (tab-delimited
// "YYYY/MM/DD\t<code>", upserted into nq_ops.del_sec with ON CONFLICT DO NOTHING -- record-only,
// no other side effect; see strategies.json's absence of a del_sec entry, it is not a vendor
// .mdb table).
//
// Startup assertions run before any database write:
//   - strategies.json and the migration DDL name exactly the same 172 vendor tables (both
//     directions) -- always enforced, dry run or write mode.
//   - every .mdb/.zip resolved from the drop dir maps to a known schema -- always enforced.
//   - every table actually present in a resolved .mdb maps to a strategies.json entry -- always
//     enforced (a delivered table with no strategy is a new-vendor-table signal, not something
//     to guess a mode for).
//   - a table whose strategy mode is "unresolved" is only a HARD failure in write mode (dry run
//     always lists unresolved tables informationally, since the whole point of a dry run is to
//     let the operator see what --skip-unresolved would need to cover before committing to a
//     real run). In write mode, any unresolved table encountered fails the run unless
//     --skip-unresolved is passed, in which case it is skipped with a loud warning and excluded
//     from the executed plan.

import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertKeySetsMatch,
  buildPsqlConnection,
  buildRowCountGateSql,
  CANONICAL_MIGRATION_FILE,
  commandAvailable,
  dedupCandidates,
  fail,
  loadStrategies,
  OPS_SCHEMA_NAME,
  parseArgs,
  parseCopyRowCount,
  parseDelSecFile,
  parseMigrationTables,
  pgTableNameFor,
  preflightMdbTools,
  progress,
  quoteIdentifier,
  quoteQualifiedIdentifier,
  readMdbRowCount,
  readMdbTableNames,
  resolveDataPeriodWindow,
  resolveDropDirCandidates,
  resolveStrategiesPath,
  resolveWriteDatabaseUrl,
  runCli,
  runMdbCopyPipeline,
  runPsqlScript,
  runReplaceAllCopy,
  sqlStringLiteral
} from "./lib.mjs";

const STRATEGIES_PATH = resolveStrategiesPath(import.meta.url);
const DEL_SEC_TABLE = `${OPS_SCHEMA_NAME}.del_sec`;

// Temp table names used by the per-mode SQL builders below. Declared here (module top, before
// the top-level executable code further down starts calling processPlanItem) rather than next
// to the functions that use them -- a `const` declared after the top-level code that reaches it
// is still in its temporal dead zone at call time, since top-level execution starts immediately
// on a single top-to-bottom pass and does not wait for later `const` lines to run first.
const UPSERT_TMP_TABLE = quoteIdentifier("tmp_netquity_upsert");
const WINDOW_TMP_TABLE = quoteIdentifier("tmp_netquity_window");
const DEL_SEC_TMP_TABLE = quoteIdentifier("tmp_netquity_del_sec");

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    boolean: ["allow-db-write", "allow-remote", "skip-unresolved"],
    string: ["drop-dir", "database-url", "migration-file"]
  });

  if (!args.dropDir) {
    fail("Missing required flag --drop-dir <dir>");
  }
  const dropDir = resolve(process.cwd(), args.dropDir);

  preflightMdbTools();
  if (!commandAvailable("unzip")) {
    fail("Missing required command on PATH: unzip (needed to resolve .zip drop-dir entries)");
  }

  const writeMode = args.allowDbWrite === true;
  const skipUnresolved = args.skipUnresolved === true;

  // ---------------------------------------------------------------------------
  // 1. Load strategies.json and the migration DDL; assert they name exactly the same 172 vendor
  //    tables in both directions. This always runs (dry run and write mode alike) -- it is a
  //    bookkeeping-integrity check independent of what any particular drop dir contains.
  // ---------------------------------------------------------------------------

  const strategies = loadStrategies(STRATEGIES_PATH);
  const strategyByKey = new Map(strategies.map((entry) => [`${entry.schema}.${entry.table}`, entry]));

  const migrationPath = resolve(process.cwd(), args.migrationFile ?? CANONICAL_MIGRATION_FILE);
  const migrationSql = readFileSync(migrationPath, "utf8");
  const ddlTables = parseMigrationTables(migrationSql).filter(
    (table) => !(table.schema === OPS_SCHEMA_NAME && table.table === "del_sec")
  );
  const ddlByKey = new Map(ddlTables.map((table) => [`${table.schema}.${table.table}`, table]));

  assertKeySetsMatch(
    new Set(strategyByKey.keys()),
    new Set(ddlByKey.keys()),
    "strategies.json",
    `migration DDL (${migrationPath})`
  );

  const knownSchemas = new Set(ddlTables.map((table) => table.schema));

  progress("netquity-update", `loaded ${strategies.length} strategy entries; cross-checked against ${ddlTables.length} DDL vendor tables (exact match)`);

  // ---------------------------------------------------------------------------
  // 2. Resolve the drop dir: raw .mdb files + .zip files (extracted to tmpdirs, resolved by their
  //    inner .mdb filename), deduplicated per schema (a real drop should only ever contain one
  //    delivery per schema; the local proving fixture _ref/Sample happens to contain both a raw
  //    .mdb and a .zip -- and, for ETFData2/TurnoverBreakdown2, an additional stale-named zip --
  //    for nearly every schema, since it is the full historical bootstrap set rather than a
  //    trimmed daily drop).
  // ---------------------------------------------------------------------------

  const tmpRoots = [];
  try {
    const { candidates, delSecFiles } = resolveDropDirCandidates(dropDir, tmpRoots, "netquity-update");

    const unknown = candidates.filter((candidate) => !knownSchemas.has(candidate.schemaName));
    if (unknown.length > 0) {
      fail(
        `Unknown vendor file(s) in ${dropDir} -- new vendor file, regenerate schema first (npm run netquity:schema) before this file can be processed:\n` +
          unknown.map((candidate) => `  ${candidate.sourceLabel} (resolved schema "${candidate.schemaName}" is not in the migration DDL)`).join("\n")
      );
    }

    const resolvedSchemas = dedupCandidates(candidates, "netquity-update");
    progress("netquity-update", `resolved ${resolvedSchemas.size} schema(s) from ${dropDir}${delSecFiles.length > 0 ? `; ${delSecFiles.length} del_sec_*.dat file(s)` : ""}`);

    // Pre-parse and validate every del_sec_*.dat file up front -- before the per-table plan is
    // even built, let alone any table's transaction commits. A malformed .dat refuses the whole
    // run immediately (fail closed) rather than being discovered only when del_sec's own write
    // step runs last, after every table has already been committed.
    const delSecParsed = parseAllDelSecFiles(delSecFiles);

    // ---------------------------------------------------------------------------
    // 3. Build the per-table plan: for every physically-delivered table in every resolved schema,
    //    look up its strategy (fail hard if a delivered table has no strategies.json entry at
    //    all -- that is a new-vendor-table signal, not something to infer a mode for) and classify
    //    it. Unresolved tables are collected separately from the executable plan.
    // ---------------------------------------------------------------------------

    const planItems = [];
    const unresolvedEncountered = [];

    for (const [schemaName, schemaEntry] of resolvedSchemas) {
      const mdbTableNames = readMdbTableNames(schemaEntry.candidate.absPath);
      const tableNameMap = new Map(mdbTableNames.map((name) => [pgTableNameFor(name), name]));
      schemaEntry.tableNameMap = tableNameMap;

      for (const mdbTableName of mdbTableNames) {
        const pgTable = pgTableNameFor(mdbTableName);
        const key = `${schemaName}.${pgTable}`;
        const strategy = strategyByKey.get(key);
        if (!strategy) {
          fail(
            `Delivered table ${key} (source: ${schemaEntry.candidate.sourceLabel}) has no scripts/netquity-mirror/strategies.json entry -- ` +
              "new vendor table, regenerate schema (npm run netquity:schema) and add a strategies.json entry before this table can be processed."
          );
        }
        if (strategy.mode === "unresolved") {
          unresolvedEncountered.push({ key, reason: strategy.evidence });
          continue;
        }
        const ddl = ddlByKey.get(key);
        if (!ddl) {
          fail(`Internal error: ${key} passed the strategies.json<->DDL cross-check but has no parsed DDL entry.`);
        }
        planItems.push({
          absPath: schemaEntry.candidate.absPath,
          ddl,
          key,
          mdbTable: mdbTableName,
          mode: strategy.mode,
          pgTable,
          schemaName,
          sourceLabel: schemaEntry.candidate.sourceLabel,
          windowColumn: strategy.window_column ?? null
        });
      }
    }

    if (unresolvedEncountered.length > 0) {
      const listing = unresolvedEncountered.map((item) => `  ${item.key}: ${item.reason}`).join("\n");
      if (writeMode && !skipUnresolved) {
        fail(
          `${unresolvedEncountered.length} delivered table(s) have mode "unresolved" (no vendor dictionary) -- refusing to write. ` +
            `Pass --skip-unresolved to skip them with a warning instead:\n${listing}`
        );
      }
      progress(
        "netquity-update",
        `${unresolvedEncountered.length} delivered table(s) have mode "unresolved"${writeMode ? " -- SKIPPING (--skip-unresolved)" : " (dry run: would block a real run without --skip-unresolved)"}:\n${listing}`
      );
    }

    // ---------------------------------------------------------------------------
    // 4. Resolve each window_replace schema's [start,end] once (its own DataPeriod control table
    //    within the SAME delivered .mdb -- read directly from the file, not the database, so this
    //    does not depend on any DB-side write having happened yet this run). Every window_replace
    //    table in a schema shares that schema's single delivery-covering-period window (each event
    //    table just uses its own semantically-relevant date field to test membership in it).
    // ---------------------------------------------------------------------------

    const windowPeriodsBySchema = new Map();
    for (const item of planItems) {
      if (item.mode !== "window_replace" || windowPeriodsBySchema.has(item.schemaName)) continue;
      windowPeriodsBySchema.set(item.schemaName, resolveDataPeriodWindow(resolvedSchemas.get(item.schemaName)));
    }
    for (const item of planItems) {
      if (item.mode === "window_replace") {
        item.periodLiterals = windowPeriodsBySchema.get(item.schemaName);
      }
    }

    // Plan-build-time assertions for the two non-replace_all modes (fail before any write rather
    // than deep inside a per-table SQL failure).
    for (const item of planItems) {
      if (item.mode === "upsert_only" && (item.ddl.key.type === "none" || item.ddl.key.columns.length === 0)) {
        fail(`${item.key}: mode is upsert_only but the table has no PRIMARY KEY/UNIQUE key in the DDL to build ON CONFLICT against.`);
      }
      if (item.mode === "window_replace" && !item.windowColumn) {
        fail(`Internal error: ${item.key} is window_replace but strategies.json has no window_column.`);
      }
    }

    orderPlan(planItems);

    // ---------------------------------------------------------------------------
    // 5. Dry run: print the plan and exit. Write mode: execute sequentially, one transaction per
    //    table (and one more for del_sec, if any files are present), then report.
    // ---------------------------------------------------------------------------

    if (!writeMode) {
      for (const item of planItems) {
        const sourceRows = readMdbRowCount(item.absPath, item.mdbTable);
        const windowSuffix = item.mode === "window_replace" ? `\twindow=${item.windowColumn} [${item.periodLiterals.start}, ${item.periodLiterals.end}]` : "";
        console.log(`${item.key}\tsource=${item.sourceLabel}:${item.mdbTable}\tmode=${item.mode}\tsource_rows=${sourceRows}${windowSuffix}`);
      }
      for (const filePath of delSecFiles) {
        console.log(`${DEL_SEC_TABLE}\tsource=${filePath}\tmode=upsert_ignore_conflicts\tsource_rows=${delSecParsed.rowCountByFile.get(filePath)}`);
      }
      progress("netquity-update", `dry run complete: ${planItems.length} table(s) in plan, ${unresolvedEncountered.length} unresolved, ${delSecFiles.length} del_sec file(s), ${delSecParsed.rows.length} del_sec row(s) parsed and validated (pass --allow-db-write to apply)`);
      return;
    }

    const databaseUrl = resolveWriteDatabaseUrl(args);
    const { psqlArgv, psqlEnv } = buildPsqlConnection(databaseUrl);

    const results = [];
    for (const item of planItems) {
      const result = await processPlanItem(item, psqlArgv, psqlEnv);
      results.push(result);
      const status = result.ok ? "OK" : "FAILED";
      const errorSuffix = result.ok ? "" : ` error=${JSON.stringify(result.error)}`;
      const outOfWindowSuffix = result.outOfWindowCount ? ` out_of_window=${result.outOfWindowCount}` : "";
      progress(
        "netquity-update",
        `${status} ${item.key} mode=${item.mode} rows_in=${result.rowsIn} rows_out=${result.rowsOut ?? "-"} duration_ms=${result.durationMs}${outOfWindowSuffix}${errorSuffix}`
      );
      if (!result.ok) {
        progress(
          "netquity-update",
          `aborting remaining ${planItems.length - results.length} table(s) after the first failure; re-run the same idempotent drop after fixing the cause`
        );
        break;
      }
    }

    let delSecResult = null;
    if (delSecFiles.length > 0 && results.every((result) => result.ok)) {
      delSecResult = await processDelSecFiles(delSecParsed.rows, psqlArgv, psqlEnv);
      const status = delSecResult.ok ? "OK" : "FAILED";
      const errorSuffix = delSecResult.ok ? "" : ` error=${JSON.stringify(delSecResult.error)}`;
      progress(
        "netquity-update",
        `${status} ${DEL_SEC_TABLE} staged=${delSecResult.rowsIn} inserted=${delSecResult.rowsOut ?? "-"} duration_ms=${delSecResult.durationMs}${errorSuffix}`
      );
    }

    const failures = results.filter((result) => !result.ok);
    if (delSecResult && !delSecResult.ok) failures.push({ ...delSecResult, key: DEL_SEC_TABLE });

    // window_replace tables where the staged file contains rows outside [start,end] (or with a
    // NULL window column) are a WARNING, not a failure: the row is genuine vendor-delivered
    // content (e.g. a documented ExDate-IS-NULL carve-out, or a Netquity-system "BA" balancing
    // record landing one day past the DataPeriod boundary) and refusing to load it would be
    // silent data loss. See buildWindowReplaceSql's delete-union comment and README.md.
    const outOfWindowWarnings = results
      .filter((result) => (result.outOfWindowCount ?? 0) > 0)
      .map((result) => ({ key: result.key, out_of_window_count: result.outOfWindowCount }));

    const summary = {
      del_sec: delSecResult
        ? { error: delSecResult.error, inserted_rows: delSecResult.rowsOut, ok: delSecResult.ok, staged_rows: delSecResult.rowsIn }
        : null,
      aborted_tables: planItems.length - results.length,
      failed_tables: failures.length,
      failures: failures.map((failure) => ({ error: failure.error, key: failure.key ?? failure.pgTable })),
      out_of_window_warnings: outOfWindowWarnings,
      skipped_unresolved: unresolvedEncountered.length,
      status: failures.length === 0 ? "ok" : "failed",
      tables: results.length,
      tables_by_mode: countBy(planItems, (item) => item.mode),
      total_rows_in: results.reduce((sum, result) => sum + (result.rowsIn ?? 0), 0),
      total_rows_out: results.reduce((sum, result) => sum + (result.rowsOut ?? 0), 0)
    };

    console.log(JSON.stringify(summary, null, 2));

    // process.exitCode (not process.exit()): let the finally block below run to completion --
    // and the event loop drain normally -- before the process actually exits. See lib.mjs
    // runCli()/NetquityFailError.
    if (failures.length > 0) {
      process.exitCode = 1;
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
}

await runCli(main);

// strategies.json loading/validation (loadStrategies) and key-set cross-checking
// (assertKeySetsMatch) live in lib.mjs, shared with verify.mjs --mode daily.

// Drop-dir resolution (resolveDropDirCandidates, dedupCandidates, resolveDataPeriodWindow) lives
// in lib.mjs, shared with verify.mjs --mode daily so both scripts resolve/dedup a --drop-dir and
// read a schema's DataPeriod window identically.

// Alphabetical by schema.table already satisfies "process UnAdjPrice2 before UnAdjPrice2H when
// both present" (nq_unadjprice2 is a strict string prefix of nq_unadjprice2h, so it always sorts
// first) -- asserted explicitly below rather than left as an unstated coincidence, so a future
// schema-naming change that broke the assumption would fail loudly instead of silently
// reordering these two tables.
function orderPlan(planItems) {
  planItems.sort((a, b) => a.key.localeCompare(b.key));
  const firstH = planItems.findIndex((item) => item.schemaName === "nq_unadjprice2h");
  const lastPlain = findLastIndex(planItems, (item) => item.schemaName === "nq_unadjprice2");
  if (firstH !== -1 && lastPlain !== -1 && firstH < lastPlain) {
    fail("Internal ordering invariant violated: nq_unadjprice2h sorted before nq_unadjprice2.");
  }
}

function findLastIndex(array, predicate) {
  for (let index = array.length - 1; index >= 0; index -= 1) {
    if (predicate(array[index])) return index;
  }
  return -1;
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Per-table execution
// ---------------------------------------------------------------------------

async function processPlanItem(item, psqlArgv, psqlEnv) {
  const startedAt = Date.now();
  const sourceRows = readMdbRowCount(item.absPath, item.mdbTable);

  if (item.mode === "replace_all") {
    const result = await runReplaceAllCopy({
      absPath: item.absPath,
      expectedRowCount: sourceRows,
      mdbTable: item.mdbTable,
      pgTable: item.pgTable,
      psqlArgv,
      psqlEnv,
      schema: item.schemaName
    });
    return {
      durationMs: result.durationMs,
      error: result.error,
      key: item.key,
      ok: result.ok,
      rowsIn: sourceRows,
      rowsOut: parseCopyRowCount(result.psqlStdout)
    };
  }

  if (item.mode === "upsert_only") {
    const { failurePostambleSql, preambleSql, successPostambleSql } = buildUpsertOnlySql(item.ddl, sourceRows);
    const result = await runMdbCopyPipeline({
      absPath: item.absPath,
      failurePostambleSql,
      mdbTable: item.mdbTable,
      preambleSql,
      psqlArgv,
      psqlEnv,
      successPostambleSql
    });
    return {
      durationMs: result.durationMs,
      error: result.error,
      key: item.key,
      ok: result.ok,
      rowsIn: sourceRows,
      rowsOut: parseCopyRowCount(result.psqlStdout)
    };
  }

  if (item.mode === "window_replace") {
    const { failurePostambleSql, preambleSql, successPostambleSql } = buildWindowReplaceSql(item.ddl, item.windowColumn, item.periodLiterals, sourceRows);
    const result = await runMdbCopyPipeline({
      absPath: item.absPath,
      failurePostambleSql,
      mdbTable: item.mdbTable,
      preambleSql,
      psqlArgv,
      psqlEnv,
      successPostambleSql
    });
    return {
      durationMs: result.durationMs,
      error: result.error,
      key: item.key,
      ok: result.ok,
      outOfWindowCount: parseOutOfWindowCount(result.psqlStdout),
      rowsIn: sourceRows,
      rowsOut: parseCopyRowCount(result.psqlStdout)
    };
  }

  fail(`Internal error: unhandled mode "${item.mode}" for ${item.key}`);
  return undefined;
}

// upsert_only: stage the whole delivered file into a TEMP table (LIKE target, so column
// order/types match exactly), gate the temp table's row count against mdb-count (proves the
// \copy brought in everything), then INSERT ... ON CONFLICT (<key columns>) DO UPDATE SET every
// non-key column = EXCLUDED.<col> (DO NOTHING if the table is fully keyed with no non-key
// columns, to avoid ever emitting an empty SET list). No deletes.
function buildUpsertOnlySql(ddl, sourceRows) {
  const qualifiedTable = quoteQualifiedIdentifier(ddl.schema, ddl.table);
  const colNames = ddl.columns.map((column) => quoteIdentifier(column.name));
  const keyColumns = new Set(ddl.key.columns);
  const nonKeyColumns = ddl.columns.filter((column) => !keyColumns.has(column.name));
  const conflictCols = ddl.key.columns.map((name) => quoteIdentifier(name));
  const onConflictAction =
    nonKeyColumns.length > 0
      ? `do update set ${nonKeyColumns.map((column) => `${quoteIdentifier(column.name)} = excluded.${quoteIdentifier(column.name)}`).join(", ")}`
      : "do nothing";

  const preambleSql =
    `begin;\n` +
    `create temp table ${UPSERT_TMP_TABLE} (like ${qualifiedTable} including defaults) on commit drop;\n` +
    `\\copy ${UPSERT_TMP_TABLE} from stdin with (format csv);\n`;

  const gateSql = buildRowCountGateSql(UPSERT_TMP_TABLE, sourceRows, `upsert staging: ${ddl.schema}.${ddl.table}`);
  const insertSql =
    `insert into ${qualifiedTable} (${colNames.join(", ")})\n` +
    `  select ${colNames.join(", ")} from ${UPSERT_TMP_TABLE}\n` +
    `  on conflict (${conflictCols.join(", ")}) ${onConflictAction};`;

  return {
    failurePostambleSql: "rollback;\n",
    preambleSql,
    successPostambleSql: `${gateSql}\n${insertSql}\ncommit;\n`
  };
}

// window_replace: stage the delivered file into a TEMP table, gate its row count against
// mdb-count, then DELETE the UNION of (a) the target's existing [start,end] window and (b) any
// existing target row the staged file is about to re-supply (matched on the table's own key --
// or, for the handful of keyless tables, on every column), INSERT every staged row (in-window or
// not), then gate that the target's post-insert in-window count matches the staged in-window
// count.
//
// The union in (b) is what makes a vendor-documented "ExDate IS NULL" carve-out row (CorpAct
// StockSplit/StockCons, DividendInfo -- see strategies.json evidence) update in place instead of
// colliding on INSERT: such a row's own window column may be NULL or far outside [start,end]
// (its original announce/report date), so leg (a) alone would never delete the stale existing
// row before the fresh one is inserted with the same key. Leg (b) closes that gap by deleting
// whatever the incoming file is about to replace, regardless of that row's own window position --
// "we only ever delete rows that are in-window or about to be re-supplied, never anything else."
//
// A staged row whose window column is NULL or genuinely outside [start,end] (e.g. a real vendor
// data artifact: a Netquity-system "BA" data-balancing record landing one day past the
// DataPeriod boundary, observed in scripts/netquity-mirror/strategies.json's
// nq_sharecapitaldata.data evidence during the Phase 3 proving run) is still loaded -- refusing
// to load genuine vendor-delivered content would be silent data loss. Its presence is surfaced
// as a `NETQUITY_OUT_OF_WINDOW:<n>` count in psql's stdout (parsed by parseOutOfWindowCount) and
// reported as a per-table warning in update.mjs's JSON summary, not a transaction failure.
function buildWindowReplaceSql(ddl, windowColumn, periodLiterals, sourceRows) {
  const qualifiedTable = quoteQualifiedIdentifier(ddl.schema, ddl.table);
  const colNames = ddl.columns.map((column) => quoteIdentifier(column.name));
  const windowColQuoted = quoteIdentifier(windowColumn);
  const { end, start } = periodLiterals;
  const tableLabel = `${ddl.schema}.${ddl.table}`;

  // Match columns for the "about to be re-supplied" delete leg: the table's own key (PRIMARY KEY
  // or, for the 3 pk-demotions.json tables, the demoted UNIQUE key -- nq_corpact.directorchange
  // is both window_replace and pk-demoted, so this must handle a nullable key column too) when
  // one exists; every column (full-row match) for the small set of tables mdb-schema inferred no
  // key for at all (nq_sharecapitaldata.data, nq_subtransaction.daily -- see README "6 tables
  // have no primary key"). IS NOT DISTINCT FROM throughout so a NULL key/column component still
  // matches NULL-to-NULL, rather than "=" silently never matching either side.
  const matchColumns = ddl.key.type !== "none" ? ddl.key.columns : ddl.columns.map((column) => column.name);
  const matchPredicate = matchColumns
    .map((name) => `s.${quoteIdentifier(name)} IS NOT DISTINCT FROM t.${quoteIdentifier(name)}`)
    .join(" AND ");

  const preambleSql =
    `begin;\n` +
    `create temp table ${WINDOW_TMP_TABLE} (like ${qualifiedTable} including defaults) on commit drop;\n` +
    `\\copy ${WINDOW_TMP_TABLE} from stdin with (format csv);\n`;

  const copyGateSql = buildRowCountGateSql(WINDOW_TMP_TABLE, sourceRows, `window staging: ${tableLabel}`);

  const outOfWindowSelectSql = `SELECT 'NETQUITY_OUT_OF_WINDOW:' || count(*) FROM ${WINDOW_TMP_TABLE} s
  WHERE s.${quoteIdentifier(windowColumn)} IS NULL OR NOT (s.${quoteIdentifier(windowColumn)} BETWEEN ${start} AND ${end});`;

  const keylessOutOfWindowGuardSql = ddl.key.type === "none"
    ? `DO $$
DECLARE
  unsafe_count bigint;
BEGIN
  SELECT count(*) INTO unsafe_count FROM ${WINDOW_TMP_TABLE}
  WHERE ${windowColQuoted} IS NULL OR NOT (${windowColQuoted} BETWEEN ${start} AND ${end});
  IF unsafe_count > 0 THEN
    RAISE EXCEPTION 'netquity keyless window-replace refused for %: % staged row(s) are outside the declared window and cannot be matched safely to a prior revision',
      ${sqlStringLiteral(tableLabel)}, unsafe_count;
  END IF;
END $$;`
    : "";

  const deleteSql = `DELETE FROM ${qualifiedTable} t
WHERE (t.${windowColQuoted} BETWEEN ${start} AND ${end})
   OR EXISTS (SELECT 1 FROM ${WINDOW_TMP_TABLE} s WHERE ${matchPredicate});`;

  const insertSql = `INSERT INTO ${qualifiedTable} (${colNames.join(", ")})\n  SELECT ${colNames.join(", ")} FROM ${WINDOW_TMP_TABLE};`;

  const postInsertGateSql = `DO $$
DECLARE
  target_in_window bigint;
  staged_in_window bigint;
BEGIN
  SELECT count(*) INTO target_in_window FROM ${qualifiedTable} WHERE ${windowColQuoted} BETWEEN ${start} AND ${end};
  SELECT count(*) INTO staged_in_window FROM ${WINDOW_TMP_TABLE} WHERE ${windowColQuoted} BETWEEN ${start} AND ${end};
  IF target_in_window <> staged_in_window THEN
    RAISE EXCEPTION 'netquity window-replace post-insert gate failed for %: target in-window count % does not match staged in-window count %',
      ${sqlStringLiteral(tableLabel)}, target_in_window, staged_in_window;
  END IF;
END $$;`;

  return {
    failurePostambleSql: "rollback;\n",
    preambleSql,
    successPostambleSql: `${copyGateSql}\n${outOfWindowSelectSql}\n${keylessOutOfWindowGuardSql}\n${deleteSql}\n${insertSql}\n${postInsertGateSql}\ncommit;\n`
  };
}

function parseOutOfWindowCount(stdout) {
  const match = stdout.match(/NETQUITY_OUT_OF_WINDOW:(\d+)/u);
  return match ? Number.parseInt(match[1], 10) : 0;
}

// ---------------------------------------------------------------------------
// del_sec_*.dat: record-only load into nq_ops.del_sec, ON CONFLICT DO NOTHING, no other side
// effect. Small flat files (tab-delimited "YYYY/MM/DD\t<code>", CRLF line endings) -- parsed and
// validated fully in memory rather than streamed (lib.mjs parseDelSecFile, shared with
// verify.mjs --mode daily's del_sec coverage check), then written to psql as one CSV \copy
// payload.
// ---------------------------------------------------------------------------

// Parses and validates every del_sec_*.dat file in the drop dir up front (called before the
// per-table plan is built -- see the call site in main()), failing the whole run on the first
// malformed line found in ANY file, across ALL files, rather than partway through a run that has
// already committed other tables' writes. Returns the combined parsed rows (used later, as-is,
// by processDelSecFiles -- the file is never re-read/re-parsed) plus a per-file row count for the
// dry-run plan printout.
function parseAllDelSecFiles(filePaths) {
  const rows = [];
  const issues = [];
  const rowCountByFile = new Map();
  for (const filePath of filePaths) {
    const parsed = parseDelSecFile(filePath);
    rowCountByFile.set(filePath, parsed.rows.length);
    rows.push(...parsed.rows);
    issues.push(...parsed.issues);
  }
  if (issues.length > 0) {
    fail(`del_sec_*.dat parse error(s) -- refusing the whole run before any table commit:\n${issues.join("\n")}`);
  }
  return { rowCountByFile, rows };
}

async function processDelSecFiles(rows, psqlArgv, psqlEnv) {
  const startedAt = Date.now();
  if (rows.length === 0) {
    return { durationMs: Date.now() - startedAt, error: null, ok: true, rowsIn: 0, rowsOut: 0 };
  }

  const csvBody = rows.map((row) => `${csvField(row.delDate)},${csvField(row.code)}`).join("\n");
  const preamble =
    `begin;\n` +
    `create temp table ${DEL_SEC_TMP_TABLE} (like "${OPS_SCHEMA_NAME}"."del_sec" including defaults) on commit drop;\n` +
    `\\copy ${DEL_SEC_TMP_TABLE} from stdin with (format csv);\n${csvBody}\n\\.\n`;

  const gateSql = buildRowCountGateSql(DEL_SEC_TMP_TABLE, rows.length, "del_sec staging");
  const insertSql =
    `insert into "${OPS_SCHEMA_NAME}"."del_sec" (del_date, code)\n` +
    `  select del_date, code from ${DEL_SEC_TMP_TABLE}\n` +
    `  on conflict (del_date, code) do nothing;`;

  const script = `${preamble}${gateSql}\n${insertSql}\ncommit;\n`;
  const result = await runPsqlScript(script, psqlArgv, psqlEnv);
  const insertedMatch = result.stdout.match(/^INSERT \d+ (\d+)$/mu);

  return {
    durationMs: Date.now() - startedAt,
    error: result.error,
    ok: result.ok,
    rowsIn: rows.length,
    rowsOut: insertedMatch ? Number.parseInt(insertedMatch[1], 10) : null
  };
}

function csvField(value) {
  if (/["\n\r,]/u.test(value)) {
    return `"${value.replace(/"/gu, '""')}"`;
  }
  return value;
}
