#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const contractPath = "deploy/governance/sprint1-tool-route-replay-readiness.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-22.phase1.tool-route-replay-readiness.v3";
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_market_calendar",
  "get_quote_snapshot",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_financial_ratios",
  "search_announcements",
  "get_announcement",
  "screen_securities",
  "compare_securities",
  "calculate_returns_risk",
  "get_event_timeline",
  "get_data_lineage",
  "get_entitlements"
];
const requiredLinkedContracts = {
  agent_tool_enforcement: "deploy/agent/tool-enforcement.contract.json",
  evidence_live_db_write_smoke: "deploy/evidence/live-db-write-smoke.contract.json",
  evidence_lineage_service: "deploy/evidence/service.contract.json",
  evidence_lineage_tools: "deploy/tools/evidence-lineage.contract.json",
  golden_tool_manifest: "tests/golden/tools/manifest.json",
  mcp_pagination_limits: "deploy/mcp/pagination-limits.contract.json",
  mcp_protocol_release_gate: "deploy/mcp/protocol-release-gate.contract.json",
  mcp_protocol_tool_execution_smoke: "deploy/mcp/protocol-tool-execution-smoke.contract.json",
  mcp_runtime_schema_snapshot: "deploy/mcp/runtime-schema-snapshot.contract.json",
  mcp_schema_validation: "deploy/mcp/tool-schema-validation.contract.json",
  mcp_usage_envelope: "deploy/mcp/usage-envelope.contract.json",
  mcp_versioning: "deploy/mcp/tool-versioning.contract.json",
  p0_tool_catalog: "deploy/tools/p0-tool-catalog.contract.json",
  tool_route_replay: "deploy/governance/sprint1-tool-route-replay.contract.json",
  tool_registry: "deploy/tools/registry.contract.json",
  tool_schemas: "deploy/tools/tool-schemas.contract.json"
};
const requiredSurfaceIds = [
  "p0_catalog",
  "tool_registry",
  "tool_schemas",
  "mcp_schema_validation",
  "mcp_runtime_schema_snapshot",
  "mcp_versioning",
  "mcp_usage_envelope",
  "mcp_pagination_limits",
  "mcp_protocol_release_gate",
  "mcp_protocol_tool_execution_smoke",
  "agent_tool_enforcement",
  "evidence_lineage_tools",
  "evidence_lineage_service",
  "evidence_live_db_write_smoke",
  "tool_route_replay",
  "golden_fixtures"
];
const requiredBlockers = ["partner_source_rows"];
const requiredNotClaimed = ["sprint1_2_exit_dod_complete", ...requiredBlockers];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

if (isMainModule()) {
  runCli();
}

export { validateReadiness };

function runCli() {
  const readiness = readJson(contractPath);
  const contracts = readSourceContracts(readiness);
  const packageJson = readJson(packagePath);
  const tracker = readText(trackerPath);
  const todos = readText(todosPath);
  const errors = validateReadiness({ contracts, packageJson, readiness, todos, tracker });

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
      blockers: readiness.blockers.length,
      p0_tool_count: readiness.p0_tool_count,
      release_transition_allowed: readiness.route_replay_policy.release_transition_allowed,
      status: "ok"
    },
    0
  );
}

function validateReadiness({ contracts, packageJson, readiness: value, todos, tracker }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["readiness contract must be an object"];
  }

  if (value.version !== expectedVersion) {
    errors.push(`version must be ${expectedVersion}`);
  }

  if (value.status !== "blocked_partner_sources") {
    errors.push("status must be blocked_partner_sources");
  }

  if (value.checker !== "scripts/check-tool-route-replay-readiness-contract.mjs") {
    errors.push("checker must point to scripts/check-tool-route-replay-readiness-contract.mjs");
  }

  if (value.fixture_checker !== "scripts/check-tool-route-replay-readiness-fixtures.mjs") {
    errors.push("fixture_checker must point to scripts/check-tool-route-replay-readiness-fixtures.mjs");
  }

  if (value.p0_tool_count !== requiredTools.length) {
    errors.push(`p0_tool_count must be ${requiredTools.length}`);
  }

  if (value.golden_fixture_count !== requiredTools.length) {
    errors.push(`golden_fixture_count must be ${requiredTools.length}`);
  }

  errors.push(...validateLinkedContracts(value.linked_contracts));
  errors.push(...validateRouteReplayPolicy(value.route_replay_policy));
  errors.push(...validateSurfaces(value.validated_surfaces));
  errors.push(...validateBlockers(value.blockers));
  errors.push(...validateStringArray(value.not_claimed, requiredNotClaimed, "not_claimed"));
  errors.push(...validateSourceContracts(contracts));
  errors.push(...validatePackageScripts(packageJson));
  errors.push(...validateTrackerAndTodos(tracker, todos));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function readSourceContracts(value) {
  const linked = isRecord(value.linked_contracts) ? value.linked_contracts : {};

  return {
    agentToolEnforcement: readJson(linked.agent_tool_enforcement ?? requiredLinkedContracts.agent_tool_enforcement),
    evidenceLiveDbWriteSmoke: readJson(
      linked.evidence_live_db_write_smoke ??
        requiredLinkedContracts.evidence_live_db_write_smoke
    ),
    evidenceLineageService: readJson(linked.evidence_lineage_service ?? requiredLinkedContracts.evidence_lineage_service),
    evidenceLineageTools: readJson(linked.evidence_lineage_tools ?? requiredLinkedContracts.evidence_lineage_tools),
    goldenManifest: readJson(linked.golden_tool_manifest ?? requiredLinkedContracts.golden_tool_manifest),
    mcpPaginationLimits: readJson(linked.mcp_pagination_limits ?? requiredLinkedContracts.mcp_pagination_limits),
    mcpProtocolReleaseGate: readJson(linked.mcp_protocol_release_gate ?? requiredLinkedContracts.mcp_protocol_release_gate),
    mcpProtocolToolExecutionSmoke: readJson(
      linked.mcp_protocol_tool_execution_smoke ??
        requiredLinkedContracts.mcp_protocol_tool_execution_smoke
    ),
    mcpRuntimeSchemaSnapshot: readJson(
      linked.mcp_runtime_schema_snapshot ??
        requiredLinkedContracts.mcp_runtime_schema_snapshot
    ),
    mcpSchemaValidation: readJson(linked.mcp_schema_validation ?? requiredLinkedContracts.mcp_schema_validation),
    mcpUsageEnvelope: readJson(linked.mcp_usage_envelope ?? requiredLinkedContracts.mcp_usage_envelope),
    mcpVersioning: readJson(linked.mcp_versioning ?? requiredLinkedContracts.mcp_versioning),
    p0ToolCatalog: readJson(linked.p0_tool_catalog ?? requiredLinkedContracts.p0_tool_catalog),
    toolRouteReplay: readJson(linked.tool_route_replay ?? requiredLinkedContracts.tool_route_replay),
    toolRegistry: readJson(linked.tool_registry ?? requiredLinkedContracts.tool_registry),
    toolSchemas: readJson(linked.tool_schemas ?? requiredLinkedContracts.tool_schemas)
  };
}

function validateLinkedContracts(value) {
  if (!isRecord(value)) {
    return ["linked_contracts must be an object"];
  }

  const errors = [];

  for (const [key, path] of Object.entries(requiredLinkedContracts)) {
    if (value[key] !== path) {
      errors.push(`linked_contracts.${key} must be ${path}`);
    }
  }

  return errors;
}

function validateRouteReplayPolicy(value) {
  if (!isRecord(value)) {
    return ["route_replay_policy must be an object"];
  }

  const errors = [];
  const requiredTrue = [
    "local_catalog_consistency_ready",
    "local_schema_contract_ready",
    "local_golden_fixture_ready",
    "no_live_posture_guarded",
    "live_route_replay",
    "mcp_live_protocol_execution",
    "runtime_schema_serving",
    "live_db_writes"
  ];

  for (const field of requiredTrue) {
    if (value[field] !== true) {
      errors.push(`route_replay_policy.${field} must be true`);
    }
  }

  if (value.release_transition_allowed !== false) {
    errors.push("route_replay_policy.release_transition_allowed must be false until live blockers clear");
  }

  for (const field of ["partner_source_rows"]) {
    if (value[field] !== false) {
      errors.push(`route_replay_policy.${field} must be false until remaining live blockers clear`);
    }
  }

  return errors;
}

function validateSurfaces(value) {
  if (!Array.isArray(value)) {
    return ["validated_surfaces must be an array"];
  }

  const errors = [];
  const seen = new Set();

  for (const [index, surface] of value.entries()) {
    if (!isRecord(surface)) {
      errors.push(`validated_surfaces[${index}] must be an object`);
      continue;
    }

    if (typeof surface.id === "string") {
      seen.add(surface.id);
    }

    if (!requiredSurfaceIds.includes(surface.id)) {
      errors.push(`validated_surfaces[${index}].id is unexpected`);
    }

    if (typeof surface.contract !== "string" || !existsSync(resolve(process.cwd(), surface.contract))) {
      errors.push(`${surface.id}.contract must exist`);
    }

    if (typeof surface.command !== "string" || !surface.command.startsWith("npm run ")) {
      errors.push(`${surface.id}.command must be an npm run command`);
    }

    if (surface.expected_status === undefined) {
      errors.push(`${surface.id}.expected_status is required`);
    }

    if (typeof surface.expected_count !== "number") {
      errors.push(`${surface.id}.expected_count must be a number`);
    }
  }

  for (const id of requiredSurfaceIds) {
    if (!seen.has(id)) {
      errors.push(`validated_surfaces missing ${id}`);
    }
  }

  return errors;
}

function validateBlockers(value) {
  if (!Array.isArray(value)) {
    return ["blockers must be an array"];
  }

  const errors = [];
  const seen = new Set();

  for (const [index, blocker] of value.entries()) {
    if (!isRecord(blocker)) {
      errors.push(`blockers[${index}] must be an object`);
      continue;
    }

    if (typeof blocker.id === "string") {
      seen.add(blocker.id);
    }

    if (!requiredBlockers.includes(blocker.id)) {
      errors.push(`blockers[${index}].id is unexpected`);
    }

    if (typeof blocker.source_contract !== "string" || !existsSync(resolve(process.cwd(), blocker.source_contract))) {
      errors.push(`${blocker.id}.source_contract must exist`);
    }

    if (typeof blocker.source_field !== "string" || blocker.source_field.length === 0) {
      errors.push(`${blocker.id}.source_field is required`);
    }

    if (blocker.current_value !== false) {
      errors.push(`${blocker.id}.current_value must be false`);
    }

    if (blocker.release_blocker !== true) {
      errors.push(`${blocker.id}.release_blocker must be true`);
    }

    if (!Array.isArray(blocker.required_evidence) || blocker.required_evidence.length === 0) {
      errors.push(`${blocker.id}.required_evidence must be a non-empty array`);
    }
  }

  for (const id of requiredBlockers) {
    if (!seen.has(id)) {
      errors.push(`blockers missing ${id}`);
    }
  }

  return errors;
}

function validateSourceContracts(contracts) {
  const errors = [];

  if (!isRecord(contracts)) {
    return ["source contracts must be an object"];
  }

  errors.push(...validateP0Catalog(contracts.p0ToolCatalog));
  errors.push(...validateRegistry(contracts.toolRegistry));
  errors.push(...validateToolSchemas(contracts.toolSchemas));
  errors.push(...validateMcpValidatedTools(contracts.mcpSchemaValidation, "mcp_schema_validation"));
  errors.push(...validateMcpValidatedTools(contracts.mcpVersioning, "mcp_versioning"));
  errors.push(...validateMcpValidatedTools(contracts.mcpUsageEnvelope, "mcp_usage_envelope"));
  errors.push(...validateMcpValidatedTools(contracts.mcpPaginationLimits, "mcp_pagination_limits"));
  errors.push(...validateMcpProtocolReleaseGate(contracts.mcpProtocolReleaseGate));
  errors.push(...validateMcpProtocolToolExecutionSmoke(contracts.mcpProtocolToolExecutionSmoke));
  errors.push(...validateMcpRuntimeSchemaSnapshot(contracts.mcpRuntimeSchemaSnapshot));
  errors.push(...validateToolRouteReplay(contracts.toolRouteReplay));
  errors.push(...validateAgentToolEnforcement(contracts.agentToolEnforcement));
  errors.push(...validateEvidenceLineageTools(contracts.evidenceLineageTools));
  errors.push(...validateEvidenceLineageService(contracts.evidenceLineageService));
  errors.push(...validateEvidenceLiveDbWriteSmoke(contracts.evidenceLiveDbWriteSmoke));
  errors.push(...validateGoldenManifest(contracts.goldenManifest));

  return errors;
}

function validateToolRouteReplay(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["tool route replay contract must be an object"];
  }

  if (value.status !== "local_contract") {
    errors.push("tool route replay status must be local_contract");
  }

  if (
    value.server_orchestrated_route_replay !== true ||
    value.golden_vs_route_response_diff !== true ||
    value.canonical_projection_replay !== true
  ) {
    errors.push("tool route replay must prove server route replay and golden diff");
  }

  if (
    value.mcp_live_protocol_execution !== false ||
    value.live_db_writes !== false ||
    value.partner_source_rows !== false ||
    value.frontend !== false
  ) {
    errors.push("tool route replay must keep MCP live protocol, DB writes, partner rows, and frontend false");
  }

  if (value.route_count !== requiredTools.length || value.golden_fixture_count !== requiredTools.length) {
    errors.push(`tool route replay route_count and golden_fixture_count must be ${requiredTools.length}`);
  }

  errors.push(...validateStringArray(value.validated_tools, requiredTools, "tool_route_replay.validated_tools"));

  return errors;
}

function validateP0Catalog(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["p0 tool catalog contract must be an object"];
  }

  if (value.status !== "local_contract") {
    errors.push("p0 tool catalog status must be local_contract");
  }

  if (value.frontend !== false || value.live_tool_execution !== false) {
    errors.push("p0 tool catalog must keep frontend and live_tool_execution false");
  }

  for (const field of [
    "p0_tool_count",
    "registry_tool_count",
    "tool_schema_pairs",
    "mcp_validated_tools",
    "golden_fixture_count"
  ]) {
    if (value[field] !== requiredTools.length) {
      errors.push(`p0 tool catalog ${field} must be ${requiredTools.length}`);
    }
  }

  errors.push(...validateStringArray(value.required_tools, requiredTools, "p0_tool_catalog.required_tools"));
  return errors;
}

function validateRegistry(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["tool registry contract must be an object"];
  }

  if (value.execution_ready !== false || value.live_data_access !== false) {
    errors.push("tool registry must keep execution_ready and live_data_access false");
  }

  if (value.allow_arbitrary_sql !== false || value.allow_arbitrary_url !== false) {
    errors.push("tool registry must reject arbitrary SQL and URL access");
  }

  errors.push(...validateStringArray(value.required_tools, requiredTools, "tool_registry.required_tools"));
  errors.push(...validateStringArray(value.scaffold_tools, requiredTools, "tool_registry.scaffold_tools"));
  return errors;
}

function validateToolSchemas(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.schemas)) {
    return ["tool schemas contract must expose schemas"];
  }

  if (value.live_data_access !== false || value.allow_arbitrary_sql !== false || value.allow_arbitrary_url !== false) {
    errors.push("tool schemas must keep no-live/no-arbitrary SQL/URL posture");
  }

  if (Object.keys(value.schemas).length !== requiredTools.length) {
    errors.push(`tool schemas must contain exactly ${requiredTools.length} schema pairs`);
  }

  for (const toolName of requiredTools) {
    const schema = value.schemas[toolName];

    if (!isRecord(schema)) {
      errors.push(`tool schemas must include ${toolName}`);
      continue;
    }

    const output = schema.output;
    if (!isRecord(output) || !Array.isArray(output.required) || !output.required.includes("provenance")) {
      errors.push(`${toolName} output schema must require provenance`);
    }
  }

  return errors;
}

function validateMcpValidatedTools(value, label) {
  const errors = [];

  if (!isRecord(value)) {
    return [`${label} contract must be an object`];
  }

  if (value.live_tool_execution !== false) {
    errors.push(`${label}.live_tool_execution must be false`);
  }

  errors.push(...validateStringArray(value.validated_tools, requiredTools, `${label}.validated_tools`));
  return errors;
}

function validateMcpProtocolReleaseGate(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["mcp protocol release gate contract must be an object"];
  }

  for (const field of [
    "live_auth_middleware",
    "live_client_e2e_passed",
    "live_db_writes",
    "live_inspector_smoke",
    "live_oauth_provider",
    "live_sdk_smoke",
    "live_tool_execution"
  ]) {
    if (value[field] !== false) {
      errors.push(`mcp protocol release gate ${field} must be false`);
    }
  }

  if (!isRecord(value.release_gate) || value.release_gate.no_live_release_claim !== true) {
    errors.push("mcp protocol release gate must keep no_live_release_claim true");
  }

  return errors;
}

function validateMcpProtocolToolExecutionSmoke(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["mcp protocol tool execution smoke contract must be an object"];
  }

  if (value.status !== "local_contract") {
    errors.push("mcp protocol tool execution smoke status must be local_contract");
  }

  if (value.protocol_route !== "POST /mcp") {
    errors.push("mcp protocol tool execution smoke protocol_route must be POST /mcp");
  }

  if (value.sample_tool_name !== "get_quote_snapshot" || value.sample_scope !== "quotes:read") {
    errors.push("mcp protocol tool execution smoke must cover get_quote_snapshot with quotes:read");
  }

  if (value.smoke_token_binding !== "AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN") {
    errors.push("mcp protocol tool execution smoke must use smoke token binding");
  }

  if (
    value.mcp_protocol_tool_execution_smoke !== true ||
    value.auth_enforced_before_tool_execution !== true ||
    value.public_default_deny_preserved !== true ||
    value.revoked_credential_denied_before_execution !== true ||
    value.scope_required_before_execution !== true ||
    value.actual_worker_route_execution !== true
  ) {
    errors.push("mcp protocol tool execution smoke must prove execution and pre-execution auth");
  }

  if (
    value.live_db_writes !== false ||
    value.partner_source_rows !== false ||
    value.frontend !== false
  ) {
    errors.push("mcp protocol tool execution smoke must keep DB writes, partner rows, and frontend false");
  }

  return errors;
}

function validateMcpRuntimeSchemaSnapshot(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["mcp runtime schema snapshot contract must be an object"];
  }

  if (value.route !== "GET /mcp/runtime/tool-schemas") {
    errors.push("mcp runtime schema snapshot route must be GET /mcp/runtime/tool-schemas");
  }

  if (value.protocol_route !== "POST /mcp") {
    errors.push("mcp runtime schema snapshot protocol_route must be POST /mcp");
  }

  if (value.schema_source_contract !== requiredLinkedContracts.tool_schemas) {
    errors.push("mcp runtime schema snapshot must source deploy/tools/tool-schemas.contract.json");
  }

  if (value.runtime_schema_serving !== true || value.tools_list_schema_snapshot !== true) {
    errors.push("mcp runtime schema snapshot must mark runtime schema serving and tools/list snapshot ready");
  }

  if (value.live_tool_execution !== false || value.frontend !== false) {
    errors.push("mcp runtime schema snapshot must keep live_tool_execution and frontend false");
  }

  if (value.tool_count !== requiredTools.length) {
    errors.push(`mcp runtime schema snapshot tool_count must be ${requiredTools.length}`);
  }

  errors.push(
    ...validateStringArray(
      value.validated_tools,
      requiredTools,
      "mcp_runtime_schema_snapshot.validated_tools"
    )
  );

  return errors;
}

function validateAgentToolEnforcement(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["agent tool enforcement contract must be an object"];
  }

  if (value.actual_tool_execution !== false) {
    errors.push("agent tool enforcement actual_tool_execution must be false");
  }

  if (value.registered_tool_count !== requiredTools.length) {
    errors.push(`agent tool enforcement registered_tool_count must be ${requiredTools.length}`);
  }

  errors.push(...validateStringArray(value.forbidden_tool_names, ["sql.query", "http.fetch"], "agent_tool_enforcement.forbidden_tool_names"));
  return errors;
}

function validateEvidenceLineageTools(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.tools)) {
    return ["evidence lineage tools contract must expose tools"];
  }

  if (value.live_data_access !== false || value.allow_arbitrary_sql !== false || value.allow_arbitrary_url !== false) {
    errors.push("evidence lineage tools must keep no-live/no-arbitrary SQL/URL posture");
  }

  const toolNames = value.tools.map((tool) => tool.tool_name).filter((toolName) => typeof toolName === "string");
  errors.push(...validateStringArray(toolNames, ["get_data_lineage", "get_entitlements"], "evidence_lineage_tools.tools"));
  return errors;
}

function validateEvidenceLineageService(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["evidence lineage service contract must be an object"];
  }

  if (value.live_db_writes !== false) {
    errors.push("evidence lineage service live_db_writes must be false");
  }

  if (value.partner_source_records_loaded !== false) {
    errors.push("evidence lineage service partner_source_records_loaded must be false");
  }

  if (value.sql_emitted !== false) {
    errors.push("evidence lineage service sql_emitted must be false");
  }

  return errors;
}

function validateEvidenceLiveDbWriteSmoke(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["evidence live DB write smoke contract must be an object"];
  }

  if (value.status !== "local_contract") {
    errors.push("evidence live DB write smoke status must be local_contract");
  }

  if (value.route !== "POST /evidence/records/live-db-smoke") {
    errors.push("evidence live DB write smoke route must be POST /evidence/records/live-db-smoke");
  }

  if (
    value.hyperdrive_binding !== "AIPHABEE_HYPERDRIVE" ||
    value.smoke_token_binding !== "AIPHABEE_EVIDENCE_LIVE_DB_SMOKE_TOKEN"
  ) {
    errors.push("evidence live DB write smoke must bind Hyperdrive and the dedicated smoke token");
  }

  for (const field of [
    "live_db_writes",
    "insert_smoke",
    "select_readback",
    "delete_cleanup",
    "transactional_rollback_on_failure",
    "hash_only_response"
  ]) {
    if (value[field] !== true) {
      errors.push(`evidence live DB write smoke ${field} must be true`);
    }
  }

  for (const field of ["partner_source_rows", "frontend", "production_evidence_persistence"]) {
    if (value[field] !== false) {
      errors.push(`evidence live DB write smoke ${field} must remain false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.tables,
      ["core.evidence_record", "core.evidence_source_ref"],
      "evidence_live_db_write_smoke.tables"
    )
  );

  return errors;
}

function validateGoldenManifest(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.samples)) {
    return ["golden manifest must expose samples"];
  }

  const toolNames = value.samples
    .filter(isRecord)
    .map((sample) => sample.tool_name)
    .filter((toolName) => typeof toolName === "string");

  errors.push(...validateStringArray(toolNames, requiredTools, "golden_manifest.tool_name"));

  if (toolNames.length !== requiredTools.length) {
    errors.push(`golden manifest must contain exactly ${requiredTools.length} samples`);
  }

  for (const sample of value.samples.filter(isRecord)) {
    if (!Array.isArray(sample.source_records) || sample.source_records.length === 0) {
      errors.push(`${sample.sample_id}.source_records must be non-empty`);
      continue;
    }

    for (const sourceRecord of sample.source_records) {
      if (!isRecord(sourceRecord)) {
        errors.push(`${sample.sample_id}.source_records entry must be an object`);
        continue;
      }

      for (const field of ["source_record_id", "data_version", "methodology_version"]) {
        if (typeof sourceRecord[field] !== "string" || sourceRecord[field].length === 0) {
          errors.push(`${sample.sample_id}.source_records must include ${field}`);
        }
      }
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const requiredScripts = {
    "check:evidence-live-db-write-smoke": "node scripts/check-evidence-live-db-write-smoke-contract.mjs",
    "check:mcp-protocol-tool-execution-smoke": "node scripts/check-mcp-protocol-tool-execution-smoke-contract.mjs",
    "check:tool-route-replay": "node scripts/check-tool-route-replay-contract.mjs",
    "check:tool-route-replay-readiness": "node scripts/check-tool-route-replay-readiness-contract.mjs",
    "check:tool-route-replay-readiness-fixtures": "node scripts/check-tool-route-replay-readiness-fixtures.mjs"
  };

  for (const [script, command] of Object.entries(requiredScripts)) {
    if (scripts[script] !== command) {
      errors.push(`package.json ${script} must be ${command}`);
    }

    if (!String(scripts.check ?? "").includes(`npm run ${script}`)) {
      errors.push(`root check must include ${script}`);
    }
  }

  return errors;
}

function validateTrackerAndTodos(tracker, todos) {
  const errors = [];
  const combined = `${tracker}\n${todos}`;

  for (const text of [
    "tool route replay readiness",
    "Evidence live DB write smoke",
    "npm run check:evidence-live-db-write-smoke",
    "MCP protocol tool execution smoke",
    "npm run check:mcp-protocol-tool-execution-smoke",
    "npm run check:tool-route-replay",
    "npm run check:tool-route-replay-readiness",
    "MCP live protocol execution",
    "live DB writes",
    "partner source rows",
    "runtime schema serving",
    "server-orchestrated route replay"
  ]) {
    if (!combined.includes(text)) {
      errors.push(`tracker/todos must mention ${text}`);
    }
  }

  if (!tracker.includes("**退出门槛 DoD：** ☐ 6–8 工具黄金样本一致")) {
    errors.push("tracker must keep Sprint 1.2 exit DoD unchecked");
  }

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

  if (new Set(value).size !== value.length) {
    errors.push(`${name} must not contain duplicates`);
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMainModule() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
