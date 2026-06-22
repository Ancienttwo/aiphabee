#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/gate0-external-evidence-intake.contract.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const decisionPackPath = "docs/governance/gate0-rights-regulatory-decision-pack.md";
const prdPath = "docs/researches/AiphaBee_PRD_v1.0.md";
const packageJsonPath = "package.json";
const requiredVersion = "2026-06-22.gate0-external-evidence-intake.v0";
const requiredDimensions = [
  "data_owner_source",
  "web_display",
  "mcp_api_redistribution",
  "raw_vs_derived",
  "realtime_delayed_eod",
  "history_range",
  "export_cache",
  "user_type_geography",
  "device_subscriber_reporting",
  "audit_termination",
  "commercial_terms"
];
const requiredEvidencePackets = [
  "field_rights_matrix",
  "hkex_vendor_licensing_memo",
  "type4_product_boundary_opinion",
  "pcpd_privacy_path_assessment",
  "commercial_settlement_schedule",
  "gate0_signature_register"
];
const requiredSignatureRoles = [
  "CEO",
  "Business / Partnerships",
  "Data Owner",
  "Compliance / Counsel",
  "Privacy Owner",
  "Engineering"
];
const requiredLinkedContracts = [
  "deploy/governance/p0-field-distribution-status.contract.json",
  "deploy/public-ops/mvp-product-boundary-copy.contract.json",
  "deploy/gateway/p0-rights-matrix-coverage.contract.json",
  "deploy/gateway/field-authorization-config.contract.json"
];
const requiredForbiddenClaims = [
  "external_approval_complete_without_evidence",
  "web_rights_imply_mcp_rights",
  "unconfirmed_field_allowed",
  "legal_advice_from_repo_contract",
  "secret_or_credential_material"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const tracker = readText(trackerPath);
const decisionPack = readText(decisionPackPath);
const prd = readText(prdPath);
const packageJson = readJson(packageJsonPath);
const errors = validateContract({ contract, decisionPack, packageJson, prd, tracker });

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
    evidence_packets: contract.required_evidence_packets.length,
    prd_dimensions: contract.required_prd_14_1_dimensions.length,
    signature_roles: contract.signature_roles.length,
    status: "ok"
  },
  0
);

function validateContract({ contract: value, decisionPack, packageJson, prd, tracker }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== requiredVersion) {
    errors.push(`version must be ${requiredVersion}`);
  }

  if (value.status !== "external_evidence_intake_ready") {
    errors.push("status must be external_evidence_intake_ready");
  }

  if (value.review_source !== "docs/researches/AiphaBee_PRD_v1.0.md#14.1-14.2") {
    errors.push("review_source must point to PRD 14.1-14.2");
  }

  if (value.decision_pack !== decisionPackPath) {
    errors.push(`decision_pack must be ${decisionPackPath}`);
  }

  if (value.intake_doc !== "docs/governance/gate0-external-evidence-intake.md") {
    errors.push("intake_doc must be docs/governance/gate0-external-evidence-intake.md");
  }

  for (const field of [
    "external_approvals_complete",
    "partner_signed_matrix_loaded",
    "legal_opinion_received",
    "pcpd_path_approved",
    "commercial_terms_signed",
    "gate0_signature_complete"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false until signed external evidence is present`);
    }
  }

  if (value.runtime_default !== "DEFAULT_DENY") {
    errors.push("runtime_default must be DEFAULT_DENY");
  }

  if (value.unconfirmed_runtime_error !== "DATA_NOT_LICENSED") {
    errors.push("unconfirmed_runtime_error must be DATA_NOT_LICENSED");
  }

  errors.push(
    ...validateExactStringArray(
      value.required_prd_14_1_dimensions,
      requiredDimensions,
      "required_prd_14_1_dimensions"
    )
  );
  errors.push(...validateEvidencePackets(value.required_evidence_packets));
  errors.push(
    ...validateExactStringArray(
      value.signature_roles,
      requiredSignatureRoles,
      "signature_roles"
    )
  );
  errors.push(
    ...validateExactStringArray(
      value.linked_contracts,
      requiredLinkedContracts,
      "linked_contracts"
    )
  );
  errors.push(
    ...validateStringArrayContains(
      value.forbidden_claims,
      requiredForbiddenClaims,
      "forbidden_claims"
    )
  );
  errors.push(...validateFallbacks(value.fallbacks));
  errors.push(...validateLinkedFiles([...value.linked_contracts, value.decision_pack, value.intake_doc]));
  errors.push(...validateSourceText({ decisionPack, prd, tracker }));
  errors.push(...validatePackageScript(packageJson));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateEvidencePackets(value) {
  if (!Array.isArray(value)) {
    return ["required_evidence_packets must be an array"];
  }

  const errors = [];
  const seen = new Set();

  for (const [index, packet] of value.entries()) {
    if (!isRecord(packet)) {
      errors.push(`required_evidence_packets[${index}] must be an object`);
      continue;
    }

    if (!requiredEvidencePackets.includes(packet.id)) {
      errors.push(`required_evidence_packets[${index}].id is not expected`);
    }

    if (seen.has(packet.id)) {
      errors.push(`required_evidence_packets duplicate id ${packet.id}`);
    }
    seen.add(packet.id);

    if (packet.status !== "pending_external") {
      errors.push(`${packet.id}.status must be pending_external`);
    }

    for (const field of ["owner", "required_scope"]) {
      if (typeof packet[field] !== "string" || packet[field].trim().length === 0) {
        errors.push(`${packet.id}.${field} must be a non-empty string`);
      }
    }

    if (!Array.isArray(packet.must_include) || packet.must_include.length === 0) {
      errors.push(`${packet.id}.must_include must be a non-empty array`);
    }
  }

  for (const packetId of requiredEvidencePackets) {
    if (!seen.has(packetId)) {
      errors.push(`required_evidence_packets missing ${packetId}`);
    }
  }

  return errors;
}

function validateFallbacks(value) {
  if (!isRecord(value)) {
    return ["fallbacks must be an object"];
  }

  const required = {
    mcp_redistribution_not_allowed: "pause_remote_mcp_or_return_default_deny_tools_list_empty",
    rights_matrix_incomplete: "keep_all_unconfirmed_fields_default_deny",
    type4_opinion_requires_license: "disable_personalized_or_recommendation_like_features_until_licensed_route"
  };
  const errors = [];

  for (const [key, expected] of Object.entries(required)) {
    if (value[key] !== expected) {
      errors.push(`fallbacks.${key} must be ${expected}`);
    }
  }

  return errors;
}

function validateSourceText({ decisionPack, prd, tracker }) {
  const errors = [];
  const requiredPrdText = [
    "数据所有者/来源",
    "MCP/API 再分发",
    "设备与订阅者",
    "默认拒绝原则",
    "Type 4"
  ];
  const requiredDecisionPackText = [
    "Gate 0 is not green until",
    "Field-level data rights",
    "MCP/API machine-readable redistribution",
    "HKEX / Vendor Licensing Questions",
    "Signature Register"
  ];
  const requiredTrackerText = [
    "Sprint 0.1",
    "字段级权利矩阵",
    "HKEX 市场数据授权确认",
    "Type 4",
    "PCPD"
  ];

  errors.push(...validateTextIncludes(prd, requiredPrdText, prdPath));
  errors.push(...validateTextIncludes(decisionPack, requiredDecisionPackText, decisionPackPath));
  errors.push(...validateTextIncludes(tracker, requiredTrackerText, trackerPath));

  return errors;
}

function validatePackageScript(packageJson) {
  const script = packageJson?.scripts?.["check:gate0-external-evidence-intake"];

  if (script !== "node scripts/check-gate0-external-evidence-intake-contract.mjs") {
    return ["package.json must expose check:gate0-external-evidence-intake"];
  }

  if (!String(packageJson?.scripts?.check ?? "").includes("npm run check:gate0-external-evidence-intake")) {
    return ["package.json check script must include check:gate0-external-evidence-intake"];
  }

  return [];
}

function validateLinkedFiles(paths) {
  return paths
    .filter((path) => typeof path !== "string" || path.trim().length === 0 || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${path}`);
}

function validateTextIncludes(text, required, label) {
  return required.filter((item) => !text.includes(item)).map((item) => `${label} missing ${item}`);
}

function validateStringArrayContains(value, required, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  return required.filter((item) => !value.includes(item)).map((item) => `${label} missing ${item}`);
}

function validateExactStringArray(value, expected, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const errors = [];

  if (value.length !== expected.length) {
    errors.push(`${label} must contain ${expected.length} items`);
  }

  for (const item of expected) {
    if (!value.includes(item)) {
      errors.push(`${label} missing ${item}`);
    }
  }

  for (const item of value) {
    if (!expected.includes(item)) {
      errors.push(`${label} has unexpected item ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern}`);
}

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

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
      },
      1
    );
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
