#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  contract: "deploy/ingest/netquity-ownership-staging.contract.json",
  entitlement: "deploy/account/netquity-ownership-entitlement-staging.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-ownership-staging.sql",
  domainMigration: "deploy/database/migrations/20260716130000_ownership_domain.sql",
  migrationsContract: "deploy/database/migrations.contract.json",
  ownership: "packages/ownership/src/index.ts",
  ownershipTest: "packages/ownership/src/index.test.ts",
  ownershipPackageJson: "packages/ownership/package.json",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/authenticated-netquity-web-resolver.test.ts",
  workerPackageJson: "apps/worker/package.json",
  webServer: "apps/web/src/lib/api/ownership.server.ts",
  webFunction: "apps/web/src/lib/api/ownership.functions.ts",
  webEndpoints: "apps/web/src/lib/api/endpoints.ts",
  webTypes: "apps/web/src/lib/api/types.ts",
  webPanels: "apps/web/src/components/workbench/panels.tsx",
  webRoute: "apps/web/src/routes/stock/$instrumentId.tsx"
};

const REQUIRED_AUTHORIZATION_FIELDS = [
  "ownership.coverage.reason",
  "ownership.coverage.status",
  "ownership.freeFloat",
  "ownership.holders.crossHolding",
  "ownership.holders.profile",
  "ownership.shareCapital"
];

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_ownership_staging" }, null, 2));
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
  const ownership = readText(root, paths.ownership);
  const ownershipTest = readText(root, paths.ownershipTest);
  const ownershipPackageJson = readJson(root, paths.ownershipPackageJson);
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
  expectEqual(errors, contract.version, "2026-07-16.netquity-ownership-staging.v1", "contract version");
  expectEqual(errors, contract.status, "approved_staging_only", "contract status");
  expectEqual(errors, contract.environment, "staging", "contract environment");
  expectEqual(errors, contract.source?.source_batch_id, "src_netquity_ownership_acef407fd957", "source batch id");
  expectEqual(errors, contract.source?.reused_from_prior_promotion, false, "ownership must pin its own new raw_source_batch, not reuse an earlier one");
  expectEqual(errors, contract.promotion?.serving_dataset, "ownership", "Serving dataset");
  expectEqual(errors, contract.promotion?.serving_dataset_id, "serving_dataset_ownership", "Serving dataset id");
  expectEqual(errors, contract.promotion?.serving_dataset_domain, "ownership", "Serving dataset domain");
  expectEqual(errors, contract.promotion?.new_migration_required, true, "ownership requires a new domain migration (no prior promotion needed one)");
  expectEqual(errors, contract.promotion?.entity_id_pattern, "hkex_security_<five-digit-code>", "entity id pattern must align with the prior 7 promotions");
  expectEqual(errors, contract.promotion?.release_state, "released", "release state");
  expectEqual(errors, contract.promotion?.new_index_required, false, "new_index_required");
  expectEqual(errors, contract.promotion?.transactional, true, "transactional promotion");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_serving_records, 18036, "full basicdata-universe row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_available, 2807, "available row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_unavailable, 15229, "unavailable row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.with_share_capital, 2786, "with_share_capital row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.with_free_float, 2783, "with_free_float row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.with_holders, 2753, "with_holders row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_holder_rows, 9349, "total holder row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.cross_holding_holder_rows, 644, "cross-holding holder row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.excluded_orphan_holder_rows, 17, "excluded orphan holder row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.excluded_orphan_holder_codes, 6, "excluded orphan holder code count");
  expectEqual(errors, contract.rights_basis?.policy_version, "netquity-collaboration-staging.v1", "rights_basis.policy_version");
  if (contract.rights_basis?.policy_version === "netquity-market-data-staging.v1") {
    errors.push("ownership must reuse netquity-collaboration-staging.v1, not quote_snapshot's separate market-data policy version");
  }
  expectEqual(errors, contract.entity_scope_choice?.chosen_pattern, "full_basicdata_universe_with_coverage_marker", "entity_scope_choice.chosen_pattern");
  for (const key of ["wrong_environment", "authorization", "missing_binding", "no_release", "not_found", "database_or_readback"]) {
    if (contract.failure_statuses?.[key] === undefined) errors.push(`failure_statuses.${key} missing`);
  }
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveOwnership", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.authorization?.dataset, "ownership", "authorization.dataset");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.rights_policy_version, "netquity-collaboration-staging.v1", "authorization.rights_policy_version");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_AUTHORIZATION_FIELDS, "authorization.requested_fields");
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("sharecapitalchange_history")) {
    errors.push("not_claimed must include sharecapitalchange_history");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("hex_graph_or_ladder_table_visualization")) {
    errors.push("not_claimed must include hex_graph_or_ladder_table_visualization");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("public_http_route")) {
    errors.push("not_claimed must include public_http_route");
  }
  if (!contract.excluded_from_this_cut?.personal_data_columns) {
    errors.push("contract must document the personal-data-column exclusion check (even when the result is 'none found')");
  }
  if (!contract.excluded_from_this_cut?.listcompheld_orphan_codes) {
    errors.push("contract must document the listcompheld orphan-code exclusion");
  }
  if (!contract.excluded_from_this_cut?.issueshare_sharehold_table) {
    errors.push("contract must document why nq_issueshare.sharehold is excluded (redundant with listcompheld, not an SDI-shape disqualification)");
  }
  if (!contract.excluded_from_this_cut?.nq_sharehold_shareholddata_table) {
    errors.push("contract must document why nq_sharehold.shareholddata is excluded (SDI-overlap filing-event shape)");
  }
  if (!contract.payload_shape_choice?.rationale) {
    errors.push("contract must document payload_shape_choice.rationale (holders[] + nested crossHolding vs a separate crossHoldings[] array)");
  }
  expectEqual(errors, rootPackage.scripts?.["check:netquity-ownership-staging"], "node scripts/check-netquity-ownership-staging-contract.mjs", "root checker command");

  // --- migrations.contract.json ---------------------------------------------
  const registeredMigration = migrationsContract.migrations?.find(
    (entry) => entry.file === "deploy/database/migrations/20260716130000_ownership_domain.sql"
  );
  if (!registeredMigration) {
    errors.push("migrations.contract.json must register 20260716130000_ownership_domain.sql");
  }

  // --- domain migration -------------------------------------------------
  expectFragments(errors, domainMigration, "Domain migration", [
    "drop constraint if exists serving_dataset_domain_check",
    "add constraint serving_dataset_domain_check check",
    "'ownership'",
    "'security_master'",
    "'directorate'"
  ]);
  if (/create\s+table/iu.test(domainMigration)) {
    errors.push("domain migration must not create tables (constraint extension only)");
  }

  // --- promotion SQL --------------------------------------------------------
  expectFragments(errors, promotionSql, "Promotion SQL", [
    "src_netquity_ownership_acef407fd957",
    "ON CONFLICT (source_batch_id) DO NOTHING",
    "'netquity-ownership-acef407fd957.v1'",
    "'netquity-collaboration-staging.v1'",
    "'serving_dataset_ownership'",
    "'ownership'",
    "nq_issueshare.issueshare",
    "nq_freefloatshare2.freefloatshare",
    "nq_listcompheld.data",
    "nq_basicdata.stock",
    "'hkex_security_' || lpad(",
    "release_state = 'released'",
    "'serving_ownership_netquity_acef407fd957_v1'",
    "jsonb_strip_nulls",
    "holdshareallper",
    "row_number() OVER"
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
  if (!/code NOT IN \(\s*SELECT code FROM nq_basicdata\.stock\s*\)/mu.test(promotionSql) && !promotionSql.includes("WHERE l.code IN (SELECT code FROM nq_basicdata.stock)")) {
    errors.push("promotion SQL must filter nq_listcompheld.data rows to codes present in nq_basicdata.stock (the 17-row / 6-code orphan exclusion)");
  }
  const promotionSqlCode = stripSqlComments(promotionSql);
  if (/'crossHoldings'\s*,/u.test(promotionSqlCode)) {
    errors.push("promotion SQL must not emit a separate top-level crossHoldings array -- crossHolding is nested per holders[] entry (see contract.json payload_shape_choice)");
  }

  // --- entitlement SQL --------------------------------------------------------
  expectFragments(errors, entitlement, "Entitlement SQL", [
    "'ownership'",
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
  if (/ownership\.\*/u.test(entitlement)) errors.push("entitlement must not grant wildcard fields");

  // --- ownership package --------------------------------------------------------
  expectEqual(errors, ownershipPackageJson.name, "@aiphabee/ownership", "ownership package name");
  expectFragments(errors, ownership, "ownership", [
    "GET_OWNERSHIP_LIVE_VERSION",
    "GetLiveOwnershipResult",
    "liveDataAccess: true",
    "export function getLiveOwnership(",
    "GetLiveOwnershipReadbackError",
    "\"unavailable\"",
    "LiveShareCapital",
    "LiveFreeFloat",
    "LiveOwnershipHolder",
    "crossHolding"
  ]);
  expectFragments(errors, ownershipTest, "ownership tests", [
    "getLiveOwnership",
    "GetLiveOwnershipReadbackError",
    "\"unavailable\"",
    "crossHolding"
  ]);

  // --- worker resolver --------------------------------------------------------
  expectFragments(errors, worker, "Worker resolver", [
    "resolveAuthenticatedNetquityOwnership",
    "resolveReleasedNetquityOwnership",
    "dataset: \"ownership\"",
    "data_entitlement.dataset = 'ownership'",
    "dataset.dataset = 'ownership'",
    "record.entity_id = $2",
    "getLiveOwnership"
  ]);
  expectFragments(errors, workerIndex, "Worker index", [
    "resolveAuthenticatedNetquityOwnership",
    "async resolveOwnership(input"
  ]);
  if (/app\.(?:get|post|all)\([^\n]*resolveOwnership/iu.test(workerIndex)) {
    errors.push("resolveOwnership must not have a public HTTP route");
  }
  expectFragments(errors, workerTest, "Worker tests", [
    "resolveAuthenticatedNetquityOwnership",
    "netquity-collaboration-staging.v1"
  ]);
  expectEqual(errors, workerPackageJson.dependencies?.["@aiphabee/ownership"], "file:../../packages/ownership", "worker package.json @aiphabee/ownership dependency");

  // --- web layer --------------------------------------------------------
  expectFragments(errors, webTypes, "Web types", ["GetLiveOwnershipData"]);
  expectFragments(errors, webServer, "Web server", [
    "resolveAuthenticatedOwnershipRequest",
    "service.resolveOwnership"
  ]);
  expectFragments(errors, webFunction, "Web server function", ["resolveAuthenticatedOwnership"]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveOwnership"]);
  expectFragments(errors, webPanels, "Web OwnershipPanel", [
    "export function OwnershipPanel({ instrumentId",
    "resolveOwnership"
  ]);
  expectFragments(errors, webRoute, "Web stock route", ["<OwnershipPanel instrumentId="]);
  if (!/key:\s*"ownership"/u.test(webRoute)) {
    errors.push("stock route must register the ownership tab key");
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
