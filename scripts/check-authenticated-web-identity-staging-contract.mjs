#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const contractPath = "deploy/account/authenticated-web-identity-staging.contract.json";
const authServerPath = "apps/web/src/lib/auth.server.ts";
const authClientPath = "apps/web/src/lib/auth-client.ts";
const sessionContextPath = "apps/web/src/lib/context/SessionContext.tsx";
const routePath = "apps/web/src/routes/api/auth/$.ts";
const smokePath = "scripts/smoke-authenticated-web-identity-staging.mjs";
const wranglerPath = "apps/web/wrangler.jsonc";
const migrationPath = "deploy/database/migrations/20260711041000_authenticated_web_identity.sql";
const rolePath = "deploy/database/roles/authenticated-web-identity-staging.sql";
const migrationContractPath = "deploy/database/migrations.contract.json";
const envSchemaPath = "deploy/env/env.schema.json";
const secretStoresPath = "deploy/secrets/stores.contract.json";
const webPackagePath = "apps/web/package.json";
const rootPackagePath = "package.json";
const deploymentArtifactPath = "apps/web/dist/server/wrangler.json";
const stagingHyperdriveId = "4a105c35ab2a42f3aec810a2db775eda";

export function validateAuthenticatedWebIdentityContract(contract) {
  const errors = [];
  expectEqual(
    errors,
    contract.version,
    "2026-07-11.authenticated-web-identity-staging.v1",
    "version",
  );
  if (!["configured_pending_live_credentials", "live_passed"].includes(contract.status)) {
    errors.push("status must be configured_pending_live_credentials or live_passed");
  }
  expectEqual(errors, contract.environment, "staging", "environment");
  expectEqual(errors, contract.worker, "aiphabee-web-staging", "worker");
  expectEqual(errors, contract.dependency?.name, "better-auth", "dependency.name");
  expectEqual(errors, contract.dependency?.version, "1.6.23", "dependency.version");
  expectEqual(errors, contract.dependency?.database_adapter, "pg_pool", "database adapter");
  expectEqual(errors, contract.dependency?.orm_added, false, "orm_added");
  expectEqual(errors, contract.oauth?.provider, "github", "oauth.provider");
  expectEqual(errors, contract.oauth?.invited_signup_enabled, true, "invited signup");
  expectEqual(errors, contract.oauth?.password_fallback, false, "password fallback");
  expectExactArray(errors, contract.oauth?.requested_scopes, ["read:user", "user:email"], "OAuth scopes");
  expectEqual(errors, contract.identity?.canonical_subject_prefix, "better-auth:", "subject prefix");
  expectEqual(
    errors,
    contract.identity?.canonical_subject_column,
    "platform.account.auth_subject",
    "subject column",
  );
  for (const [label, value] of [
    ["email identity", contract.identity?.email_is_identity_key],
    ["caller workspace", contract.identity?.caller_workspace_accepted],
    ["legacy fallback", contract.identity?.legacy_runtime_fallback],
  ]) {
    expectEqual(errors, value, false, label);
  }
  expectEqual(errors, contract.session?.database_backed, true, "database session");
  expectEqual(errors, contract.session?.cookie_cache_enabled, false, "cookie cache");
  expectEqual(errors, contract.session?.secure_cookies, true, "secure cookies");
  expectEqual(errors, contract.session?.csrf_check_enabled, true, "CSRF check");
  expectEqual(errors, contract.session?.origin_check_enabled, true, "origin check");
  expectEqual(errors, contract.session?.revoke_all_supported, true, "session revoke");
  expectEqual(errors, contract.oauth_token_storage?.encrypted, true, "OAuth token encryption");
  expectEqual(errors, contract.oauth_token_storage?.account_cookie_enabled, false, "account cookie");
  expectEqual(errors, contract.oauth_token_storage?.state_strategy, "database", "OAuth state");
  expectEqual(errors, contract.rate_limit?.enabled, true, "rate limit");
  expectEqual(errors, contract.rate_limit?.storage, "database", "rate limit storage");
  expectEqual(errors, contract.database?.binding, "AIPHABEE_AUTH_HYPERDRIVE", "auth binding");
  expectEqual(errors, contract.database?.schema, "aiphabee_auth", "auth schema");
  expectEqual(
    errors,
    contract.database?.runtime_role,
    "aiphabee_auth_staging",
    "auth runtime role",
  );
  expectEqual(errors, contract.database?.hyperdrive_cache_disabled, true, "Hyperdrive cache");
  expectEqual(
    errors,
    contract.database?.pool_lifecycle,
    "request_scoped_max_1_close_after_handler",
    "pool lifecycle",
  );
  expectExactArray(
    errors,
    contract.database?.tables,
    ["user", "session", "account", "verification", "rateLimit"],
    "auth tables",
  );
  expectExactArray(
    errors,
    contract.runtime_role_policy?.auth_table_dml,
    ["SELECT", "INSERT", "UPDATE", "DELETE"],
    "auth DML",
  );
  for (const field of ["auth_schema_create", "superuser", "createdb", "createrole", "inherit", "bypassrls"]) {
    expectEqual(errors, contract.runtime_role_policy?.[field], false, `runtime_role_policy.${field}`);
  }
  expectEqual(errors, contract.product_data_access?.enabled, false, "product data access");
  expectEqual(errors, contract.product_data_access?.netquity_reads, false, "Netquity reads");
  expectEqual(
    errors,
    contract.product_data_access?.automatic_platform_provisioning,
    false,
    "automatic provisioning",
  );
  if (!["pending_credentials", "passed"].includes(contract.live_acceptance?.status)) {
    errors.push("live_acceptance.status must be pending_credentials or passed");
  }
  expectEqual(errors, contract.production?.deployment_allowed, false, "production deploy");
  expectEqual(errors, contract.production?.auth_route_status, "not_found", "production auth route");
  return errors;
}

export function validateStaticImplementation(root = process.cwd()) {
  const contract = readJson(root, contractPath);
  const errors = validateAuthenticatedWebIdentityContract(contract);
  const authServer = readText(root, authServerPath);
  const authClient = readText(root, authClientPath);
  const sessionContext = readText(root, sessionContextPath);
  const route = readText(root, routePath);
  const smoke = readText(root, smokePath);
  const wrangler = readText(root, wranglerPath);
  const migration = readText(root, migrationPath);
  const role = readText(root, rolePath);
  const migrationContract = readJson(root, migrationContractPath);
  const envSchema = readJson(root, envSchemaPath);
  const secretStores = readJson(root, secretStoresPath);
  const webPackage = readJson(root, webPackagePath);
  const rootPackage = readJson(root, rootPackagePath);

  expectEqual(errors, webPackage.dependencies?.["better-auth"], "^1.6.23", "Web Better Auth dependency");
  expectEqual(errors, webPackage.dependencies?.pg, "^8.22.0", "Web pg dependency");
  expectEqual(errors, webPackage.devDependencies?.["@types/pg"], "^8.20.0", "Web pg types");
  expectEqual(
    errors,
    rootPackage.scripts?.["check:authenticated-web-identity"],
    "node scripts/check-authenticated-web-identity-staging-contract.mjs && node scripts/check-authenticated-web-identity-staging-fixtures.mjs",
    "root identity checker command",
  );
  expectEqual(
    errors,
    rootPackage.scripts?.["deploy:authenticated-web-identity:staging"],
    "CLOUDFLARE_ENV=staging npm run build --workspace @aiphabee/web && node scripts/check-authenticated-web-identity-staging-contract.mjs --deployment-artifact && CLOUDFLARE_ENV=staging npm exec --workspace @aiphabee/web -- wrangler deploy",
    "staging identity deploy command",
  );

  expectFragments(errors, authServer, authServerPath, [
    'bindings.APP_ENV !== "staging"',
    'encryptOAuthTokens: true',
    'storeAccountCookie: false',
    'storeStateStrategy: "database"',
    'disableImplicitSignUp: true',
    'user.emailVerified !== true',
    'cookieCache:',
    'enabled: false',
    'useSecureCookies: true',
    'disableCSRFCheck: false',
    'disableOriginCheck: false',
    'ipAddressHeaders: ["cf-connecting-ip"]',
    'storage: "database"',
    'max: 1',
    'options: "-c search_path=aiphabee_auth,pg_catalog"',
    'await backgroundTasks.settle()',
    'await runtime.close()',
    'return `${AUTH_SUBJECT_PREFIX}${userId.toLowerCase()}`',
  ]);
  if (/auth_user_id/u.test(authServer)) errors.push(`${authServerPath} must not read auth_user_id`);
  if (/mock-user|MOCK_SESSION/u.test(sessionContext)) errors.push(`${sessionContextPath} must not contain mock session authority`);
  expectFragments(errors, authClient, authClientPath, ['basePath: "/api/auth"']);
  expectFragments(errors, route, routePath, [
    'createFileRoute("/api/auth/$")',
    'new URL(request.url).pathname === "/api/auth/github/start"',
    'target.hostname !== "github.com"',
    '["CF-Connecting-IP", "Cookie", "User-Agent"]',
    'error.code === "AUTH_ENVIRONMENT_DENIED" ? 404 : 503',
    '"Cache-Control": "no-store"',
  ]);
  expectFragments(errors, wrangler, wranglerPath, [
    '"APP_ENV": "prod"',
    '"staging"',
    '"APP_ENV": "staging"',
    '"BETTER_AUTH_URL": "https://aiphabee-web-staging.metalabs.workers.dev"',
    '"binding": "AIPHABEE_AUTH_HYPERDRIVE"',
  ]);
  expectFragments(errors, migration, migrationPath, [
    'CREATE SCHEMA IF NOT EXISTS aiphabee_auth',
    'CREATE TABLE IF NOT EXISTS aiphabee_auth."user"',
    'CREATE TABLE IF NOT EXISTS aiphabee_auth."session"',
    'CREATE TABLE IF NOT EXISTS aiphabee_auth."account"',
    'CREATE TABLE IF NOT EXISTS aiphabee_auth."verification"',
    'CREATE TABLE IF NOT EXISTS aiphabee_auth."rateLimit"',
    'ALTER TABLE platform.account ADD COLUMN auth_subject text',
    'CREATE INDEX IF NOT EXISTS "rateLimit_lastRequest_idx"',
    'CREATE UNIQUE INDEX IF NOT EXISTS platform_account_auth_subject_uidx',
  ]);
  if (/auth_user_id|platform_account_auth_subject_shape_check/u.test(migration)) {
    errors.push(`${migrationPath} must not mutate legacy identity rows or constrain shared auth_subject formats`);
  }
  expectFragments(errors, role, rolePath, [
    'CREATE ROLE aiphabee_auth_staging',
    'NOSUPERUSER',
    'NOCREATEDB',
    'NOCREATEROLE',
    'NOINHERIT',
    'NOBYPASSRLS',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE',
    'REVOKE CREATE ON SCHEMA aiphabee_auth',
    "has_database_privilege(",
    "required_privilege text",
    "FOREACH required_privilege IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']",
    "'public', 'CREATE'",
    "schema_name LIKE 'nq\\_%' ESCAPE '\\'",
  ]);
  expectFragments(errors, smoke, smokePath, [
    'const STAGING_ORIGIN = "https://aiphabee-web-staging.metalabs.workers.dev"',
    'url.origin !== expectedOrigin',
    'AIPHABEE_AUTH_STAGING_REVOKE_PEER_SESSION_COOKIE',
    'const PRODUCTION_WEB_WORKER = "aiphabee-web"',
    'const PRODUCTION_WORKER = "aiphabee-worker"',
    'EXPECTED_PRODUCTION_WORKER_VERSION',
    'evidence.production_web_absent',
    'evidence.production_worker_unchanged',
    'revokedPeerSession.body.value === null',
    'invalidBody.valid && invalidBody.value === null',
    'const commandEnv = { CLOUDFLARE_ACCOUNT_ID }',
  ]);

  if (!migrationContract.migrations?.some((entry) => entry.file === migrationPath)) {
    errors.push(`${migrationContractPath} must register ${migrationPath}`);
  }
  const envByName = new Map(envSchema.variables?.map((entry) => [entry.name, entry]));
  for (const name of contract.required_variables) {
    if (envByName.get(name)?.secret !== false) errors.push(`${name} must be a non-secret env variable`);
  }
  for (const name of contract.required_secrets) {
    if (envByName.get(name)?.secret !== true) errors.push(`${name} must be registered as secret`);
    if (!secretStores.secret_names?.includes(name)) errors.push(`${name} must be in secret store contract`);
  }
  return errors;
}

function main() {
  const errors = validateStaticImplementation();
  if (process.argv.includes("--deployment-artifact")) {
    errors.push(...validateDeploymentArtifact());
  }
  if (errors.length > 0) {
    console.error(JSON.stringify({ errors, status: "invalid_authenticated_web_identity" }, null, 2));
    process.exit(1);
  }
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  console.log(
    JSON.stringify({
      environment: contract.environment,
      live_acceptance: contract.live_acceptance.status,
      role: contract.database.runtime_role,
      status: "ok",
      tables: contract.database.tables.length,
    }),
  );
}

function validateDeploymentArtifact(root = process.cwd()) {
  const errors = [];
  const artifact = readJson(root, deploymentArtifactPath);
  expectEqual(errors, artifact.name, "aiphabee-web-staging", "deployment artifact Worker");
  expectEqual(errors, artifact.vars?.APP_ENV, "staging", "deployment artifact APP_ENV");
  expectEqual(
    errors,
    artifact.vars?.BETTER_AUTH_URL,
    "https://aiphabee-web-staging.metalabs.workers.dev",
    "deployment artifact origin",
  );
  const authHyperdrive = artifact.hyperdrive?.find(
    (binding) => binding.binding === "AIPHABEE_AUTH_HYPERDRIVE",
  );
  expectEqual(errors, authHyperdrive?.id, stagingHyperdriveId, "deployment artifact Hyperdrive");
  expectExactArray(
    errors,
    [...(artifact.secrets?.required ?? [])].sort(),
    [
      "AIPHABEE_AUTH_INVITED_EMAIL_SHA256",
      "BETTER_AUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
    ],
    "deployment artifact required secrets",
  );
  return errors;
}

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) errors.push(`${label} must be ${JSON.stringify(expected)}`);
}

function expectExactArray(errors, actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${label} must equal ${JSON.stringify(expected)}`);
  }
}

function expectFragments(errors, text, path, fragments) {
  for (const fragment of fragments) {
    if (!text.includes(fragment)) errors.push(`${path} must include ${fragment}`);
  }
}

function readText(root, path) {
  return readFileSync(new URL(path, `file://${root.replace(/\/$/u, "")}/`), "utf8");
}

function readJson(root, path) {
  return JSON.parse(readText(root, path));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
