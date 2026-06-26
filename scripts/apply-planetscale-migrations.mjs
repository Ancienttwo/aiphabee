#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const contractPath = "deploy/database/planetscale-remote-apply.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const applyPacketContractPath = "deploy/database/apply-packet.contract.json";
const directPreflightContractPath = "deploy/database/planetscale-direct-preflight.contract.json";
const runnerPath = "scripts/apply-planetscale-migrations.mjs";
const checkPackageScript = "check:planetscale-remote-apply";
const executePackageScript = "database:planetscale:apply";
const migrationDirectory = "supabase/migrations";
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const inventory = args.has("--inventory");
const useKeychain = args.has("--use-keychain");

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const applyPacketContract = readJson(applyPacketContractPath);
const directPreflightContract = readJson(directPreflightContractPath);
const packageJson = readJson("package.json");
const errors = validateContract(
  contract,
  databaseContract,
  applyPacketContract,
  directPreflightContract,
  packageJson
);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_planetscale_remote_apply_contract"
    },
    1
  );
}

const packet = buildPacket(databaseContract);
const packetErrors = validatePacket(applyPacketContract, packet);

if (packetErrors.length > 0) {
  emit(
    {
      errors: packetErrors,
      expected_packet_hash: applyPacketContract.packet_hash,
      observed_packet_hash: packet.packet_hash,
      status: "database_apply_packet_changed"
    },
    1
  );
}

if (!execute && !inventory) {
  emit(
    {
      migration_count: packet.migration_count,
      package_script: checkPackageScript,
      packet_hash: packet.packet_hash,
      status: "ready_for_guarded_remote_apply",
      target: safeTarget(contract.target)
    },
    0
  );
}

if (!useKeychain) {
  emit(
    {
      required_flag: "--use-keychain",
      status: "missing_keychain_flag"
    },
    2
  );
}

const password = await readKeychainPassword(contract.credential_source);
const before = await remoteInventory(contract.target, password);
const privileges = await remotePrivileges(contract.target, password);
const disallowed = before.tables.filter(
  (table) => !contract.execution.allowed_existing_tables.includes(`${table.schema}.${table.name}`)
);

if (inventory) {
  emit(
    {
      allowed_existing_tables: before.tables.length - disallowed.length,
      database_create_privilege: privileges.database_create,
      disallowed_existing_tables: disallowed.map((table) => `${table.schema}.${table.name}`),
      schemas: before.schemas,
      status:
        disallowed.length === 0 && privileges.database_create
          ? "remote_inventory_ok"
          : "remote_inventory_blocked",
      tables: before.tables.length,
      target: safeTarget(contract.target)
    },
    disallowed.length === 0 && privileges.database_create ? 0 : 1
  );
}

if (!execute) {
  emit(
    {
      required_flag: "--execute",
      status: "missing_execute_flag"
    },
    2
  );
}

if (disallowed.length > 0) {
  emit(
    {
      disallowed_existing_tables: disallowed.map((table) => `${table.schema}.${table.name}`),
      status: "remote_database_not_empty"
    },
    1
  );
}

if (!privileges.database_create) {
  emit(
    {
      operator_action: "create or use a PlanetScale direct database credential with CREATE privilege on database postgres",
      required_privilege: "CREATE on current_database()",
      status: "remote_apply_permission_missing",
      target: safeTarget(contract.target)
    },
    2
  );
}

const applyResult = await runCommand("psql", [
  "-h",
  contract.target.host,
  "-p",
  String(contract.target.port),
  "-U",
  contract.target.user,
  "-d",
  contract.target.dbname,
  "--set",
  "ON_ERROR_STOP=1",
  "--single-transaction",
  "--quiet",
  ...databaseContract.migrations.flatMap((migration) => ["--file", migration.file])
], {
  env: databaseEnv(contract.target, password)
});

if (applyResult.status !== 0) {
  emit(
    {
      packet_hash: packet.packet_hash,
      status: "remote_apply_failed",
      stderr_hash: hashString(applyResult.stderr),
      stderr_tail: tail(redact(applyResult.stderr), 1200),
      stdout_hash: hashString(applyResult.stdout)
    },
    1
  );
}

const after = await remoteInventory(contract.target, password);

emit(
  {
    migrations_applied: packet.migration_count,
    packet_hash: packet.packet_hash,
    schemas: after.schemas,
    status: "ok",
    tables: after.tables.length,
    target: safeTarget(contract.target)
  },
  0
);

function buildPacket(value) {
  const rows = value.migrations.map((migration) => {
    const bytes = readFileSync(resolve(root, migration.file));
    return {
      file: migration.file,
      sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      size_bytes: bytes.length
    };
  });
  const serializedRows = `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;

  return {
    first_file: rows[0]?.file ?? "",
    last_file: rows.at(-1)?.file ?? "",
    migration_count: rows.length,
    packet_hash: `sha256:${createHash("sha256").update(serializedRows).digest("hex")}`,
    total_size_bytes: rows.reduce((sum, row) => sum + row.size_bytes, 0)
  };
}

function validateContract(value, databaseValue, packetValue, directValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-26.planetscale-remote-apply.v0") {
    errors.push("version must match PlanetScale remote apply contract");
  }

  if (value.status !== "guarded_remote_apply") {
    errors.push("status must be guarded_remote_apply");
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("provider must be planetscale_postgres");
  }

  if (value.database_contract !== databaseContractPath) {
    errors.push(`database_contract must be ${databaseContractPath}`);
  }

  if (value.apply_packet_contract !== applyPacketContractPath) {
    errors.push(`apply_packet_contract must be ${applyPacketContractPath}`);
  }

  if (value.direct_preflight_contract !== directPreflightContractPath) {
    errors.push(`direct_preflight_contract must be ${directPreflightContractPath}`);
  }

  if (value.runner !== runnerPath) {
    errors.push(`runner must be ${runnerPath}`);
  }

  if (value.package_script_check !== checkPackageScript) {
    errors.push(`package_script_check must be ${checkPackageScript}`);
  }

  if (value.package_script_execute !== executePackageScript) {
    errors.push(`package_script_execute must be ${executePackageScript}`);
  }

  errors.push(...validateTarget(value.target, directValue.target));
  errors.push(...validateCredentialSource(value.credential_source, value.target));
  errors.push(...validateExecution(value.execution));
  errors.push(...validateCommands(value.commands));
  errors.push(...validateSafeOutputPolicy(value.safe_output_policy));
  errors.push(...validateDatabaseContract(databaseValue));
  errors.push(...validateApplyPacketContract(packetValue));
  errors.push(...validatePackage(packageValue));

  return errors;
}

function validateTarget(value, directTarget) {
  const errors = [];

  if (!isRecord(value)) {
    return ["target must be an object"];
  }

  for (const field of ["organization", "database", "host", "port", "dbname", "user", "primary_region", "sslmode"]) {
    if (value[field] !== directTarget?.[field]) {
      errors.push(`target.${field} must match direct preflight target`);
    }
  }

  if (
    !Array.isArray(value.sslrootcert_candidates) ||
    !value.sslrootcert_candidates.includes("/etc/ssl/cert.pem")
  ) {
    errors.push("target.sslrootcert_candidates must include /etc/ssl/cert.pem");
  }

  return errors;
}

function validateCredentialSource(value, target) {
  const errors = [];

  if (!isRecord(value)) {
    return ["credential_source must be an object"];
  }

  if (value.source !== "macos_keychain") {
    errors.push("credential_source.source must be macos_keychain");
  }

  if (value.service !== "AiphaBee PlanetScale Postgres chris-fung aiphabee-prod") {
    errors.push("credential_source.service must match the local ops route");
  }

  if (value.account !== target.user) {
    errors.push("credential_source.account must match target user");
  }

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
    network: true,
    requires_execute_flag: true,
    requires_keychain_flag: true,
    requires_database_create_privilege: true,
    single_transaction: true,
    stop_on_error: true
  };

  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) {
      errors.push(`execution.${field} must be ${expectedValue}`);
    }
  }

  if (
    !Array.isArray(value.allowed_existing_tables) ||
    !value.allowed_existing_tables.includes("pscale_extensions.hypopg_hidden_indexes") ||
    !value.allowed_existing_tables.includes("pscale_extensions.hypopg_list_indexes")
  ) {
    errors.push("execution.allowed_existing_tables must include PlanetScale helper tables");
  }

  return errors;
}

function validateCommands(value) {
  const errors = [];
  const required = new Set(["preflight", "remote_inventory", "execute"]);

  if (!Array.isArray(value)) {
    return ["commands must be an array"];
  }

  for (const command of value) {
    if (!isRecord(command)) {
      errors.push("commands entries must be objects");
      continue;
    }
    required.delete(command.name);
    for (const field of ["name", "command", "effect"]) {
      if (typeof command[field] !== "string" || command[field].length === 0) {
        errors.push(`command.${field} must be a non-empty string`);
      }
    }
    if (typeof command.network !== "boolean") {
      errors.push("command.network must be boolean");
    }
  }

  for (const missing of required) {
    errors.push(`commands missing ${missing}`);
  }

  return errors;
}

function validateSafeOutputPolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["safe_output_policy must be an object"];
  }

  for (const field of [
    "never_log_database_url",
    "never_log_password",
    "never_pass_database_url_as_process_argument",
    "emit_counts_and_hashes_only",
    "emit_safe_failure_reason"
  ]) {
    if (value[field] !== true) {
      errors.push(`safe_output_policy.${field} must be true`);
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
  const actualFiles = readdirSync(resolve(root, migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .map((name) => `${migrationDirectory}/${name}`)
    .sort();

  if (listedFiles.join("\n") !== sortedFiles.join("\n")) {
    errors.push("database contract migrations must be sorted");
  }

  if (sortedFiles.join("\n") !== actualFiles.join("\n")) {
    errors.push("database contract migration list must match migration directory");
  }

  return errors;
}

function validateApplyPacketContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["apply packet contract must be an object"];
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("apply packet provider must be planetscale_postgres");
  }

  if (typeof value.packet_hash !== "string" || !value.packet_hash.startsWith("sha256:")) {
    errors.push("apply packet hash must be a sha256 digest");
  }

  return errors;
}

function validatePacket(contractValue, packet) {
  const errors = [];
  const expected = {
    first_file: contractValue.first_file,
    last_file: contractValue.last_file,
    migration_count: contractValue.migration_count,
    packet_hash: contractValue.packet_hash,
    total_size_bytes: contractValue.total_size_bytes
  };

  for (const [field, expectedValue] of Object.entries(expected)) {
    if (packet[field] !== expectedValue) {
      errors.push(`${field} changed`);
    }
  }

  return errors;
}

function validatePackage(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json must contain scripts"];
  }

  if (value.scripts[checkPackageScript] !== `node ${runnerPath}`) {
    errors.push(`${checkPackageScript} must run ${runnerPath}`);
  }

  if (value.scripts[executePackageScript] !== `node ${runnerPath} --execute --use-keychain`) {
    errors.push(`${executePackageScript} must run ${runnerPath} --execute --use-keychain`);
  }

  if (typeof value.scripts.check !== "string" || !value.scripts.check.includes(`npm run ${checkPackageScript}`)) {
    errors.push(`root check must include npm run ${checkPackageScript}`);
  }

  return errors;
}

async function remoteInventory(target, password) {
  const result = await runCommand("psql", [
    "-h",
    target.host,
    "-p",
    String(target.port),
    "-U",
    target.user,
    "-d",
    target.dbname,
    "--set",
    "ON_ERROR_STOP=1",
    "--csv",
    "--command",
    `select table_schema, table_name
from information_schema.tables
where table_schema not in ('pg_catalog','information_schema')
order by table_schema, table_name;`
  ], {
    env: databaseEnv(target, password)
  });

  if (result.status !== 0) {
    emit(
      {
        status: "remote_inventory_failed",
        stderr_hash: hashString(result.stderr),
        stderr_tail: tail(redact(result.stderr), 800)
      },
      1
    );
  }

  const tables = result.stdout
    .trim()
    .split(/\r?\n/u)
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const [schema, name] = line.split(",");
      return { name, schema };
    });
  const schemas = new Set(tables.map((table) => table.schema)).size;

  return { schemas, tables };
}

async function remotePrivileges(target, password) {
  const result = await runCommand("psql", [
    "-h",
    target.host,
    "-p",
    String(target.port),
    "-U",
    target.user,
    "-d",
    target.dbname,
    "--set",
    "ON_ERROR_STOP=1",
    "--tuples-only",
    "--no-align",
    "--command",
    "select has_database_privilege(current_user, current_database(), 'CREATE');"
  ], {
    env: databaseEnv(target, password)
  });

  if (result.status !== 0) {
    emit(
      {
        status: "remote_privilege_probe_failed",
        stderr_hash: hashString(result.stderr),
        stderr_tail: tail(redact(result.stderr), 800)
      },
      1
    );
  }

  return {
    database_create: result.stdout.trim() === "t"
  };
}

async function readKeychainPassword(source) {
  if (process.platform !== "darwin") {
    emit(
      {
        status: "unsupported_keychain_platform"
      },
      2
    );
  }

  const result = await runCommand("security", [
    "find-generic-password",
    "-s",
    source.service,
    "-a",
    source.account,
    "-w"
  ]);

  if (result.status !== 0 || result.stdout.trim().length === 0) {
    emit(
      {
        account_hash: hashString(source.account),
        service_hash: hashString(source.service),
        status: "keychain_password_read_failed"
      },
      2
    );
  }

  return result.stdout.trim();
}

function databaseEnv(target, password) {
  return {
    ...process.env,
    PGPASSWORD: password,
    PGSSLMODE: target.sslmode,
    ...(resolveSslRootCert(target) ? { PGSSLROOTCERT: resolveSslRootCert(target) } : {})
  };
}

function resolveSslRootCert(target) {
  for (const candidate of target.sslrootcert_candidates ?? []) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

function safeTarget(target) {
  return {
    database: target.database,
    dbname: target.dbname,
    host: target.host,
    port: target.port,
    primary_region: target.primary_region,
    user_hash: hashString(target.user)
  };
}

function runCommand(command, commandArgs, options = {}) {
  return new Promise((resolveResult) => {
    const child = spawn(command, commandArgs, {
      cwd: root,
      env: options.env ?? process.env,
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

function redact(value) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/giu, "postgresql://<redacted>")
    .replace(/pscale_pw_[A-Za-z0-9]+/gu, "<redacted_planetscale_password>");
}

function tail(value, maxLength) {
  return value.length <= maxLength ? value : value.slice(-maxLength);
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
