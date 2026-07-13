#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const selfTest = process.argv.includes("--self-test");
const contractPath = process.argv.includes("--contract")
  ? process.argv[process.argv.indexOf("--contract") + 1]
  : "packages/data-contracts/src/error-taxonomy-reconciliation.contract.json";
const deployPath = "deploy/mcp/error-codes.contract.json";
const errors = [];

const sources = {
  data_contracts_public: extractStringArray("packages/data-contracts/src/index.ts", "ERROR_CODES"),
  mcp_public: extractStringArray("packages/mcp-runtime/src/index.ts", "MCP_STANDARD_ERROR_CODES"),
  mcp_private: extractStringUnion("packages/mcp-runtime/src/index.ts", "McpRuntimeInputErrorCode"),
  agent_runtime_input: extractStringUnion("packages/agent-runtime/src/index.ts", "AgentRuntimeInputErrorCode"),
  agent_recovery_retryable: extractStringUnion(
    "packages/agent-runtime/src/index.ts",
    "AgentFailureRecoveryRetryableErrorClass"
  ),
  agent_recovery_non_retryable: extractStringUnion(
    "packages/agent-runtime/src/index.ts",
    "AgentFailureRecoveryNonRetryableErrorClass"
  ),
  fastclaw_runner_private: extractStringUnion(
    "packages/agent-runtime/src/fastclaw-agent-runner.ts",
    "FastClawAgentRunnerFailureCode"
  ),
  tool_registry_declared: extractToolRegistryErrors("packages/tool-registry/src/index.ts")
};
const sourceMetadata = {
  data_contracts_public: {
    canonical_owner: "@aiphabee/data-contracts",
    path: "packages/data-contracts/src/index.ts",
    selector: "ERROR_CODES",
    source_contract_version: "data-contracts.ERROR_CODES.current",
    authority_kind: "closed_const_array"
  },
  mcp_public: {
    canonical_owner: "@aiphabee/mcp-runtime",
    path: "packages/mcp-runtime/src/index.ts",
    selector: "MCP_STANDARD_ERROR_CODES",
    source_contract_version: "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
    authority_kind: "closed_const_array"
  },
  mcp_private: {
    canonical_owner: "@aiphabee/mcp-runtime",
    path: "packages/mcp-runtime/src/index.ts",
    selector: "McpRuntimeInputErrorCode",
    source_contract_version: "mcp-runtime.McpRuntimeInputErrorCode.current",
    authority_kind: "closed_type_union"
  },
  agent_runtime_input: {
    canonical_owner: "@aiphabee/agent-runtime",
    path: "packages/agent-runtime/src/index.ts",
    selector: "AgentRuntimeInputErrorCode",
    source_contract_version: "agent-runtime.AgentRuntimeInputErrorCode.current",
    authority_kind: "closed_type_union"
  },
  agent_recovery_retryable: {
    canonical_owner: "@aiphabee/agent-runtime",
    path: "packages/agent-runtime/src/index.ts",
    selector: "AgentFailureRecoveryRetryableErrorClass",
    source_contract_version: "agent-runtime.failure-recovery.current",
    authority_kind: "closed_type_union"
  },
  agent_recovery_non_retryable: {
    canonical_owner: "@aiphabee/agent-runtime",
    path: "packages/agent-runtime/src/index.ts",
    selector: "AgentFailureRecoveryNonRetryableErrorClass",
    source_contract_version: "agent-runtime.failure-recovery.current",
    authority_kind: "closed_type_union"
  },
  fastclaw_runner_private: {
    canonical_owner: "@aiphabee/agent-runtime",
    path: "packages/agent-runtime/src/fastclaw-agent-runner.ts",
    selector: "FastClawAgentRunnerFailureCode",
    source_contract_version: "fastclaw-agent-runner.current",
    authority_kind: "closed_type_union"
  },
  tool_registry_declared: {
    canonical_owner: "@aiphabee/tool-registry",
    path: "packages/tool-registry/src/index.ts",
    selector: "REGISTERED_TOOLS[*].schema.standardErrorCodes",
    source_contract_version: "tool-registry.current",
    authority_kind: "per_tool_declaration"
  }
};
const mcpSourceMappings = extractStringMap(
  "packages/mcp-runtime/src/index.ts",
  "MCP_RUNTIME_INPUT_ERROR_TO_STANDARD_ERROR"
);
const mcpDefinitions = extractMcpDefinitions("packages/mcp-runtime/src/index.ts");
const contract = readJson(contractPath);
const deployed = readJson(deployPath);

if (selfTest) runMutationSelfTests(contract, deployed);

validateTopLevel(contract);
validateSourceSets(contract);
validateEntries(contract);
validateMcpParity(contract, deployed);

if (errors.length > 0) {
  process.stderr.write(`${JSON.stringify({ errors: errors.sort(), status: "invalid_contract" }, null, 2)}\n`);
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify(
    {
      contract_version: contract.contract_version,
      entries: contract.entries.length,
      mcp_private_mappings: Object.keys(mcpSourceMappings).length,
      source_sets: Object.keys(sources).length,
      status: "ok"
    },
    null,
    2
  )}\n`
);

function validateTopLevel(value) {
  if (!isRecord(value)) return push("contract must be an object");
  if (value.schema_version !== 1) push("schema_version must be 1");
  if (value.contract_version !== "2026-07-13.error-taxonomy-reconciliation.v1") {
    push("contract_version must match Row 1 v1");
  }
  if (value.status !== "local_contract") push("status must be local_contract");
  if (value.authority?.matrix_owner !== "@aiphabee/data-contracts") {
    push("authority.matrix_owner must be @aiphabee/data-contracts");
  }
  if (value.authority?.scope !== "cross_owner_reconciliation_only") {
    push("authority.scope must be cross_owner_reconciliation_only");
  }
  if (value.authority?.owner_types_remain_authoritative !== true) {
    push("authority.owner_types_remain_authoritative must be true");
  }
  if (value.authority?.global_runtime_enum !== false) {
    push("authority.global_runtime_enum must be false");
  }
  const unknown = value.unknown_policy;
  if (
    unknown?.public_code !== "INTERNAL_ERROR" ||
    unknown?.public_message_policy !== "route_owned_generic_constant" ||
    unknown?.public_retryable !== false ||
    unknown?.mapping_method !== "explicit_exact_lookup_only" ||
    unknown?.retain_internal_audit_identity !== true ||
    unknown?.emit_raw_internal_code_publicly !== false ||
    unknown?.semantic_fallback !== false
  ) {
    push("unknown_policy must fail closed to generic non-retryable INTERNAL_ERROR");
  }
  if (Array.isArray(value.compatibility_aliases) && value.compatibility_aliases.length > 0) {
    push("compatibility_aliases must be empty");
  }
  const pack = value.non_authoritative_inputs?.find(
    (item) => item?.input === "planning_pack_seventeen_error_list"
  );
  if (pack?.disposition !== "rejected") push("planning pack error list must be rejected");
}

function validateSourceSets(value) {
  if (!Array.isArray(value.source_sets)) return push("source_sets must be an array");
  const actualIds = value.source_sets.map((item) => item?.source_set_id);
  compareSet("source_sets", Object.keys(sources), actualIds);
  for (const source of value.source_sets) {
    if (!isRecord(source)) continue;
    const expected = sources[source.source_set_id];
    const metadata = sourceMetadata[source.source_set_id];
    if (expected === undefined || metadata === undefined) continue;
    for (const [field, expectedValue] of Object.entries(metadata)) {
      if (source[field] !== expectedValue) push(`${source.source_set_id}: ${field} mismatch`);
    }
    if (source.extraction !== "typescript_ast_exact_selector") {
      push(`${source.source_set_id}: extraction must be typescript_ast_exact_selector`);
    }
    if (source.open_string_codes_allowed !== false) {
      push(`${source.source_set_id}: open_string_codes_allowed must be false`);
    }
    compareSet(`${source.source_set_id}.codes`, expected, source.codes);
  }
  const excluded = new Map(
    (value.excluded_source_sets ?? []).map((item) => [item?.source_set_id, item])
  );
  for (const required of [
    "agent_sandbox_backend",
    "agent_sandbox_kill_reason",
    "fastclaw_lifecycle",
    "fastclaw_sandbox_smoke",
    "durable_handoff",
    "chart_image_upload",
    "parse_chart_image_open_error_string"
  ]) {
    if (excluded.get(required)?.disposition !== "explicitly_out_of_scope") {
      push(`${required}: missing explicit out-of-scope owner record`);
    }
  }
}

function validateEntries(value) {
  if (!Array.isArray(value.entries)) return push("entries must be an array");
  const expectedMembership = new Map();
  for (const [sourceId, codes] of Object.entries(sources)) {
    for (const code of codes) {
      const list = expectedMembership.get(code) ?? [];
      list.push(sourceId);
      expectedMembership.set(code, list);
    }
  }
  compareSet("entries.codes", [...expectedMembership.keys()], value.entries.map((entry) => entry?.code));
  const seen = new Set();
  for (const entry of value.entries) {
    if (!isRecord(entry) || typeof entry.code !== "string") continue;
    if (seen.has(entry.code)) push(`${entry.code}: multiple matrix entries`);
    seen.add(entry.code);
    compareSet(`${entry.code}.source_set_ids`, expectedMembership.get(entry.code) ?? [], entry.source_set_ids);
    for (const field of [
      "canonical_owner",
      "semantic_category",
      "exposure",
      "source_contract_version",
      "matrix_contract_version"
    ]) {
      if (typeof entry[field] !== "string" || entry[field].length === 0) push(`${entry.code}: missing ${field}`);
    }
    if (entry.matrix_contract_version !== value.contract_version) {
      push(`${entry.code}: matrix_contract_version mismatch`);
    }
    const allowedOwners = new Set([
      "@aiphabee/data-contracts",
      "@aiphabee/mcp-runtime",
      "@aiphabee/agent-runtime",
      "@aiphabee/tool-registry"
    ]);
    if (!allowedOwners.has(entry.canonical_owner)) push(`${entry.code}: invalid canonical_owner`);
    if (!allowedOwners.has(entry.producer_owner)) push(`${entry.code}: invalid producer_owner`);
    if (![
      "authentication",
      "authorization",
      "data",
      "limit",
      "policy",
      "system",
      "validation"
    ].includes(entry.semantic_category)) push(`${entry.code}: invalid semantic_category`);
    if (!["shared_public", "mapped_public", "internal_only"].includes(entry.exposure)) {
      push(`${entry.code}: invalid exposure`);
    }
    if (!isRecord(entry.channel_mapping)) push(`${entry.code}: missing channel_mapping`);
    validateRetryPolicies(entry);
    if (!isRecord(entry.redaction) || entry.redaction.emit_raw_internal_code_publicly !== false) {
      push(`${entry.code}: unknown_redaction_violation`);
    } else {
      const expectedMessagePolicy = entry.exposure === "internal_only"
        ? "not_public"
        : "owner_defined_public_constant";
      if (entry.redaction.public_message_policy !== expectedMessagePolicy) {
        push(`${entry.code}: public_message_policy mismatch`);
      }
      const expectedAllowlist = entry.channel_mapping?.mcp === null
        ? []
        : [
            "category",
            "client_action",
            "mcp_error_version",
            "recoverable",
            "request_id",
            "retry_after_required",
            "source_record_id"
          ];
      compareSet(`${entry.code}.redaction.public_detail_allowlist`, expectedAllowlist, entry.redaction.public_detail_allowlist);
      compareSet(`${entry.code}.redaction.internal_audit_fields`, [
        "request_id",
        "source_set_id",
        "raw_internal_code",
        "owner_contract_version"
      ], entry.redaction.internal_audit_fields);
      compareSet(`${entry.code}.redaction.forbidden_public_fields`, [
        "raw_exception_message",
        "provider_identity",
        "credential_material",
        "sandbox_detail",
        "runner_detail"
      ], entry.redaction.forbidden_public_fields);
    }
    if (entry.exposure === "internal_only") {
      if (entry.channel_mapping?.mcp !== null || entry.channel_mapping?.web !== null) {
        push(`${entry.code}: private_channel_leak`);
      }
    }
  }
}

function validateMcpParity(value, deployedContract) {
  compareSet("mcp source mapping keys", sources.mcp_private, Object.keys(mcpSourceMappings));
  compareSet("deployed MCP mapping keys", sources.mcp_private, Object.keys(deployedContract.internal_error_mappings ?? {}));
  compareSet("deployed MCP public codes", sources.mcp_public, deployedContract.standard_error_codes);
  for (const [code, publicCode] of Object.entries(mcpSourceMappings)) {
    if (deployedContract.internal_error_mappings?.[code] !== publicCode) {
      push(`MCP mapping mismatch: ${code} expected ${publicCode}`);
    }
    const entry = value.entries.find((candidate) => candidate.code === code);
    if (entry?.channel_mapping?.mcp !== publicCode) {
      push(`${code}: matrix MCP mapping must be ${publicCode}`);
    }
  }
  const privateLeaks = value.entries.filter(
    (entry) => entry?.exposure === "internal_only" && sources.mcp_public.includes(entry.code)
  );
  if (privateLeaks.length > 0) push("internal-only entries must not enter MCP public subset");
}

function validateRetryPolicies(entry) {
  if (!isRecord(entry.retry) || !Array.isArray(entry.retry.policies) || entry.retry.policies.length === 0) {
    return push(`${entry.code}: retry authority missing`);
  }
  const bySemantics = new Map();
  for (const policy of entry.retry.policies) {
    const key = `${policy?.authority}:${policy?.semantics}`;
    if (bySemantics.has(key)) push(`${entry.code}: duplicate retry policy ${key}`);
    bySemantics.set(key, policy);
    const allowedKey =
      key === "@aiphabee/agent-runtime:retryable" ||
      key === "@aiphabee/mcp-runtime:recoverable" ||
      key === "@aiphabee/mcp-runtime:mapped_public_recoverable" ||
      (key === `${entry.canonical_owner}:retryable` && policy?.field === null && policy?.value === false);
    if (!allowedKey) push(`${entry.code}: invalid retry authority/semantics combination`);
    if (!["retryable", "recoverable", "mapped_public_recoverable"].includes(policy?.semantics)) {
      push(`${entry.code}: invalid retry semantics`);
    }
    if (policy?.value !== true && policy?.value !== false && policy?.value !== null) {
      push(`${entry.code}: invalid retry value`);
    }
  }
  const agentExpected = sources.agent_recovery_retryable.includes(entry.code)
    ? true
    : sources.agent_recovery_non_retryable.includes(entry.code)
      ? false
      : undefined;
  if (agentExpected !== undefined) {
    const policy = bySemantics.get("@aiphabee/agent-runtime:retryable");
    if (policy?.value !== agentExpected) push(`${entry.code}: Agent retryability mismatch`);
    const expectedField = agentExpected
      ? "AgentFailureRecoveryRetryableErrorClass"
      : "AgentFailureRecoveryNonRetryableErrorClass";
    if (policy?.field !== expectedField) push(`${entry.code}: Agent retry field mismatch`);
  }
  if (sources.mcp_public.includes(entry.code)) {
    const policy = bySemantics.get("@aiphabee/mcp-runtime:recoverable");
    if (policy?.value !== mcpDefinitions[entry.code]?.recoverable) {
      push(`${entry.code}: MCP recoverability mismatch`);
    }
    if (policy?.field !== "MCP_STANDARD_ERROR_DEFINITIONS.recoverable") {
      push(`${entry.code}: MCP recoverability field mismatch`);
    }
  }
  if (sources.mcp_private.includes(entry.code)) {
    const policy = bySemantics.get("@aiphabee/mcp-runtime:mapped_public_recoverable");
    const publicCode = mcpSourceMappings[entry.code];
    if (policy?.value !== mcpDefinitions[publicCode]?.recoverable) {
      push(`${entry.code}: mapped MCP recoverability mismatch`);
    }
    if (policy?.field !== `MCP_STANDARD_ERROR_DEFINITIONS.${publicCode}.recoverable`) {
      push(`${entry.code}: mapped MCP recoverability field mismatch`);
    }
  }
  if (sources.fastclaw_runner_private.includes(entry.code)) {
    const policy = bySemantics.get("@aiphabee/agent-runtime:retryable");
    if (policy?.value !== null || policy?.field !== "FastClawRunnerFailure.retryable") {
      push(`${entry.code}: FastClaw retryability must remain runtime-instance owned`);
    }
  }
}

function runMutationSelfTests(canonical, canonicalDeployed) {
  const cases = [
    {
      name: "source_metadata",
      mutate(value) { value.source_sets[0].canonical_owner = "@invalid/owner"; },
      expected: "canonical_owner mismatch"
    },
    {
      name: "retry_authority",
      mutate(value) { value.entries[0].retry.policies[0].authority = "@invalid/owner"; },
      expected: "invalid retry authority/semantics combination"
    },
    {
      name: "public_allowlist",
      mutate(value) {
        const entry = value.entries.find((item) => item.channel_mapping.mcp !== null);
        entry.redaction.public_detail_allowlist.push("credential_material");
      },
      expected: "redaction.public_detail_allowlist: extra"
    },
    {
      name: "canonical_owner",
      mutate(value) { value.entries[0].canonical_owner = "@invalid/owner"; },
      expected: "invalid canonical_owner"
    },
    {
      name: "exposure",
      mutate(value) { value.entries[0].exposure = "public_everywhere"; },
      expected: "invalid exposure"
    },
    {
      name: "agent_retry",
      mutate(value) {
        const entry = value.entries.find((item) => item.code === "DATA_NOT_LICENSED");
        entry.retry.policies.find((policy) => policy.semantics === "retryable").value = true;
      },
      expected: "Agent retryability mismatch"
    },
    {
      name: "mcp_recoverability",
      mutate(value) {
        const entry = value.entries.find((item) => item.code === "AUTH_REQUIRED");
        entry.retry.policies.find((policy) => policy.semantics === "recoverable").value = false;
      },
      expected: "MCP recoverability mismatch"
    },
    {
      name: "redaction",
      mutate(value) { value.entries[0].redaction.forbidden_public_fields = []; },
      expected: "redaction.forbidden_public_fields: missing"
    },
    {
      name: "unknown",
      mutate(value) { value.unknown_policy.mapping_method = "name_heuristic"; },
      expected: "unknown_policy must fail closed"
    },
    {
      name: "mcp_mapping",
      mutate(_value, deployedValue) { deployedValue.internal_error_mappings.API_KEY_ID_REQUIRED = "SCOPE_DENIED"; },
      expected: "MCP mapping mismatch"
    }
  ];
  for (const testCase of cases) {
    const value = JSON.parse(JSON.stringify(canonical));
    const deployedValue = JSON.parse(JSON.stringify(canonicalDeployed));
    testCase.mutate(value, deployedValue);
    errors.splice(0);
    validateTopLevel(value);
    validateSourceSets(value);
    validateEntries(value);
    validateMcpParity(value, deployedValue);
    if (!errors.some((message) => message.includes(testCase.expected))) {
      process.stderr.write(`Mutation self-test failed: ${testCase.name} did not produce ${testCase.expected}\n`);
      process.exit(1);
    }
  }
  errors.splice(0);
}

function sourceFile(path) {
  const text = readFileSync(resolve(root, path), "utf8");
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
}

function extractStringArray(path, name) {
  const file = sourceFile(path);
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(file) !== name) continue;
      const initializer = unwrapExpression(declaration.initializer);
      if (!initializer || !ts.isArrayLiteralExpression(initializer)) failSelector(path, name);
      return initializer.elements.map((element) => {
        if (!ts.isStringLiteral(element)) failSelector(path, name);
        return element.text;
      });
    }
  }
  return failSelector(path, name);
}

function extractStringUnion(path, name) {
  const file = sourceFile(path);
  for (const statement of file.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || statement.name.text !== name) continue;
    if (!ts.isUnionTypeNode(statement.type)) failSelector(path, name);
    return statement.type.types.map((type) => {
      if (!ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) failSelector(path, name);
      return type.literal.text;
    });
  }
  return failSelector(path, name);
}

function extractStringMap(path, name) {
  const file = sourceFile(path);
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(file) !== name) continue;
      const initializer = unwrapExpression(declaration.initializer);
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) failSelector(path, name);
      return Object.fromEntries(initializer.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)) failSelector(path, name);
        const key = property.name.getText(file).replaceAll('"', "");
        if (!ts.isStringLiteral(property.initializer)) failSelector(path, name);
        return [key, property.initializer.text];
      }));
    }
  }
  return failSelector(path, name);
}

function extractMcpDefinitions(path) {
  const file = sourceFile(path);
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(file) !== "MCP_STANDARD_ERROR_DEFINITIONS") continue;
      const initializer = unwrapExpression(declaration.initializer);
      if (!initializer || !ts.isArrayLiteralExpression(initializer)) failSelector(path, "MCP_STANDARD_ERROR_DEFINITIONS");
      return Object.fromEntries(initializer.elements.map((element) => {
        if (!ts.isObjectLiteralExpression(element)) failSelector(path, "MCP_STANDARD_ERROR_DEFINITIONS");
        const fields = Object.fromEntries(element.properties.map((property) => {
          if (!ts.isPropertyAssignment(property)) failSelector(path, "MCP_STANDARD_ERROR_DEFINITIONS");
          const key = property.name.getText(file).replaceAll('"', "");
          const value = property.initializer.kind === ts.SyntaxKind.TrueKeyword
            ? true
            : property.initializer.kind === ts.SyntaxKind.FalseKeyword
              ? false
              : ts.isStringLiteral(property.initializer)
                ? property.initializer.text
                : undefined;
          return [key, value];
        }));
        return [fields.code, fields];
      }));
    }
  }
  return failSelector(path, "MCP_STANDARD_ERROR_DEFINITIONS");
}

function extractToolRegistryErrors(path) {
  const file = sourceFile(path);
  const codes = new Set();
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(file) === "createSchema" &&
      node.arguments.length >= 2 &&
      ts.isArrayLiteralExpression(node.arguments[1])
    ) {
      for (const element of node.arguments[1].elements) {
        if (!ts.isStringLiteral(element)) failSelector(path, "createSchema error array");
        codes.add(element.text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (codes.size === 0) failSelector(path, "createSchema error arrays");
  return [...codes].sort();
}

function unwrapExpression(node) {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))) {
    node = node.expression;
  }
  return node;
}

function compareSet(label, expected, actual) {
  if (!Array.isArray(actual)) return push(`${label}: expected an array`);
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = [...expectedSet].filter((item) => !actualSet.has(item)).sort();
  const extra = [...actualSet].filter((item) => !expectedSet.has(item)).sort();
  if (actual.length !== actualSet.size) push(`${label}: duplicate values`);
  if (missing.length > 0) push(`${label}: missing [${missing.join(", ")}]`);
  if (extra.length > 0) push(`${label}: extra [${extra.join(", ")}]`);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), "utf8"));
  } catch (error) {
    process.stderr.write(`${path}: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

function failSelector(path, selector) {
  process.stderr.write(`Unable to extract exact selector ${selector} from ${path}\n`);
  process.exit(1);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function push(message) {
  errors.push(message);
}
