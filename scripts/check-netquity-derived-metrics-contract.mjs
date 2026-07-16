#!/usr/bin/env node
// Static contract checker for the cross-dataset derived-metrics RPC
// (resolveAuthenticatedNetquityDerivedMetrics). Unlike the 9 sibling
// scripts/check-netquity-*-staging-contract.mjs checkers, there is no
// dedicated deploy/ingest/netquity-derived-metrics-staging.contract.json:
// this RPC promotes no Serving dataset of its own -- it conjuncts the two
// gates already owned by resolveAuthenticatedNetquityFinancialFacts and
// resolveAuthenticatedNetquityQuoteSnapshot and delegates the arithmetic to
// @aiphabee/workbench. So this checker instead follows
// check-authenticated-netquity-web-resolver-contract.mjs's resolver-wiring
// style: read the real source files and assert on concrete code fragments.
// All assertions lock onto real SQL/TypeScript syntax, never comment text,
// so a resolver refactor that keeps the invariant true keeps passing, and
// one that breaks it fails loudly instead of bit-rotting into a false pass.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const paths = {
  package: "package.json",
  webGuard: "apps/web/src/lib/api/derived-metrics.server.ts",
  worker: "apps/worker/src/authenticated-netquity-web-resolver.ts",
  workerIndex: "apps/worker/src/index.ts",
};

const DERIVED_METRICS_FN_START = "export async function resolveAuthenticatedNetquityDerivedMetrics(";
const DERIVED_METRICS_FN_END = "function hasExactFieldAuthority(";
const VALIDATE_INPUT_FN_START = "function validateDerivedMetricsInput(";
const VALIDATE_INPUT_FN_END = "function errorResult(";
const RPC_CLASS_START = "export class AuthenticatedNetquityResolver extends WorkerEntrypoint";
const RPC_CLASS_END = "\nexport class ";

// Mirrors packages/workbench/src/index.ts's own
// `const marketCap = roundMetric(quote.close * quote.sharesOutstanding);`
// shape -- if this pattern ever appears in the worker resolver, the worker
// stopped delegating and started recomputing the formula locally.
const LOCAL_FORMULA_PATTERN = /quote\.close\s*\*|\*\s*quote\.close|\bmarket_cap\s*[:=]|\bmarketCap\s*[:=]/u;

export function validateDualGateConjunction(worker) {
  const errors = [];
  const slice = extractSlice(worker, DERIVED_METRICS_FN_START, DERIVED_METRICS_FN_END, "resolveAuthenticatedNetquityDerivedMetrics body", errors);
  if (!slice) return errors;

  requireText(slice, "hasExactFinancialFactsFieldAuthority(financialRightsResult.rows)", "Gate A must check exact financial_facts field authority", errors);
  requireText(slice, "hasExactQuoteSnapshotFieldAuthority(quoteRightsResult.rows)", "Gate B must check exact quote_snapshot field authority", errors);
  requireText(slice, "context.rights_policy_version,", "Gate A must scope its rights query by the account's own context.rights_policy_version", errors);
  requireText(slice, "NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION,", "Gate B must scope its rights query by the hardcoded NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION constant", errors);

  const gateAIndex = slice.indexOf("hasExactFinancialFactsFieldAuthority(financialRightsResult.rows)");
  const gateBIndex = slice.indexOf("hasExactQuoteSnapshotFieldAuthority(quoteRightsResult.rows)");
  if (gateAIndex >= 0 && gateBIndex >= 0 && gateAIndex >= gateBIndex) {
    errors.push("Gate A (financial_facts) must be enforced before Gate B (quote_snapshot)");
  }

  return errors;
}

export function validateAuthorizationBeforeReleasedReads(worker) {
  const errors = [];
  const slice = extractSlice(worker, DERIVED_METRICS_FN_START, DERIVED_METRICS_FN_END, "resolveAuthenticatedNetquityDerivedMetrics body", errors);
  if (!slice) return errors;

  const gateAIndex = slice.indexOf("hasExactFinancialFactsFieldAuthority(financialRightsResult.rows)");
  const gateBIndex = slice.indexOf("hasExactQuoteSnapshotFieldAuthority(quoteRightsResult.rows)");
  const financialReadIndex = slice.indexOf("resolveReleasedNetquityFinancialFacts(client, {");
  const quoteReadIndex = slice.indexOf("resolveReleasedNetquityQuoteSnapshot(client, {");

  if ([gateAIndex, gateBIndex, financialReadIndex, quoteReadIndex].some((index) => index < 0)) {
    errors.push("could not locate both field-authority gates and both released-Serving reads inside resolveAuthenticatedNetquityDerivedMetrics");
    return errors;
  }

  if (gateAIndex >= financialReadIndex || gateAIndex >= quoteReadIndex) {
    errors.push("Gate A must be enforced before either released dataset is read");
  }
  if (gateBIndex >= financialReadIndex || gateBIndex >= quoteReadIndex) {
    errors.push("Gate B must be enforced before either released dataset is read");
  }

  return errors;
}

export function validateDerivedCalculationDelegation(worker) {
  const errors = [];
  requireText(worker, "createLiveDerivedMetrics,", "worker must import createLiveDerivedMetrics", errors);
  requireText(worker, 'from "@aiphabee/workbench";', "worker must import createLiveDerivedMetrics from @aiphabee/workbench", errors);
  requireText(worker, "const result = createLiveDerivedMetrics({ financialFacts, quoteSnapshot });", "worker must delegate the derived-metrics computation to createLiveDerivedMetrics", errors);

  if (LOCAL_FORMULA_PATTERN.test(worker)) {
    errors.push("worker must not recompute derived-metric formulas locally (market_cap = close * sharesOutstanding belongs to @aiphabee/workbench)");
  }

  return errors;
}

export function validateNoPublicRoute(workerIndex) {
  const errors = [];
  const slice = extractSlice(workerIndex, RPC_CLASS_START, RPC_CLASS_END, "AuthenticatedNetquityResolver RPC class body", errors);
  if (!slice) return errors;

  requireText(slice, "async resolveDerivedMetrics(input: AuthenticatedNetquityDerivedMetricsResolverInput) {", "RPC class must expose a resolveDerivedMetrics method", errors);
  requireText(slice, "return resolveAuthenticatedNetquityDerivedMetrics(this.env, input);", "RPC method must delegate to resolveAuthenticatedNetquityDerivedMetrics", errors);

  const occurrences = countOccurrences(workerIndex, "resolveDerivedMetrics(");
  if (occurrences !== 1) {
    errors.push(`resolveDerivedMetrics( must appear exactly once in the worker entrypoint (RPC class method only, no HTTP handler), found ${occurrences}`);
  }

  if (/app\.(?:get|post|all|put|delete)\([^)]*[Dd]erived[_-]?[Mm]etrics/u.test(workerIndex)) {
    errors.push("derived-metrics RPC must not have a public HTTP route bound in the worker entrypoint");
  }

  return errors;
}

export function validateWebGuard(webGuard) {
  const errors = [];
  requireText(webGuard, "data.live_data_access !== true", "web guard must assert the wire-format snake_case live_data_access field is exactly true", errors);
  requireText(webGuard, "isNonEmptyString(provenance.source_record_id)", "web guard must assert each provenance entry carries a non-empty source_record_id", errors);
  return errors;
}

export function validateStagingOnly(worker) {
  const errors = [];
  const slice = extractSlice(worker, VALIDATE_INPUT_FN_START, VALIDATE_INPUT_FN_END, "validateDerivedMetricsInput body", errors);
  if (!slice) return errors;

  requireText(slice, 'bindings.APP_ENV !== "staging"', "derived-metrics input validation must reject any non-staging APP_ENV", errors);
  return errors;
}

export function validatePackageScript(packageJson) {
  const expectedScript = "node scripts/check-netquity-derived-metrics-contract.mjs";
  return packageJson.scripts?.["check:netquity-derived-metrics"] === expectedScript
    ? []
    : [`package script check:netquity-derived-metrics must be ${JSON.stringify(expectedScript)}`];
}

export function validateStaticImplementation(root = process.cwd()) {
  const worker = readText(root, paths.worker);
  const workerIndex = readText(root, paths.workerIndex);
  const webGuard = readText(root, paths.webGuard);
  const packageJson = readJson(root, paths.package);

  return [
    ...validateDualGateConjunction(worker),
    ...validateAuthorizationBeforeReleasedReads(worker),
    ...validateDerivedCalculationDelegation(worker),
    ...validateNoPublicRoute(workerIndex),
    ...validateWebGuard(webGuard),
    ...validateStagingOnly(worker),
    ...validatePackageScript(packageJson),
  ];
}

function main() {
  const errors = validateStaticImplementation();
  if (errors.length) {
    console.error(JSON.stringify({ errors, status: "invalid_netquity_derived_metrics_contract" }, null, 2));
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        checks: [
          "dual_gate_conjunction",
          "gates_before_released_reads",
          "derived_calculation_delegation",
          "no_public_route",
          "web_guard",
          "staging_only",
          "package_script",
        ],
        status: "ok",
      },
      null,
      2,
    ),
  );
}

function extractSlice(source, startMarker, endMarker, label, errors) {
  const start = source.indexOf(startMarker);
  if (start < 0) {
    errors.push(`could not locate ${label} (start marker missing: ${JSON.stringify(startMarker)})`);
    return undefined;
  }
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) {
    errors.push(`could not locate ${label} (end marker missing: ${JSON.stringify(endMarker)})`);
    return undefined;
  }
  return source.slice(start, end);
}

function countOccurrences(source, needle) {
  let count = 0;
  let index = source.indexOf(needle);
  while (index >= 0) {
    count += 1;
    index = source.indexOf(needle, index + needle.length);
  }
  return count;
}

function requireText(source, expectedText, message, errors) {
  if (!source.includes(expectedText)) errors.push(message);
}

function readJson(root, path) {
  return JSON.parse(readText(root, path));
}

function readText(root, path) {
  return readFileSync(`${root}/${path}`, "utf8");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
