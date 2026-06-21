#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractSpecs = [
  {
    ambiguityCandidates: true,
    coverageMetadata: undefined,
    fixtureCases: [
      "code_variant",
      "symbol_variant",
      "zh_name",
      "en_name",
      "historical_name",
      "ambiguous",
      "not_found"
    ],
    path: "deploy/tools/resolve-security.contract.json",
    requiredCandidateFields: [
      "instrumentId",
      "listingId",
      "symbol",
      "market",
      "exchange",
      "currency",
      "status",
      "name",
      "validFrom",
      "matchReason"
    ],
    requiredCoverageFields: undefined,
    requiredErrorCodes: ["NOT_FOUND", "SCOPE_DENIED"],
    requiredProfileFields: undefined,
    requiredStatuses: ["resolved", "ambiguous", "not_found"],
    route: "POST /tools/resolve-security",
    supportedInputs: undefined,
    supportedListingStatuses: undefined,
    supportedLookupForms: ["code", "symbol", "name", "historical_name"],
    toolName: "resolve_security"
  },
  {
    ambiguityCandidates: undefined,
    coverageMetadata: true,
    fixtureCases: ["listed_profile", "suspended_profile", "delisted_profile", "not_found"],
    path: "deploy/tools/get-security-profile.contract.json",
    requiredCandidateFields: undefined,
    requiredCoverageFields: [
      "profile",
      "quoteSnapshot",
      "priceHistory",
      "financialFacts",
      "corporateActions",
      "lineage",
      "entitlements"
    ],
    requiredErrorCodes: ["NOT_FOUND", "SCOPE_DENIED"],
    requiredProfileFields: [
      "instrumentId",
      "listingId",
      "symbol",
      "market",
      "exchange",
      "currency",
      "listingStatus",
      "company",
      "industry",
      "coverage",
      "lifecycle"
    ],
    requiredStatuses: ["found", "not_found"],
    route: "POST /tools/get-security-profile",
    supportedInputs: ["instrument_id"],
    supportedListingStatuses: ["listed", "suspended", "delisted"],
    supportedLookupForms: undefined,
    toolName: "get_security_profile"
  }
];

const contracts = [];
const errors = [];

for (const spec of contractSpecs) {
  let contract;

  try {
    contract = JSON.parse(readFileSync(resolve(process.cwd(), spec.path), "utf8"));
  } catch (error) {
    errors.push({
      error: error instanceof Error ? error.message : String(error),
      path: spec.path,
      status: "invalid_json"
    });
    continue;
  }

  const contractErrors = validateContract(contract, spec);

  if (contractErrors.length > 0) {
    errors.push({
      errors: contractErrors,
      path: spec.path,
      status: "invalid_contract"
    });
  }

  contracts.push(contract);
}

if (errors.length > 0) {
  emit(
    {
      errors,
      status: "invalid_contract"
    },
    1
  );
}

emit(
  {
    contracts: contracts.length,
    routes: contracts.map((contract) => contract.route),
    status: "ok",
    tools: contracts.map((contract) => contract.tool_name)
  },
  0
);

function validateContract(value, spec) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until live tool data exists");
  }

  if (value.tool_name !== spec.toolName) {
    errors.push(`tool_name must be ${spec.toolName}`);
  }

  if (value.route !== spec.route) {
    errors.push(`route must be ${spec.route}`);
  }

  if (value.handler_ready !== true) {
    errors.push("handler_ready must be true for this scaffold");
  }

  if (value.live_data_access !== false) {
    errors.push("live_data_access must be false in this scaffold");
  }

  if (value.allow_arbitrary_sql !== false) {
    errors.push("allow_arbitrary_sql must be false");
  }

  if (value.allow_arbitrary_url !== false) {
    errors.push("allow_arbitrary_url must be false");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (spec.ambiguityCandidates !== undefined && value.ambiguity_candidates !== true) {
    errors.push("ambiguity_candidates must be true");
  }

  if (spec.coverageMetadata !== undefined && value.coverage_metadata !== true) {
    errors.push("coverage_metadata must be true");
  }

  if (spec.supportedLookupForms !== undefined) {
    errors.push(
      ...validateStringArray(
        value.supported_lookup_forms,
        spec.supportedLookupForms,
        "supported_lookup_forms"
      )
    );
  }

  if (spec.supportedInputs !== undefined) {
    errors.push(
      ...validateStringArray(value.supported_inputs, spec.supportedInputs, "supported_inputs")
    );
  }

  if (spec.supportedListingStatuses !== undefined) {
    errors.push(
      ...validateStringArray(
        value.supported_listing_statuses,
        spec.supportedListingStatuses,
        "supported_listing_statuses"
      )
    );
  }

  errors.push(
    ...validateStringArray(value.required_statuses, spec.requiredStatuses, "required_statuses")
  );

  if (spec.requiredCandidateFields !== undefined) {
    errors.push(
      ...validateStringArray(
        value.required_candidate_fields,
        spec.requiredCandidateFields,
        "required_candidate_fields"
      )
    );
  }

  if (spec.requiredProfileFields !== undefined) {
    errors.push(
      ...validateStringArray(
        value.required_profile_fields,
        spec.requiredProfileFields,
        "required_profile_fields"
      )
    );
  }

  if (spec.requiredCoverageFields !== undefined) {
    errors.push(
      ...validateStringArray(
        value.required_coverage_fields,
        spec.requiredCoverageFields,
        "required_coverage_fields"
      )
    );
  }

  errors.push(
    ...validateStringArray(
      value.required_error_codes,
      spec.requiredErrorCodes,
      "required_error_codes"
    )
  );
  errors.push(...validateStringArray(value.fixture_cases, spec.fixtureCases, "fixture_cases"));
  errors.push(...validateNoSecretLikeValues(value));

  return errors;
}

function validateStringArray(value, requiredValues, name) {
  const errors = [];

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${name} must include ${requiredValue}`);
    }
  }

  return errors;
}

function validateNoSecretLikeValues(value) {
  const serialized = JSON.stringify(value);
  const patterns = [
    /sk-[A-Za-z0-9_-]+/u,
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]+/u,
    /gh[pousr]_[A-Za-z0-9_]+/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ];

  return patterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
