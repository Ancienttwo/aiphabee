#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CONTRACT_PATH = "deploy/account/authenticated-netquity-web-resolver-staging.contract.json";
const WEB_ARTIFACT_PATH = "apps/web/dist/server/wrangler.json";
const REQUIRED_FIELDS = [
  "security_master.currency",
  "security_master.exchange",
  "security_master.instrument_id",
  "security_master.listing_id",
  "security_master.market",
  "security_master.match_reason",
  "security_master.name.en",
  "security_master.name.zh_hans",
  "security_master.name.zh_hant",
  "security_master.status",
  "security_master.symbol",
  "security_master.valid_from",
  "security_master.valid_to",
];

export function validateAuthenticatedNetquityWebResolverContract(contract) {
  const errors = [];
  expectEqual(errors, contract.version, "2026-07-11.authenticated-netquity-web-resolver-staging.v1", "version");
  if (!["configured_pending_live_apply", "live_passed"].includes(contract.status)) {
    errors.push("status must be configured_pending_live_apply or live_passed");
  }
  expectEqual(errors, contract.environment, "staging", "environment");
  expectEqual(errors, contract.web_worker, "aiphabee-web-staging", "web_worker");
  expectEqual(errors, contract.api_worker, "aiphabee-worker-staging", "api_worker");
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveSecurity", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.web?.transport, "tanstack_createServerFn_post", "web.transport");
  expectEqual(errors, contract.web?.session_authority, "better_auth_database_session", "web.session_authority");
  expectExactArray(errors, contract.web?.allowed_input_fields, ["market", "query"], "web.allowed_input_fields");
  expectExactArray(errors, contract.web?.forbidden_input_fields, ["accountId", "authSubject", "email", "workspaceId"], "web.forbidden_input_fields");
  expectEqual(errors, contract.web?.cache_control, "no-store", "web.cache_control");
  expectEqual(errors, contract.web?.vary, "Cookie", "web.vary");
  expectEqual(errors, contract.database?.binding, "AIPHABEE_HYPERDRIVE", "database.binding");
  expectEqual(errors, contract.database?.runtime_role, "aiphabee_runtime_rls", "database.runtime_role");
  expectTrue(errors, contract.database?.subject_function_security_definer, "database.subject_function_security_definer");
  expectFalse(errors, contract.database?.subject_function_public_execute, "database.subject_function_public_execute");
  expectFalse(errors, contract.database?.writes_by_runtime, "database.writes_by_runtime");
  expectFalse(errors, contract.database?.raw_netquity_access, "database.raw_netquity_access");
  expectFalse(errors, contract.database?.better_auth_schema_access_by_api_runtime, "database.better_auth_schema_access_by_api_runtime");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.dataset, "security_master", "authorization.dataset");
  expectEqual(errors, contract.authorization?.default_rights_status, "default_deny", "authorization.default_rights_status");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_FIELDS, "authorization.requested_fields");
  expectFalse(errors, contract.authorization?.partial_candidate_allowed, "authorization.partial_candidate_allowed");
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  expectTrue(errors, contract.serving?.exact_alias_only, "serving.exact_alias_only");
  expectEqual(errors, contract.serving?.max_candidates, 25, "serving.max_candidates");
  expectFalse(errors, contract.serving?.synthetic_fallback, "serving.synthetic_fallback");
  expectFalse(errors, contract.serving?.raw_table_reads, "serving.raw_table_reads");
  expectTrue(errors, contract.public_http?.remains_synthetic, "public_http.remains_synthetic");
  expectFalse(errors, contract.public_http?.private_identity_headers_accepted, "public_http.private_identity_headers_accepted");
  expectFalse(errors, contract.public_http?.named_rpc_route_exists, "public_http.named_rpc_route_exists");
  expectFalse(errors, contract.production?.deployment_allowed, "production.deployment_allowed");
  expectTrue(errors, contract.production?.web_worker_must_remain_absent, "production.web_worker_must_remain_absent");
  expectTrue(errors, contract.production?.version_must_remain_unchanged, "production.version_must_remain_unchanged");
  if (contract.status === "live_passed") {
    expectEqual(errors, contract.live_acceptance?.status, "passed", "live_acceptance.status");
    expectTrue(errors, contract.live_acceptance?.authenticated_web_session_readback, "live_acceptance.authenticated_web_session_readback");
    expectTrue(errors, contract.live_acceptance?.authenticated_web_stock_search_navigated, "live_acceptance.authenticated_web_stock_search_navigated");
    expectEqual(errors, contract.live_acceptance?.unauthenticated_web_server_fn_status, 401, "live_acceptance.unauthenticated_web_server_fn_status");
    expectTrue(errors, contract.live_acceptance?.better_auth_secret_synced_after_final_deploy, "live_acceptance.better_auth_secret_synced_after_final_deploy");
    expectEqual(errors, contract.live_acceptance?.alias_index_readback?.name, "serving_record_security_aliases_gin_idx", "live_acceptance.alias_index_readback.name");
    expectTrue(errors, contract.live_acceptance?.alias_index_readback?.index_used, "live_acceptance.alias_index_readback.index_used");
    expectEqual(errors, contract.live_acceptance?.live_success_count, 4, "live_acceptance.live_success_count");
    expectEqual(errors, contract.live_acceptance?.live_denial_count, 7, "live_acceptance.live_denial_count");
    expectEqual(errors, contract.live_acceptance?.temporary_fixture_count_after_cleanup, 0, "live_acceptance.temporary_fixture_count_after_cleanup");
    expectEqual(errors, contract.live_acceptance?.temporary_session_count_after_cleanup, 0, "live_acceptance.temporary_session_count_after_cleanup");
    expectTrue(errors, contract.live_acceptance?.temporary_workers_absent, "live_acceptance.temporary_workers_absent");
    expectUuid(errors, contract.live_acceptance?.api_deployment?.deployment_id, "live_acceptance.api_deployment.deployment_id");
    expectUuid(errors, contract.live_acceptance?.api_deployment?.version_id, "live_acceptance.api_deployment.version_id");
    expectUuid(errors, contract.live_acceptance?.web_deployment?.deployment_id, "live_acceptance.web_deployment.deployment_id");
    expectUuid(errors, contract.live_acceptance?.web_deployment?.version_id, "live_acceptance.web_deployment.version_id");
  }
  return errors;
}

export function validateProvisioningReplaySafety(provisioning) {
  const errors = [];
  if (!provisioning.includes("WHERE aiphabee_governance.data_entitlement.status = 'approved'")) {
    errors.push("provisioning conflict update must preserve non-approved entitlement status");
  }
  if (/ON CONFLICT \(dataset, channel, field_pattern, rights_policy_version\) DO UPDATE SET[^;]*\n\s*status\s*=\s*'approved'\s*,/u.test(provisioning)) {
    errors.push("provisioning replay must not reactivate blocked or default-deny data entitlement rows");
  }
  return errors;
}

export function validateStaticImplementation(root = process.cwd()) {
  const contract = readJson(root, CONTRACT_PATH);
  const errors = validateAuthenticatedNetquityWebResolverContract(contract);
  const worker = readText(root, "apps/worker/src/authenticated-netquity-web-resolver.ts");
  const workerIndex = readText(root, "apps/worker/src/index.ts");
  const workerTests = readText(root, "apps/worker/src/authenticated-netquity-web-resolver.test.ts");
  const webServer = readText(root, "apps/web/src/lib/api/security.server.ts");
  const webFunction = readText(root, "apps/web/src/lib/api/security.functions.ts");
  const webTests = readText(root, "apps/web/src/lib/api/security.server.test.ts");
  const webEndpoints = readText(root, "apps/web/src/lib/api/endpoints.ts");
  const webWrangler = readText(root, "apps/web/wrangler.jsonc");
  const migration = readText(root, contract.database.migration);
  const role = readText(root, contract.database.role_policy);
  const provisioning = readText(root, contract.database.provisioning);
  errors.push(...validateProvisioningReplaySafety(provisioning));
  const rootPackage = readJson(root, "package.json");
  const migrationContract = readJson(root, "deploy/database/migrations.contract.json");
  const bindingContract = readJson(root, "deploy/cloudflare/bindings.contract.json");

  expectEqual(errors, rootPackage.scripts?.["check:authenticated-netquity-web-resolver"], "node scripts/check-authenticated-netquity-web-resolver-contract.mjs && node scripts/check-authenticated-netquity-web-resolver-fixtures.mjs", "root checker command");
  expectEqual(errors, rootPackage.scripts?.["deploy:authenticated-netquity-api:staging"], "npm exec --workspace @aiphabee/worker -- wrangler deploy --env staging", "API staging deploy command");
  expectFragments(errors, worker, "Worker resolver", [
    "resolve_active_account_id_by_auth_subject",
    "SELECT set_config('aiphabee.account_id', $1, true)",
    "subscription.billing_state = 'active'",
    "subscription_valid_from",
    "workspace_entitlement.subscription_id = $2",
    "data_entitlement.channel = 'web'",
    "data_entitlement.rights_policy_version = $3",
    "hasExactFieldAuthority(rightsResult.rows)",
    "AUTHENTICATED_NETQUITY_REQUIRED_FIELD_SET.has(row.field_pattern)",
    "dataset.default_rights_status = 'approved'",
    "dataset.rights_policy_version = $1",
    "snapshot.quality_state = 'PASS'",
    "snapshot.rights_policy_version = $1",
    "version.rights_policy_version = $1",
    "createPolicyFromEntitlementRows",
    "evaluateDataAccessRequest",
    "decision.status !== \"allow\"",
    "resolveReleasedNetquitySecurity",
    "await client.end()",
  ]);
  expectOrder(errors, worker, "FROM aiphabee_governance.workspace_entitlement", "FROM aiphabee_core.serving_dataset", "rights before Serving");
  expectFragments(errors, workerIndex, "Worker index", [
    "export class AuthenticatedNetquityResolver extends WorkerEntrypoint",
    "return resolveAuthenticatedNetquitySecurity(this.env, input)",
    'app.post("/tools/resolve-security"',
  ]);
  if (/app\.(?:get|post|all)\([^\n]*AuthenticatedNetquityResolver/u.test(workerIndex)) errors.push("private RPC must not have a public HTTP route");
  expectFragments(errors, webServer, "Web server", [
    "getAuthenticatedWebIdentitySession",
    "resolveWebRequestSubject(session)",
    "AIPHABEE_API",
    "await service.resolveSecurity",
    "data.liveDataAccess !== true",
    'provenance.source === "netquity-basicdata"',
    "envelope.data_version === data.dataVersion",
  ]);
  expectOrder(errors, webServer, "getAuthenticatedWebIdentitySession", "bindings.AIPHABEE_API", "session before RPC binding");
  expectFragments(errors, webFunction, "Web server function", [
    'createServerFn({ method: "POST" })',
    ".validator(validateSecurityInput)",
    "getRequest()",
    '"Cache-Control": "no-store"',
    'Vary: "Cookie"',
  ]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveAuthenticatedSecurity({ data: { query, market } })"]);
  expectFragments(errors, webWrangler, "Web Wrangler", [
    '"binding": "AIPHABEE_API"',
    '"service": "aiphabee-worker-staging"',
    '"entrypoint": "AuthenticatedNetquityResolver"',
  ]);
  expectFragments(errors, migration, "migration", [
    "SECURITY DEFINER",
    "SET search_path = ''",
    "REVOKE ALL ON FUNCTION",
    "platform.resolve_active_account_id_by_auth_subject(text)",
    "FROM PUBLIC",
    "^better-auth:[0-9a-f]{8}-",
    "serving_record_security_aliases_gin_idx",
    "USING gin ((payload -> 'aliases') jsonb_path_ops)",
    "WHERE entity_type = 'instrument'",
  ]);
  if (/auth_user_id/u.test(migration.replace(/^\s*--.*$/gmu, ""))) errors.push("migration must not read legacy auth_user_id");
  expectFragments(errors, role, "role packet", [
    "TO aiphabee_runtime_rls",
    "REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER",
    "PUBLIC unexpectedly executes auth-subject resolver",
    "raw Netquity schema USAGE",
  ]);
  expectFragments(errors, provisioning, "provisioning", [
    'WHERE "emailVerified" = true',
    "expected exactly one verified Better Auth staging user",
    "'better-auth:' || id::text",
    "approved_field_count <> 13",
    "channel IN ('api', 'mcp', 'export')",
    "WHERE aiphabee_governance.data_entitlement.status = 'approved'",
  ]);
  if (/2026-07-11T00:00:00/u.test(provisioning)) errors.push("provisioning validity must not begin after the live apply instant");
  if (/security_master\.\*/u.test(provisioning)) errors.push("provisioning must not grant wildcard fields");
  expectFragments(errors, workerTests, "Worker tests", [
    "unmapped account", "no membership", "expired subscription", "more than one entitled workspace",
    "missing exact field rights", "wildcard authority", "blocked field", "阿爾法控股有限公司", "阿尔法控股有限公司", "Serving reads",
  ]);
  expectFragments(errors, webTests, "Web tests", ["public anonymous sentinel subject", "canonical subject", "service binding is missing", 'it.each(["throws", "malformed"])', "synthetic result", "missing provenance"]);
  if (!migrationContract.migrations?.some((entry) => entry.file === contract.database.migration)) errors.push("migration ledger must register resolver migration");
  if (!bindingContract.bindings?.some((entry) => entry.name === "AIPHABEE_API" && entry.provisioned_environments?.staging === true && entry.provisioned_environments?.production === false)) errors.push("binding contract must register staging-only AIPHABEE_API");
  return errors;
}

function validateWebDeploymentArtifact(root = process.cwd()) {
  const errors = [];
  const artifact = readJson(root, WEB_ARTIFACT_PATH);
  expectEqual(errors, artifact.name, "aiphabee-web-staging", "deployment artifact name");
  expectEqual(errors, artifact.vars?.APP_ENV, "staging", "deployment artifact APP_ENV");
  expectEqual(errors, artifact.hyperdrive?.find((entry) => entry.binding === "AIPHABEE_AUTH_HYPERDRIVE")?.id, "4a105c35ab2a42f3aec810a2db775eda", "deployment artifact auth Hyperdrive");
  const service = artifact.services?.find((entry) => entry.binding === "AIPHABEE_API");
  expectEqual(errors, service?.service, "aiphabee-worker-staging", "deployment artifact service");
  expectEqual(errors, service?.entrypoint, "AuthenticatedNetquityResolver", "deployment artifact entrypoint");
  // GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are intentionally not asserted as
  // required here: wrangler's `secrets.required` is a hard `wrangler deploy`
  // gate with no skip flag, and Google OAuth is runtime-optional (see the
  // comment on env.staging.secrets in apps/web/wrangler.jsonc). Assert only
  // the base secrets that must always be present, and guard against the
  // retired GitHub OAuth provider's secrets regressing back into the gate.
  const requiredSecrets = artifact.secrets?.required ?? [];
  for (const name of ["AIPHABEE_AUTH_INVITED_EMAIL_SHA256", "BETTER_AUTH_SECRET"]) {
    if (!requiredSecrets.includes(name)) errors.push(`deployment artifact required secrets must include ${name}`);
  }
  for (const name of ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]) {
    if (requiredSecrets.includes(name)) errors.push(`deployment artifact required secrets must not include retired ${name}`);
  }
  return errors;
}

function main() {
  const errors = validateStaticImplementation();
  if (process.argv.includes("--web-deployment-artifact")) errors.push(...validateWebDeploymentArtifact());
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_authenticated_netquity_web_resolver" }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ fields: REQUIRED_FIELDS.length, status: "ok" }));
}

function readJson(root, path) { return JSON.parse(readText(root, path)); }
function readText(root, path) { return readFileSync(`${root}/${path}`, "utf8"); }
function expectEqual(errors, actual, expected, label) { if (actual !== expected) errors.push(`${label} must equal ${JSON.stringify(expected)}`); }
function expectTrue(errors, value, label) { expectEqual(errors, value, true, label); }
function expectFalse(errors, value, label) { expectEqual(errors, value, false, label); }
function expectUuid(errors, value, label) { if (typeof value !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/u.test(value)) errors.push(`${label} must be a UUID`); }
function expectExactArray(errors, actual, expected, label) { if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${label} must equal ${JSON.stringify(expected)}`); }
function expectFragments(errors, source, label, fragments) { for (const fragment of fragments) if (!source.includes(fragment)) errors.push(`${label} missing ${fragment}`); }
function expectOrder(errors, source, first, second, label) { const a = source.indexOf(first); const b = source.indexOf(second); if (a < 0 || b < 0 || a >= b) errors.push(`${label} order is invalid`); }

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
