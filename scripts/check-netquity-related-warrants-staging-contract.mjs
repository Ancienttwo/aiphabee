#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  contract: "deploy/ingest/netquity-related-warrants-staging.contract.json",
  entitlement: "deploy/account/netquity-related-warrants-entitlement-staging.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-related-warrants-staging.sql",
  domainMigration: "deploy/database/migrations/20260716140000_related_warrants_domain.sql",
  migrationsContract: "deploy/database/migrations.contract.json",
  relatedWarrants: "packages/related-warrants/src/index.ts",
  relatedWarrantsTest: "packages/related-warrants/src/index.test.ts",
  relatedWarrantsPackageJson: "packages/related-warrants/package.json",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/authenticated-netquity-web-resolver.test.ts",
  workerPackageJson: "apps/worker/package.json",
  webServer: "apps/web/src/lib/api/related-warrants.server.ts",
  webFunction: "apps/web/src/lib/api/related-warrants.functions.ts",
  webEndpoints: "apps/web/src/lib/api/endpoints.ts",
  webTypes: "apps/web/src/lib/api/types.ts",
  webPanels: "apps/web/src/components/workbench/panels.tsx",
  webRoute: "apps/web/src/routes/stock/$instrumentId.tsx"
};

const REQUIRED_AUTHORIZATION_FIELDS = [
  "related_warrants.coverage.reason",
  "related_warrants.coverage.status",
  "related_warrants.warrants"
];

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_related_warrants_staging" }, null, 2));
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
  const relatedWarrants = readText(root, paths.relatedWarrants);
  const relatedWarrantsTest = readText(root, paths.relatedWarrantsTest);
  const relatedWarrantsPackageJson = readJson(root, paths.relatedWarrantsPackageJson);
  const worker = readText(root, paths.worker);
  const workerIndex = readText(root, paths.workerIndex);
  const workerTest = readText(root, paths.workerTest);
  const workerPackageJson = readJson(root, paths.workerPackageJson);
  const webServer = readText(root, paths.webServer);
  const webFunction = readText(root, paths.webFunction);
  const webEndpoints = readText(root, paths.webEndpoints);
  const webTypes = readText(root, paths.webTypes);
  const webPanels = readText(root, paths.webPanels);
  const webRoute = readText(root, paths.webRoute);

  // --- contract.json ------------------------------------------------------
  expectEqual(errors, contract.version, "2026-07-16.netquity-related-warrants-staging.v1", "contract version");
  expectEqual(errors, contract.status, "approved_staging_only", "contract status");
  expectEqual(errors, contract.environment, "staging", "contract environment");
  expectEqual(errors, contract.source?.source_batch_id, "src_netquity_related_warrants_6f4019928e9b", "source batch id");
  expectEqual(errors, contract.source?.reused_from_prior_promotion, false, "related_warrants must pin its own new raw_source_batch, not reuse an earlier one");
  expectEqual(errors, contract.promotion?.serving_dataset, "related_warrants", "Serving dataset");
  expectEqual(errors, contract.promotion?.serving_dataset_id, "serving_dataset_related_warrants", "Serving dataset id");
  expectEqual(errors, contract.promotion?.serving_dataset_domain, "related_warrants", "Serving dataset domain");
  expectEqual(errors, contract.promotion?.new_migration_required, true, "related_warrants requires a new domain migration (no prior promotion needed one)");
  expectEqual(errors, contract.promotion?.entity_id_pattern, "hkex_security_<five-digit-code>", "entity id pattern must align with the prior 8 promotions");
  expectEqual(errors, contract.promotion?.release_state, "released", "release state");
  expectEqual(errors, contract.promotion?.new_index_required, false, "new_index_required");
  expectEqual(errors, contract.promotion?.transactional, true, "transactional promotion");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_serving_records, 18036, "full basicdata-universe row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_available, 309, "available row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_unavailable, 17727, "unavailable row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_warrant_link_rows, 9639, "total warrant link row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.distinct_warrant_codes, 9623, "distinct warrant code count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.comp_warrant_link_rows, 6, "comp_warrant link row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.dp_warrant_link_rows, 1045, "dp_warrant link row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.dc_warrant_link_rows, 5916, "dc_warrant link row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.cc_warrant_link_rows, 1247, "cc_warrant link row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.ce_warrant_link_rows, 1425, "ce_warrant link row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.excluded_il_warrant_rows, 0, "excluded il_warrant row count");
  expectEqual(errors, contract.rights_basis?.policy_version, "netquity-collaboration-staging.v1", "rights_basis.policy_version");
  if (contract.rights_basis?.policy_version === "netquity-market-data-staging.v1") {
    errors.push("related_warrants must reuse netquity-collaboration-staging.v1, not quote_snapshot's separate market-data policy version");
  }
  expectEqual(errors, contract.entity_scope_choice?.chosen_pattern, "full_basicdata_universe_with_coverage_marker", "entity_scope_choice.chosen_pattern");
  for (const key of ["wrong_environment", "authorization", "missing_binding", "no_release", "not_found", "database_or_readback"]) {
    if (contract.failure_statuses?.[key] === undefined) errors.push(`failure_statuses.${key} missing`);
  }
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveRelatedWarrants", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.authorization?.dataset, "related_warrants", "authorization.dataset");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.rights_policy_version, "netquity-collaboration-staging.v1", "authorization.rights_policy_version");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_AUTHORIZATION_FIELDS, "authorization.requested_fields");
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("warrant_terms")) {
    errors.push("not_claimed must include warrant_terms");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("warrant_quote_or_pricing")) {
    errors.push("not_claimed must include warrant_quote_or_pricing");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("public_http_route")) {
    errors.push("not_claimed must include public_http_route");
  }
  if (!contract.excluded_from_this_cut?.personal_data_columns) {
    errors.push("contract must document the personal-data-column exclusion check (even when the result is 'none found')");
  }
  if (!contract.excluded_from_this_cut?.warrant_terms_no_fact_table) {
    errors.push("contract must document why no issuer/type/underlying decode join or strike/expiry term is attachable this cut");
  }
  if (!contract.excluded_from_this_cut?.etfdata2_relatedcode_table) {
    errors.push("contract must document why nq_etfdata2.relatedcode is excluded (ETF-scoped sibling table)");
  }
  if (!contract.excluded_from_this_cut?.il_warrant_column) {
    errors.push("contract must document the il_warrant exclusion (verified 0 populated)");
  }
  if (!contract.payload_shape_choice?.rationale) {
    errors.push("contract must document payload_shape_choice.rationale (single warrants[] array with category as a per-entry attribute)");
  }
  expectEqual(errors, rootPackage.scripts?.["check:netquity-related-warrants-staging"], "node scripts/check-netquity-related-warrants-staging-contract.mjs", "root checker command");

  // --- migrations.contract.json ---------------------------------------------
  const registeredMigration = migrationsContract.migrations?.find(
    (entry) => entry.file === "deploy/database/migrations/20260716140000_related_warrants_domain.sql"
  );
  if (!registeredMigration) {
    errors.push("migrations.contract.json must register 20260716140000_related_warrants_domain.sql");
  }

  // --- domain migration -------------------------------------------------
  expectFragments(errors, domainMigration, "Domain migration", [
    "drop constraint if exists serving_dataset_domain_check",
    "add constraint serving_dataset_domain_check check",
    "'related_warrants'",
    "'security_master'",
    "'ownership'"
  ]);
  if (/create\s+table/iu.test(domainMigration)) {
    errors.push("domain migration must not create tables (constraint extension only)");
  }

  // --- promotion SQL --------------------------------------------------------
  expectFragments(errors, promotionSql, "Promotion SQL", [
    "src_netquity_related_warrants_6f4019928e9b",
    "ON CONFLICT (source_batch_id) DO NOTHING",
    "'netquity-related-warrants-6f4019928e9b.v1'",
    "'netquity-collaboration-staging.v1'",
    "'serving_dataset_related_warrants'",
    "'related_warrants'",
    "nq_basicdata.relatedcode",
    "nq_basicdata.stock",
    "'hkex_security_' || lpad(",
    "release_state = 'released'",
    "'serving_related_warrants_netquity_6f4019928e9b_v1'",
    "comp_warrant",
    "dp_warrant",
    "dc_warrant",
    "cc_warrant",
    "ce_warrant"
  ]);
  if (/CREATE\s+(UNIQUE\s+)?INDEX/iu.test(promotionSql)) {
    errors.push("promotion SQL must not create a new index (entity_id lookup reuses the existing serving_record unique index prefix)");
  }
  if (!/ON CONFLICT \(serving_record_id\) DO NOTHING/u.test(promotionSql)) {
    errors.push("promotion SQL must insert serving_record idempotently");
  }
  if (!/coverage/u.test(promotionSql) || !/unavailable/u.test(promotionSql)) {
    errors.push("promotion SQL must mark zero-coverage instruments with an explicit coverage.status=unavailable, not silent omission");
  }
  const promotionSqlCode = stripSqlComments(promotionSql);
  if (/'il_warrant'/u.test(promotionSqlCode)) {
    errors.push("promotion SQL must not promote il_warrant as a category tag (verified 0 populated -- see contract.json excluded_from_this_cut.il_warrant_column); it may still appear as a bare, unquoted column reference in the preflight assertion that checks it stays empty");
  }

  // --- entitlement SQL --------------------------------------------------------
  expectFragments(errors, entitlement, "Entitlement SQL", [
    "'related_warrants'",
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
  if (/related_warrants\.\*/u.test(entitlement)) errors.push("entitlement must not grant wildcard fields");

  // --- related-warrants package --------------------------------------------------------
  expectEqual(errors, relatedWarrantsPackageJson.name, "@aiphabee/related-warrants", "related-warrants package name");
  expectFragments(errors, relatedWarrants, "related-warrants", [
    "GET_RELATED_WARRANTS_LIVE_VERSION",
    "GetLiveRelatedWarrantsResult",
    "liveDataAccess: true",
    "export function getLiveRelatedWarrants(",
    "GetLiveRelatedWarrantsReadbackError",
    "\"unavailable\"",
    "LiveRelatedWarrant",
    "LiveRelatedWarrantCategory",
    "comp_warrant",
    "dp_warrant",
    "dc_warrant",
    "cc_warrant",
    "ce_warrant"
  ]);
  expectFragments(errors, relatedWarrantsTest, "related-warrants tests", [
    "getLiveRelatedWarrants",
    "GetLiveRelatedWarrantsReadbackError",
    "\"unavailable\""
  ]);

  // --- worker resolver --------------------------------------------------------
  expectFragments(errors, worker, "Worker resolver", [
    "resolveAuthenticatedNetquityRelatedWarrants",
    "resolveReleasedNetquityRelatedWarrants",
    "dataset: \"related_warrants\"",
    "data_entitlement.dataset = 'related_warrants'",
    "dataset.dataset = 'related_warrants'",
    "record.entity_id = $2",
    "getLiveRelatedWarrants"
  ]);
  expectFragments(errors, workerIndex, "Worker index", [
    "resolveAuthenticatedNetquityRelatedWarrants",
    "async resolveRelatedWarrants(input"
  ]);
  if (/app\.(?:get|post|all)\([^\n]*resolveRelatedWarrants/iu.test(workerIndex)) {
    errors.push("resolveRelatedWarrants must not have a public HTTP route");
  }
  expectFragments(errors, workerTest, "Worker tests", [
    "resolveAuthenticatedNetquityRelatedWarrants",
    "netquity-collaboration-staging.v1"
  ]);
  expectEqual(errors, workerPackageJson.dependencies?.["@aiphabee/related-warrants"], "file:../../packages/related-warrants", "worker package.json @aiphabee/related-warrants dependency");

  // --- web layer --------------------------------------------------------
  expectFragments(errors, webTypes, "Web types", ["GetLiveRelatedWarrantsData"]);
  expectFragments(errors, webServer, "Web server", [
    "resolveAuthenticatedRelatedWarrantsRequest",
    "service.resolveRelatedWarrants"
  ]);
  expectFragments(errors, webFunction, "Web server function", ["resolveAuthenticatedRelatedWarrants"]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveRelatedWarrants"]);
  expectFragments(errors, webPanels, "Web RelatedWarrantsPanel", [
    "export function RelatedWarrantsPanel({ instrumentId",
    "resolveRelatedWarrants"
  ]);
  expectFragments(errors, webRoute, "Web stock route", ["<RelatedWarrantsPanel instrumentId="]);
  if (!/key:\s*"warrants"/u.test(webRoute)) {
    errors.push("stock route must register the warrants tab key");
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
function expectEqual(errors, actual, expected, label) { if (actual !== expected) errors.push(`${label} must equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
function expectFalse(errors, value, label) { if (value !== false) errors.push(`${label} must be false, got ${JSON.stringify(value)}`); }
function expectExactArray(errors, actual, expected, label) { if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${label} must equal ${JSON.stringify(expected)}`); }
function expectFragments(errors, source, label, fragments) { for (const fragment of fragments) if (!source.includes(fragment)) errors.push(`${label} missing ${fragment}`); }

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
