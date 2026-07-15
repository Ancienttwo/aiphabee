#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  contract: "deploy/ingest/netquity-security-profile-staging.contract.json",
  entitlement: "deploy/account/netquity-security-profile-entitlement-staging.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-security-profile-staging.sql",
  resolutionContract: "deploy/ingest/netquity-security-resolution-staging.contract.json",
  securityTools: "packages/security-tools/src/index.ts",
  securityToolsTest: "packages/security-tools/src/index.test.ts",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/authenticated-netquity-web-resolver.test.ts",
  webServer: "apps/web/src/lib/api/security.server.ts",
  webFunction: "apps/web/src/lib/api/security.functions.ts",
  webEndpoints: "apps/web/src/lib/api/endpoints.ts",
  webTypes: "apps/web/src/lib/api/types.ts",
  webRoute: "apps/web/src/routes/stock/$instrumentId.tsx"
};

const REQUIRED_PAYLOAD_FIELDS = [
  "symbol",
  "name.en",
  "name.zhHant",
  "name.zhHans",
  "listingStatus",
  "lifecycle.listedAt",
  "lifecycle.delistedAt",
  "lifecycle.suspendedAt",
  "listingId",
  "exchange",
  "market",
  "currency"
];

const REQUIRED_AUTHORIZATION_FIELDS = [
  "security_profile.currency",
  "security_profile.exchange",
  "security_profile.instrument_id",
  "security_profile.lifecycle.delisted_at",
  "security_profile.lifecycle.listed_at",
  "security_profile.lifecycle.suspended_at",
  "security_profile.listing_id",
  "security_profile.listing_status",
  "security_profile.market",
  "security_profile.name.en",
  "security_profile.name.zh_hans",
  "security_profile.name.zh_hant",
  "security_profile.symbol"
];

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_security_profile_staging" }, null, 2));
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      { fields: REQUIRED_PAYLOAD_FIELDS.length, status: "ok" },
      null,
      2
    )
  );
}

function validateStaticImplementation(root = process.cwd()) {
  const errors = [];
  const contract = readJson(root, paths.contract);
  const resolutionContract = readJson(root, paths.resolutionContract);
  const rootPackage = readJson(root, paths.package);
  const promotionSql = readText(root, paths.promotionSql);
  const entitlement = readText(root, paths.entitlement);
  const securityTools = readText(root, paths.securityTools);
  const securityToolsTest = readText(root, paths.securityToolsTest);
  const worker = readText(root, paths.worker);
  const workerIndex = readText(root, paths.workerIndex);
  const workerTest = readText(root, paths.workerTest);
  const webServer = readText(root, paths.webServer);
  const webFunction = readText(root, paths.webFunction);
  const webEndpoints = readText(root, paths.webEndpoints);
  const webTypes = readText(root, paths.webTypes);
  const webRoute = readText(root, paths.webRoute);

  // --- contract.json ------------------------------------------------------
  expectEqual(errors, contract.version, "2026-07-15.netquity-security-profile-staging.v1", "contract version");
  expectEqual(errors, contract.status, "approved_staging_only", "contract status");
  expectEqual(errors, contract.environment, "staging", "contract environment");
  expectEqual(errors, contract.source?.source_batch_id, "src_netquity_basicdata_80cfa8bd1c73", "source batch id");
  expectEqual(errors, contract.source?.sha256, resolutionContract.source?.sha256, "source sha256 must match the pinned security_master promotion");
  expectEqual(errors, contract.source?.row_count, 18036, "source row count");
  expectEqual(errors, contract.promotion?.serving_dataset, "security_profile", "Serving dataset");
  expectEqual(errors, contract.promotion?.serving_dataset_domain, "security_master", "Serving dataset domain (no security_profile CHECK value exists)");
  expectEqual(errors, contract.promotion?.entity_id_pattern, resolutionContract.promotion?.entity_id_pattern, "entity id pattern must match the security_master promotion");
  expectEqual(errors, contract.promotion?.release_state, "released", "release state");
  expectEqual(errors, contract.promotion?.new_index_required, false, "new_index_required");
  expectEqual(errors, contract.promotion?.transactional, true, "transactional promotion");
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveProfile", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.authorization?.dataset, "security_profile", "authorization.dataset");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectExactArray(errors, contract.payload_fields, REQUIRED_PAYLOAD_FIELDS, "payload_fields");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_AUTHORIZATION_FIELDS, "authorization.requested_fields");
  expectExactArray(errors, contract.payload_fields_never_populated?.fields, ["listingId", "lifecycle.suspendedAt"], "payload_fields_never_populated.fields");
  if (!(contract.payload_fields_excluded?.fields ?? []).includes("industry")) errors.push("payload_fields_excluded.fields must exclude industry");
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("public_http_route")) {
    errors.push("not_claimed must include public_http_route");
  }
  expectEqual(errors, rootPackage.scripts?.["check:netquity-security-profile-staging"], "node scripts/check-netquity-security-profile-staging-contract.mjs", "root checker command");

  // --- promotion SQL --------------------------------------------------------
  expectFragments(errors, promotionSql, "Promotion SQL", [
    "src_netquity_basicdata_80cfa8bd1c73",
    "ON CONFLICT (source_batch_id) DO NOTHING",
    "'netquity-security-profile-80cfa8bd1c73.v1'",
    "'serving_dataset_security_profile'",
    "'security_profile'",
    "'security_master'",
    "'hkex_security_' || lpad(stock.code::text, 5, '0')",
    "'netquity:basicdata.stock:' || lpad(stock.code::text, 5, '0')",
    "'lifecycle', jsonb_build_object(",
    "entity_id !~ '^hkex_security_[0-9]{5}$'",
    "payload ? 'listingId'",
    "(payload -> 'lifecycle') ? 'suspendedAt'",
    "release_state = 'released'",
    "'serving_security_profile_netquity_basicdata_80cfa8bd1c73_v1'"
  ]);
  if (/CREATE\s+(UNIQUE\s+)?INDEX/iu.test(promotionSql)) {
    errors.push("promotion SQL must not create a new index (entity_id lookup reuses the existing serving_record unique index prefix)");
  }
  if (!/ON CONFLICT \(serving_record_id\) DO NOTHING/u.test(promotionSql)) {
    errors.push("promotion SQL must insert serving_record idempotently");
  }

  // --- entitlement SQL --------------------------------------------------------
  expectFragments(errors, entitlement, "Entitlement SQL", [
    "'security_profile'",
    "'web'",
    "'netquity-collaboration-staging.v1'",
    "workspace_authenticated_netquity_staging",
    "subscription_authenticated_netquity_staging",
    "ON CONFLICT (dataset, channel, field_pattern, rights_policy_version) DO UPDATE SET",
    "WHERE aiphabee_governance.data_entitlement.status = 'approved'"
  ]);
  for (const field of REQUIRED_AUTHORIZATION_FIELDS) {
    if (!entitlement.includes(field)) errors.push(`Entitlement SQL missing field_pattern ${field}`);
  }
  if (/security_profile\.\*/u.test(entitlement)) errors.push("entitlement must not grant wildcard fields");

  // --- security-tools --------------------------------------------------------
  expectFragments(errors, securityTools, "security-tools", [
    "GET_SECURITY_PROFILE_LIVE_VERSION",
    "GetLiveSecurityProfileResult",
    "liveDataAccess: true",
    "export function getLiveSecurityProfile(",
    "function mapLiveSecurityProfileRow(",
    "GetLiveSecurityProfileReadbackError",
    "status: \"planned\""
  ]);
  if (/export function mapLiveSecurityProfileRow/u.test(securityTools)) {
    errors.push("mapLiveSecurityProfileRow must stay module-private, matching mapLiveSecurityRow");
  }
  expectFragments(errors, securityToolsTest, "security-tools tests", [
    "getLiveSecurityProfile",
    "GetLiveSecurityProfileReadbackError",
    "\"planned\""
  ]);

  // --- worker resolver --------------------------------------------------------
  expectFragments(errors, worker, "Worker resolver", [
    "resolveAuthenticatedNetquityProfile",
    "resolveReleasedNetquityProfile",
    "PROFILE_RIGHTS_QUERY",
    "dataset: \"security_profile\"",
    "data_entitlement.dataset = 'security_profile'",
    "PROFILE_SNAPSHOT_QUERY",
    "dataset.dataset = 'security_profile'",
    "PROFILE_RECORD_QUERY",
    "record.entity_id = $2",
    "getLiveSecurityProfile"
  ]);
  expectFragments(errors, workerIndex, "Worker index", [
    "resolveAuthenticatedNetquityProfile",
    "async resolveProfile(input"
  ]);
  if (/app\.(?:get|post|all)\([^\n]*resolveProfile/iu.test(workerIndex)) {
    errors.push("resolveProfile must not have a public HTTP route");
  }
  expectFragments(errors, workerTest, "Worker tests", [
    "resolveAuthenticatedNetquityProfile"
  ]);

  // --- web layer --------------------------------------------------------
  expectFragments(errors, webTypes, "Web types", ["GetSecurityProfileData"]);
  expectFragments(errors, webServer, "Web server", [
    "resolveAuthenticatedProfileRequest",
    "service.resolveProfile"
  ]);
  expectFragments(errors, webFunction, "Web server function", ["resolveAuthenticatedSecurityProfile"]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveSecurityProfile"]);
  expectFragments(errors, webRoute, "Web stock route", ["CompanyHeader", "resolveSecurityProfile"]);

  return errors;
}

function readJson(root, path) { return JSON.parse(readText(root, path)); }
function readText(root, path) { return readFileSync(`${root}/${path}`, "utf8"); }
function expectEqual(errors, actual, expected, label) { if (actual !== expected) errors.push(`${label} must equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
function expectFalse(errors, value, label) { expectEqual(errors, value, false, label); }
function expectExactArray(errors, actual, expected, label) { if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${label} must equal ${JSON.stringify(expected)}`); }
function expectFragments(errors, source, label, fragments) { for (const fragment of fragments) if (!source.includes(fragment)) errors.push(`${label} missing ${fragment}`); }

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
