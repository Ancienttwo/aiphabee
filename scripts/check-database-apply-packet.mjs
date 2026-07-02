#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/database/apply-packet.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const localDryRunContractPath = "deploy/database/local-dry-run.contract.json";
const migrationDirectory = "deploy/database/migrations";
const packageScript = "check:database-apply-packet";

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const localDryRunContract = readJson(localDryRunContractPath);
const packageJson = readJson("package.json");
const errors = validateContract(contract, databaseContract, localDryRunContract, packageJson);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_database_apply_packet_contract"
    },
    1
  );
}

const packet = buildPacket(databaseContract);
const packetErrors = validatePacket(contract, packet);

if (packetErrors.length > 0) {
  emit(
    {
      errors: packetErrors,
      expected_packet_hash: contract.packet_hash,
      observed_packet_hash: packet.packet_hash,
      status: "database_apply_packet_changed"
    },
    1
  );
}

emit(
  {
    first_file: packet.first_file,
    last_file: packet.last_file,
    migration_count: packet.migration_count,
    packet_hash: packet.packet_hash,
    status: "ok",
    total_size_bytes: packet.total_size_bytes
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

function validateContract(value, databaseValue, localDryRunValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-26.database-apply-packet.v0") {
    errors.push("version must match database apply packet contract");
  }

  if (value.status !== "local_apply_packet") {
    errors.push("status must be local_apply_packet");
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("provider must be planetscale_postgres");
  }

  if (value.database_contract !== databaseContractPath) {
    errors.push(`database_contract must be ${databaseContractPath}`);
  }

  if (value.local_dry_run_contract !== localDryRunContractPath) {
    errors.push(`local_dry_run_contract must be ${localDryRunContractPath}`);
  }

  if (value.checker !== "scripts/check-database-apply-packet.mjs") {
    errors.push("checker must point to scripts/check-database-apply-packet.mjs");
  }

  if (value.package_script !== packageScript) {
    errors.push(`package_script must be ${packageScript}`);
  }

  if (value.command !== `npm run ${packageScript}`) {
    errors.push(`command must be npm run ${packageScript}`);
  }

  if (value.migration_directory !== migrationDirectory) {
    errors.push(`migration_directory must be ${migrationDirectory}`);
  }

  if (!Array.isArray(value.packet_material) || value.packet_material.length !== 3) {
    errors.push("packet_material must list path, sha256, and size_bytes");
  }

  if (!Array.isArray(value.remote_apply_gates) || value.remote_apply_gates.length < 4) {
    errors.push("remote_apply_gates must include database, local dry-run, packet, and direct smoke gates");
  }

  errors.push(...validateSafeOutputPolicy(value.safe_output_policy));
  errors.push(...validateDatabaseContract(databaseValue));
  errors.push(...validateLocalDryRunContract(localDryRunValue));
  errors.push(...validatePackage(packageValue));

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
    .map((name) => join(migrationDirectory, name))
    .sort();

  if (listedFiles.join("\n") !== sortedFiles.join("\n")) {
    errors.push("database contract migrations must be sorted");
  }

  if (sortedFiles.join("\n") !== actualFiles.join("\n")) {
    errors.push("database contract migration list must match migration directory");
  }

  return errors;
}

function validateLocalDryRunContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["local dry-run contract must be an object"];
  }

  if (value.status !== "local_tooling_check") {
    errors.push("local dry-run contract status must be local_tooling_check");
  }

  if (value.command !== "npm run check:database-local-dry-run") {
    errors.push("local dry-run contract command must be npm run check:database-local-dry-run");
  }

  return errors;
}

function validatePackage(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json must contain scripts"];
  }

  if (value.scripts[packageScript] !== "node scripts/check-database-apply-packet.mjs") {
    errors.push(`${packageScript} must run scripts/check-database-apply-packet.mjs`);
  }

  if (typeof value.scripts.check !== "string" || !value.scripts.check.includes(`npm run ${packageScript}`)) {
    errors.push(`root check must include npm run ${packageScript}`);
  }

  return errors;
}

function validateSafeOutputPolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["safe_output_policy must be an object"];
  }

  for (const field of ["no_database_url", "no_password", "counts_and_hashes_only"]) {
    if (value[field] !== true) {
      errors.push(`safe_output_policy.${field} must be true`);
    }
  }

  return errors;
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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
