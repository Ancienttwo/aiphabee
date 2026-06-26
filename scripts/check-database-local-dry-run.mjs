#!/usr/bin/env node
import { mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const contractPath = "deploy/database/local-dry-run.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const migrationDirectory = "supabase/migrations";
const packageScript = "check:database-local-dry-run";
const requiredTools = ["initdb", "pg_ctl", "createdb", "psql"];
const port = "55432";

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson("package.json");
const errors = validateContract(contract, databaseContract, packageJson);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_database_local_dry_run_contract"
    },
    1
  );
}

const toolStatus = await probeTools(requiredTools);
const missingTools = toolStatus.filter((tool) => !tool.available);

if (missingTools.length > 0) {
  emit(
    {
      missing_tools: missingTools.map((tool) => tool.name),
      status: "missing_postgres_toolchain",
      tools: toolStatus
    },
    2
  );
}

const tmpBase = await mkdtemp(join(tmpdir(), "aiphabee-pg-dry-run-"));
const dataDir = join(tmpBase, "data");
const socketDir = join(tmpBase, "socket");
const logFile = join(tmpBase, "postgres.log");
const databaseName = "aiphabee_dry_run";
let started = false;

try {
  await runCommand("mkdir", ["-p", socketDir]);
  await expectCommand("initdb", [
    "-D",
    dataDir,
    "--auth=trust",
    "--no-locale",
    "--encoding=UTF8"
  ]);
  await expectCommand("pg_ctl", [
    "-D",
    dataDir,
    "-o",
    `-k ${socketDir} -p ${port} -c listen_addresses=''`,
    "-l",
    logFile,
    "-w",
    "start"
  ]);
  started = true;
  await expectCommand("createdb", ["-h", socketDir, "-p", port, databaseName]);

  let applied = 0;
  for (const file of getMigrationFiles(databaseContract)) {
    const result = await runCommand("psql", [
      "-h",
      socketDir,
      "-p",
      port,
      "-d",
      databaseName,
      "--set",
      "ON_ERROR_STOP=1",
      "--quiet",
      "--file",
      file
    ]);

    if (result.status !== 0) {
      emit(
        {
          applied_before_failure: applied,
          failed_file: file,
          status: "migration_apply_failed",
          stderr_tail: tail(result.stderr, 2000)
        },
        1
      );
    }

    applied += 1;
  }

  const schemaCount = await queryCount(
    "select count(*) from information_schema.schemata where schema_name not like 'pg_%' and schema_name <> 'information_schema';"
  );
  const tableCount = await queryCount(
    "select count(*) from information_schema.tables where table_schema not in ('pg_catalog','information_schema');"
  );

  emit(
    {
      migrations_applied: applied,
      schemas: schemaCount,
      status: "ok",
      tables: tableCount,
      tool_versions: Object.fromEntries(
        toolStatus.map((tool) => [tool.name, tool.version_status])
      )
    },
    0
  );
} finally {
  if (started) {
    await runCommand("pg_ctl", ["-D", dataDir, "-m", "fast", "-w", "stop"]).catch(() => undefined);
  }
  await rm(tmpBase, { force: true, recursive: true }).catch(() => undefined);
}

async function queryCount(sql) {
  const result = await expectCommand("psql", [
    "-h",
    socketDir,
    "-p",
    port,
    "-d",
    databaseName,
    "--tuples-only",
    "--no-align",
    "--command",
    sql
  ]);
  return Number.parseInt(result.stdout.trim(), 10);
}

function getMigrationFiles(value) {
  return value.migrations.map((migration) => migration.file);
}

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-26.database-local-dry-run.v0") {
    errors.push("version must match database local dry-run contract");
  }

  if (value.status !== "local_tooling_check") {
    errors.push("status must be local_tooling_check");
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("provider must be planetscale_postgres");
  }

  if (value.database_contract !== databaseContractPath) {
    errors.push(`database_contract must be ${databaseContractPath}`);
  }

  if (value.migration_directory !== migrationDirectory) {
    errors.push(`migration_directory must be ${migrationDirectory}`);
  }

  if (value.checker !== "scripts/check-database-local-dry-run.mjs") {
    errors.push("checker must point to scripts/check-database-local-dry-run.mjs");
  }

  if (value.package_script !== packageScript) {
    errors.push(`package_script must be ${packageScript}`);
  }

  if (value.command !== `npm run ${packageScript}`) {
    errors.push(`command must be npm run ${packageScript}`);
  }

  for (const tool of requiredTools) {
    if (!Array.isArray(value.toolchain) || !value.toolchain.includes(tool)) {
      errors.push(`toolchain must include ${tool}`);
    }
  }

  errors.push(...validateExecution(value.execution));
  errors.push(...validateDatabaseContract(databaseValue));
  errors.push(...validatePackage(packageValue));

  return errors;
}

function validateExecution(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["execution must be an object"];
  }

  const expected = {
    applies_data: false,
    applies_schema: true,
    auth: "trust",
    cleanup: "always_remove_temporary_cluster",
    cluster: "temporary_local_postgres",
    network: false
  };

  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value[key] !== expectedValue) {
      errors.push(`execution.${key} must be ${expectedValue}`);
    }
  }

  return errors;
}

function validateDatabaseContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["database contract must be an object"];
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("database contract provider must be planetscale_postgres");
  }

  if (value.migration_directory !== migrationDirectory) {
    errors.push(`database contract migration_directory must be ${migrationDirectory}`);
  }

  const listedFiles = value.migrations.map((migration) => migration.file);
  const sortedFiles = [...listedFiles].sort();

  if (listedFiles.join("\n") !== sortedFiles.join("\n")) {
    errors.push("database contract migrations must be sorted");
  }

  for (const file of listedFiles) {
    if (!file.startsWith(`${migrationDirectory}/`) || !file.endsWith(".sql")) {
      errors.push(`invalid migration file ${file}`);
    }
  }

  return errors;
}

function validatePackage(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json must contain scripts"];
  }

  return value.scripts[packageScript] === "node scripts/check-database-local-dry-run.mjs"
    ? []
    : [`package.json must define ${packageScript}`];
}

async function probeTools(tools) {
  const results = [];

  for (const tool of tools) {
    const result = await runCommand(tool, ["--version"]);
    results.push({
      available: result.status === 0,
      name: tool,
      version_status: result.status === 0 ? "available" : "missing"
    });
  }

  return results;
}

async function expectCommand(command, args) {
  const result = await runCommand(command, args);

  if (result.status !== 0) {
    emit(
      {
        command,
        status: "command_failed",
        stderr_tail: tail(result.stderr, 2000)
      },
      1
    );
  }

  return result;
}

function runCommand(command, args) {
  return new Promise((resolveResult) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      resolveResult({
        error: error.message,
        status: 127,
        stderr,
        stdout
      });
    });
    child.on("close", (status) => {
      resolveResult({
        status: status ?? 1,
        stderr,
        stdout
      });
    });
  });
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), "utf8"));
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

function tail(value, maxLength) {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
