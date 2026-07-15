#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  contract: "deploy/ingest/netquity-sdi-disclosure-staging.contract.json",
  entitlement: "deploy/account/netquity-sdi-disclosure-entitlement-staging.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-sdi-disclosure-staging.sql",
  domainMigration: "deploy/database/migrations/20260715150000_sdi_disclosure_domain.sql",
  migrationsContract: "deploy/database/migrations.contract.json",
  sdiDisclosure: "packages/sdi-disclosure/src/index.ts",
  sdiDisclosureTest: "packages/sdi-disclosure/src/index.test.ts",
  sdiDisclosurePackageJson: "packages/sdi-disclosure/package.json",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/authenticated-netquity-web-resolver.test.ts",
  webServer: "apps/web/src/lib/api/sdi-disclosure.server.ts",
  webFunction: "apps/web/src/lib/api/sdi-disclosure.functions.ts",
  webEndpoints: "apps/web/src/lib/api/endpoints.ts",
  webTypes: "apps/web/src/lib/api/types.ts",
  webPanels: "apps/web/src/components/workbench/panels.tsx",
  webRoute: "apps/web/src/routes/stock/$instrumentId.tsx"
};

const REQUIRED_AUTHORIZATION_FIELDS = [
  "sdi_disclosure.coverage.reason",
  "sdi_disclosure.coverage.status",
  "sdi_disclosure.disclosures.long",
  "sdi_disclosure.disclosures.pool",
  "sdi_disclosure.disclosures.short"
];

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_sdi_disclosure_staging" }, null, 2));
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      { fields: REQUIRED_AUTHORIZATION_FIELDS.length, status: "ok" },
      null,
      2
    )
  );
}

function validateStaticImplementation(root = process.cwd()) {
  const errors = [];
  const contract = readJson(root, paths.contract);
  const rootPackage = readJson(root, paths.package);
  const migrationsContract = readJson(root, paths.migrationsContract);
  const promotionSql = readText(root, paths.promotionSql);
  const entitlement = readText(root, paths.entitlement);
  const domainMigration = readText(root, paths.domainMigration);
  const sdiDisclosure = readText(root, paths.sdiDisclosure);
  const sdiDisclosureTest = readText(root, paths.sdiDisclosureTest);
  const sdiDisclosurePackageJson = readJson(root, paths.sdiDisclosurePackageJson);
  const worker = readText(root, paths.worker);
  const workerIndex = readText(root, paths.workerIndex);
  const workerTest = readText(root, paths.workerTest);
  const webServer = readText(root, paths.webServer);
  const webFunction = readText(root, paths.webFunction);
  const webEndpoints = readText(root, paths.webEndpoints);
  const webTypes = readText(root, paths.webTypes);
  const webPanels = readText(root, paths.webPanels);
  const webRoute = readText(root, paths.webRoute);

  // --- contract.json ------------------------------------------------------
  expectEqual(errors, contract.version, "2026-07-15.netquity-sdi-disclosure-staging.v1", "contract version");
  expectEqual(errors, contract.status, "approved_staging_only", "contract status");
  expectEqual(errors, contract.environment, "staging", "contract environment");
  expectEqual(errors, contract.source?.source_batch_id, "src_netquity_sdi_disclosure_cf0fbc789c41", "source batch id");
  expectEqual(errors, contract.source?.reused_from_prior_promotion, false, "sdi_disclosure must pin its own new raw_source_batch, not reuse an earlier one");
  expectEqual(errors, contract.promotion?.serving_dataset, "sdi_disclosure", "Serving dataset");
  expectEqual(errors, contract.promotion?.serving_dataset_id, "serving_dataset_sdi_disclosure", "Serving dataset id");
  expectEqual(errors, contract.promotion?.serving_dataset_domain, "sdi_disclosure", "Serving dataset domain");
  expectEqual(errors, contract.promotion?.new_migration_required, true, "sdi_disclosure requires a new domain migration (no prior promotion needed one)");
  expectEqual(errors, contract.promotion?.entity_id_pattern, "hkex_security_<five-digit-code>", "entity id pattern must align with the prior 5 promotions");
  expectEqual(errors, contract.promotion?.release_state, "released", "release state");
  expectEqual(errors, contract.promotion?.new_index_required, false, "new_index_required");
  expectEqual(errors, contract.promotion?.transactional, true, "transactional promotion");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_serving_records, 18036, "full basicdata-universe row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_unavailable_no_filing, 16821, "unavailable-coverage row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.with_disclosures_available, 1215, "available row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_disclosure_rows, 17514, "total disclosure row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_position_rows, 24907, "total position row count");
  expectEqual(errors, contract.rights_basis?.policy_version, "netquity-collaboration-staging.v1", "rights_basis.policy_version");
  if (contract.rights_basis?.policy_version === "netquity-market-data-staging.v1") {
    errors.push("sdi_disclosure must reuse netquity-collaboration-staging.v1, not quote_snapshot's separate market-data policy version");
  }
  expectEqual(errors, contract.entity_scope_choice?.chosen_pattern, "full_basicdata_universe_with_coverage_marker", "entity_scope_choice.chosen_pattern");
  for (const key of ["wrong_environment", "authorization", "missing_binding", "no_release", "not_found", "database_or_readback"]) {
    if (contract.failure_statuses?.[key] === undefined) errors.push(`failure_statuses.${key} missing`);
  }
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveSdiDisclosure", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.authorization?.dataset, "sdi_disclosure", "authorization.dataset");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.rights_policy_version, "netquity-collaboration-staging.v1", "authorization.rights_policy_version");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_AUTHORIZATION_FIELDS, "authorization.requested_fields");
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("nature_of_change_classification")) {
    errors.push("not_claimed must include nature_of_change_classification");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("threshold_crossing_detection")) {
    errors.push("not_claimed must include threshold_crossing_detection");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("public_http_route")) {
    errors.push("not_claimed must include public_http_route");
  }
  if (!contract.excluded_from_this_cut?.personal_data_columns) {
    errors.push("contract must document the personal-data-column exclusion check (even when the result is 'none found')");
  }
  expectEqual(errors, rootPackage.scripts?.["check:netquity-sdi-disclosure-staging"], "node scripts/check-netquity-sdi-disclosure-staging-contract.mjs", "root checker command");

  // --- migrations.contract.json ---------------------------------------------
  const registeredMigration = migrationsContract.migrations?.find(
    (entry) => entry.file === "deploy/database/migrations/20260715150000_sdi_disclosure_domain.sql"
  );
  if (!registeredMigration) {
    errors.push("migrations.contract.json must register 20260715150000_sdi_disclosure_domain.sql");
  }

  // --- domain migration -------------------------------------------------
  expectFragments(errors, domainMigration, "Domain migration", [
    "drop constraint if exists serving_dataset_domain_check",
    "add constraint serving_dataset_domain_check check",
    "'sdi_disclosure'",
    "'security_master'",
    "'corporate_action'"
  ]);
  if (/create\s+table/iu.test(domainMigration)) {
    errors.push("domain migration must not create tables (constraint extension only)");
  }

  // --- promotion SQL --------------------------------------------------------
  expectFragments(errors, promotionSql, "Promotion SQL", [
    "src_netquity_sdi_disclosure_cf0fbc789c41",
    "ON CONFLICT (source_batch_id) DO NOTHING",
    "'netquity-sdi-disclosure-cf0fbc789c41.v1'",
    "'netquity-collaboration-staging.v1'",
    "'serving_dataset_sdi_disclosure'",
    "'sdi_disclosure'",
    "nq_sdidata.sdi",
    "nq_sdidata.dataperiod",
    "nq_basicdata.stock",
    "'hkex_security_' || lpad(",
    "release_state = 'released'",
    "'serving_sdi_disclosure_netquity_cf0fbc789c41_v1'",
    "jsonb_strip_nulls",
    "'long'",
    "'short'",
    "'pool'",
    "positionType"
  ]);
  if (/CREATE\s+(UNIQUE\s+)?INDEX/iu.test(promotionSql)) {
    errors.push("promotion SQL must not create a new index (entity_id lookup reuses the existing serving_record unique index prefix)");
  }
  if (!/ON CONFLICT \(serving_record_id\) DO NOTHING/u.test(promotionSql)) {
    errors.push("promotion SQL must insert serving_record idempotently");
  }
  if (!/coverage/u.test(promotionSql) || !/unavailable/u.test(promotionSql)) {
    errors.push("promotion SQL must mark zero-filing instruments with an explicit coverage.status=unavailable, not silent omission");
  }
  const promotionSqlCode = stripSqlComments(promotionSql);
  if (/'kind'\s*,|'kindZh'\s*,|'crossing'\s*,/u.test(promotionSqlCode)) {
    errors.push("promotion SQL must not fabricate a nature-of-change kind/kindZh or threshold-crossing field (no decode table for eventcode)");
  }
  if (/onex_highprice|onex_avgprice|offex_consshare|offex_conscode/iu.test(promotionSqlCode)) {
    errors.push("promotion SQL must not promote the excluded on-exchange price / off-exchange consideration columns");
  }

  // --- entitlement SQL --------------------------------------------------------
  expectFragments(errors, entitlement, "Entitlement SQL", [
    "'sdi_disclosure'",
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
  if (/sdi_disclosure\.\*/u.test(entitlement)) errors.push("entitlement must not grant wildcard fields");

  // --- sdi-disclosure package --------------------------------------------------------
  expectEqual(errors, sdiDisclosurePackageJson.name, "@aiphabee/sdi-disclosure", "sdi-disclosure package name");
  expectFragments(errors, sdiDisclosure, "sdi-disclosure", [
    "GET_SDI_DISCLOSURE_LIVE_VERSION",
    "GetLiveSdiDisclosuresResult",
    "liveDataAccess: true",
    "export function getLiveSdiDisclosures(",
    "GetLiveSdiDisclosuresReadbackError",
    "\"unavailable\"",
    "LiveSdiPositionType",
    "\"long\"",
    "\"short\"",
    "\"pool\""
  ]);
  const sdiDisclosureCode = stripJsComments(sdiDisclosure);
  if (/kindZh|"increase"|"decrease"|"passive"|crossing/iu.test(sdiDisclosureCode)) {
    errors.push("sdi-disclosure must not carry a fabricated nature-of-change kind or threshold-crossing field");
  }
  expectFragments(errors, sdiDisclosureTest, "sdi-disclosure tests", [
    "getLiveSdiDisclosures",
    "GetLiveSdiDisclosuresReadbackError",
    "\"unavailable\""
  ]);

  // --- worker resolver --------------------------------------------------------
  expectFragments(errors, worker, "Worker resolver", [
    "resolveAuthenticatedNetquitySdiDisclosure",
    "resolveReleasedNetquitySdiDisclosure",
    "dataset: \"sdi_disclosure\"",
    "data_entitlement.dataset = 'sdi_disclosure'",
    "dataset.dataset = 'sdi_disclosure'",
    "record.entity_id = $2",
    "getLiveSdiDisclosures"
  ]);
  expectFragments(errors, workerIndex, "Worker index", [
    "resolveAuthenticatedNetquitySdiDisclosure",
    "async resolveSdiDisclosure(input"
  ]);
  if (/app\.(?:get|post|all)\([^\n]*resolveSdiDisclosure/iu.test(workerIndex)) {
    errors.push("resolveSdiDisclosure must not have a public HTTP route");
  }
  expectFragments(errors, workerTest, "Worker tests", [
    "resolveAuthenticatedNetquitySdiDisclosure",
    "netquity-collaboration-staging.v1"
  ]);

  // --- web layer --------------------------------------------------------
  expectFragments(errors, webTypes, "Web types", ["GetLiveSdiDisclosuresData"]);
  expectFragments(errors, webServer, "Web server", [
    "resolveAuthenticatedSdiDisclosureRequest",
    "service.resolveSdiDisclosure"
  ]);
  expectFragments(errors, webFunction, "Web server function", ["resolveAuthenticatedSdiDisclosure"]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveSdiDisclosure"]);
  expectFragments(errors, webPanels, "Web SdiDisclosurePanel", [
    "export function SdiDisclosurePanel({ instrumentId",
    "resolveSdiDisclosure"
  ]);
  expectFragments(errors, webRoute, "Web stock route", ["<SdiDisclosurePanel instrumentId="]);
  if (!/key:\s*"sdi"/u.test(webRoute)) {
    errors.push("stock route must register the sdi tab key");
  }

  return errors;
}

function readJson(root, path) { return JSON.parse(readText(root, path)); }
function readText(root, path) { return readFileSync(`${root}/${path}`, "utf8"); }
// Strips `-- ...` line comments so fabrication guards scan executable SQL
// only, not this file's own prose documenting the exclusion (which
// necessarily names the excluded column/key literals it explains).
function stripSqlComments(source) {
  return source
    .split("\n")
    .map((line) => line.replace(/--.*$/u, ""))
    .join("\n");
}
// Strips `//` line comments and `/* */` block comments for the same reason.
function stripJsComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/u, ""))
    .join("\n");
}
function expectEqual(errors, actual, expected, label) { if (actual !== expected) errors.push(`${label} must equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
function expectFalse(errors, value, label) { if (value !== false) errors.push(`${label} must be false, got ${JSON.stringify(value)}`); }
function expectExactArray(errors, actual, expected, label) { if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${label} must equal ${JSON.stringify(expected)}`); }
function expectFragments(errors, source, label, fragments) { for (const fragment of fragments) if (!source.includes(fragment)) errors.push(`${label} missing ${fragment}`); }

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
