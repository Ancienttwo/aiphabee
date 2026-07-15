#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  contract: "deploy/ingest/netquity-financial-facts-staging.contract.json",
  entitlement: "deploy/account/netquity-financial-facts-entitlement-staging.sql",
  package: "package.json",
  promotionSql: "deploy/ingest/netquity-financial-facts-staging.sql",
  financialFacts: "packages/financial-facts/src/index.ts",
  financialFactsTest: "packages/financial-facts/src/index.test.ts",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
  workerTest: "apps/worker/src/authenticated-netquity-web-resolver.test.ts",
  webServer: "apps/web/src/lib/api/financial-facts.server.ts",
  webFunction: "apps/web/src/lib/api/financial-facts.functions.ts",
  webEndpoints: "apps/web/src/lib/api/endpoints.ts",
  webTypes: "apps/web/src/lib/api/types.ts",
  webPanels: "apps/web/src/components/workbench/panels.tsx",
  webRoute: "apps/web/src/routes/stock/$instrumentId.tsx"
};

const REQUIRED_METRIC_IDS = [
  "assets",
  "equity",
  "liabilities",
  "net_income",
  "operating_cash_flow",
  "revenue"
];

const REQUIRED_AUTHORIZATION_FIELDS = [
  "financial_facts.coverage.reason",
  "financial_facts.coverage.status",
  "financial_facts.facts.assets",
  "financial_facts.facts.equity",
  "financial_facts.facts.liabilities",
  "financial_facts.facts.net_income",
  "financial_facts.facts.operating_cash_flow",
  "financial_facts.facts.revenue"
];

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_financial_facts_staging" }, null, 2));
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      { metrics: REQUIRED_METRIC_IDS.length, status: "ok" },
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
  const financialFacts = readText(root, paths.financialFacts);
  const financialFactsTest = readText(root, paths.financialFactsTest);
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
  expectEqual(errors, contract.version, "2026-07-15.netquity-financial-facts-staging.v1", "contract version");
  expectEqual(errors, contract.status, "approved_staging_only", "contract status");
  expectEqual(errors, contract.environment, "staging", "contract environment");
  expectEqual(errors, contract.source?.source_batch_id, "src_netquity_finreport_nb_a8f571ad55d2", "source batch id");
  expectEqual(errors, contract.source?.reused_from_prior_promotion, false, "financial_facts must pin its own new raw_source_batch, not reuse an earlier one");
  expectEqual(errors, contract.promotion?.serving_dataset, "financial_facts", "Serving dataset");
  expectEqual(errors, contract.promotion?.serving_dataset_id, "serving_dataset_financial_facts", "Serving dataset id");
  expectEqual(errors, contract.promotion?.serving_dataset_domain, "financial_fact", "Serving dataset domain (existing CHECK value, singular)");
  expectEqual(errors, contract.promotion?.entity_id_pattern, "hkex_security_<five-digit-code>", "entity id pattern must align with security_master/profile");
  expectEqual(errors, contract.promotion?.release_state, "released", "release state");
  expectEqual(errors, contract.promotion?.new_index_required, false, "new_index_required");
  expectEqual(errors, contract.promotion?.transactional, true, "transactional promotion");
  expectEqual(errors, contract.promotion?.row_count_breakdown?.coverage_unavailable_bank_insurance, 54, "bank/insurance unavailable-coverage row count");
  expectEqual(errors, contract.rpc?.binding, "AIPHABEE_API", "rpc.binding");
  expectEqual(errors, contract.rpc?.entrypoint, "AuthenticatedNetquityResolver", "rpc.entrypoint");
  expectEqual(errors, contract.rpc?.method, "resolveFinancialFacts", "rpc.method");
  expectFalse(errors, contract.rpc?.public_http_exposed, "rpc.public_http_exposed");
  expectEqual(errors, contract.authorization?.dataset, "financial_facts", "authorization.dataset");
  expectEqual(errors, contract.authorization?.channel, "web", "authorization.channel");
  expectEqual(errors, contract.authorization?.entitled_workspace_cardinality, 1, "authorization.entitled_workspace_cardinality");
  expectExactArray(errors, contract.authorization?.requested_fields, REQUIRED_AUTHORIZATION_FIELDS, "authorization.requested_fields");
  const promotedMetricIds = (contract.metric_mapping ?? []).map((entry) => entry.metric_id).sort();
  expectExactArray(errors, promotedMetricIds, REQUIRED_METRIC_IDS, "metric_mapping metric ids");
  if (!(contract.metric_excluded?.metric_ids ?? []).includes("free_cash_flow")) {
    errors.push("metric_excluded.metric_ids must exclude free_cash_flow");
  }
  for (const key of ["api_rights_approved", "mcp_rights_approved", "export_rights_approved"]) {
    expectFalse(errors, contract.authorization?.[key], `authorization.${key}`);
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("public_http_route") && !contract.not_claimed.includes("public_resolver_cutover")) {
    errors.push("not_claimed must include public_resolver_cutover or public_http_route");
  }
  if (!Array.isArray(contract.not_claimed) || !contract.not_claimed.includes("bank_or_insurance_financial_values")) {
    errors.push("not_claimed must include bank_or_insurance_financial_values");
  }
  expectEqual(errors, rootPackage.scripts?.["check:netquity-financial-facts-staging"], "node scripts/check-netquity-financial-facts-staging-contract.mjs", "root checker command");

  // --- promotion SQL --------------------------------------------------------
  expectFragments(errors, promotionSql, "Promotion SQL", [
    "src_netquity_finreport_nb_a8f571ad55d2",
    "ON CONFLICT (source_batch_id) DO NOTHING",
    "'netquity-financial-facts-a8f571ad55d2.v1'",
    "'serving_dataset_financial_facts'",
    "'financial_facts'",
    "'financial_fact'",
    "totalturnover",
    "net_prof",
    "total_ass",
    "liab_total",
    "total_equity",
    "cf_ncf_operact",
    "'hkex_security_' || lpad(",
    "release_state = 'released'",
    "'serving_financial_facts_netquity_finreport_nb_a8f571ad55d2_v1'"
  ]);
  if (/CREATE\s+(UNIQUE\s+)?INDEX/iu.test(promotionSql)) {
    errors.push("promotion SQL must not create a new index (entity_id lookup reuses the existing serving_record unique index prefix)");
  }
  if (!/ON CONFLICT \(serving_record_id\) DO NOTHING/u.test(promotionSql)) {
    errors.push("promotion SQL must insert serving_record idempotently");
  }
  if (!promotionSql.includes("nq_finreport.pla_b") || !promotionSql.includes("nq_finreport.bal_b")) {
    errors.push("promotion SQL must read pla_b/bal_b to detect bank/insurance-only coverage exclusion");
  }
  if (!/coverage/u.test(promotionSql) || !/unavailable/u.test(promotionSql)) {
    errors.push("promotion SQL must mark bank/insurance-excluded instruments with an explicit coverage.status=unavailable, not silent omission");
  }
  if (/'free_cash_flow'/u.test(promotionSql)) {
    errors.push("promotion SQL must not promote free_cash_flow (no clean single-column vendor mapping)");
  }
  if (!/coverperiod\s*=\s*12/u.test(promotionSql) || !/coverperiod\s*=\s*6/u.test(promotionSql)) {
    errors.push("promotion SQL must scope statementtype F/I by coverperiod (12/6) to keep periodType FY/H1 truthful");
  }

  // --- entitlement SQL --------------------------------------------------------
  expectFragments(errors, entitlement, "Entitlement SQL", [
    "'financial_facts'",
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
  if (/financial_facts\.\*/u.test(entitlement)) errors.push("entitlement must not grant wildcard fields");

  // --- financial-facts package --------------------------------------------------------
  expectFragments(errors, financialFacts, "financial-facts", [
    "GET_FINANCIAL_FACTS_LIVE_VERSION",
    "GetLiveFinancialFactsResult",
    "liveDataAccess: true",
    "export function getLiveFinancialFacts(",
    "GetLiveFinancialFactsReadbackError",
    "\"unavailable\""
  ]);
  if (!promotionSql.includes("'scale', 1") || !promotionSql.includes("'unit', 'unit'")) {
    errors.push("promotion SQL must treat vendor values as unscaled (scale 1, unit 'unit'), not reuse the synthetic million-scale convention");
  }
  expectFragments(errors, financialFactsTest, "financial-facts tests", [
    "getLiveFinancialFacts",
    "GetLiveFinancialFactsReadbackError",
    "\"unavailable\""
  ]);

  // --- worker resolver --------------------------------------------------------
  expectFragments(errors, worker, "Worker resolver", [
    "resolveAuthenticatedNetquityFinancialFacts",
    "resolveReleasedNetquityFinancialFacts",
    "dataset: \"financial_facts\"",
    "data_entitlement.dataset = 'financial_facts'",
    "dataset.dataset = 'financial_facts'",
    "record.entity_id = $2",
    "getLiveFinancialFacts"
  ]);
  expectFragments(errors, workerIndex, "Worker index", [
    "resolveAuthenticatedNetquityFinancialFacts",
    "async resolveFinancialFacts(input"
  ]);
  if (/app\.(?:get|post|all)\([^\n]*resolveFinancialFacts/iu.test(workerIndex)) {
    errors.push("resolveFinancialFacts must not have a public HTTP route");
  }
  expectFragments(errors, workerTest, "Worker tests", [
    "resolveAuthenticatedNetquityFinancialFacts"
  ]);

  // --- web layer --------------------------------------------------------
  expectFragments(errors, webTypes, "Web types", ["GetLiveFinancialFactsData"]);
  expectFragments(errors, webServer, "Web server", [
    "resolveAuthenticatedFinancialFactsRequest",
    "service.resolveFinancialFacts"
  ]);
  expectFragments(errors, webFunction, "Web server function", ["resolveAuthenticatedFinancialFacts"]);
  expectFragments(errors, webEndpoints, "Web endpoint", ["resolveFinancialFacts"]);
  expectFragments(errors, webPanels, "Web FinancialsPanel", [
    "export function FinancialsPanel({ instrumentId",
    "resolveFinancialFacts"
  ]);
  if (/FinancialsPanel\(\{\s*section/u.test(webPanels)) {
    errors.push("FinancialsPanel must be decoupled from the synthetic snapshot section prop (CompanyHeader pattern)");
  }
  expectFragments(errors, webRoute, "Web stock route", ["<FinancialsPanel instrumentId="]);
  if (/<FinancialsPanel[^/]*section=/u.test(webRoute)) {
    errors.push("stock route must not pass the synthetic snapshot section into FinancialsPanel anymore");
  }

  return errors;
}

function readJson(root, path) { return JSON.parse(readText(root, path)); }
function readText(root, path) { return readFileSync(`${root}/${path}`, "utf8"); }
function expectEqual(errors, actual, expected, label) { if (actual !== expected) errors.push(`${label} must equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
function expectFalse(errors, value, label) { expectEqual(errors, value, false, label); }
function expectExactArray(errors, actual, expected, label) { if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${label} must equal ${JSON.stringify(expected)}`); }
function expectFragments(errors, source, label, fragments) { for (const fragment of fragments) if (!source.includes(fragment)) errors.push(`${label} missing ${fragment}`); }

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
