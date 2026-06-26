#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/database/planetscale-direct-preflight.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const boundaryDocPath = "docs/governance/aiphabee-planetscale-boundary.md";
const scriptPath = "scripts/check-planetscale-direct-preflight.mjs";
const packageScript = "check:planetscale-direct-preflight";
const args = new Set(process.argv.slice(2));
const requireDirectSecret = args.has("--require-direct-secret");
const smokeSelectOne = args.has("--smoke-select-1");
const useKeychain = args.has("--use-keychain");

const forbiddenTextPatterns = [
  /postgres(?:ql)?:\/\/[^"'\s]+/iu,
  /password\s*=/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson("package.json");
const boundaryDoc = readText(boundaryDocPath);
const errors = validateContract(contract, databaseContract, packageJson, boundaryDoc);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_planetscale_direct_preflight_contract"
    },
    1
  );
}

const psqlProbe = await probeCommand("psql", ["--version"]);
const credentialState = await getCredentialState(contract.target, contract.credential_sources);

if (smokeSelectOne) {
  await runDirectSelectOne(contract.target, credentialState);
}

const directSecretReady = credentialState.planetscale_database_url.present || credentialState.keychain.present;
const status = directSecretReady
  ? "ready_for_direct_select_1"
  : "blocked_missing_direct_secret";
const exitCode = requireDirectSecret && !directSecretReady ? 2 : 0;

emit(
  {
    credential_sources: credentialState.safe_summary,
    package_script: packageScript,
    psql: psqlProbe,
    status,
    target: {
      database: contract.target.database,
      dbname: contract.target.dbname,
      host: contract.target.host,
      port: contract.target.port,
      primary_region: contract.target.primary_region,
      user_hash: hashString(contract.target.user)
    }
  },
  exitCode
);

async function runDirectSelectOne(target, credentialState) {
  const inspected = await resolveConnectionTarget(target, credentialState);
  const mismatch = validateDatabaseUrlTarget(inspected, target);
  const sslRootCert = resolveSslRootCert(target);

  if (mismatch.length > 0) {
    emit(
      {
        errors: mismatch,
        status: "invalid_planetscale_database_url_target"
      },
      1
    );
  }

  const result = await runCommand(
    "psql",
    [
      "-h",
      inspected.host,
      "-p",
      String(inspected.port),
      "-U",
      inspected.username,
      "-d",
      inspected.dbname,
      "--set",
      "ON_ERROR_STOP=1",
      "--tuples-only",
      "--no-align",
      "--command",
      "select 1 as planetscale_direct_smoke_result;"
    ],
    {
      env: {
        ...process.env,
        PGPASSWORD: inspected.password,
        PGSSLMODE: inspected.sslmode,
        ...(sslRootCert ? { PGSSLROOTCERT: sslRootCert } : {})
      }
    }
  );

  if (result.status !== 0) {
    const failure = classifyPsqlFailure(result.stderr, result.error);
    emit(
      {
        failure_reason: failure.reason,
        operator_action: failure.operator_action,
        stderr_hash: hashString(result.stderr),
        status: "direct_select_1_failed",
        stdout_hash: hashString(result.stdout)
      },
      1
    );
  }

  const normalizedOutput = result.stdout.trim();
  emit(
    {
      credential_source: credentialState.planetscale_database_url.present
        ? "PLANETSCALE_DATABASE_URL"
        : "macos_keychain",
      operation: "select_1",
      result_hash: hashString(normalizedOutput),
      row_count: normalizedOutput === "1" ? 1 : 0,
      status: normalizedOutput === "1" ? "ok" : "unexpected_select_1_result",
      target: {
        database: target.database,
        dbname: inspected.dbname,
        host: inspected.host,
        port: inspected.port,
        sslrootcert_status: sslRootCert ? "configured" : "missing",
        user_hash: hashString(inspected.username)
      }
    },
    normalizedOutput === "1" ? 0 : 1
  );
}

async function resolveConnectionTarget(target, credentialState) {
  if (credentialState.planetscale_database_url.present) {
    return inspectDatabaseUrl(process.env.PLANETSCALE_DATABASE_URL);
  }

  if (!useKeychain) {
    emit(
      {
        required_env: "PLANETSCALE_DATABASE_URL",
        status: "missing_planetscale_database_url"
      },
      2
    );
  }

  if (!credentialState.keychain.present) {
    emit(
      {
        keychain_account_hash: hashString(target.user),
        status: "missing_planetscale_keychain_password"
      },
      2
    );
  }

  const keychainSource = credentialState.keychain.source;
  const passwordResult = await runCommand("security", [
    "find-generic-password",
    "-s",
    keychainSource.service,
    "-a",
    keychainSource.account,
    "-w"
  ]);

  if (passwordResult.status !== 0 || passwordResult.stdout.trim().length === 0) {
    emit(
      {
        status: "keychain_password_read_failed"
      },
      2
    );
  }

  return {
    dbname: target.dbname,
    host: target.host,
    password: passwordResult.stdout.trim(),
    port: target.port,
    sslmode: target.sslmode,
    username: target.user
  };
}

async function getCredentialState(target, sources) {
  const envUrl = process.env.PLANETSCALE_DATABASE_URL;
  const envState = envUrl
    ? {
        detail: validateDatabaseUrlTarget(inspectDatabaseUrl(envUrl), target),
        present: true
      }
    : {
        detail: [],
        present: false
      };
  const keychainSource = sources.find((source) => source.source === "macos_keychain");
  const keychainState = await probeKeychain(keychainSource);

  return {
    keychain: {
      ...keychainState,
      source: keychainSource
    },
    planetscale_database_url: envState,
    safe_summary: {
      macos_keychain_password: {
        account_hash: hashString(keychainSource.account),
        present: keychainState.present,
        service_hash: hashString(keychainSource.service),
        status: keychainState.status
      },
      PLANETSCALE_DATABASE_URL: {
        present: envState.present,
        status: envState.present
          ? envState.detail.length === 0
            ? "present_target_matches"
            : "present_target_mismatch"
          : "missing"
      }
    }
  };
}

async function probeKeychain(source) {
  if (process.platform !== "darwin") {
    return {
      present: false,
      status: "unsupported_platform"
    };
  }

  const result = await runCommand("security", [
    "find-generic-password",
    "-s",
    source.service,
    "-a",
    source.account
  ]);

  return {
    present: result.status === 0,
    status: result.status === 0 ? "present" : "missing"
  };
}

async function probeCommand(command, args) {
  const result = await runCommand(command, args);
  return {
    available: result.status === 0,
    status: result.status === 0 ? "available" : "missing",
    version_hash: result.status === 0 ? hashString(result.stdout.trim()) : null
  };
}

function inspectDatabaseUrl(value) {
  try {
    const parsed = new URL(value);
    return {
      dbname: parsed.pathname.replace(/^\//u, ""),
      host: parsed.hostname,
      password: decodeURIComponent(parsed.password),
      port: parsed.port.length > 0 ? Number.parseInt(parsed.port, 10) : 5432,
      sslmode: parsed.searchParams.get("sslmode") ?? "",
      username: decodeURIComponent(parsed.username)
    };
  } catch {
    return {
      dbname: "",
      host: "",
      password: "",
      port: 0,
      sslmode: "",
      username: ""
    };
  }
}

function validateDatabaseUrlTarget(value, target) {
  const errors = [];

  if (value.host !== target.host) {
    errors.push("PLANETSCALE_DATABASE_URL host must match contract target");
  }

  if (value.port !== target.port) {
    errors.push("PLANETSCALE_DATABASE_URL port must match contract target");
  }

  if (value.dbname !== target.dbname) {
    errors.push("PLANETSCALE_DATABASE_URL dbname must match contract target");
  }

  if (value.username !== target.user) {
    errors.push("PLANETSCALE_DATABASE_URL user must match contract target");
  }

  if (value.sslmode !== target.sslmode) {
    errors.push("PLANETSCALE_DATABASE_URL sslmode must be verify-full");
  }

  return errors;
}

function classifyPsqlFailure(stderr, error) {
  const text = `${stderr ?? ""}\n${error ?? ""}`.toLowerCase();

  if (text.includes("password authentication failed")) {
    return {
      operator_action: "replace macos keychain password with the unmasked PlanetScale direct database password",
      reason: "password_authentication_failed"
    };
  }

  if (text.includes("user parameter must include branch")) {
    return {
      operator_action: "use the PlanetScale user.branch username from the connection details",
      reason: "branch_required"
    };
  }

  if (text.includes("root certificate file") && text.includes("does not exist")) {
    return {
      operator_action: "configure PGSSLROOTCERT with a local CA bundle while keeping sslmode verify-full",
      reason: "missing_ssl_root_certificate"
    };
  }

  if (text.includes("certificate verify failed") || text.includes("certificate verification failed")) {
    return {
      operator_action: "verify host, sslrootcert, and sslmode settings",
      reason: "ssl_certificate_verification_failed"
    };
  }

  if (text.includes("could not translate host name") || text.includes("name or service not known")) {
    return {
      operator_action: "verify the PlanetScale host and local DNS",
      reason: "dns_resolution_failed"
    };
  }

  if (text.includes("connection timed out") || text.includes("operation timed out")) {
    return {
      operator_action: "verify network access to the PlanetScale host and port",
      reason: "connection_timeout"
    };
  }

  if (text.includes("connection refused")) {
    return {
      operator_action: "verify the PlanetScale host, port, and service status",
      reason: "connection_refused"
    };
  }

  if (text.includes("no route to host") || text.includes("network is unreachable")) {
    return {
      operator_action: "verify local network routing to PlanetScale",
      reason: "network_unreachable"
    };
  }

  if (text.includes("database") && text.includes("does not exist")) {
    return {
      operator_action: "verify the database name in the direct connection target",
      reason: "database_not_found"
    };
  }

  return {
    operator_action: "run a redacted local psql diagnostic; do not print passwords or full database URLs",
    reason: "unknown_psql_failure"
  };
}

function resolveSslRootCert(target) {
  if (!Array.isArray(target.sslrootcert_candidates)) {
    return null;
  }

  for (const candidate of target.sslrootcert_candidates) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function validateContract(value, databaseValue, packageValue, boundaryValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-26.planetscale-direct-preflight.v1") {
    errors.push("version must match PlanetScale direct preflight contract");
  }

  if (value.status !== "readiness_no_secret") {
    errors.push("status must be readiness_no_secret");
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("provider must be planetscale_postgres");
  }

  if (value.database_contract !== databaseContractPath) {
    errors.push(`database_contract must be ${databaseContractPath}`);
  }

  if (value.boundary_doc !== boundaryDocPath) {
    errors.push(`boundary_doc must be ${boundaryDocPath}`);
  }

  if (value.checker !== scriptPath) {
    errors.push(`checker must be ${scriptPath}`);
  }

  if (value.package_script !== packageScript) {
    errors.push(`package_script must be ${packageScript}`);
  }

  errors.push(...validateTarget(value.target));
  errors.push(...validateCredentialSources(value.credential_sources, value.target));
  errors.push(...validateCommands(value.commands));
  errors.push(...validateSafeOutputPolicy(value.safe_output_policy));
  errors.push(...validateDatabaseContract(databaseValue));
  errors.push(...validatePackage(packageValue));
  errors.push(...validateBoundaryDoc(boundaryValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateTarget(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["target must be an object"];
  }

  const expected = {
    database: "aiphabee-prod",
    dbname: "postgres",
    host: "ap-southeast-2.pg.psdb.cloud",
    organization: "chris-fung",
    port: 5432,
    primary_region: "aws_ap_southeast_1",
    sslmode: "verify-full",
    user: "pscale_api_yn66uahpa46b.bpvsmvgwkutr"
  };

  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) {
      errors.push(`target.${field} must be ${expectedValue}`);
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

function validateCredentialSources(value, target) {
  const errors = [];

  if (!Array.isArray(value) || value.length !== 2) {
    return ["credential_sources must contain local env and macOS Keychain sources"];
  }

  const envSource = value.find((entry) => entry.name === "PLANETSCALE_DATABASE_URL");
  if (!isRecord(envSource) || envSource.source !== "local_environment") {
    errors.push("credential_sources must include PLANETSCALE_DATABASE_URL local_environment");
  }

  const keychainSource = value.find((entry) => entry.source === "macos_keychain");
  if (!isRecord(keychainSource)) {
    errors.push("credential_sources must include macos_keychain source");
  } else {
    if (keychainSource.service !== "AiphaBee PlanetScale Postgres chris-fung aiphabee-prod") {
      errors.push("macos_keychain service must match the local ops route");
    }

    if (keychainSource.account !== target.user) {
      errors.push("macos_keychain account must match target user");
    }
  }

  return errors;
}

function validateCommands(value) {
  const errors = [];
  const requiredNames = [
    "readiness",
    "require_direct_secret",
    "direct_select_1",
    "direct_select_1_from_keychain"
  ];

  if (!Array.isArray(value)) {
    return ["commands must be an array"];
  }

  const names = new Set();
  for (const [index, command] of value.entries()) {
    if (!isRecord(command)) {
      errors.push(`commands[${index}] must be an object`);
      continue;
    }

    names.add(command.name);

    for (const field of ["name", "command", "effect"]) {
      if (typeof command[field] !== "string" || command[field].length === 0) {
        errors.push(`commands[${index}].${field} must be a non-empty string`);
      }
    }

    if (typeof command.network !== "boolean") {
      errors.push(`commands[${index}].network must be boolean`);
    }
  }

  for (const required of requiredNames) {
    if (!names.has(required)) {
      errors.push(`commands missing ${required}`);
    }
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
    "never_log_raw_psql_output",
    "emit_hashes_only_for_smoke",
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

  if (value.connection_path !== "cloudflare_hyperdrive") {
    errors.push("database contract connection_path must be cloudflare_hyperdrive");
  }

  if (value.database_boundary?.active_boundary_doc !== boundaryDocPath) {
    errors.push("database contract active boundary must be the PlanetScale boundary doc");
  }

  return errors;
}

function validatePackage(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json must contain scripts"];
  }

  if (value.scripts[packageScript] !== `node ${scriptPath}`) {
    errors.push(`${packageScript} must run ${scriptPath}`);
  }

  if (typeof value.scripts.check !== "string" || !value.scripts.check.includes(`npm run ${packageScript}`)) {
    errors.push(`root check must include npm run ${packageScript}`);
  }

  return errors;
}

function validateBoundaryDoc(value) {
  const errors = [];

  if (!value.includes(contractPath)) {
    errors.push("boundary doc must reference PlanetScale direct preflight contract");
  }

  if (!value.includes(packageScript)) {
    errors.push("boundary doc must reference PlanetScale direct preflight package script");
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `secret-like value matched ${pattern.source}`);
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

function readText(path) {
  try {
    return readFileSync(resolve(root, path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_text_file"
      },
      1
    );
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolveResult) => {
    const child = spawn(command, args, {
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
