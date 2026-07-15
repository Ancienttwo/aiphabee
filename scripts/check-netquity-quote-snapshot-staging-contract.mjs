#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  contract: "deploy/ingest/netquity-quote-snapshot-staging.contract.json",
  entitlement: "deploy/account/netquity-quote-snapshot-entitlement-staging.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-quote-snapshot-staging.sql",
  marketData: "packages/market-data/src/index.ts",
  marketDataTest: "packages/market-data/src/index.test.ts",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/authenticated-netquity-web-resolver.test.ts",
  webServer: "apps/web/src/lib/api/quote-snapshot.server.ts",
  webFunction: "apps/web/src/lib/api/quote-snapshot.functions.ts",
  webEndpoints: "apps/web/src/lib/api/endpoints.ts",
  webTypes: "apps/web/src/lib/api/types.ts",
  webPanels: "apps/web/src/components/workbench/panels.tsx",
  webRoute: "apps/web/src/routes/stock/$instrumentId.tsx"
};

const REQUIRED_AUTHORIZATION_FIELDS = [
  "quote_snapshot.coverage.reason",
  "quote_snapshot.coverage.status",
  "quote_snapshot.quote.close",
  "quote_snapshot.quote.currency",
  "quote_snapshot.quote.high",
  "quote_snapshot.quote.low",
  "quote_snapshot.quote.open",
  "quote_snapshot.quote.sharesOutstanding",
  "quote_snapshot.quote.tradeDate",
  "quote_snapshot.quote.turnover",
  "quote_snapshot.quote.volume"
];

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_quote_snapshot_staging" }, null, 2));
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
  const marketData = readText(root, paths.marketData);
  const marketDataTest = readText(root, paths.marketDataTest);
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
  expectEqual(errors, contract.version, "2026-07-15.netquity-quote-snapshot-staging.v1", "contract version");
  expectEqual(errors, contract.status, "approved_staging_only", "contract status");
  expectEqual(errors, contract.environment, "staging", "contract environment");
  expectEqual(errors, contract.source?.source_batch_id, "src_netquity_quote_snapshot_4c37391c8531", "source batch id");
  expectEqual(errors, contract.source?.reused_from_prior_promotion, false, "quote_snapshot must pin its own new raw_source_batch, not reuse an earlier one");
  expectEqual(errors, contract.promotion?.serving_dataset, "quote_snapshot", "Serving dataset");
  expectEqual(errors, contract.promotion?.serving_dataset_id, "serving_dataset_quote_snapshot", "Serving dataset id");
  expectEqual(errors, contract.promotion?.serving_dataset_domain, "quote_snapshot", "Serving dataset domain (exact CHECK match)");
  expectEqual(errors, contract.promotion?.entity_id_pattern, "hkex_security_<five-digit-code>", "entity id pattern must align with security_master/profile/financial_facts");
  expectEqual(errors, contract.promotion?.release_state, "released", "release state");
  expectEqual(errors, contract.promotion?.new_index_required, false, "new_index_required");
  expectEqual(errors, contract.promotion?.transactional, true, "transactional promotion");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_unavailable_no_daily_row, 541, "unavailable-coverage row count");
  expectEqual(errors, contract.rights_basis?.policy_version, "netquity-market-data-staging.v1", "rights_basis.policy_version");
  if (contract.rights_basis?.policy_version === "netquity-collaboration-staging.v1") {
    errors.push("quote_snapshot must use its own distinct rights_policy_version, not reuse netquity-collaboration-staging.v1");
  }
  expectEqual(errors, contract.derived_panel_valuation_unblock?.attempted, true, "derived_panel_valuation_unblock.attempted must be documented as true (attempted and reported)");
  for (const key of ["wrong_environment", "authorization", "missing_binding", "no_release", "not_found", "database_or_readback"]) {
    if (contract.failure_statuses?.[key] === undefined) errors.push(`failure_statuses.${key} missing`);
  }
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveQuoteSnapshot", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.authorization?.dataset, "quote_snapshot", "authorization.dataset");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.rights_policy_version, "netquity-market-data-staging.v1", "authorization.rights_policy_version");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_AUTHORIZATION_FIELDS, "authorization.requested_fields");
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  expectExactArray(errors, contract.field_ohlcv_mapping?.map((entry) => entry.field).sort(), [
    "quote.close", "quote.currency", "quote.high", "quote.low", "quote.open",
    "quote.sharesOutstanding", "quote.tradeDate", "quote.turnover", "quote.volume"
  ], "field_ohlcv_mapping fields");
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("real_time_or_intraday_quotes")) {
    errors.push("not_claimed must include real_time_or_intraday_quotes");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("market_cap_or_valuation_derived_metrics")) {
    errors.push("not_claimed must include market_cap_or_valuation_derived_metrics");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("public_http_route")) {
    errors.push("not_claimed must include public_http_route");
  }
  expectEqual(errors, rootPackage.scripts?.["check:netquity-quote-snapshot-staging"], "node scripts/check-netquity-quote-snapshot-staging-contract.mjs", "root checker command");

  // --- promotion SQL --------------------------------------------------------
  expectFragments(errors, promotionSql, "Promotion SQL", [
    "src_netquity_quote_snapshot_4c37391c8531",
    "ON CONFLICT (source_batch_id) DO NOTHING",
    "'netquity-quote-snapshot-4c37391c8531.v1'",
    "'netquity-market-data-staging.v1'",
    "'serving_dataset_quote_snapshot'",
    "'quote_snapshot'",
    "nq_unadjprice2.daily",
    "nq_marketdata.stock",
    "nq_basicdata.stock",
    "issue_cap",
    "'hkex_security_' || lpad(",
    "release_state = 'released'",
    "'serving_quote_snapshot_netquity_unadjprice2_4c37391c8531_v1'",
    "jsonb_strip_nulls"
  ]);
  if (/CREATE\s+(UNIQUE\s+)?INDEX/iu.test(promotionSql)) {
    errors.push("promotion SQL must not create a new index (entity_id lookup reuses the existing serving_record unique index prefix)");
  }
  if (!/ON CONFLICT \(serving_record_id\) DO NOTHING/u.test(promotionSql)) {
    errors.push("promotion SQL must insert serving_record idempotently");
  }
  if (!/coverage/u.test(promotionSql) || !/unavailable/u.test(promotionSql)) {
    errors.push("promotion SQL must mark no-daily-row instruments with an explicit coverage.status=unavailable, not silent omission");
  }
  if (/\bm\.total_issue_cap\b/u.test(promotionSql)) {
    errors.push("promotion SQL must source sharesOutstanding from issue_cap, not total_issue_cap (verified against vendor marketcap)");
  }
  if (/'marketcap'/u.test(promotionSql) || /\bm\.marketcap\b/u.test(promotionSql)) {
    errors.push("promotion SQL must not promote marketcap (vendor's own derived value, not a 1:1 source column)");
  }
  if (/\bd\.status\b/u.test(promotionSql)) {
    errors.push("promotion SQL must not promote nq_unadjprice2.daily.status (undocumented business meaning)");
  }

  // --- entitlement SQL --------------------------------------------------------
  expectFragments(errors, entitlement, "Entitlement SQL", [
    "'quote_snapshot'",
    "'web'",
    "'netquity-market-data-staging.v1'",
    "workspace_authenticated_netquity_staging",
    "subscription_authenticated_netquity_staging",
    "ON CONFLICT (dataset, channel, field_pattern, rights_policy_version) DO UPDATE SET",
    "WHERE aiphabee_governance.data_entitlement.status = 'approved'"
  ]);
  for (const field of REQUIRED_AUTHORIZATION_FIELDS) {
    if (!entitlement.includes(field)) errors.push(`Entitlement SQL missing field_pattern ${field}`);
  }
  if (/quote_snapshot\.\*/u.test(entitlement)) errors.push("entitlement must not grant wildcard fields");

  // --- market-data package --------------------------------------------------------
  expectFragments(errors, marketData, "market-data", [
    "GET_QUOTE_SNAPSHOT_LIVE_VERSION",
    "GetLiveQuoteSnapshotResult",
    "liveDataAccess: true",
    "export function getLiveQuoteSnapshot(",
    "GetLiveQuoteSnapshotReadbackError",
    "\"unavailable\"",
    "sharesOutstanding"
  ]);
  if (!marketData.includes("GET_QUOTE_SNAPSHOT_DATA_VERSION")) {
    errors.push("market-data must leave the synthetic GET_QUOTE_SNAPSHOT_DATA_VERSION constant untouched");
  }
  expectFragments(errors, marketDataTest, "market-data tests", [
    "getLiveQuoteSnapshot",
    "GetLiveQuoteSnapshotReadbackError",
    "\"unavailable\""
  ]);

  // --- worker resolver --------------------------------------------------------
  expectFragments(errors, worker, "Worker resolver", [
    "resolveAuthenticatedNetquityQuoteSnapshot",
    "resolveReleasedNetquityQuoteSnapshot",
    "NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION",
    "dataset: \"quote_snapshot\"",
    "data_entitlement.dataset = 'quote_snapshot'",
    "dataset.dataset = 'quote_snapshot'",
    "record.entity_id = $2",
    "getLiveQuoteSnapshot"
  ]);
  if (!/NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION\s*=\s*"netquity-market-data-staging\.v1"/u.test(worker)) {
    errors.push("Worker resolver must define NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION as its own hardcoded constant, independent of context.rights_policy_version");
  }
  expectFragments(errors, workerIndex, "Worker index", [
    "resolveAuthenticatedNetquityQuoteSnapshot",
    "async resolveQuoteSnapshot(input"
  ]);
  if (/app\.(?:get|post|all)\([^\n]*resolveQuoteSnapshot/iu.test(workerIndex)) {
    errors.push("resolveQuoteSnapshot must not have a public HTTP route");
  }
  expectFragments(errors, workerTest, "Worker tests", [
    "resolveAuthenticatedNetquityQuoteSnapshot",
    "netquity-market-data-staging.v1"
  ]);

  // --- web layer --------------------------------------------------------
  expectFragments(errors, webTypes, "Web types", ["GetLiveQuoteSnapshotData"]);
  expectFragments(errors, webServer, "Web server", [
    "resolveAuthenticatedQuoteSnapshotRequest",
    "service.resolveQuoteSnapshot"
  ]);
  expectFragments(errors, webFunction, "Web server function", ["resolveAuthenticatedQuoteSnapshot"]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveQuoteSnapshot"]);
  expectFragments(errors, webPanels, "Web QuotePanel", [
    "export function QuotePanel({ instrumentId",
    "resolveQuoteSnapshot"
  ]);
  if (/QuotePanel\(\{\s*section/u.test(webPanels)) {
    errors.push("QuotePanel must be decoupled from the synthetic snapshot section prop (FinancialsPanel pattern)");
  }
  if (!/收盘价/u.test(webPanels)) {
    errors.push("QuotePanel must render EOD wording (\"收盘价\"), not a real-time label");
  }
  expectFragments(errors, webRoute, "Web stock route", ["<QuotePanel instrumentId="]);
  if (/<QuotePanel[^/]*section=/u.test(webRoute)) {
    errors.push("stock route must not pass the synthetic snapshot section into QuotePanel anymore");
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
