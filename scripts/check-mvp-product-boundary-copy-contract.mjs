#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/public-ops/mvp-product-boundary-copy.contract.json";
const packageJsonPath = "package.json";
const requiredAllowedTerms = [
  "research",
  "analysis",
  "data_explanation",
  "研究",
  "分析",
  "数据解释"
];
const requiredProhibitedClaims = [
  "stock_pick",
  "investment_advice",
  "smart_investment_adviser",
  "personalized_buy_sell_hold_recommendation",
  "position_sizing_advice",
  "suitability_conclusion",
  "risk_tolerance_collection_for_suitability",
  "guaranteed_return",
  "copy_trading",
  "order_execution"
];
const requiredCopyEvidence = [
  "research_analysis_data_explanation_positioning",
  "non_advice_disclaimer",
  "no_buy_sell_hold_recommendation",
  "no_risk_tolerance_suitability_collection"
];
const requiredPublishSurfaceFiles = [
  "docs/public/api.md",
  "docs/public/help-center.md",
  "docs/public/mcp.md",
  "docs/public/privacy.md",
  "docs/public/terms.md",
  "apps/web/src/components/Disclaimer.tsx",
  "apps/web/src/components/Footer.tsx",
  "apps/web/src/components/MarketSentimentPanel.tsx",
  "apps/web/src/data/ipos.fixtures.ts",
  "apps/web/src/lib/api/endpoints.ts",
  "apps/web/src/lib/api/ipo-mock.ts",
  "apps/web/src/routes/dashboard.tsx",
  "apps/web/src/routes/index.tsx",
  "apps/web/src/routes/ipos/$ipoId.tsx",
  "apps/web/src/routes/ipos/calendar.tsx",
  "apps/web/src/routes/ipos/compare.tsx",
  "apps/web/src/routes/ipos/index.tsx"
];
const requiredEvidenceFiles = [
  "docs/governance/mvp-product-boundary-copy.md",
  "deploy/public-ops/compliance-ops-release-gate.contract.json",
  "apps/web/src/lib/api/client.test.ts"
];
const requiredBlockers = [
  "type4_written_opinion_missing",
  "external_compliance_signoff_missing",
  "gate0_decision_memo_signature_missing"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];
const forbiddenAdvicePatterns = [
  /荐股|薦股|智能投顾|智能投顧|投顾|投顧|目标仓位|目標倉位|自动再平衡|自動再平衡|止盈|止损|止損|下单|下單|保证收益|保證收益|跟单|跟單/iu,
  /风险承受|風險承受|适合性结论|適合性結論/iu,
  /买入|買入|卖出|賣出|持有/iu,
  /stock[- ]?pick|smart investment adviser|target weights?|position sizing|stop[- ]loss|guaranteed return|copy trading|place orders?/iu,
  /personalized investment advice|investment advice|buy\/sell\/hold|buy recommendation|sell recommendation|hold recommendation|recommendation|risk tolerance|suitability conclusion/iu
];
const negativeContextPattern =
  /not|does not|do not|without|forbidden|blocked|default-deny|non-advice|NOT|original kit|reframed|不构成|不提供|不承诺|不输出|不收集|禁止|非|未|不得|不自动|不\s/iu;

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const errors = validateContract(contract, packageJson);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_contract"
    },
    1
  );
}

emit(
  {
    evidence: contract.required_copy_evidence.length,
    files: contract.publish_surface_files.length,
    review_source: contract.review_source,
    status: "ok"
  },
  0
);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "invalid_json"
      },
      1
    );
  }
}

function validateContract(value, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-27.phase0.mvp-product-boundary-copy.v1") {
    errors.push("version must match MVP product boundary copy version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/public-ops") {
    errors.push("package must be @aiphabee/public-ops");
  }

  if (value.review_source !== "docs/researches/AiphaBee_PRD_v1.0.md#14.2") {
    errors.push("review_source must point to PRD 14.2");
  }

  if (value.governance_doc !== "docs/governance/mvp-product-boundary-copy.md") {
    errors.push("governance_doc must be docs/governance/mvp-product-boundary-copy.md");
  }

  for (const field of ["frontend", "live_type4_written_opinion", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.allowed_positioning_terms,
      requiredAllowedTerms,
      "allowed_positioning_terms"
    )
  );
  errors.push(
    ...validateStringArray(
      value.prohibited_positioning_claims,
      requiredProhibitedClaims,
      "prohibited_positioning_claims"
    )
  );
  errors.push(
    ...validateStringArray(value.required_copy_evidence, requiredCopyEvidence, "required_copy_evidence")
  );
  errors.push(
    ...validateStringArray(
      value.publish_surface_files,
      requiredPublishSurfaceFiles,
      "publish_surface_files"
    )
  );
  errors.push(...validateStringArray(value.evidence_files, requiredEvidenceFiles, "evidence_files"));
  errors.push(...validateBoundaryAssertions(value.boundary_assertions));
  errors.push(...validateScanPolicy(value.scan_policy));
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateLinkedFiles([...value.publish_surface_files, ...value.evidence_files, ...value.linked_contracts]));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateNoSecrets(value));

  if (errors.length === 0) {
    const scanErrors = scanBoundaryCopy(value);
    errors.push(...scanErrors);
  }

  return errors;
}

function validateBoundaryAssertions(value) {
  if (!isRecord(value)) {
    return ["boundary_assertions must be an object"];
  }

  return [
    "uses_research_analysis_data_explanation",
    "no_stock_pick_or_smart_adviser_claims",
    "no_personalized_buy_sell_hold_instructions",
    "no_risk_tolerance_collection_for_suitability",
    "no_position_sizing_rebalancing_stop_loss_or_order_execution"
  ]
    .filter((field) => value[field] !== true)
    .map((field) => `boundary_assertions.${field} must be true`);
}

function validateScanPolicy(value) {
  if (!isRecord(value)) {
    return ["scan_policy must be an object"];
  }

  const errors = [];

  for (const field of ["include_public_docs", "include_user_visible_web_source"]) {
    if (value[field] !== true) {
      errors.push(`scan_policy.${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.exclude_reference_material,
      ["docs/AiphaBee Design System/**"],
      "scan_policy.exclude_reference_material"
    )
  );

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_external_type4_written_opinion") {
    errors.push("release_gate.gate_status must be blocked_external_type4_written_opinion");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["product", "compliance", "legal"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validatePackageScript(packageValue) {
  if (!isRecord(packageValue) || !isRecord(packageValue.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (
    packageValue.scripts["check:mvp-product-boundary-copy"] !==
    "node scripts/check-mvp-product-boundary-copy-contract.mjs"
  ) {
    errors.push("package.json must define check:mvp-product-boundary-copy");
  }

  if (
    typeof packageValue.scripts.check !== "string" ||
    !packageValue.scripts.check.includes("npm run check:mvp-product-boundary-copy")
  ) {
    errors.push("package.json check script must include check:mvp-product-boundary-copy");
  }

  return errors;
}

function scanBoundaryCopy(value) {
  const files = [...value.publish_surface_files, ...value.evidence_files];
  const errors = [];
  const combined = files
    .map((path) => `${path}\n${readFileSync(resolve(process.cwd(), path), "utf8")}`)
    .join("\n\n");

  const requiredEvidencePatterns = {
    research_analysis_data_explanation_positioning:
      /研究|research/iu.test(combined) &&
      /分析|analysis/iu.test(combined) &&
      /数据解释|数据解读|data[- ]?interpretation|evidence-linked explanations/iu.test(combined),
    non_advice_disclaimer:
      /不构成个性化投资建议|does not (?:give|provide).*personalized investment advice/iu.test(combined),
    no_buy_sell_hold_recommendation:
      /不构成.*买入\/卖出\/持有建议|NOT a\s+personalized buy\/sell\/hold recommendation|does not give.*buy\/sell\/hold recommendations/iu.test(combined),
    no_risk_tolerance_suitability_collection:
      /不收集[\s\S]*风险承受[\s\S]*适合性结论|does not collect risk tolerance[\s\S]*suitability conclusions/iu.test(combined)
  };

  for (const [evidence, present] of Object.entries(requiredEvidencePatterns)) {
    if (!present) {
      errors.push(`missing required copy evidence: ${evidence}`);
    }
  }

  for (const path of value.publish_surface_files) {
    const text = readFileSync(resolve(process.cwd(), path), "utf8");
    const lines = text.split(/\r?\n/u);
    lines.forEach((line, index) => {
      const window = [lines[index - 1] ?? "", line, lines[index + 1] ?? ""].join(" ");
      const hasForbiddenAdvice = forbiddenAdvicePatterns.some((pattern) => pattern.test(line));
      if (hasForbiddenAdvice && !negativeContextPattern.test(window)) {
        errors.push(`unqualified advice-like claim in ${path}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  return errors;
}

function validateLinkedFiles(paths) {
  if (!Array.isArray(paths)) {
    return ["linked file list must be an array"];
  }

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${String(path)}`);
}

function validateStringArray(value, expected, path) {
  if (!Array.isArray(value)) {
    return [`${path} must be an array`];
  }

  const actual = value.filter((item) => typeof item === "string");
  const errors = [];

  for (const item of expected) {
    if (!actual.includes(item)) {
      errors.push(`${path} must include ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract must not contain secret-like value matching ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(code);
}
