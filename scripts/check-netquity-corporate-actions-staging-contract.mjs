#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  contract: "deploy/ingest/netquity-corporate-actions-staging.contract.json",
  entitlement: "deploy/account/netquity-corporate-actions-entitlement-staging.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-corporate-actions-staging.sql",
  corporateActions: "packages/corporate-actions/src/index.ts",
  corporateActionsTest: "packages/corporate-actions/src/index.test.ts",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/authenticated-netquity-web-resolver.test.ts",
  webServer: "apps/web/src/lib/api/corporate-actions.server.ts",
  webFunction: "apps/web/src/lib/api/corporate-actions.functions.ts",
  webEndpoints: "apps/web/src/lib/api/endpoints.ts",
  webTypes: "apps/web/src/lib/api/types.ts",
  webPanels: "apps/web/src/components/workbench/panels.tsx",
  webRoute: "apps/web/src/routes/stock/$instrumentId.tsx"
};

const REQUIRED_AUTHORIZATION_FIELDS = [
  "corporate_actions.actions.buyback",
  "corporate_actions.actions.consolidation",
  "corporate_actions.actions.dividend",
  "corporate_actions.actions.split",
  "corporate_actions.coverage.reason",
  "corporate_actions.coverage.status"
];

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_corporate_actions_staging" }, null, 2));
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
  const promotionSql = readText(root, paths.promotionSql);
  const entitlement = readText(root, paths.entitlement);
  const corporateActions = readText(root, paths.corporateActions);
  const corporateActionsTest = readText(root, paths.corporateActionsTest);
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
  expectEqual(errors, contract.version, "2026-07-15.netquity-corporate-actions-staging.v1", "contract version");
  expectEqual(errors, contract.status, "approved_staging_only", "contract status");
  expectEqual(errors, contract.environment, "staging", "contract environment");
  expectEqual(errors, contract.source?.source_batch_id, "src_netquity_corporate_actions_e543ecd86216", "source batch id");
  expectEqual(errors, contract.source?.reused_from_prior_promotion, false, "corporate_actions must pin its own new raw_source_batch, not reuse an earlier one");
  expectEqual(errors, contract.promotion?.serving_dataset, "corporate_actions", "Serving dataset");
  expectEqual(errors, contract.promotion?.serving_dataset_id, "serving_dataset_corporate_actions", "Serving dataset id");
  expectEqual(errors, contract.promotion?.serving_dataset_domain, "corporate_action", "Serving dataset domain (exact CHECK match, singular)");
  expectEqual(errors, contract.promotion?.entity_id_pattern, "hkex_security_<five-digit-code>", "entity id pattern must align with the prior 4 promotions");
  expectEqual(errors, contract.promotion?.release_state, "released", "release state");
  expectEqual(errors, contract.promotion?.new_index_required, false, "new_index_required");
  expectEqual(errors, contract.promotion?.transactional, true, "transactional promotion");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.total_serving_records, 18036, "full basicdata-universe row count");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_unavailable_no_action, 16981, "unavailable-coverage row count");
  expectEqual(errors, contract.rights_basis?.policy_version, "netquity-collaboration-staging.v1", "rights_basis.policy_version");
  if (contract.rights_basis?.policy_version === "netquity-market-data-staging.v1") {
    errors.push("corporate_actions must reuse netquity-collaboration-staging.v1, not quote_snapshot's separate market-data policy version");
  }
  expectEqual(errors, contract.entity_scope_choice?.chosen_pattern, "full_basicdata_universe_with_coverage_marker", "entity_scope_choice.chosen_pattern");
  for (const key of ["wrong_environment", "authorization", "missing_binding", "no_release", "not_found", "database_or_readback"]) {
    if (contract.failure_statuses?.[key] === undefined) errors.push(`failure_statuses.${key} missing`);
  }
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveCorporateActions", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.authorization?.dataset, "corporate_actions", "authorization.dataset");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.rights_policy_version, "netquity-collaboration-staging.v1", "authorization.rights_policy_version");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_AUTHORIZATION_FIELDS, "authorization.requested_fields");
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  expectExactArray(errors, contract.action_type_source_mapping?.map((entry) => entry.action_type).sort(), [
    "buyback", "consolidation", "dividend", "dividend", "split"
  ], "action_type_source_mapping action types");
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("split_or_consolidation_ratio_values")) {
    errors.push("not_claimed must include split_or_consolidation_ratio_values");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("capital_raised_promotion")) {
    errors.push("not_claimed must include capital_raised_promotion");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("public_http_route")) {
    errors.push("not_claimed must include public_http_route");
  }
  expectEqual(errors, rootPackage.scripts?.["check:netquity-corporate-actions-staging"], "node scripts/check-netquity-corporate-actions-staging-contract.mjs", "root checker command");

  // --- promotion SQL --------------------------------------------------------
  expectFragments(errors, promotionSql, "Promotion SQL", [
    "src_netquity_corporate_actions_e543ecd86216",
    "ON CONFLICT (source_batch_id) DO NOTHING",
    "'netquity-corporate-actions-e543ecd86216.v1'",
    "'netquity-collaboration-staging.v1'",
    "'serving_dataset_corporate_actions'",
    "'corporate_actions'",
    "'corporate_action'",
    "nq_dividendinfo.dividendinfo",
    "nq_sharebuyback.daily_data",
    "nq_corpact.stocksplit",
    "nq_corpact.stockcons",
    "nq_basicdata.stock",
    "'hkex_security_' || lpad(",
    "release_state = 'released'",
    "'serving_corporate_actions_netquity_e543ecd86216_v1'",
    "jsonb_strip_nulls",
    "catype LIKE '%CD%'",
    "catype LIKE '%SD%'",
    "termaction IS DISTINCT FROM 'Y'"
  ]);
  if (/CREATE\s+(UNIQUE\s+)?INDEX/iu.test(promotionSql)) {
    errors.push("promotion SQL must not create a new index (entity_id lookup reuses the existing serving_record unique index prefix)");
  }
  if (!/ON CONFLICT \(serving_record_id\) DO NOTHING/u.test(promotionSql)) {
    errors.push("promotion SQL must insert serving_record idempotently");
  }
  if (!/coverage/u.test(promotionSql) || !/unavailable/u.test(promotionSql)) {
    errors.push("promotion SQL must mark zero-action instruments with an explicit coverage.status=unavailable, not silent omission");
  }
  if (/'ratio'\s*,/u.test(promotionSql)) {
    errors.push("promotion SQL must not populate terms.ratio for split/consolidation (no clean numeric vendor source)");
  }
  if (/\b(?:FROM|JOIN)\s+nq_capitalraised/iu.test(promotionSql)) {
    errors.push("promotion SQL must not read nq_capitalraised (methodcode has no decode table)");
  }

  // --- entitlement SQL --------------------------------------------------------
  expectFragments(errors, entitlement, "Entitlement SQL", [
    "'corporate_actions'",
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
  if (/corporate_actions\.\*/u.test(entitlement)) errors.push("entitlement must not grant wildcard fields");

  // --- corporate-actions package --------------------------------------------------------
  expectFragments(errors, corporateActions, "corporate-actions", [
    "GET_CORPORATE_ACTIONS_LIVE_VERSION",
    "GetLiveCorporateActionsResult",
    "liveDataAccess: true",
    "export function getLiveCorporateActions(",
    "GetLiveCorporateActionsReadbackError",
    "\"unavailable\"",
    "LiveCorporateActionType",
    "buyback",
    "consolidation"
  ]);
  if (!corporateActions.includes("GET_CORPORATE_ACTIONS_DATA_VERSION")) {
    errors.push("corporate-actions must leave the synthetic GET_CORPORATE_ACTIONS_DATA_VERSION constant untouched");
  }
  if (/priceAdjustmentFactor/u.test(corporateActions.slice(corporateActions.indexOf("GET_CORPORATE_ACTIONS_LIVE_VERSION")))) {
    errors.push("live corporate-actions types must not carry a derived priceAdjustmentFactor (no rights-pinned source)");
  }
  expectFragments(errors, corporateActionsTest, "corporate-actions tests", [
    "getLiveCorporateActions",
    "GetLiveCorporateActionsReadbackError",
    "\"unavailable\""
  ]);

  // --- worker resolver --------------------------------------------------------
  expectFragments(errors, worker, "Worker resolver", [
    "resolveAuthenticatedNetquityCorporateActions",
    "resolveReleasedNetquityCorporateActions",
    "dataset: \"corporate_actions\"",
    "data_entitlement.dataset = 'corporate_actions'",
    "dataset.dataset = 'corporate_actions'",
    "record.entity_id = $2",
    "getLiveCorporateActions"
  ]);
  expectFragments(errors, workerIndex, "Worker index", [
    "resolveAuthenticatedNetquityCorporateActions",
    "async resolveCorporateActions(input"
  ]);
  if (/app\.(?:get|post|all)\([^\n]*resolveCorporateActions/iu.test(workerIndex)) {
    errors.push("resolveCorporateActions must not have a public HTTP route");
  }
  expectFragments(errors, workerTest, "Worker tests", [
    "resolveAuthenticatedNetquityCorporateActions",
    "netquity-collaboration-staging.v1"
  ]);

  // --- web layer --------------------------------------------------------
  expectFragments(errors, webTypes, "Web types", ["GetLiveCorporateActionsData"]);
  expectFragments(errors, webServer, "Web server", [
    "resolveAuthenticatedCorporateActionsRequest",
    "service.resolveCorporateActions"
  ]);
  expectFragments(errors, webFunction, "Web server function", ["resolveAuthenticatedCorporateActions"]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveCorporateActions"]);
  expectFragments(errors, webPanels, "Web CorporateActionsPanel", [
    "export function CorporateActionsPanel({ instrumentId",
    "resolveCorporateActions"
  ]);
  if (/CorporateActionsPanel\(\{\s*section/u.test(webPanels)) {
    errors.push("CorporateActionsPanel must be decoupled from the synthetic snapshot section prop (FinancialsPanel/QuotePanel pattern)");
  }
  if (!/export function AnnouncementsPanel\(\{ section/u.test(webPanels)) {
    errors.push("AnnouncementsPanel must remain synthetic (unchanged section prop)");
  }
  expectFragments(errors, webRoute, "Web stock route", ["<CorporateActionsPanel instrumentId="]);
  if (/<CorporateActionsPanel[^/]*section=/u.test(webRoute)) {
    errors.push("stock route must not pass the synthetic snapshot section into CorporateActionsPanel anymore");
  }

  return errors;
}

function readJson(root, path) { return JSON.parse(readText(root, path)); }
function readText(root, path) { return readFileSync(`${root}/${path}`, "utf8"); }
function expectEqual(errors, actual, expected, label) { if (actual !== expected) errors.push(`${label} must equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
function expectFalse(errors, value, label) { if (value !== false) errors.push(`${label} must be false, got ${JSON.stringify(value)}`); }
function expectExactArray(errors, actual, expected, label) { if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${label} must equal ${JSON.stringify(expected)}`); }
function expectFragments(errors, source, label, fragments) { for (const fragment of fragments) if (!source.includes(fragment)) errors.push(`${label} missing ${fragment}`); }

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
