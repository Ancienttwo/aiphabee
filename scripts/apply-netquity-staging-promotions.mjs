#!/usr/bin/env node
// Applies the 16 Netquity live-domain staging promotion files (8
// deploy/ingest/netquity-*-staging.sql + 8
// deploy/account/netquity-*-entitlement-staging.sql) to the shared staging
// PlanetScale database as the scoped netquity_serving_writer_staging role.
//
// Unlike scripts/apply-planetscale-migrations.mjs (production DDL apply,
// single-transaction across the whole packet), this runner does NOT use
// --single-transaction: every file already wraps itself in its own
// BEGIN...COMMIT plus an internal readback DO block, so each promotion is
// independently atomic and a later file's failure does not roll back an
// earlier file's already-committed and already-verified work. psql's
// ON_ERROR_STOP=1 still stops the whole run at the first failing file.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const contractPath = "deploy/database/netquity-staging-promotions.contract.json";
const runnerPath = "scripts/apply-netquity-staging-promotions.mjs";
const checkPackageScript = "check:netquity-staging-promotions";
const executePackageScript = "netquity:staging:promote";
// Session-scope value for the aiphabee.account_id RLS claim GUC that
// platform.is_workspace_member()-gated SELECT policies read (see
// platform.workspace_subscription and aiphabee_governance.data_entitlement/
// workspace_entitlement's policies). Literal value carried over from
// deploy/database/roles/netquity-serving-writer-staging.sql's original
// `ALTER ROLE netquity_serving_writer_staging SET aiphabee.account_id =
// 'account_authenticated_netquity_staging';` statement -- that statement is
// gone from the role SQL (confirmed against staging: a *persistent*
// ALTER ROLE ... SET on a custom GUC needs either superuser or a
// superuser-granted `SET ON PARAMETER` privilege, and staging's
// PlanetScale-managed admin credential has neither, with an empty
// pg_parameter_acl and no superuser reachable on the instance to grant
// one). This runner now sets the same value at session scope instead, once
// per connection, before any promotion file runs -- see the `--command`
// entry ahead of the `--file` list below.
const ACCOUNT_ID_SESSION_CLAIM = "account_authenticated_netquity_staging";
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const useKeychain = args.has("--use-keychain");

const contract = readJson(contractPath);
const packageJson = readJson("package.json");
const errors = validateContract(contract, packageJson);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_netquity_staging_promotions_contract"
    },
    1
  );
}

const packet = buildPacket(contract.files);
const packetErrors = validatePacket(contract.packet, packet);

if (packetErrors.length > 0) {
  emit(
    {
      errors: packetErrors,
      expected_packet: contract.packet,
      observed_packet: packet,
      status: "netquity_staging_promotions_packet_changed"
    },
    1
  );
}

if (!execute) {
  emit(
    {
      file_count: packet.file_count,
      package_script: checkPackageScript,
      packet_hash: packet.packet_hash,
      status: "ready_for_guarded_staging_promotion_apply",
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
const privileges = await remotePrivileges(contract.target, password);

if (privileges.current_user !== contract.target.user.split(".")[0]) {
  emit(
    {
      expected_role: contract.target.user.split(".")[0],
      observed_role_hash: hashString(privileges.current_user),
      status: "unexpected_connected_role"
    },
    1
  );
}

if (privileges.database_create || privileges.is_superuser || privileges.bypassrls) {
  emit(
    {
      bypassrls: privileges.bypassrls,
      database_create_privilege: privileges.database_create,
      is_superuser: privileges.is_superuser,
      operator_action: "netquity_serving_writer_staging must never have CREATE, SUPERUSER, or BYPASSRLS -- re-run deploy/database/roles/netquity-serving-writer-staging.sql and inspect its readback DO block",
      status: "connected_role_not_least_privilege"
    },
    1
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
  "--quiet",
  // Single psql invocation, single connection, one session for all 16
  // files (see the header comment above): this --command runs once, on
  // that one connection, before the first --file below. psql executes -c/
  // --command and -f/--file in the order given on the command line, so
  // every one of the 16 files sees the claim already set.
  "--command",
  `SET aiphabee.account_id = '${ACCOUNT_ID_SESSION_CLAIM}';`,
  ...contract.files.flatMap((file) => ["--file", file])
], {
  env: databaseEnv(contract.target, password)
});

if (applyResult.status !== 0) {
  emit(
    {
      packet_hash: packet.packet_hash,
      status: "staging_promotion_apply_failed",
      stderr_hash: hashString(applyResult.stderr),
      stderr_tail: tail(redact(applyResult.stderr), 1200),
      stdout_hash: hashString(applyResult.stdout)
    },
    1
  );
}

emit(
  {
    files_applied: packet.file_count,
    packet_hash: packet.packet_hash,
    status: "ok",
    target: safeTarget(contract.target)
  },
  0
);

function buildPacket(files) {
  const rows = files.map((file) => {
    const bytes = readFileSync(resolve(root, file));
    return {
      file,
      sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      size_bytes: bytes.length
    };
  });
  const serializedRows = `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;

  return {
    file_count: rows.length,
    first_file: rows[0]?.file ?? "",
    last_file: rows.at(-1)?.file ?? "",
    packet_hash: `sha256:${createHash("sha256").update(serializedRows).digest("hex")}`,
    total_size_bytes: rows.reduce((sum, row) => sum + row.size_bytes, 0)
  };
}

function validateContract(value, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-07-16.netquity-staging-promotions.v0") {
    errors.push("version must match netquity staging promotions contract");
  }

  if (value.status !== "guarded_staging_promotion_apply") {
    errors.push("status must be guarded_staging_promotion_apply");
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("provider must be planetscale_postgres");
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

  errors.push(...validateTarget(value.target));
  errors.push(...validateCredentialSource(value.credential_source, value.target));
  errors.push(...validateExecution(value.execution));
  errors.push(...validateFiles(value.files));
  errors.push(...validateSafeOutputPolicy(value.safe_output_policy));
  errors.push(...validatePackage(packageValue));

  return errors;
}

function validateTarget(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["target must be an object"];
  }

  for (const field of ["organization", "database", "host", "port", "dbname", "user", "sslmode"]) {
    if (value[field] === undefined || value[field] === null || value[field] === "") {
      errors.push(`target.${field} must be set`);
    }
  }

  if (typeof value.user === "string" && !value.user.startsWith("netquity_serving_writer_staging")) {
    errors.push("target.user must be the netquity_serving_writer_staging role");
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

  if (
    value.service !==
    "AiphaBee PlanetScale Postgres chris-fung aiphabee-staging-serving-writer"
  ) {
    errors.push("credential_source.service must match the local ops route");
  }

  if (value.account !== target?.user) {
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
    applies_data: true,
    applies_schema: false,
    forbids_database_create_privilege: true,
    network: true,
    requires_execute_flag: true,
    requires_keychain_flag: true,
    single_transaction: false,
    stop_on_error: true
  };

  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) {
      errors.push(`execution.${field} must be ${expectedValue}`);
    }
  }

  return errors;
}

function validateFiles(value) {
  const errors = [];

  if (!Array.isArray(value) || value.length !== 16) {
    return ["files must be an array of exactly 16 paths"];
  }

  const ingestCount = value.filter((file) => file.startsWith("deploy/ingest/")).length;
  const entitlementCount = value.filter((file) => file.startsWith("deploy/account/")).length;

  if (ingestCount !== 8) {
    errors.push("files must include exactly 8 deploy/ingest/ paths");
  }

  if (entitlementCount !== 8) {
    errors.push("files must include exactly 8 deploy/account/ paths");
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

  return errors;
}

function validatePacket(contractValue, packet) {
  const errors = [];
  const expected = {
    file_count: contractValue.file_count,
    first_file: contractValue.first_file,
    last_file: contractValue.last_file,
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
    "select current_user, has_database_privilege(current_user, current_database(), 'CREATE'), (select rolsuper from pg_roles where rolname = current_user), (select rolbypassrls from pg_roles where rolname = current_user);"
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

  const [currentUser, databaseCreate, isSuperuser, bypassrls] = result.stdout.trim().split("|");

  return {
    bypassrls: bypassrls === "t",
    current_user: currentUser,
    database_create: databaseCreate === "t",
    is_superuser: isSuperuser === "t"
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
    PGSSLMODE: target.sslmode
  };
}

function safeTarget(target) {
  return {
    database: target.database,
    dbname: target.dbname,
    host: target.host,
    port: target.port,
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
