#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/oauth-pkce.contract.json";
const requiredSprintItems = [
  "MCP-02",
  "oauth_pkce",
  "clear_scopes",
  "revocable_scopes",
  "token_passthrough_blocked"
];
const requiredScopes = [
  "security.read",
  "market.read",
  "fundamentals.read",
  "filings.read",
  "analytics.run",
  "portfolio.read",
  "alerts.write",
  "exports.read",
  "admin.usage.read"
];
const requiredAuthorizeFields = [
  "client_id",
  "redirect_uri",
  "code_challenge",
  "code_challenge_method",
  "scopes"
];
const requiredAuthorizeOutputFields = [
  "oauth_flow",
  "pkce",
  "consent",
  "authorization_code",
  "revocation",
  "third_party_token_passthrough"
];
const requiredTokenFields = ["authorization_code", "code_verifier", "scopes"];
const requiredTokenOutputFields = [
  "pkce_verification",
  "scope_binding",
  "token",
  "third_party_token_passthrough"
];
const requiredRevokeFields = ["connection_id_or_token_id"];
const requiredRevokeOutputFields = [
  "revocation_plan",
  "future_calls_denied_after_revoke",
  "scope_grants_removed"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const errors = validateContract(contract);

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
    authorize_route: contract.authorize_route,
    revoke_route: contract.revoke_route,
    status: "ok",
    token_route: contract.token_route
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

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.mcp-oauth-pkce-scaffold.v0") {
    errors.push("version must match MCP OAuth PKCE scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.runtime_route !== "GET /mcp/oauth/runtime") {
    errors.push("runtime_route must be GET /mcp/oauth/runtime");
  }

  if (value.authorize_route !== "POST /mcp/oauth/authorize/plan") {
    errors.push("authorize_route must be POST /mcp/oauth/authorize/plan");
  }

  if (value.token_route !== "POST /mcp/oauth/token/plan") {
    errors.push("token_route must be POST /mcp/oauth/token/plan");
  }

  if (value.revoke_route !== "POST /mcp/oauth/revoke/plan") {
    errors.push("revoke_route must be POST /mcp/oauth/revoke/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_oauth_provider",
    "token_issued",
    "third_party_token_passthrough"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.scopes_revocable !== true) {
    errors.push("scopes_revocable must be true");
  }

  errors.push(...validateStringArray(value.pkce_methods, ["S256"], "pkce_methods"));
  errors.push(
    ...validateStringArray(value.supported_scopes, requiredScopes, "supported_scopes")
  );
  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_3_items,
      requiredSprintItems,
      "covered_sprint_2_3_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.authorize_required_fields,
      requiredAuthorizeFields,
      "authorize_required_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.authorize_output_fields,
      requiredAuthorizeOutputFields,
      "authorize_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.token_required_fields, requiredTokenFields, "token_required_fields")
  );
  errors.push(
    ...validateStringArray(
      value.token_output_fields,
      requiredTokenOutputFields,
      "token_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.revoke_required_fields, requiredRevokeFields, "revoke_required_fields")
  );
  errors.push(
    ...validateStringArray(
      value.revoke_output_fields,
      requiredRevokeOutputFields,
      "revoke_output_fields"
    )
  );
  errors.push(...validateNoSecrets(value));

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

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
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
