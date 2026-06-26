#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/database/migrations.contract.json";
const migrationDirectory = "supabase/migrations";
const requiredCommands = [
  "create_migration",
  "apply_local",
  "dry_run_remote",
  "apply_remote"
];
const forbiddenSqlPatterns = [
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
const forbiddenContractFields = ["id", "password", "secret", "token", "value"];

let contract;

try {
  contract = JSON.parse(readFileSync(resolve(root, contractPath), "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: contractPath,
      status: "invalid_json"
    },
    1
  );
}

const errors = validateContract(contract);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_database_migration_contract"
    },
    1
  );
}

emit(
  {
    migrations: contract.migrations.length,
    provider: contract.provider,
    status: "ok"
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until a database is provisioned");
  }

  if (value.provider !== "planetscale_postgres") {
    errors.push("provider must be planetscale_postgres");
  }

  if (value.connection_path !== "cloudflare_hyperdrive") {
    errors.push("connection_path must be cloudflare_hyperdrive");
  }

  if (value.migration_directory !== migrationDirectory) {
    errors.push(`migration_directory must be ${migrationDirectory}`);
  }

  for (const forbidden of forbiddenContractFields) {
    if (containsForbiddenKey(value, forbidden)) {
      errors.push(`contract must not contain a ${forbidden} field`);
    }
  }

  errors.push(...validateDatabaseBoundary(value.database_boundary));
  errors.push(...validateHyperdrive(value.hyperdrive));
  errors.push(...validateCommands(value.commands));
  errors.push(...validateMigrations(value.migrations));

  return errors;
}

function validateDatabaseBoundary(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["database_boundary must be an object"];
  }

  if (value.scope !== "aiphabee_dedicated_planetscale_database") {
    errors.push("database_boundary.scope must be aiphabee_dedicated_planetscale_database");
  }

  if (value.organization !== "chris_fung_planetscale_organization") {
    errors.push("database_boundary.organization must be chris_fung_planetscale_organization");
  }

  if (value.share_with_aimpact !== false) {
    errors.push("database_boundary.share_with_aimpact must be false");
  }

  if (value.share_with_salesko !== false) {
    errors.push("database_boundary.share_with_salesko must be false");
  }

  if (value.cross_product_tables !== false) {
    errors.push("database_boundary.cross_product_tables must be false");
  }

  if (
    value.active_boundary_doc !==
    "docs/governance/aiphabee-planetscale-boundary.md"
  ) {
    errors.push("database_boundary.active_boundary_doc must point to the active boundary doc");
  }

  if (
    value.superseded_database_boundary !==
    "docs/governance/aiphabee-independent-supabase-boundary.md"
  ) {
    errors.push("database_boundary.superseded_database_boundary must point to the superseded boundary");
  }

  return errors;
}

function validateHyperdrive(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["hyperdrive must be an object"];
  }

  if (value.binding !== "AIPHABEE_HYPERDRIVE") {
    errors.push("hyperdrive.binding must be AIPHABEE_HYPERDRIVE");
  }

  if (value.status !== "planned") {
    errors.push("hyperdrive.status must be planned until provisioned");
  }

  if (value.wrangler_binding_requires_real_id !== true) {
    errors.push("hyperdrive.wrangler_binding_requires_real_id must be true");
  }

  if (
    value.local_dev_secret_env !==
    "CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_AIPHABEE_HYPERDRIVE"
  ) {
    errors.push("hyperdrive.local_dev_secret_env must match the documented binding env name");
  }

  return errors;
}

function validateCommands(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["commands must be an array"];
  }

  const names = new Set();

  value.forEach((command, index) => {
    if (!isRecord(command)) {
      errors.push(`commands[${index}] must be an object`);
      return;
    }

    for (const field of ["name", "command", "effect"]) {
      if (typeof command[field] !== "string" || command[field].length === 0) {
        errors.push(`commands[${index}].${field} must be a non-empty string`);
      }
    }

    if (typeof command.name === "string") {
      names.add(command.name);
    }

    if (typeof command.command === "string" && /postgres(?:ql)?:\/\//iu.test(command.command)) {
      errors.push(`commands[${index}].command must not contain a database URL`);
    }
  });

  for (const required of requiredCommands) {
    if (!names.has(required)) {
      errors.push(`missing command ${required}`);
    }
  }

  return errors;
}

function validateMigrations(value) {
  const errors = [];

  if (!Array.isArray(value) || value.length === 0) {
    return ["migrations must be a non-empty array"];
  }

  const listedFiles = value.map((migration) => migration.file);
  const sortedFiles = [...listedFiles].sort();

  if (listedFiles.join("\n") !== sortedFiles.join("\n")) {
    errors.push("migrations must be listed in ascending filename order");
  }

  const actualFiles = readdirSync(resolve(root, migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .map((name) => join(migrationDirectory, name))
    .sort();

  if (listedFiles.slice().sort().join("\n") !== actualFiles.join("\n")) {
    errors.push("migrations list must match SQL files in supabase/migrations");
  }

  value.forEach((migration, index) => {
    if (!isRecord(migration)) {
      errors.push(`migrations[${index}] must be an object`);
      return;
    }

    if (
      typeof migration.file !== "string" ||
      !/^supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql$/u.test(migration.file)
    ) {
      errors.push(`migrations[${index}].file must use Supabase timestamp naming`);
      return;
    }

    if (migration.market_data !== false) {
      errors.push(`migrations[${index}].market_data must be false in Phase 0`);
    }

    if (migration.default_rights_status !== "default_deny") {
      errors.push(`migrations[${index}].default_rights_status must be default_deny`);
    }

    for (const field of ["purpose", "schemas", "tables"]) {
      if (migration[field] === undefined) {
        errors.push(`migrations[${index}].${field} is required`);
      }
    }

    const sql = readFileSync(resolve(root, migration.file), "utf8");

    forbiddenSqlPatterns.forEach((pattern) => {
      if (pattern.test(sql)) {
        errors.push(`${migration.file} contains forbidden SQL pattern ${pattern.source}`);
      }
    });

    validateSqlCoverage(migration, sql, errors);
  });

  return errors;
}

function validateSqlCoverage(migration, sql, errors) {
  const lowerSql = sql.toLowerCase();

  if (!Array.isArray(migration.schemas) || migration.schemas.length === 0) {
    errors.push(`${migration.file} must list at least one schema`);
  } else {
    for (const schema of migration.schemas) {
      if (!lowerSql.includes(`create schema if not exists ${schema}`)) {
        errors.push(`${migration.file} must create schema ${schema}`);
      }
    }
  }

  if (!Array.isArray(migration.tables) || migration.tables.length === 0) {
    errors.push(`${migration.file} must list at least one table`);
  } else {
    for (const table of migration.tables) {
      if (!lowerSql.includes(`create table if not exists ${table}`)) {
        errors.push(`${migration.file} must create table ${table}`);
      }
    }
  }

  if (!lowerSql.includes("default_deny")) {
    errors.push(`${migration.file} must preserve default_deny rights state`);
  }

  if (migration.indexes !== undefined) {
    if (!Array.isArray(migration.indexes) || migration.indexes.length === 0) {
      errors.push(`${migration.file} indexes must be a non-empty array when present`);
    } else {
      for (const indexName of migration.indexes) {
        if (typeof indexName !== "string" || indexName.length === 0) {
          errors.push(`${migration.file} indexes must contain non-empty strings`);
          continue;
        }

        if (!lowerSql.includes(`create index if not exists ${indexName.toLowerCase()}`)) {
          errors.push(`${migration.file} must create index ${indexName}`);
        }
      }
    }
  }

  if (migration.rls_tables !== undefined) {
    if (!Array.isArray(migration.rls_tables) || migration.rls_tables.length === 0) {
      errors.push(`${migration.file} rls_tables must be a non-empty array when present`);
    } else {
      for (const table of migration.rls_tables) {
        if (typeof table !== "string" || table.length === 0) {
          errors.push(`${migration.file} rls_tables must contain non-empty strings`);
          continue;
        }

        const normalizedTable = table.toLowerCase();
        if (!lowerSql.includes(`alter table ${normalizedTable} enable row level security`)) {
          errors.push(`${migration.file} must enable row level security on ${table}`);
        }

        if (!lowerSql.includes(`alter table ${normalizedTable} force row level security`)) {
          errors.push(`${migration.file} must force row level security on ${table}`);
        }
      }
    }
  }

  if (migration.rls_session_claim !== undefined) {
    if (typeof migration.rls_session_claim !== "string" || migration.rls_session_claim.length === 0) {
      errors.push(`${migration.file} rls_session_claim must be a non-empty string when present`);
    } else if (
      !lowerSql.includes(
        `current_setting('${migration.rls_session_claim.toLowerCase()}', true)`
      )
    ) {
      errors.push(`${migration.file} must read rls_session_claim ${migration.rls_session_claim}`);
    }
  }
}

function containsForbiddenKey(value, forbiddenKey) {
  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenKey(item, forbiddenKey));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(([key, nested]) => {
    if (key.toLowerCase() === forbiddenKey) {
      return true;
    }

    return containsForbiddenKey(nested, forbiddenKey);
  });
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
