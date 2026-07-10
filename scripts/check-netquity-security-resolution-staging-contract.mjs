#!/usr/bin/env node
import { readFileSync } from "node:fs";

const paths = {
  contract: "deploy/ingest/netquity-security-resolution-staging.contract.json",
  env: "deploy/env/env.schema.json",
  indexSql: "deploy/ingest/netquity-security-resolution-staging-index.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-security-resolution-staging.sql",
  roleSql: "deploy/database/roles/netquity-security-serving-staging.sql",
  secrets: "deploy/secrets/stores.contract.json",
  securityTools: "packages/security-tools/src/index.ts",
  securityToolsTest: "packages/security-tools/src/index.test.ts",
  worker: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/netquity-security-resolution-live.test.ts"
};
const expected = {
  dataVersion: "netquity-basicdata-80cfa8bd1c73.v1",
  hash: "80cfa8bd1c737750199ceaf0f8f0bfe5c71d7f3cb074d6ae51da5cb394f8c861",
  route: "/tools/resolve-security/live-smoke",
  sourceBatch: "src_netquity_basicdata_80cfa8bd1c73",
  token: "AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN",
  version: "2026-07-11.netquity-security-resolution-staging.v1"
};
const expectedTables = [
  "aiphabee_core.raw_source_batch",
  "aiphabee_core.data_version_batch",
  "aiphabee_core.serving_dataset",
  "aiphabee_core.serving_snapshot",
  "aiphabee_core.serving_record"
];
const forbiddenSecretPatterns = [
  /postgres(?:ql)?:\/\/[^"\\\s]+/giu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/gu,
  /gh[pousr]_[A-Za-z0-9_]{20,}/gu,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gu
];

const contract = readJson(paths.contract);
const env = readJson(paths.env);
const packageJson = readJson(paths.package);
const secrets = readJson(paths.secrets);
const sources = Object.fromEntries(
  Object.entries(paths)
    .filter(([, path]) => !path.endsWith(".json"))
    .map(([key, path]) => [key, readText(path)])
);
const errors = [
  ...validateContract(contract),
  ...validatePromotionSql(sources.promotionSql),
  ...validateIndexSql(sources.indexSql),
  ...validateRoleSql(sources.roleSql),
  ...validateRuntime(sources.worker, sources.workerTest),
  ...validateSecurityTools(sources.securityTools, sources.securityToolsTest),
  ...validateEnvironment(env, secrets),
  ...validatePackage(packageJson),
  ...validateNoSecrets()
];

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_contract" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      data_version: contract.source.data_version,
      released_rows: contract.source.row_count,
      route: `POST ${contract.route.path}`,
      runtime_select_tables: contract.runtime_role.select_tables.length,
      status: "ok"
    },
    null,
    2
  )
);

function validateContract(value) {
  const errors = [];

  assertEqual(value.version, expected.version, "contract version", errors);
  assertEqual(value.status, "approved_staging_only", "contract status", errors);
  assertEqual(value.environment, "staging", "contract environment", errors);
  assertEqual(value.source?.source_batch_id, expected.sourceBatch, "source batch", errors);
  assertEqual(value.source?.data_version, expected.dataVersion, "data version", errors);
  assertEqual(value.source?.sha256, expected.hash, "source hash", errors);
  assertEqual(value.source?.row_count, 18036, "source row count", errors);
  assertEqual(value.source?.missing_listing_dates, 62, "missing listing dates", errors);
  assertEqual(value.source?.status_partition?.listed, 17555, "listed count", errors);
  assertEqual(value.source?.status_partition?.suspended, 141, "suspended count", errors);
  assertEqual(value.source?.status_partition?.delisted, 340, "delisted count", errors);

  const statusTotal = Object.values(value.source?.status_partition ?? {}).reduce(
    (total, count) => total + Number(count),
    0
  );
  assertEqual(statusTotal, 18036, "status partition total", errors);
  assertEqual(value.promotion?.serving_dataset, "security_master", "Serving dataset", errors);
  assertArrayEqual(
    value.promotion?.staging_prerequisite_migrations,
    [
      "deploy/database/migrations/20260620082000_security_master_raw_snapshot_scaffold.sql",
      "deploy/database/migrations/20260620091000_serving_store_scaffold.sql"
    ],
    "staging prerequisite migrations",
    errors
  );
  assertEqual(value.promotion?.release_state, "released", "release state", errors);
  assertEqual(value.promotion?.transactional, true, "transactional promotion", errors);
  assertEqual(
    value.promotion?.concurrent_index_outside_transaction,
    true,
    "concurrent index split",
    errors
  );
  assertEqual(value.runtime_role?.role, "aiphabee_runtime_rls", "runtime role", errors);
  assertArrayEqual(value.runtime_role?.select_tables, expectedTables, "runtime SELECT tables", errors);

  for (const field of [
    "raw_schema_usage",
    "writes",
    "schema_create",
    "database_create",
    "superuser",
    "bypassrls"
  ]) {
    assertEqual(value.runtime_role?.[field], false, `runtime_role.${field}`, errors);
  }

  assertEqual(value.route?.path, expected.route, "route path", errors);
  assertEqual(value.route?.token_binding, expected.token, "route token binding", errors);
  assertEqual(value.route?.required_app_env, "staging", "route environment guard", errors);
  assertEqual(value.route?.authorization_before_binding, true, "auth ordering", errors);
  assertEqual(value.route?.constant_time_bearer_comparison, true, "constant-time bearer", errors);
  assertEqual(value.route?.query_limit, 26, "query limit", errors);
  assertEqual(value.route?.maximum_candidates, 25, "candidate limit", errors);
  assertEqual(value.route?.maximum_input_bytes, 512, "input byte limit", errors);
  assertEqual(value.failure_statuses?.authorization, 403, "authorization status", errors);
  assertEqual(value.failure_statuses?.wrong_environment, 404, "wrong environment status", errors);
  assertEqual(value.failure_statuses?.missing_binding, 424, "missing binding status", errors);
  assertEqual(value.failure_statuses?.no_release, 409, "no release status", errors);
  assertEqual(value.failure_statuses?.not_found, 404, "not found status", errors);
  assertEqual(value.failure_statuses?.database_or_readback, 502, "database status", errors);
  assertEqual(value.rollback?.delete_raw_mirror, false, "raw mirror rollback", errors);

  return errors;
}

function validatePromotionSql(sql) {
  const errors = [];
  requireText(sql, "BEGIN;", "promotion must start a transaction", errors);
  requireText(sql, "COMMIT;", "promotion must commit", errors);
  requireText(sql, expected.hash, "promotion must pin source hash", errors);
  requireText(sql, expected.sourceBatch, "promotion must pin source batch", errors);
  requireText(sql, expected.dataVersion, "promotion must pin data version", errors);
  requireText(sql, "source_rows <> 18036", "promotion must preflight row count", errors);
  requireText(sql, "listed_rows <> 17555", "promotion must preflight listed count", errors);
  requireText(sql, "suspended_rows <> 141", "promotion must preflight suspended count", errors);
  requireText(sql, "delisted_rows <> 340", "promotion must preflight delisted count", errors);
  requireText(sql, "jsonb_strip_nulls", "promotion must omit absent dates", errors);
  requireText(sql, "ON CONFLICT (serving_record_id) DO NOTHING", "promotion must be idempotent", errors);
  requireText(sql, "release_state = 'released'", "promotion must release after readback", errors);

  for (const nameColumn of [
    "engshkname",
    "chishkname",
    "simshkname",
    "engname",
    "chiname",
    "simname"
  ]) {
    requireText(sql, nameColumn, `promotion must include ${nameColumn}`, errors);
  }

  if (/delete\s+from\s+nq_/iu.test(sql)) {
    errors.push("promotion must never delete the raw Netquity mirror");
  }

  if (/CREATE\s+INDEX/iu.test(sql)) {
    errors.push("concurrent index DDL must remain outside the promotion transaction");
  }

  return errors;
}

function validateIndexSql(sql) {
  const errors = [];
  requireText(sql, "CREATE INDEX CONCURRENTLY IF NOT EXISTS", "index must be concurrent", errors);
  requireText(sql, "jsonb_path_ops", "index must use JSONB path ops", errors);
  requireText(sql, "payload -> 'aliases'", "index must cover exact aliases", errors);

  if (/\bBEGIN\b/iu.test(sql)) {
    errors.push("concurrent index SQL must not open a transaction");
  }

  return errors;
}

function validateRoleSql(sql) {
  const errors = [];
  requireText(sql, "GRANT USAGE ON SCHEMA aiphabee_core", "role must receive core USAGE", errors);
  requireText(sql, "REVOKE CREATE ON SCHEMA aiphabee_core", "role must lose core CREATE", errors);
  requireText(sql, "GRANT SELECT ON TABLE", "role must receive explicit SELECT", errors);
  requireText(sql, "REVOKE INSERT, UPDATE, DELETE, TRUNCATE", "role must lose writes", errors);
  requireText(sql, "schema_name LIKE 'nq\\_%'", "role must enumerate raw schemas", errors);
  requireText(sql, "REVOKE ALL ON SCHEMA %I", "role must lose raw schema access", errors);

  for (const table of expectedTables) {
    requireText(sql, table, `role SQL must name ${table}`, errors);
  }

  if (/GRANT\s+(?:USAGE|SELECT|INSERT|UPDATE|DELETE)[\s\S]{0,120}\bnq_/iu.test(sql)) {
    errors.push("role SQL must not grant raw Netquity privileges");
  }

  return errors;
}

function validateRuntime(worker, workerTest) {
  const errors = [];
  const routeStart = worker.indexOf("app.post(NETQUITY_SECURITY_RESOLUTION_LIVE_ROUTE");
  const routeEnd = worker.indexOf('app.post("/tools/get-security-profile"', routeStart);
  const routeSource = worker.slice(routeStart, routeEnd);

  if (routeStart < 0 || routeEnd < 0) {
    errors.push("Worker must contain a separately bounded live-smoke route");
    return errors;
  }

  requireText(worker, expected.route, "Worker must name the guarded route", errors);
  requireText(worker, expected.token, "Worker must bind the staging token", errors);
  requireText(worker, "timingSafeEqual", "Worker must compare bearer digests in constant time", errors);
  requireText(
    worker,
    "NETQUITY_SECURITY_RESOLUTION_MAX_INPUT_BYTES = 512",
    "Worker must bound token and query hashing input",
    errors
  );
  requireText(routeSource, "resolveLiveSecurityRows", "live route must use the live row mapper", errors);
  requireText(routeSource, 'c.env.APP_ENV !== "staging"', "live route must enforce staging", errors);
  requireText(routeSource, "NETQUITY_SECURITY_SNAPSHOT_QUERY", "live route must run the snapshot gate", errors);
  requireText(routeSource, "NETQUITY_SECURITY_CANDIDATE_QUERY", "live route must run the candidate query", errors);
  requireText(worker, "LIMIT 26", "live route query must read one overflow sentinel", errors);
  requireText(worker, "snapshot.release_state = 'released'", "live route must gate snapshot release", errors);
  requireText(worker, "version.release_state = 'released'", "live route must gate data version release", errors);

  if (routeSource.includes("resolveSecurity(")) {
    errors.push("live route must never call the synthetic resolver");
  }

  if (
    routeSource.indexOf("hasValidNetquitySecuritySmokeAuthorization") >
    routeSource.indexOf("getRuntimeHyperdriveConnectionString")
  ) {
    errors.push("live route must authorize before reading Hyperdrive");
  }

  for (const evidence of [
    "Hyperdrive binding must not be read",
    "oversized bearer",
    "oversized query",
    "smoke route unavailable outside staging",
    "never falls back to synthetic records",
    "returns 424",
    "returns 409",
    "returns 404",
    "returns 502",
    "rejects 26 exact candidates"
  ]) {
    requireText(workerTest, evidence, `Worker test must prove: ${evidence}`, errors);
  }

  return errors;
}

function validateSecurityTools(source, test) {
  const errors = [];
  requireText(source, "resolveLiveSecurityRows", "security-tools must expose live mapping", errors);
  requireText(source, "normalizeExactSecurityLookup", "security-tools must expose exact normalization", errors);
  requireText(source, "CANDIDATE_LIMIT_EXCEEDED", "security-tools must reject overflow", errors);
  requireText(source, "validFrom?: string", "listing start must remain optional", errors);
  requireText(test, "nullable listing dates", "tests must cover absent listing dates", errors);
  requireText(test, "returns ambiguity", "tests must cover ambiguity", errors);
  requireText(test, "rejects candidate overflow", "tests must cover overflow", errors);
  return errors;
}

function validateEnvironment(env, secrets) {
  const errors = [];
  const variable = env.variables?.find((entry) => entry.name === expected.token);
  assertEqual(variable?.secret, true, "staging token secret classification", errors);
  assertArrayEqual(
    variable?.environments,
    ["dev", "staging", "prod"],
    "environment schema compatibility",
    errors
  );

  if (!secrets.secret_names?.includes(expected.token)) {
    errors.push("secret-store contract must list the staging token name");
  }

  const cloudflareStore = secrets.providers?.find(
    (provider) => provider.name === "cloudflare_workers"
  );
  if (!cloudflareStore?.stores?.includes(expected.token)) {
    errors.push("Cloudflare Worker secret store must own the staging token");
  }

  return errors;
}

function validatePackage(value) {
  const expectedScript = "node scripts/check-netquity-security-resolution-staging-contract.mjs";
  return value.scripts?.["check:netquity-security-resolution-staging"] === expectedScript
    ? []
    : [`package script check:netquity-security-resolution-staging must be ${expectedScript}`];
}

function validateNoSecrets() {
  const errors = [];

  for (const path of Object.values(paths)) {
    const source = readText(path);
    for (const pattern of forbiddenSecretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(source)) {
        errors.push(`${path} contains a forbidden secret-shaped value`);
      }
    }
  }

  return errors;
}

function assertEqual(actual, expectedValue, label, errors) {
  if (actual !== expectedValue) {
    errors.push(`${label} must be ${JSON.stringify(expectedValue)}`);
  }
}

function assertArrayEqual(actual, expectedValue, label, errors) {
  if (JSON.stringify(actual) !== JSON.stringify(expectedValue)) {
    errors.push(`${label} must equal ${JSON.stringify(expectedValue)}`);
  }
}

function requireText(source, expectedText, message, errors) {
  if (!source.includes(expectedText)) {
    errors.push(message);
  }
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(path, "utf8");
}
