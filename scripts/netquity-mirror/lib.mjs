// Shared helpers for the Netquity vendor MDB -> PostgreSQL 1:1 mirror scripts
// (generate-schema.mjs, load.mjs, update.mjs, verify.mjs). Mirrors the arg-parsing,
// env-resolution, and mdbtools-invocation conventions established by scripts/ingest-ipo-mdb.mjs.

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  realpathSync
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";

export const NETQUITY_SCHEMA_PREFIX = "nq_";
export const OPS_SCHEMA_NAME = "nq_ops";
export const REQUIRED_MDB_TOOLS = ["mdb-schema", "mdb-tables", "mdb-export", "mdb-count"];
export const DEFAULT_SOURCE_DIR = "_ref/Sample";
export const CANONICAL_MIGRATION_FILE = "deploy/database/migrations/20260709180000_netquity_mirror_schema.sql";

// Mirrors the forbidden-pattern list enforced by scripts/check-database-migrations-contract.mjs.
// Duplicated here (not imported) because that script performs top-level side effects
// (reads migrations.contract.json and calls process.exit) as soon as it is loaded as a module.
// Keep this array in sync with that script's `forbiddenSqlPatterns`.
export const FORBIDDEN_SQL_PATTERNS = [
  /\bdrop\s+(?!constraint\b)/iu,
  /\btruncate\b/iu,
  /\bdelete\b/iu,
  /\bcopy\b/iu,
  /\bcreate\s+extension\b/iu,
  /\balter\s+role\b/iu,
  /\bgrant\s+all\b/iu,
  /\bpostgres(?:ql)?:\/\//iu,
  /\bauth\.uid\s*\(/iu,
  /\bto\s+authenticated\b/iu,
  /\bsupabase_[a-z0-9_]*\b/iu,
  /\bpassword\b/iu,
  /\bsecret\b/iu,
  /\btoken\b/iu
];

export function parseArgs(argv, { boolean: booleanFlags = [], string: stringFlags = [] } = {}) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      fail(`Unexpected positional argument: ${token}`);
    }
    const name = token.slice(2);
    if (booleanFlags.includes(name)) {
      args[camelCase(name)] = true;
      continue;
    }
    if (stringFlags.includes(name)) {
      index += 1;
      const value = argv[index];
      if (value === undefined) {
        fail(`Flag --${name} requires a value`);
      }
      args[camelCase(name)] = value;
      continue;
    }
    fail(`Unknown flag --${name}`);
  }
  return args;
}

function camelCase(name) {
  return name.replace(/-([a-z0-9])/gu, (_match, char) => char.toUpperCase());
}

// basename (minus .mdb) -> lowercase -> non-[a-z0-9_] -> "_" -> prefix "nq_"
export function schemaNameFor(mdbBaseName) {
  const normalized = mdbBaseName.toLowerCase().replace(/[^a-z0-9_]/gu, "_");
  return `${NETQUITY_SCHEMA_PREFIX}${normalized}`;
}

// mdb-schema lowercases table names verbatim (no other transformation); empirically
// verified across all 172 source tables in _ref/Sample.
export function pgTableNameFor(mdbTableName) {
  return mdbTableName.toLowerCase();
}

// Quotes a single SQL identifier for safe interpolation into a statement (double-quote, double
// any embedded double quotes). Schema/table names in this pipeline are always produced by
// schemaNameFor()/pgTableNameFor(), but mdbTableName itself comes from `mdb-tables` output (the
// vendor's own Access table names) rather than a value we construct -- reject NUL/CR/LF outright
// rather than let them reach SQL text, since either would let one CSV/COPY statement smuggle in
// a second statement.
export function quoteIdentifier(identifier) {
  if (typeof identifier !== "string" || identifier.length === 0) {
    fail(`Invalid SQL identifier: ${JSON.stringify(identifier)}`);
  }
  if (/[\u0000\r\n]/u.test(identifier)) {
    fail(`Refusing to quote SQL identifier containing NUL/CR/LF: ${JSON.stringify(identifier)}`);
  }
  return `"${identifier.replace(/"/gu, '""')}"`;
}

export function quoteQualifiedIdentifier(schema, table) {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
}

export function resolveSourceDir(args) {
  const dir = resolve(process.cwd(), args.sourceDir ?? DEFAULT_SOURCE_DIR);
  if (!existsSync(dir)) {
    fail(`Source directory not found: ${dir}`);
  }
  return dir;
}

// Read-mode URL resolution (verify.mjs): falls back through the shared local-dev env chain.
// Read-only queries against whatever database is configured are low-risk, so the wider
// fallback is fine here.
export function resolveDatabaseUrl(args) {
  const url =
    args.databaseUrl ??
    process.env.NETQUITY_DATABASE_URL ??
    process.env.LOCAL_DATABASE_URL ??
    process.env.DATABASE_URL;
  if (!url) {
    fail(
      "Missing database URL. Pass --database-url, or set one of NETQUITY_DATABASE_URL, LOCAL_DATABASE_URL, DATABASE_URL."
    );
  }
  return url;
}

// Write-mode URL resolution (load.mjs, and future update.mjs): deliberately narrower than
// resolveDatabaseUrl. A write command must not silently inherit LOCAL_DATABASE_URL/DATABASE_URL
// -- those are shared defaults other tools may point at something this tool should never
// truncate/COPY into without an explicit, netquity-specific say-so. Also classifies the target
// host and refuses non-local hosts unless the caller explicitly allows it: this pipeline is
// scoped to the local Phase 1 mirror; remote (PlanetScale) apply is Phase 2 of
// plans/plan-netquity-pg-mirror.md and is explicitly blocked on credentials + explicit user
// confirmation there.
export function resolveWriteDatabaseUrl(args) {
  const url = args.databaseUrl ?? process.env.NETQUITY_DATABASE_URL;
  if (!url) {
    fail(
      "Missing database URL for a write-mode command. Pass --database-url, or set NETQUITY_DATABASE_URL. " +
        "(Write mode does not fall back to LOCAL_DATABASE_URL/DATABASE_URL -- pass one of the two accepted " +
        "sources explicitly.)"
    );
  }
  assertLocalOrAllowedRemoteHost(url, args);
  return url;
}

const LOCAL_HOSTNAMES = new Set(["", "localhost", "127.0.0.1", "::1"]);

// "" = no host component at all, e.g. postgresql:///dbname (unix socket, peer/local auth).
export function classifyDatabaseHost(databaseUrl) {
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch (error) {
    fail(`Could not parse database URL: ${error instanceof Error ? error.message : String(error)}`);
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/gu, "");
  return LOCAL_HOSTNAMES.has(hostname) ? "local" : "remote";
}

function assertLocalOrAllowedRemoteHost(databaseUrl, args) {
  if (classifyDatabaseHost(databaseUrl) === "local") {
    return;
  }
  if (args.allowRemote === true) {
    return;
  }
  fail(
    "Refusing to write to a non-local database host without --allow-remote. This pipeline is scoped to the " +
      "local Phase 1 mirror (see plans/plan-netquity-pg-mirror.md); remote (PlanetScale) apply is Phase 2, " +
      "explicitly blocked there on credentials and explicit user confirmation. Pass --allow-remote only if you " +
      "already have that go-ahead."
  );
}

// Splits a password out of a database URL so callers can pass it via the child process's
// environment (PGPASSWORD) instead of argv, where it would be visible to `ps`, shell history,
// and process-list-based secret scanners. Returns the URL with the password blanked, plus the
// extracted (percent-decoded) password, or null if the URL carries none (e.g. peer/socket auth,
// or a .pgpass-based setup).
export function splitDatabaseUrlSecret(databaseUrl) {
  let url;
  try {
    url = new URL(databaseUrl);
  } catch (error) {
    fail(`Could not parse database URL: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (url.password.length === 0) {
    return { password: null, urlWithoutPassword: databaseUrl };
  }
  let password;
  try {
    password = decodeURIComponent(url.password);
  } catch {
    password = url.password;
  }
  url.password = "";
  return { password, urlWithoutPassword: url.toString() };
}

export function preflightMdbTools() {
  const missing = REQUIRED_MDB_TOOLS.filter((tool) => !commandAvailable(tool));
  if (missing.length > 0) {
    fail(`Missing required mdbtools commands on PATH: ${missing.join(", ")}`);
  }
}

export function commandAvailable(command) {
  const result = spawnSync("command", ["-v", command], { encoding: "utf8", shell: true });
  return result.status === 0;
}

export function listMdbFiles(sourceDir) {
  const files = readdirSync(sourceDir)
    .filter((name) => name.toLowerCase().endsWith(".mdb"))
    .sort((a, b) => a.localeCompare(b));
  if (files.length === 0) {
    fail(`No .mdb files found in ${sourceDir}`);
  }
  return files.map((fileName) => {
    const baseName = fileName.slice(0, -4);
    return {
      absPath: resolve(sourceDir, fileName),
      baseName,
      fileName,
      schemaName: schemaNameFor(baseName)
    };
  });
}

export function readMdbTableNames(absPath) {
  const result = spawnSync("mdb-tables", ["-1", absPath], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 16
  });
  if (result.status !== 0) {
    fail(`mdb-tables failed for ${absPath}: ${result.stderr || result.stdout}`);
  }
  return result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function readMdbRowCount(absPath, tableName) {
  const result = spawnSync("mdb-count", [absPath, tableName], { encoding: "utf8" });
  if (result.status !== 0) {
    fail(`mdb-count failed for ${absPath} ${tableName}: ${result.stderr || result.stdout}`);
  }
  const count = Number.parseInt(result.stdout.trim(), 10);
  if (!Number.isFinite(count)) {
    fail(`mdb-count returned non-numeric output for ${absPath} ${tableName}: ${JSON.stringify(result.stdout)}`);
  }
  return count;
}

export function runMdbSchema(absPath, schemaName) {
  const result = spawnSync("mdb-schema", ["-N", schemaName, absPath, "postgres"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
  if (result.status !== 0) {
    fail(`mdb-schema failed for ${absPath}: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

export function scanForbiddenSql(text) {
  const matches = [];
  for (const pattern of FORBIDDEN_SQL_PATTERNS) {
    if (pattern.test(text)) {
      matches.push(pattern.source);
    }
  }
  return matches;
}

// Parses the generator's combined migration SQL into a per-table structure. Shared by
// generate-schema.mjs (self-assert counts) and verify.mjs (column/PK parity) so both
// scripts agree on exactly one grammar for the DDL this repo emits.
export function parseMigrationTables(sql) {
  const blocks = sql.split(/(?=CREATE TABLE IF NOT EXISTS)/u).filter((block) => block.startsWith("CREATE TABLE IF NOT EXISTS"));
  return blocks.map((block) => parseTableBlock(block));
}

function parseTableBlock(block) {
  const headerMatch = block.match(/^CREATE TABLE IF NOT EXISTS "([^"]+)"\."([^"]+)"/u);
  if (!headerMatch) {
    fail(`Could not parse table header from migration block starting: ${block.slice(0, 80)}`);
  }
  const [, schema, table] = headerMatch;

  const bodyMatch = block.match(/\(\s*\n([\s\S]*?)\n\);/u);
  if (!bodyMatch) {
    fail(`Could not parse column body for "${schema}"."${table}"`);
  }

  const columns = bodyMatch[1]
    .split("\n")
    .map((rawLine) => rawLine.trim().replace(/,$/u, ""))
    .filter(Boolean)
    .map((line) => parseColumnLine(line, schema, table));

  const key = parseTableKey(block);

  return { columns, key, schema, table };
}

// A table's "key" is either a PRIMARY KEY (`ADD CONSTRAINT "<table>_pkey" PRIMARY KEY (...)`,
// the default) or, for the small evidence-backed exception set in
// scripts/netquity-mirror/pk-demotions.json, a UNIQUE constraint of the same columns
// (`ADD CONSTRAINT "<table>_key" UNIQUE (...)`). At most one of the two exists per table; some
// tables (6 in the current vendor delivery) have neither ("none").
function parseTableKey(block) {
  const pkMatch = block.match(/ADD CONSTRAINT "[^"]+_pkey" PRIMARY KEY \(([^)]+)\)/u);
  if (pkMatch) {
    return { columns: parseColumnRefList(pkMatch[1]), type: "primary_key" };
  }
  const uniqueMatch = block.match(/ADD CONSTRAINT "[^"]+_key" UNIQUE \(([^)]+)\)/u);
  if (uniqueMatch) {
    return { columns: parseColumnRefList(uniqueMatch[1]), type: "unique" };
  }
  return { columns: [], type: "none" };
}

function parseColumnRefList(text) {
  return text.split(",").map((part) => part.trim().replace(/^"|"$/gu, ""));
}

function parseColumnLine(line, schema, table) {
  const match = line.match(/^"([^"]+)"\s+([A-Z][A-Z ]*?)(?:\s*\((\d+)(?:,\s*\d+)?\))?(\s+NOT NULL)?$/u);
  if (!match) {
    fail(`Could not parse column definition in "${schema}"."${table}": ${line}`);
  }
  const [, name, rawType, length, notNull] = match;
  return {
    length: length ? Number.parseInt(length, 10) : null,
    name,
    notNull: Boolean(notNull),
    type: rawType.trim()
  };
}

export function progress(tag, message) {
  console.error(`[${tag}] ${new Date().toISOString()} ${message}`);
}

// A deliberate, already-reported failure (the message is printed by fail() itself, at the point
// of failure, before throwing) -- distinct from a genuinely unexpected bug so a top-level catch
// can print a full stack trace for the latter but not the former.
export class NetquityFailError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetquityFailError";
  }
}

// Throws (does not process.exit()) so that any `try { ... } finally { cleanup }` block up the
// call stack -- e.g. update.mjs's / verify.mjs --mode daily's tmpdir-cleanup finally, which a
// deep process.exit() would skip entirely -- still runs. Every script's top-level entry point is
// responsible for catching NetquityFailError (message already printed here) and translating it
// into process.exit(1); see lib.mjs's runCli() for the shared version of that translation.
export function fail(message) {
  console.error(message);
  throw new NetquityFailError(message);
}

// Shared top-level entry-point wrapper: runs `fn`, and on failure sets the process exit code to 1
// -- `process.exitCode` (not `process.exit()`) so the event loop is allowed to drain normally
// and any already-scheduled I/O (e.g. a `finally` block's own async cleanup) completes before the
// process actually exits. A NetquityFailError's message was already printed by fail() at the
// point of failure; any other error is an unexpected bug and gets its full stack trace printed
// here, since nothing upstream had a chance to describe it.
export async function runCli(fn) {
  try {
    await fn();
  } catch (error) {
    if (!(error instanceof NetquityFailError)) {
      console.error(error);
    }
    process.exitCode = 1;
  }
}

// For scripts whose top-level body is not wrapped in a single async entry function (load.mjs,
// generate-schema.mjs -- purely top-level imperative code, unlike update.mjs/verify.mjs) and so
// cannot use runCli() without a wider restructure: registers a process-level safety net so a
// thrown NetquityFailError still produces the same "message already printed by fail(), exit 1"
// behavior fail()'s old process.exit(1) gave directly, instead of an uncaught-exception stack
// trace dump. Call once, near the top of the script, before any code that might call fail().
// Neither of those two scripts creates a tmpdir, so unlike update.mjs/verify.mjs --mode daily
// there is no cleanup to run here -- this is purely an output-cleanliness safety net.
export function installFailSafetyNet() {
  const handle = (error) => {
    if (!(error instanceof NetquityFailError)) {
      console.error(error);
    }
    process.exitCode = 1;
  };
  process.on("uncaughtException", handle);
  process.on("unhandledRejection", handle);
}

// ---------------------------------------------------------------------------
// Write-mode psql connection + mdb-export|psql copy-in pipeline.
//
// Extracted from load.mjs's original loadTable() (Phase 1) so load.mjs and update.mjs share one
// tested implementation instead of two copies. The peer-kill/settle skeleton, the
// psql-stderr-priority-over-empty-mdb-export-stderr error selection, and the PGPASSWORD/argv
// leak assertion are all load-bearing fixes from Phase 1's review round (see
// tasks/notes/netquity-pg-mirror.notes.md, "Follow-up 3", items 3 and 10) -- preserved verbatim
// here, not re-derived.
// ---------------------------------------------------------------------------

// Resolves a write-mode database URL into the argv/env a psql child process should use: strips
// any password out of argv (visible to `ps`/shell history) into PGPASSWORD instead, and asserts
// in code that the password string never actually ends up in the argv about to be spawned.
export function buildPsqlConnection(databaseUrl) {
  const { password, urlWithoutPassword } = splitDatabaseUrlSecret(databaseUrl);
  const psqlArgv = [urlWithoutPassword, "-X", "-v", "ON_ERROR_STOP=1"];
  if (password !== null && psqlArgv.some((arg) => arg.includes(password))) {
    fail("Internal error: database password leaked into psql argv after stripping; refusing to spawn.");
  }
  const psqlEnv = { ...process.env, PGCLIENTENCODING: "UTF8" };
  if (password !== null) {
    psqlEnv.PGPASSWORD = password;
  } else {
    delete psqlEnv.PGPASSWORD;
  }
  return { psqlArgv, psqlEnv };
}

// Builds the in-transaction row-count gate used after a `\copy` completes: assert the named
// relation now holds exactly `expectedCount` rows before allowing the commit. A mismatch RAISEs,
// which -- under `psql -v ON_ERROR_STOP=1` -- aborts the script before `commit;` ever runs, so
// the whole transaction rolls back on connection close. `expectedCount` must already be a
// trusted integer (e.g. from readMdbRowCount()'s own Number.isFinite() assertion, or a JS
// array's .length) -- it is interpolated as a bare integer literal.
export function buildRowCountGateSql(qualifiedTable, expectedCount, label) {
  if (!Number.isInteger(expectedCount) || expectedCount < 0) {
    fail(`buildRowCountGateSql: expectedCount must be a non-negative integer, got ${JSON.stringify(expectedCount)}`);
  }
  return `DO $$
DECLARE
  actual_count bigint;
BEGIN
  SELECT count(*) INTO actual_count FROM ${qualifiedTable};
  IF actual_count <> ${expectedCount} THEN
    RAISE EXCEPTION 'netquity row-count gate failed%: expected % rows, found %', ${sqlStringLiteral(label ? ` (${label})` : "")}, ${expectedCount}, actual_count;
  END IF;
END $$;`;
}

export function parseCopyRowCount(stdout) {
  const match = stdout.match(/^COPY (\d+)$/mu);
  return match ? Number.parseInt(match[1], 10) : null;
}

// Single-quotes a JS string for interpolation into a SQL literal (doubles embedded quotes,
// rejects NUL/CR/LF outright -- same posture as quoteIdentifier). Used for RAISE EXCEPTION
// message fragments and other short, code-controlled strings; not a general-purpose escaper.
export function sqlStringLiteral(value) {
  if (typeof value !== "string") {
    fail(`sqlStringLiteral: expected a string, got ${JSON.stringify(value)}`);
  }
  if (/[\u0000\r\n]/u.test(value)) {
    fail(`Refusing to build a SQL string literal containing NUL/CR/LF: ${JSON.stringify(value)}`);
  }
  return `'${value.replace(/'/gu, "''")}'`;
}

// Validates and formats a date/timestamp string (as produced by this pipeline's own
// `mdb-export -D "%Y-%m-%d" -T "%Y-%m-%d %H:%M:%S"` flags) into a single-quoted SQL literal.
// Deliberately strict (exact format, no timezone, no free text) even though these values
// originate from this codebase's own mdb-export calls rather than external input: the same
// fail-closed posture as quoteIdentifier's NUL/CR/LF rejection, applied to the one other place
// (update.mjs's window_replace mode) that interpolates a data-derived value into SQL text
// instead of passing it through \copy or a quoted identifier.
const SQL_TIMESTAMP_LITERAL_PATTERN = /^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?$/u;
export function sqlTimestampLiteral(value) {
  if (typeof value !== "string" || !SQL_TIMESTAMP_LITERAL_PATTERN.test(value)) {
    fail(`Refusing to build a SQL timestamp literal from an unexpected value: ${JSON.stringify(value)}`);
  }
  return `'${value}'`;
}

// Runs one `mdb-export | psql` copy-in pipeline: mdb-export's stdout is piped directly into
// psql's stdin (never buffered whole in memory), preceded by `preambleSql` (must itself issue
// the `\copy ... FROM STDIN WITH (FORMAT csv);` statement once mdb-export's rows should start
// flowing) and followed, once mdb-export finishes, by either `successPostambleSql` (mdb-export
// exited 0) or `failurePostambleSql` (mdb-export failed -- typically just "rollback;\n").
// Whichever child fails/errors first kills the other so nothing is left running under
// concurrency; the returned promise settles only once both children have reported `close`.
export function runMdbCopyPipeline({ absPath, mdbTable, psqlArgv, psqlEnv, preambleSql, successPostambleSql, failurePostambleSql }) {
  return new Promise((resolvePromise) => {
    const startedAt = Date.now();
    const psql = spawn("psql", psqlArgv, { env: psqlEnv, stdio: ["pipe", "pipe", "pipe"] });
    const mdbExport = spawn(
      "mdb-export",
      ["-H", "-D", "%Y-%m-%d", "-T", "%Y-%m-%d %H:%M:%S", absPath, mdbTable],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let psqlStdout = "";
    let psqlStderr = "";
    let mdbExportStderr = "";
    psql.stdout.on("data", (chunk) => {
      psqlStdout += chunk;
    });
    psql.stderr.on("data", (chunk) => {
      psqlStderr += chunk;
    });
    mdbExport.stderr.on("data", (chunk) => {
      mdbExportStderr += chunk;
    });
    // Killing the peer below produces EPIPE on whichever side loses the race; the real failure
    // signal is the exit code / spawn error, handled in the close/error listeners.
    psql.stdin.on("error", () => {});
    mdbExport.stdout.on("error", () => {});

    mdbExport.stdout.pipe(psql.stdin, { end: false });
    psql.stdin.write(preambleSql);

    let psqlDone = false;
    let mdbExportDone = false;
    let mdbExportOk = false;
    let psqlExitCode = null;
    let psqlSpawnErrorMessage = null;
    let settled = false;

    mdbExport.on("error", (error) => {
      mdbExportStderr += `spawn error: ${error.message}\n`;
      mdbExportDone = true;
      mdbExportOk = false;
      if (!psqlDone) psql.kill("SIGTERM");
      maybeSettle();
    });

    mdbExport.on("close", (code) => {
      mdbExportDone = true;
      mdbExportOk = code === 0;
      if (mdbExportOk) {
        safeWrite(psql.stdin, `\\.\n${successPostambleSql}`);
      } else {
        safeWrite(psql.stdin, `\\.\n${failurePostambleSql}`);
        if (!psqlDone) psql.kill("SIGTERM");
      }
      safeEnd(psql.stdin);
      maybeSettle();
    });

    psql.on("error", (error) => {
      psqlSpawnErrorMessage = `psql spawn error: ${error.message}`;
      psqlDone = true;
      if (!mdbExportDone) mdbExport.kill("SIGTERM");
      maybeSettle();
    });

    psql.on("close", (code) => {
      psqlExitCode = code;
      psqlDone = true;
      if (!mdbExportDone) mdbExport.kill("SIGTERM");
      maybeSettle();
    });

    function maybeSettle() {
      if (settled || !psqlDone || !mdbExportDone) return;
      settled = true;
      const ok = mdbExportOk && psqlExitCode === 0 && !psqlSpawnErrorMessage;
      let error = null;
      if (!ok) {
        // Prefer whichever side actually explains the failure. psql's own stderr (a real
        // connection/COPY/gate error) is the most informative when present, even if mdb-export
        // was also killed as a side effect of psql failing first -- reporting "mdb-export
        // failed" with empty stderr in that case would hide the real cause.
        if (psqlSpawnErrorMessage) {
          error = psqlSpawnErrorMessage;
        } else if (psqlExitCode !== 0 && psqlStderr.trim()) {
          error = psqlStderr.trim();
        } else if (!mdbExportOk) {
          error = `mdb-export failed for ${mdbTable}: ${mdbExportStderr.trim()}`;
        } else {
          error = psqlStderr.trim() || "unknown error";
        }
      }
      resolvePromise({
        durationMs: Date.now() - startedAt,
        error,
        ok,
        psqlStdout
      });
    }
  });
}

// The `replace_all` recipe: TRUNCATE the target + \copy the whole delivered file into it + a
// row-count gate (actual count must equal expectedRowCount, read via readMdbRowCount before the
// copy starts) + commit. This is the ENTIRE Phase 1 bootstrap loader's per-table behavior
// (load.mjs processes every table this way) and is also strategies.json's "replace_all" mode
// for the daily updater (update.mjs) -- same recipe, same guarantees, one implementation so
// neither script re-derives it.
export function runReplaceAllCopy({ absPath, mdbTable, schema, pgTable, expectedRowCount, psqlArgv, psqlEnv }) {
  const qualifiedTable = quoteQualifiedIdentifier(schema, pgTable);
  const rowCountGateSql = buildRowCountGateSql(qualifiedTable, expectedRowCount);
  return runMdbCopyPipeline({
    absPath,
    failurePostambleSql: "rollback;\n",
    mdbTable,
    preambleSql: `begin;\ntruncate ${qualifiedTable};\n\\copy ${qualifiedTable} from stdin with (format csv);\n`,
    psqlArgv,
    psqlEnv,
    successPostambleSql: `${rowCountGateSql}\ncommit;\n`
  });
}

function safeWrite(stream, text) {
  if (stream.destroyed) return;
  try {
    stream.write(text);
  } catch {
    // stream already closed on the other end; the failure is already recorded via exit code.
  }
}

function safeEnd(stream) {
  if (stream.destroyed) return;
  try {
    stream.end();
  } catch {
    // already closed
  }
}

// Runs one whole SQL script (including any inline \copy ... FROM STDIN payload) through a single
// psql child process and reports ok/error/stdout. For scripts small enough to build entirely in
// memory up front (e.g. update.mjs's del_sec_*.dat load, a handful of KB) rather than needing the
// streaming mdb-export|psql pipeline above. Not used for bulk vendor-table copies.
export function runPsqlScript(script, psqlArgv, psqlEnv) {
  return new Promise((resolvePromise) => {
    const psql = spawn("psql", psqlArgv, { env: psqlEnv, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let spawnErrorMessage = null;
    psql.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    psql.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    psql.stdin.on("error", () => {});
    psql.on("error", (error) => {
      spawnErrorMessage = `psql spawn error: ${error.message}`;
    });
    psql.on("close", (code) => {
      const ok = code === 0 && !spawnErrorMessage;
      resolvePromise({ error: ok ? null : spawnErrorMessage || stderr.trim() || "unknown error", ok, stdout });
    });
    safeWrite(psql.stdin, script);
    safeEnd(psql.stdin);
  });
}

// ---------------------------------------------------------------------------
// Streaming CSV row tokenizer for mdb-export -H output, shared by verify.mjs (large streaming
// scans) and update.mjs (small synchronous reads, e.g. a DataPeriod control table). A row is an
// array of { value, wasQuoted } fields; wasQuoted distinguishes a genuine unquoted NULL_SENTINEL
// occurrence from quoted text that merely happens to equal the sentinel string (mdb-export
// always quotes text/varchar fields, so a real "NULL" piece of vendor text arrives as `"NULL"`,
// not `NULL`). See isNullField() below and scripts/netquity-mirror/README.md.
// ---------------------------------------------------------------------------

export const NULL_SENTINEL = "NULL";

export function createRowTokenizer(onRow) {
  let field = "";
  let fieldWasQuoted = false;
  let row = [];
  let inQuotes = false;
  // Node delivers stdout in ~64KB chunks. An escaped internal quote ("") in memo/text fields can
  // land exactly on a chunk boundary. Any run of trailing quote characters at the end of a chunk
  // is ambiguous (closing quote vs. escape-pair halves) until more input is known, so the ENTIRE
  // trailing run is carried into the next chunk rather than guessing based on just the last
  // character -- a single held-back quote is not enough when 2+ quotes land exactly at the
  // boundary (e.g. `X""` split as `X"` | `"...`).
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

export function isNullField(field) {
  return !field.wasQuoted && field.value === NULL_SENTINEL;
}

// Synchronous small-table read: spawns `mdb-export -H -D ... -T ... -0 NULL <absPath> <mdbTable>`
// and parses the whole (small) output with createRowTokenizer(). Intended for control tables
// that are known to be tiny (e.g. a schema's DataPeriod table, typically 0-1 rows) -- NOT for
// bulk vendor tables, which must stream (see streamMdbExportRows-style usage in verify.mjs /
// runMdbCopyPipeline above) rather than risk buffering a large export in memory.
export function readMdbTableRowsSync(absPath, mdbTable) {
  const result = spawnSync(
    "mdb-export",
    ["-H", "-D", "%Y-%m-%d", "-T", "%Y-%m-%d %H:%M:%S", "-0", NULL_SENTINEL, absPath, mdbTable],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 16 }
  );
  if (result.status !== 0) {
    fail(`mdb-export failed for ${absPath} ${mdbTable}: ${result.stderr || result.stdout}`);
  }
  const rows = [];
  const tokenizer = createRowTokenizer((row) => rows.push(row));
  tokenizer.pushChunk(result.stdout);
  tokenizer.flush();
  // mdb-export's -H flag means "suppress header row" (confirmed via `mdb-export --help`: "-H,
  // --no-header  Suppress header row"), not "include header" -- every emitted row is data. This
  // matches verify.mjs's streamMdbExportRows, which also treats every row as data with no
  // header-skip step.
  return rows;
}

// ---------------------------------------------------------------------------
// strategies.json loading + validation, shared by update.mjs (applying a drop) and verify.mjs
// --mode daily (scope-limited parity for an already-applied drop) so both scripts agree on
// exactly one grammar/validation pass for this file.
// ---------------------------------------------------------------------------

export const STRATEGY_MODES = new Set(["replace_all", "upsert_only", "window_replace", "unresolved"]);

// Resolves the path to strategies.json: NETQUITY_STRATEGIES_PATH_OVERRIDE if set, else
// "strategies.json" next to the calling script. The override exists solely as a test hook (e.g.
// pointing update.mjs/verify.mjs at a scratch copy of strategies.json with one entry removed, to
// prove the strategies<->DDL cross-check fails closed, without mutating the real checked-in
// file) -- production usage never needs to set it.
export function resolveStrategiesPath(scriptImportMetaUrl) {
  if (process.env.NETQUITY_STRATEGIES_PATH_OVERRIDE) {
    return resolve(process.cwd(), process.env.NETQUITY_STRATEGIES_PATH_OVERRIDE);
  }
  return resolve(new URL(".", scriptImportMetaUrl).pathname, "strategies.json");
}

export function loadStrategies(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Failed to read/parse ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(parsed.strategies)) {
    fail(`${path} must have a top-level "strategies" array`);
  }
  const seen = new Set();
  parsed.strategies.forEach((entry, index) => {
    for (const field of ["schema", "table", "mode", "evidence"]) {
      if (typeof entry[field] !== "string" || entry[field].length === 0) {
        fail(`${path} strategies[${index}] is missing required non-empty string field "${field}"`);
      }
    }
    if (!STRATEGY_MODES.has(entry.mode)) {
      fail(`${path} strategies[${index}] (${entry.schema}.${entry.table}) has invalid mode "${entry.mode}"`);
    }
    if (entry.mode === "window_replace" && (typeof entry.window_column !== "string" || entry.window_column.length === 0)) {
      fail(`${path} strategies[${index}] (${entry.schema}.${entry.table}) has mode window_replace but no window_column`);
    }
    if (entry.mode !== "window_replace" && entry.window_column !== undefined) {
      fail(`${path} strategies[${index}] (${entry.schema}.${entry.table}) has window_column but mode is "${entry.mode}"`);
    }
    const key = `${entry.schema}.${entry.table}`;
    if (seen.has(key)) {
      fail(`${path} has a duplicate entry for ${key}`);
    }
    seen.add(key);
  });
  return parsed.strategies;
}

// Asserts two key sets are identical, failing closed with both differences named. Shared by
// update.mjs (strategies.json vs migration DDL) and verify.mjs --mode daily (same check, run
// independently so a drift introduced after an update.mjs release is still caught by verify).
export function assertKeySetsMatch(setA, setB, labelA, labelB) {
  const missingFromB = [...setA].filter((key) => !setB.has(key));
  const missingFromA = [...setB].filter((key) => !setA.has(key));
  if (missingFromB.length > 0 || missingFromA.length > 0) {
    fail(
      `${labelA} and ${labelB} disagree on the vendor table set:\n` +
        (missingFromB.length > 0 ? `  in ${labelA} but not ${labelB}: ${missingFromB.join(", ")}\n` : "") +
        (missingFromA.length > 0 ? `  in ${labelB} but not ${labelA}: ${missingFromA.join(", ")}\n` : "")
    );
  }
}

export const DEL_SEC_FILE_PATTERN = /^del_sec_.*\.dat$/iu;

// Strict line grammar for a del_sec_*.dat entry: "YYYY/MM/DD<TAB>code". The code group
// `[^\t\r\n]+` (not `.+`) deliberately excludes tab, so a line carrying an extra TAB-delimited
// column (e.g. "2026/07/07\t08558\textra") fails the match entirely instead of the extra
// column(s) being silently absorbed into `code` -- `.+` is greedy and would have swallowed a
// trailing "\textra" into the captured code. Also rejects an empty code (`+` requires at least
// one non-tab/CR/LF character).
const DEL_SEC_LINE_PATTERN = /^(\d{4})\/(\d{2})\/(\d{2})\t([^\t\r\n]+)$/u;

// Parses one del_sec_*.dat file (tab-delimited "YYYY/MM/DD<TAB>code", CRLF line endings) fully in
// memory -- these are small flat files, not vendor .mdb exports, so no streaming is needed.
// Shared by update.mjs (loads the parsed rows into nq_ops.del_sec) and verify.mjs --mode daily
// (asserts every parsed row's presence in nq_ops.del_sec) so both scripts agree on exactly one
// grammar for this file. Returns `{ rows, issues }`; a non-empty `issues` array never contains a
// row for that same line (parse failure and row extraction are mutually exclusive per line).
export function parseDelSecFile(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const lines = raw.split(/\r\n|\n/u).filter((line) => line.length > 0);
  const rows = [];
  const issues = [];
  lines.forEach((line, index) => {
    const match = line.match(DEL_SEC_LINE_PATTERN);
    if (!match) {
      issues.push(
        `${filePath}:${index + 1}: expected "YYYY/MM/DD<TAB>code" with no extra columns and a non-empty code containing no tab, got ${JSON.stringify(line)}`
      );
      return;
    }
    const [, year, month, day, code] = match;
    rows.push({ code, delDate: `${year}-${month}-${day}` });
  });
  return { issues, rows };
}

// ---------------------------------------------------------------------------
// Drop-dir resolution, shared by update.mjs (applying a drop) and verify.mjs --mode daily
// (scope-limited parity for an already-applied drop) so both scripts agree on exactly one
// resolution/dedup/window-reading algorithm for a --drop-dir.
// ---------------------------------------------------------------------------

// Lists every .mdb (raw) and .zip (extracted to a tmpdir, resolved by its INNER .mdb filename --
// a vendor .zip's own basename does not have to match the schema it contains) candidate in a
// drop dir, plus any del_sec_*.dat files. Appends every tmpdir it creates to the caller-owned
// `tmpRoots` array so the caller can clean them up when done. `progressTag` is used for the
// duplicate-delivery log line (see dedupCandidates) so each caller's log lines are attributable.
export function resolveDropDirCandidates(dir, tmpRoots, progressTag) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isFile());
  } catch (error) {
    fail(`Could not read --drop-dir ${dir}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const candidates = [];
  for (const entry of entries) {
    if (!/\.mdb$/iu.test(entry.name)) continue;
    const baseName = entry.name.slice(0, -4);
    candidates.push({
      absPath: resolve(dir, entry.name),
      schemaName: schemaNameFor(baseName),
      sourceKind: "mdb",
      sourceLabel: entry.name
    });
  }

  for (const entry of entries) {
    if (!/\.zip$/iu.test(entry.name)) continue;
    const zipPath = resolve(dir, entry.name);
    assertSafeZipEntryNames(zipPath, entry.name);

    const tmpDir = mkdtempSync(resolve(tmpdir(), "netquity-drop-"));
    tmpRoots.push(tmpDir);
    const result = spawnSync("unzip", ["-o", "-q", "-d", tmpDir, zipPath], { encoding: "utf8" });
    if (result.status !== 0) {
      fail(`unzip failed for ${entry.name}: ${result.stderr || result.stdout}`);
    }
    assertExtractedEntriesContained(tmpDir, entry.name);

    const innerMdbNames = readdirSync(tmpDir).filter((name) => /\.mdb$/iu.test(name));
    if (innerMdbNames.length === 0) {
      fail(`${entry.name} contains no .mdb file -- nothing to resolve from this archive.`);
    }
    for (const innerName of innerMdbNames) {
      const baseName = innerName.slice(0, -4);
      candidates.push({
        absPath: resolve(tmpDir, innerName),
        schemaName: schemaNameFor(baseName),
        sourceKind: "zip",
        sourceLabel: `${entry.name} -> ${innerName}`
      });
    }
  }

  const delSecFiles = entries.filter((entry) => DEL_SEC_FILE_PATTERN.test(entry.name)).map((entry) => resolve(dir, entry.name));

  if (candidates.length === 0 && delSecFiles.length === 0) {
    fail(`No .mdb, .zip, or del_sec_*.dat files found in ${dir}`);
  }

  return { candidates, delSecFiles };
}

// Zip containment, step 1 (before extraction): lists every entry name via `unzip -Z1` (no
// filesystem writes yet) and refuses the WHOLE archive if any entry is an absolute path (POSIX
// "/" or "\", or a Windows drive/UNC form some zip tools can embed) or contains a ".." path
// segment (either separator, since an archive's origin OS/tool can use either) -- both are
// classic zip-slip path-traversal vectors that could otherwise make `unzip -d tmpDir` write
// outside tmpDir. Reuses the same `unzip` binary already required on PATH (no new dependency).
function assertSafeZipEntryNames(zipPath, zipLabel) {
  const result = spawnSync("unzip", ["-Z1", zipPath], { encoding: "utf8" });
  if (result.status !== 0) {
    fail(`unzip -Z1 (listing) failed for ${zipLabel}: ${result.stderr || result.stdout}`);
  }
  const names = result.stdout.split(/\r?\n/u).filter((name) => name.length > 0);
  const unsafe = names.filter((name) => isUnsafeZipEntryName(name));
  if (unsafe.length > 0) {
    fail(
      `Refusing to extract ${zipLabel}: unsafe entry name(s) found before extraction (absolute path or ".." path-traversal segment):\n` +
        unsafe.map((name) => `  ${JSON.stringify(name)}`).join("\n")
    );
  }
}

function isUnsafeZipEntryName(name) {
  if (name.startsWith("/") || name.startsWith("\\") || /^[A-Za-z]:[\\/]/u.test(name)) {
    return true;
  }
  return name.split(/[\\/]/u).includes("..");
}

// Zip containment, step 2 (after extraction): defense in depth against the entry-name check
// above missing some encoding/tool-specific traversal trick -- walks every extracted entry
// (recursively; a malicious archive could nest a traversal several directories deep), refuses
// the whole archive if any entry is anything other than a regular file or a directory (a
// symlink, in particular, could point anywhere on the filesystem and would not itself be "a file
// extracted outside tmpDir" by name, only by the target it resolves to), and requires every
// regular file's realpath to resolve strictly under the tmpdir's own realpath (guards against
// tmpdir itself sitting behind a symlink, e.g. macOS's /tmp -> /private/tmp).
function assertExtractedEntriesContained(tmpDir, zipLabel) {
  const realTmpDir = realpathSync(tmpDir);
  const entries = readdirSync(tmpDir, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      fail(`Refusing ${zipLabel}: extracted entry "${entry.name}" is a symlink -- refusing the whole archive.`);
    }
    if (!entry.isFile() && !entry.isDirectory()) {
      fail(`Refusing ${zipLabel}: extracted entry "${entry.name}" is neither a regular file nor a directory -- refusing the whole archive.`);
    }
    if (!entry.isFile()) continue;
    const entryPath = resolve(entry.parentPath, entry.name);
    const real = realpathSync(entryPath);
    if (real !== realTmpDir && !real.startsWith(`${realTmpDir}${sep}`)) {
      fail(`Refusing ${zipLabel}: extracted entry "${entry.name}" resolves outside the extraction tmpdir (realpath ${real}) -- refusing the whole archive.`);
    }
  }
}

// Groups candidates by resolved schema, picking exactly one per schema when more than one
// resolves to it (a real daily drop should only ever contain one delivery per schema; the local
// proving fixture _ref/Sample intentionally contains redundant raw .mdb + .zip forms for nearly
// every schema, since it is the Phase 1 bootstrap set reused as a drop-dir fixture rather than a
// trimmed daily drop). Preference: a raw .mdb file over a zip-derived one; ties broken by
// sourceLabel so the choice is deterministic across runs. Every non-chosen duplicate is logged,
// not silently dropped.
export function dedupCandidates(candidates, progressTag) {
  const bySchema = new Map();
  for (const candidate of candidates) {
    const existing = bySchema.get(candidate.schemaName);
    if (!existing) {
      bySchema.set(candidate.schemaName, { candidate });
      continue;
    }
    const existingDigest = sha256File(existing.candidate.absPath);
    const candidateDigest = sha256File(candidate.absPath);
    if (existingDigest !== candidateDigest) {
      fail(
        `Conflicting duplicate deliveries for schema "${candidate.schemaName}": ` +
          `${existing.candidate.sourceLabel} sha256=${existingDigest} differs from ` +
          `${candidate.sourceLabel} sha256=${candidateDigest}. Refusing to choose one by filename or source kind.`
      );
    }
    const existingWins = compareCandidates(existing.candidate, candidate) <= 0;
    const winner = existingWins ? existing.candidate : candidate;
    const loser = existingWins ? candidate : existing.candidate;
    progress(progressTag, `duplicate delivery for schema "${candidate.schemaName}": using ${winner.sourceLabel}, ignoring ${loser.sourceLabel}`);
    bySchema.set(candidate.schemaName, { candidate: winner });
  }
  return bySchema;
}

function sha256File(path) {
  const hash = createHash("sha256");
  const fd = openSync(path, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    while (true) {
      const bytesRead = readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(fd);
  }
  return hash.digest("hex");
}

function compareCandidates(a, b) {
  const rank = (candidate) => (candidate.sourceKind === "mdb" ? 0 : 1);
  const rankDiff = rank(a) - rank(b);
  if (rankDiff !== 0) return rankDiff;
  return a.sourceLabel.localeCompare(b.sourceLabel);
}

// Reads a window_replace schema's own DataPeriod control table directly from the delivered .mdb
// file (not the database -- this must not depend on any DB-side write having happened yet this
// run) and returns its [start,end] as ready-to-interpolate SQL timestamp literals.
export function resolveDataPeriodWindow(schemaEntry) {
  const dataperiodName = schemaEntry.tableNameMap.get("dataperiod");
  if (!dataperiodName) {
    fail(
      `${schemaEntry.candidate.schemaName}: a window_replace table is present in this delivery but its .mdb has no "DataPeriod" table to read [start,end] from (source: ${schemaEntry.candidate.sourceLabel}).`
    );
  }
  const rows = readMdbTableRowsSync(schemaEntry.candidate.absPath, dataperiodName);
  if (rows.length !== 1) {
    fail(
      `${schemaEntry.candidate.schemaName}.dataperiod: expected exactly 1 row describing this delivery's covering period, found ${rows.length} ` +
        `(source: ${schemaEntry.candidate.sourceLabel}).`
    );
  }
  const [row] = rows;
  const [startField, endField] = row;
  if (!startField || !endField || isNullField(startField) || isNullField(endField)) {
    fail(
      `${schemaEntry.candidate.schemaName}.dataperiod: StartDate/EndDate must both be present and non-null (source: ${schemaEntry.candidate.sourceLabel}).`
    );
  }
  return { end: sqlTimestampLiteral(endField.value), start: sqlTimestampLiteral(startField.value) };
}
