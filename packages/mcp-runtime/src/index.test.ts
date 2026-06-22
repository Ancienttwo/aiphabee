import { describe, expect, it } from "vitest";
import {
  MCP_AUTH_LIMITS_RELEASE_GATE_REQUIRED_CHECKS,
  MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
  MCP_COMPATIBILITY_STATUS_VERSION,
  MCP_DEVELOPER_CONSOLE_REQUIRED_CHECKS,
  MCP_DEVELOPER_CONSOLE_VERSION,
  MCP_PROTOCOL_RELEASE_GATE_REQUIRED_CHECKS,
  MCP_PROTOCOL_RELEASE_GATE_VERSION,
  MCP_REVOCATION_ENFORCEMENT_VERSION,
  MCP_STANDARD_ERROR_CODES,
  MCP_STANDARD_ERROR_CODES_VERSION,
  MCP_CLIENT_MATURITY_REQUIRED_CHECKS,
  MCP_CLIENT_MATURITY_VERSION,
  MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_REQUIRED_CHECKS,
  MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
  MCP_TOOL_LIMITER_VERSION,
  MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
  McpRuntimeInputError,
  createMcpAuthLimitsReleaseGatePlan,
  createMcpApiKeyCreatePlan,
  createMcpApiKeyRevokePlan,
  createMcpApiKeyRotatePlan,
  createMcpCompatibilityStatusPlan,
  createMcpOAuthAuthorizePlan,
  createMcpOAuthRevokePlan,
  createMcpOAuthTokenPlan,
  createMcpClientMaturityPlan,
  createMcpDeveloperConsolePlan,
  createMcpProtocolPlan,
  createMcpProtocolReleaseGatePlan,
  createMcpRevocationEnforcementPlan,
  createMcpTargetClientsConsoleReleaseGatePlan,
  getMcpApiKeyCapabilities,
  getMcpAuthLimitsReleaseGateCapabilities,
  getMcpClientMaturityCapabilities,
  getMcpOAuthCapabilities,
  getMcpDeveloperConsoleCapabilities,
  getMcpProtocolReleaseGateCapabilities,
  getMcpRevocationEnforcementCapabilities,
  getMcpRuntimeCapabilities,
  getMcpRuntimeSchemaSnapshot,
  getMcpRuntimeStandardError,
  getMcpStandardErrorDefinition,
  getMcpTargetClientsConsoleReleaseGateCapabilities
} from "./index";

describe("mcp endpoint default-deny scaffold", () => {
  it("reports MCP runtime capabilities with default-deny rights gate", () => {
    expect(getMcpRuntimeCapabilities()).toMatchObject({
      api_key_live: false,
      default_deny: true,
      developer_console_live: false,
      live_tool_execution: false,
      mcp_api_redistribution_rights_confirmed: false,
      oauth_live: false,
      origin_validation: true,
      package: "@aiphabee/mcp-runtime",
      route: "POST /mcp",
      runtime_route: "GET /mcp/runtime",
      runtime_schema_serving: true,
      runtime_schema_snapshot_route: "GET /mcp/runtime/tool-schemas",
      runtime_schema_snapshot_version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
      status: "mcp_endpoint_default_deny_scaffold",
      tools_list_schema_snapshot: true,
      tools_list_live: false,
      transport: "streamable_http",
      web_rights_do_not_imply_mcp: true
    });
    expect(getMcpRuntimeCapabilities().supported_methods).toEqual([
      "initialize",
      "tools/list",
      "tools/call"
    ]);
    expect(getMcpRuntimeCapabilities()).toMatchObject({
      api_key_create_route: "POST /mcp/api-keys/create/plan",
      api_key_hash_storage_ready: true,
      api_key_ip_allowlist_ready: true,
      api_key_one_time_display_ready: true,
      api_key_revoke_route: "POST /mcp/api-keys/revoke/plan",
      api_key_revoke_enforced_before_new_calls: true,
      api_key_rotation_old_key_denied: true,
      api_key_rotate_route: "POST /mcp/api-keys/rotate/plan",
      api_key_rotation_ready: true,
      api_key_runtime_route: "GET /mcp/api-keys/runtime",
      breaking_changes_require_new_major: true,
      deprecation_policy_ready: true,
      oauth_authorize_route: "POST /mcp/oauth/authorize/plan",
      oauth_pkce_ready: true,
      oauth_revoke_enforced_before_new_calls: true,
      oauth_revoke_route: "POST /mcp/oauth/revoke/plan",
      oauth_token_route: "POST /mcp/oauth/token/plan",
      scopes_revocable: true,
      mcp_revocation_enforcement_error_code: "AUTH_REQUIRED",
      mcp_revocation_enforcement_live: false,
      mcp_revocation_enforcement_ready: true,
      mcp_revocation_enforcement_route: "POST /mcp/revocations/enforce/plan",
      mcp_revocation_enforcement_version:
        "2026-06-21.phase2.mcp-revocation-enforcement-scaffold.v0",
      structured_content_output_schema_ready: true,
      third_party_token_passthrough: false
    });
    expect(getMcpRuntimeCapabilities()).toMatchObject({
      cursor_pagination_ready: true,
      max_row_limit_enforced: true,
      mcp_error_detail_fields: [
        "category",
        "client_action",
        "internal_code",
        "mcp_error_version",
        "recoverable",
        "request_id",
        "retry_after_required",
        "source_record_id"
      ],
      pagination_limits_ready: true,
      pagination_limits_version: "2026-06-21.phase2.mcp-pagination-limits-scaffold.v0",
      pagination_or_rights_bypass_blocked: true,
      standard_error_code_version:
        "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
      standard_error_codes_ready: true,
      budget_limit_plan_ready: true,
      concurrency_limit_plan_ready: true,
      mcp_compatibility_status_ready: true,
      mcp_compatibility_status_route: "GET /mcp/compatibility/status",
      mcp_compatibility_status_version:
        "2026-06-21.phase2.mcp-compatibility-status-scaffold.v0",
      mcp_live_client_e2e_passed: false,
      mcp_protocol_release_gate_ready: true,
      mcp_protocol_release_gate_route: "POST /mcp/release-gates/protocol/plan",
      mcp_protocol_release_gate_version:
        "2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0",
      mcp_auth_limits_release_gate_ready: true,
      mcp_auth_limits_release_gate_route: "POST /mcp/release-gates/auth-limits/plan",
      mcp_auth_limits_release_gate_version:
        "2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0",
      mcp_target_clients_console_release_gate_ready: true,
      mcp_target_clients_console_release_gate_route:
        "POST /mcp/release-gates/target-clients-console/plan",
      mcp_target_clients_console_release_gate_version:
        "2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0",
      mcp_target_client_e2e_matrix_ready: true,
      mcp_developer_console_backend_ready: true,
      mcp_developer_console_live: false,
      mcp_developer_console_route: "POST /mcp/developer-console/plan",
      mcp_developer_console_version:
        "2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0",
      mcp_target_protocol_version: "2025-03-26",
      mcp_client_maturity_ready: true,
      mcp_client_maturity_route: "POST /mcp/client-maturity/plan",
      mcp_client_maturity_version: "2026-06-22.phase4.mcp-client-maturity-scaffold.v0",
      mcp_interactive_apps_live: false,
      mcp_prompts_live: false,
      mcp_resources_live: false,
      developer_console_reconciliation_ready: true,
      mcp_limiter_error_codes: ["RATE_LIMITED", "BUDGET_EXCEEDED"],
      mcp_limiter_live: false,
      mcp_tool_limiter_dimensions: [
        "user",
        "workspace",
        "client",
        "tool",
        "dataset",
        "ip_risk"
      ],
      mcp_tool_limiter_ip_reputation_live: false,
      mcp_tool_limiter_ready: true,
      mcp_tool_limiter_version: "2026-06-21.phase2.mcp-tool-limiter-scaffold.v0",
      mcp_tool_limiter_raw_ip_stored: false,
      ordinary_pool_protection: true,
      rate_limit_plan_ready: true,
      tool_call_input_strict_validation: true,
      time_range_limits_ready: true,
      tool_schema_validation_version:
        "2026-06-21.phase2.mcp-tool-schema-validation-scaffold.v0",
      tool_versioning_ready: true,
      usage_envelope_ready: true,
      usage_envelope_version: "2026-06-21.phase2.mcp-usage-envelope-scaffold.v0",
      usage_remaining_ready: true,
      usage_request_id_visible: true,
      usage_reconciliation_ready: true
    });
    expect(getMcpRuntimeCapabilities().standard_error_codes).toEqual([
      "AUTH_REQUIRED",
      "SCOPE_DENIED",
      "DATA_NOT_LICENSED",
      "SYMBOL_AMBIGUOUS",
      "OUT_OF_RANGE",
      "TOO_MANY_ROWS",
      "RATE_LIMITED",
      "BUDGET_EXCEEDED",
      "UPSTREAM_STALE",
      "DATA_QUALITY_HOLD",
      "INTERNAL_ERROR"
    ]);
    expect(getMcpRuntimeCapabilities().standard_error_categories).toEqual([
      "authentication",
      "authorization",
      "data",
      "limit",
      "system"
    ]);
    expect(getMcpRuntimeCapabilities().mcp_tool_limiter_pools).toEqual([
      {
        high_cost: false,
        max_parallel: 8,
        name: "mcp_standard",
        ordinary_pool_protection: true
      },
      {
        high_cost: true,
        max_parallel: 2,
        name: "mcp_high_cost",
        ordinary_pool_protection: true,
        queue_name: "mcp-high-cost"
      }
    ]);
    expect(getMcpRuntimeCapabilities().monitored_protocol_versions).toEqual([
      "2025-03-26",
      "2025-11-25"
    ]);
    expect(getMcpRuntimeCapabilities().mcp_auth_limits_release_gate_required_checks).toEqual([
      "oauth_scope_catalog_and_pkce_ready",
      "oauth_revoke_denies_future_calls",
      "api_key_rotation_denies_old_key",
      "api_key_revoke_denies_future_calls",
      "cursor_pagination_bypass_blocked",
      "quota_and_limit_bypass_blocked",
      "standard_error_codes_stable"
    ]);
    expect(
      getMcpRuntimeCapabilities().mcp_target_clients_console_release_gate_required_checks
    ).toEqual([
      "target_client_matrix_present",
      "inspector_and_sdk_smoke_vectors_planned",
      "first_call_guide_under_10_minute_target",
      "console_reconciliation_fields_present",
      "request_usage_scope_and_key_reconciliation_ready",
      "compatibility_status_linked",
      "no_live_console_or_client_claim"
    ]);
    expect(getMcpRuntimeCapabilities().mcp_developer_console_required_checks).toEqual([
      "connection_guide_surface_ready",
      "api_key_and_oauth_routes_linked",
      "scope_catalog_visible",
      "quota_usage_summary_visible",
      "request_log_schema_ready",
      "examples_cover_initialize_tools_list_tools_call",
      "first_call_guide_under_10_minute_target",
      "no_live_console_claim"
    ]);
    expect(getMcpRuntimeCapabilities().mcp_developer_console_log_fields).toContain(
      "request_id"
    );
    expect(getMcpRuntimeCapabilities().mcp_developer_console_forbidden_fields).toContain(
      "raw_api_key"
    );
    expect(getMcpRuntimeCapabilities().mcp_client_maturity_required_checks).toEqual([
      "target_clients_capability_matrix_present",
      "resources_support_guarded_by_client_maturity",
      "prompts_support_guarded_by_client_maturity",
      "interactive_apps_support_blocked_until_client_stable",
      "fallback_to_tools_only_documented",
      "no_live_resources_prompts_apps_claim"
    ]);
  });

  it("serves a runtime schema snapshot without live tool execution", () => {
    const snapshot = getMcpRuntimeSchemaSnapshot();

    expect(snapshot).toMatchObject({
      live_tool_execution: false,
      package: "@aiphabee/mcp-runtime",
      protocol_route: "POST /mcp",
      route: "GET /mcp/runtime/tool-schemas",
      runtime_schema_serving: true,
      schema_dialect: "https://json-schema.org/draft/2020-12/schema",
      schema_snapshot_version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
      schema_source_contract: "deploy/tools/tool-schemas.contract.json",
      status: "runtime_schema_snapshot_scaffold",
      tool_count: 16,
      tools_list_schema_snapshot: true,
      version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION
    });
    expect(snapshot.tools).toHaveLength(16);
    expect(snapshot.tools.every((tool) => tool.schema_snapshot !== undefined)).toBe(true);
    expect(
      snapshot.tools.every(
        (tool) =>
          tool.schema_snapshot.input_schema.additional_properties_allowed === false &&
          tool.schema_snapshot.output_schema.structured_content_required === true &&
          tool.schema_snapshot.output_schema.raw_text_only_response_allowed === false &&
          tool.schema_snapshot.schema_source_contract ===
            "deploy/tools/tool-schemas.contract.json"
      )
    ).toBe(true);
    expect(
      snapshot.tools
        .find((tool) => tool.name === "resolve_security")
        ?.schema_snapshot.input_schema.required
    ).toEqual(["query"]);
  });

  it("plans MCP compatibility status without live client smoke", () => {
    const plan = createMcpCompatibilityStatusPlan({
      requestId: "req-mcp-compatibility"
    });

    expect(MCP_COMPATIBILITY_STATUS_VERSION).toBe(
      "2026-06-21.phase2.mcp-compatibility-status-scaffold.v0"
    );
    expect(plan).toMatchObject({
      data_version: MCP_COMPATIBILITY_STATUS_VERSION,
      inspector: {
        live_inspector_smoke: false,
        planned_command: "npx @modelcontextprotocol/inspector",
        target: "@modelcontextprotocol/inspector"
      },
      live_client_e2e_passed: false,
      methodology_version: MCP_COMPATIBILITY_STATUS_VERSION,
      package: "@aiphabee/mcp-runtime",
      protocol_route: "POST /mcp",
      request_id: "req-mcp-compatibility",
      runtime_route: "GET /mcp/runtime",
      sdk: {
        latest_seen_v1_release: "v1.29.0",
        live_sdk_smoke: false,
        production_channel: "typescript-sdk-v1.x",
        v2_channel_status: "pre_alpha_not_targeted"
      },
      status: "planned_no_live_compatibility_status",
      status_page: {
        public_status_page_live: false,
        route: "GET /mcp/compatibility/status",
        shows_last_successful_client_smoke: true,
        shows_open_incidents: true,
        shows_protocol_version: true
      },
      target_protocol_version: "2025-03-26",
      usage: {
        credits: 0,
        rows: 0,
        usage_reconciliation_status: "planned_no_live"
      },
      version: MCP_COMPATIBILITY_STATUS_VERSION
    });
    expect(plan.monitored_protocol_versions).toEqual(["2025-03-26", "2025-11-25"]);
    expect(plan.inspector.required_checks).toEqual([
      "connectivity",
      "capability_negotiation",
      "tools_tab",
      "error_responses"
    ]);
    expect(plan.target_clients.map((client) => client.name)).toEqual([
      "mcp_inspector",
      "typescript_sdk_client",
      "claude_desktop",
      "cursor",
      "chatgpt_connector"
    ]);
    expect(plan.target_clients.every((client) => client.live_e2e_passed === false)).toBe(true);
    expect(plan.test_vectors.map((vector) => vector.name)).toEqual([
      "streamable_http_post",
      "initialize_negotiation",
      "tools_list",
      "tools_call_schema_validation",
      "structured_content_text_fallback",
      "oauth_pkce",
      "api_key_lifecycle",
      "pagination_limits",
      "standard_errors",
      "usage_and_request_id",
      "as_of_delay_source_display"
    ]);
    expect(plan.test_vectors.every((vector) => vector.local_contract_ready)).toBe(true);
    expect(plan.test_vectors.every((vector) => vector.live_smoke_passed === false)).toBe(true);
  });

  it("plans MCP protocol release gate checks without live execution", () => {
    const plan = createMcpProtocolReleaseGatePlan({
      requestId: "req-mcp-protocol-release-gate",
      usagePlanCode: "developer",
      usedCredits: 12,
      workspaceId: "workspace_mcp"
    });

    expect(MCP_PROTOCOL_RELEASE_GATE_VERSION).toBe(
      "2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0"
    );
    expect(getMcpProtocolReleaseGateCapabilities()).toMatchObject({
      authentication_gate_ready: true,
      compatibility_status_route: "GET /mcp/compatibility/status",
      input_output_schema_compatibility_ready: true,
      live_auth_middleware: false,
      live_client_e2e_passed: false,
      package: "@aiphabee/mcp-runtime",
      protocol_route: "POST /mcp",
      route: "POST /mcp/release-gates/protocol/plan",
      runtime_route: "GET /mcp/runtime",
      status: "mcp_protocol_release_gate_scaffold",
      streamable_http_ready: true,
      target_protocol_version: "2025-03-26",
      version: MCP_PROTOCOL_RELEASE_GATE_VERSION
    });
    expect(getMcpProtocolReleaseGateCapabilities().required_checks).toEqual(
      MCP_PROTOCOL_RELEASE_GATE_REQUIRED_CHECKS
    );
    expect(plan).toMatchObject({
      data_version: MCP_PROTOCOL_RELEASE_GATE_VERSION,
      frontend_rendering: false,
      live_auth_middleware: false,
      live_client_e2e_passed: false,
      live_db_writes: false,
      live_tool_execution: false,
      methodology_version: MCP_PROTOCOL_RELEASE_GATE_VERSION,
      model_calls: false,
      persistent_writes: false,
      route: "POST /mcp/release-gates/protocol/plan",
      sql_emitted: false,
      status: "planned_no_write",
      version: MCP_PROTOCOL_RELEASE_GATE_VERSION
    });
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      "streamable_http_initialize_contract",
      "origin_required_and_allowed",
      "auth_enforced_before_tool_execution",
      "tools_list_default_deny_until_rights_confirmed",
      "tools_call_input_schema_validation",
      "tools_call_output_schema_contract",
      "compatibility_vectors_present"
    ]);
    expect(plan.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(plan.protocol_gate).toMatchObject({
      protocol: {
        json_rpc: "2.0",
        streamable_http: true
      },
      protocol_route: "POST /mcp",
      transport: "streamable_http"
    });
    expect(plan.protocol_gate.initialize?.protocol_version).toBe("2025-03-26");
    expect(plan.origin_gate).toMatchObject({
      allowed_origin_check: {
        required: true,
        valid: true
      },
      denied_error: {
        code: "ORIGIN_NOT_ALLOWED",
        standard_error_code: "SCOPE_DENIED"
      }
    });
    expect(plan.auth_gate).toMatchObject({
      denied_error: {
        code: "MCP_CREDENTIAL_REVOKED",
        standard_error_code: "AUTH_REQUIRED"
      },
      live_auth_middleware: false,
      rights_denied_error: {
        code: "MCP_REDISTRIBUTION_RIGHTS_REQUIRED",
        standard_error_code: "DATA_NOT_LICENSED"
      }
    });
    expect(plan.auth_gate.active_credential_plan?.denial).toMatchObject({
      decision: "allow_planned",
      denied: false,
      enforced_before_tool_execution: true
    });
    expect(plan.schema_compatibility_gate).toMatchObject({
      input_schema_id: "tool.get_quote_snapshot.input.v0",
      input_validation: {
        additional_properties_allowed: false,
        arguments_valid: true,
        schema_validation_status: "validated"
      },
      invalid_input_denial: {
        code: "TOOL_ARGUMENT_UNSUPPORTED",
        standard_error_code: "OUT_OF_RANGE"
      },
      output_schema_id: "tool.get_quote_snapshot.output.v0",
      output_validation: {
        raw_text_only_response_allowed: false,
        structured_content_matches_output_schema: "planned_no_live",
        structured_content_required: true
      },
      requested_tool_name: "get_quote_snapshot",
      required_scope: "quotes:read",
      schema_validation: "validated",
      structured_content_validation: "planned_no_live"
    });
    expect(plan.compatibility_gate.test_vectors.map((vector) => vector.name)).toContain(
      "tools_call_schema_validation"
    );
    expect(Object.values(plan.validation).every(Boolean)).toBe(true);
    expect(plan.release_gate).toMatchObject({
      blockers: [
        "live_oauth_provider_missing",
        "live_auth_middleware_missing",
        "live_sdk_inspector_smoke_missing",
        "target_client_e2e_missing"
      ],
      gate_status: "blocked_live_mcp_protocol_validation",
      no_live_release_claim: true,
      required_signoffs: ["platform", "security", "data-rights", "developer-relations"]
    });
    expect(plan.usage).toMatchObject({
      credits: 0,
      request_id: "req-mcp-protocol-release-gate",
      rows: 7,
      usage_reconciliation_status: "planned_no_live"
    });
  });

  it("plans MCP auth, key, cursor, limit, and error release gate checks", () => {
    const plan = createMcpAuthLimitsReleaseGatePlan({
      requestId: "req-mcp-auth-limits-release-gate",
      usagePlanCode: "developer",
      usedCredits: 12,
      workspaceId: "workspace_mcp"
    });

    expect(MCP_AUTH_LIMITS_RELEASE_GATE_VERSION).toBe(
      "2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0"
    );
    expect(getMcpAuthLimitsReleaseGateCapabilities()).toMatchObject({
      api_key_revoke_route: "POST /mcp/api-keys/revoke/plan",
      api_key_rotate_route: "POST /mcp/api-keys/rotate/plan",
      cursor_pagination_ready: true,
      live_api_key_generation: false,
      live_auth_middleware: false,
      live_limiter_enforcement: false,
      live_oauth_provider: false,
      live_tool_execution: false,
      mcp_error_code_version: MCP_STANDARD_ERROR_CODES_VERSION,
      oauth_authorize_route: "POST /mcp/oauth/authorize/plan",
      oauth_revoke_route: "POST /mcp/oauth/revoke/plan",
      package: "@aiphabee/mcp-runtime",
      protocol_route: "POST /mcp",
      route: "POST /mcp/release-gates/auth-limits/plan",
      runtime_route: "GET /mcp/runtime",
      status: "mcp_auth_limits_release_gate_scaffold",
      version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION
    });
    expect(getMcpAuthLimitsReleaseGateCapabilities().required_checks).toEqual(
      MCP_AUTH_LIMITS_RELEASE_GATE_REQUIRED_CHECKS
    );
    expect(plan).toMatchObject({
      data_version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
      frontend_rendering: false,
      live_api_key_generation: false,
      live_auth_middleware: false,
      live_db_writes: false,
      live_limiter_enforcement: false,
      live_oauth_provider: false,
      live_tool_execution: false,
      methodology_version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
      model_calls: false,
      persistent_writes: false,
      route: "POST /mcp/release-gates/auth-limits/plan",
      sql_emitted: false,
      status: "planned_no_write",
      version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION
    });
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      "oauth_scope_catalog_and_pkce_ready",
      "oauth_revoke_denies_future_calls",
      "api_key_rotation_denies_old_key",
      "api_key_revoke_denies_future_calls",
      "cursor_pagination_bypass_blocked",
      "quota_and_limit_bypass_blocked",
      "standard_error_codes_stable"
    ]);
    expect(plan.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(plan.oauth_scope_gate.authorize_plan).toMatchObject({
      consent: {
        clear_scope_display: true,
        requested_scope_count: 3,
        user_consent_required: true
      },
      live_oauth_provider: false,
      oauth_flow: "authorization_code_pkce",
      pkce: {
        code_challenge_method: "S256",
        plain_method_allowed: false
      },
      revocation: {
        revocable: true,
        revoke_route: "POST /mcp/oauth/revoke/plan"
      }
    });
    expect(plan.oauth_scope_gate.authorize_plan.consent.scopes.map((scope) => scope.scope)).toEqual([
      "security.read",
      "market.read",
      "analytics.run"
    ]);
    expect(
      plan.oauth_scope_gate.authorize_plan.consent.scopes.every((scope) => scope.revocable)
    ).toBe(true);
    expect(plan.oauth_scope_gate.revoke_plan.revocation_plan).toMatchObject({
      future_calls_denied_after_revoke: true,
      token_invalidation_live: false
    });
    expect(plan.oauth_scope_gate.revoked_connection_denial).toMatchObject({
      code: "MCP_CREDENTIAL_REVOKED",
      standard_error_code: "AUTH_REQUIRED"
    });
    expect(plan.api_key_gate.rotate_plan).toMatchObject({
      api_key: {
        live_secret_generated: false,
        old_key_future_calls_denied_after_rotation: true,
        rotation_overlap_seconds: 0
      },
      hash_storage: {
        raw_key_stored: false
      },
      server_to_server: {
        allowed_only: true,
        browser_use_allowed: false
      }
    });
    expect(plan.api_key_gate.revoke_plan.revocation_plan).toMatchObject({
      future_calls_denied_after_revoke: true,
      live_invalidation: false
    });
    expect(plan.api_key_gate.rotated_key_denial).toMatchObject({
      code: "MCP_CREDENTIAL_REVOKED",
      standard_error_code: "AUTH_REQUIRED"
    });
    expect(plan.limit_gate.bounded_retrieval).toMatchObject({
      cursor_pagination: {
        cursor: "cursor_1",
        cursor_bound_to_request: true,
        cursor_opaque: true,
        enabled: true,
        parameter: "cursor"
      },
      max_rows_enforced: true,
      plan_or_rights_bypass_blocked: true,
      row_limit: {
        effective_limit: 3,
        max_limit: 3,
        too_many_rows_error_code: "TOO_MANY_ROWS"
      },
      time_range_limit: {
        out_of_range_error_code: "OUT_OF_RANGE",
        time_range_enforced: true,
        window_days: 6
      }
    });
    expect(plan.limit_gate.too_many_rows_denial).toMatchObject({
      code: "TOOL_LIMIT_EXCEEDED",
      standard_error_code: "TOO_MANY_ROWS"
    });
    expect(plan.limit_gate.time_range_denial).toMatchObject({
      code: "TOOL_TIME_RANGE_EXCEEDED",
      standard_error_code: "OUT_OF_RANGE"
    });
    expect(plan.limit_gate.tool_limits).toMatchObject({
      budget: {
        budget_exceeded_error_code: "BUDGET_EXCEEDED",
        failure_refund_required: true,
        live_debit: false,
        pre_debit_required: true
      },
      concurrency: {
        high_cost_pool_isolated: true,
        live_inflight_reads: false,
        pool: "mcp_standard"
      },
      limiter_version: MCP_TOOL_LIMITER_VERSION,
      ordinary_pool_protection: true,
      rate_limit: {
        live_window_reads: false,
        rate_limited_error_code: "RATE_LIMITED",
        status: "planned_no_live"
      }
    });
    expect(plan.error_stability_gate).toMatchObject({
      required_mappings: {
        MCP_CREDENTIAL_REVOKED: "AUTH_REQUIRED",
        MCP_REDISTRIBUTION_RIGHTS_REQUIRED: "DATA_NOT_LICENSED",
        TOOL_LIMIT_EXCEEDED: "TOO_MANY_ROWS",
        TOOL_SCOPE_REQUIRED: "SCOPE_DENIED",
        TOOL_TIME_RANGE_EXCEEDED: "OUT_OF_RANGE"
      },
      standard_error_code_version: MCP_STANDARD_ERROR_CODES_VERSION
    });
    expect(plan.error_stability_gate.limiter_error_codes).toEqual([
      "RATE_LIMITED",
      "BUDGET_EXCEEDED"
    ]);
    expect(plan.error_stability_gate.standard_error_codes).toEqual(MCP_STANDARD_ERROR_CODES);
    expect(Object.values(plan.validation).every(Boolean)).toBe(true);
    expect(plan.release_gate).toMatchObject({
      blockers: [
        "live_oauth_provider_missing",
        "live_token_store_missing",
        "live_api_key_secret_generation_missing",
        "live_limiter_window_reads_missing",
        "live_usage_ledger_writes_missing"
      ],
      gate_status: "blocked_live_mcp_auth_limits_validation",
      no_live_release_claim: true,
      required_signoffs: ["platform", "security", "billing", "data-rights"]
    });
    expect(plan.usage).toMatchObject({
      credits: 0,
      request_id: "req-mcp-auth-limits-release-gate",
      rows: 7,
      usage_reconciliation_status: "planned_no_live"
    });
  });

  it("plans MCP target-client and Developer Console reconciliation release gate", () => {
    const plan = createMcpTargetClientsConsoleReleaseGatePlan({
      clientName: "mcp-inspector",
      clientVersion: "0.16.0",
      requestId: "req-mcp-target-clients-console-release-gate",
      usagePlanCode: "developer",
      usedCredits: 12,
      workspaceId: "workspace_mcp"
    });

    expect(MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION).toBe(
      "2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0"
    );
    expect(getMcpTargetClientsConsoleReleaseGateCapabilities()).toMatchObject({
      compatibility_status_route: "GET /mcp/compatibility/status",
      console_reconciliation_ready: true,
      developer_console_live: false,
      first_call_time_target_minutes: 10,
      live_client_e2e_passed: false,
      live_console_log_store: false,
      package: "@aiphabee/mcp-runtime",
      protocol_route: "POST /mcp",
      route: "POST /mcp/release-gates/target-clients-console/plan",
      runtime_route: "GET /mcp/runtime",
      status: "mcp_target_clients_console_release_gate_scaffold",
      target_client_matrix_ready: true,
      target_protocol_version: "2025-03-26",
      version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION
    });
    expect(getMcpTargetClientsConsoleReleaseGateCapabilities().required_checks).toEqual(
      MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_REQUIRED_CHECKS
    );
    expect(plan).toMatchObject({
      data_version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
      developer_console_live: false,
      frontend_rendering: false,
      live_client_e2e_passed: false,
      live_console_log_store: false,
      live_db_writes: false,
      live_sdk_inspector_smoke: false,
      live_tool_execution: false,
      live_usage_ledger_reads: false,
      methodology_version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
      model_calls: false,
      persistent_writes: false,
      route: "POST /mcp/release-gates/target-clients-console/plan",
      sql_emitted: false,
      status: "planned_no_write",
      version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION
    });
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      "target_client_matrix_present",
      "inspector_and_sdk_smoke_vectors_planned",
      "first_call_guide_under_10_minute_target",
      "console_reconciliation_fields_present",
      "request_usage_scope_and_key_reconciliation_ready",
      "compatibility_status_linked",
      "no_live_console_or_client_claim"
    ]);
    expect(plan.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(plan.target_client_gate).toMatchObject({
      first_call_time_target_minutes: 10,
      live_client_e2e_passed: false
    });
    expect(plan.target_client_gate.matrix.map((client) => client.client_name)).toEqual([
      "mcp_inspector",
      "typescript_sdk_client",
      "claude_desktop",
      "cursor",
      "chatgpt_connector"
    ]);
    expect(
      plan.target_client_gate.matrix.every(
        (client) =>
          client.connection_guide_artifact === "docs/public/mcp.md" &&
          client.first_call_time_target_minutes === 10 &&
          client.live_e2e_passed === false &&
          client.planned_checks.includes("console_reconciliation")
      )
    ).toBe(true);
    expect(plan.console_reconciliation_gate).toMatchObject({
      api_key_runtime_route: "GET /mcp/api-keys/runtime",
      console_live: false,
      log_store_live: false,
      request_id_visible: true,
      scope_visibility: true,
      status_source: "GET /mcp/compatibility/status",
      usage_ledger_reads_live: false
    });
    expect(plan.console_reconciliation_gate.required_fields).toEqual([
      "request_id",
      "workspace_id",
      "client_name",
      "client_version",
      "credential_kind",
      "credential_reference",
      "scope",
      "tool_name",
      "tool_version",
      "status",
      "standard_error_code",
      "credits",
      "credits_remaining",
      "usage_event_id",
      "data_version",
      "methodology_version",
      "source_record_id"
    ]);
    expect(plan.console_reconciliation_gate.forbidden_fields).toEqual([
      "raw_api_key",
      "oauth_access_token",
      "oauth_refresh_token",
      "raw_prompt",
      "raw_generated_answer",
      "raw_document_body",
      "payment_identifier",
      "personal_contact"
    ]);
    expect(plan.compatibility_gate).toMatchObject({
      status_route: "GET /mcp/compatibility/status",
      target_protocol_version: "2025-03-26"
    });
    expect(plan.compatibility_gate.inspector.live_inspector_smoke).toBe(false);
    expect(plan.compatibility_gate.sdk.live_sdk_smoke).toBe(false);
    expect(plan.protocol_gate).toMatchObject({
      route: "POST /mcp/release-gates/protocol/plan",
      schema_compatibility_gate: {
        requested_tool_name: "get_quote_snapshot",
        required_scope: "quotes:read"
      }
    });
    expect(plan.protocol_gate.usage).toMatchObject({
      request_id: "req-mcp-target-clients-console-release-gate:protocol",
      request_id_visible: true
    });
    expect(plan.auth_limits_gate.oauth_scope_gate.authorize_plan.consent).toMatchObject({
      clear_scope_display: true,
      requested_scope_count: 3
    });
    expect(plan.auth_limits_gate.api_key_gate.rotate_plan.api_key).toMatchObject({
      live_secret_generated: false,
      old_key_future_calls_denied_after_rotation: true
    });
    expect(plan.auth_limits_gate.error_stability_gate.limiter_error_codes).toEqual([
      "RATE_LIMITED",
      "BUDGET_EXCEEDED"
    ]);
    expect(Object.values(plan.validation).every(Boolean)).toBe(true);
    expect(plan.release_gate).toMatchObject({
      blockers: [
        "live_target_client_e2e_missing",
        "developer_console_ui_missing",
        "live_console_log_store_missing",
        "live_usage_ledger_reads_missing",
        "public_status_page_deploy_missing"
      ],
      gate_status: "blocked_live_mcp_target_clients_console_validation",
      no_live_release_claim: true,
      required_signoffs: [
        "platform",
        "developer-relations",
        "support",
        "billing",
        "data-rights"
      ]
    });
    expect(plan.usage).toMatchObject({
      credits: 0,
      request_id: "req-mcp-target-clients-console-release-gate",
      rows: 7,
      usage_reconciliation_status: "planned_no_live"
    });
  });

  it("plans MCP Developer Console backend payload without live Console surfaces", () => {
    const plan = createMcpDeveloperConsolePlan({
      clientName: "mcp-inspector",
      clientVersion: "0.16.0",
      requestId: "req-mcp-developer-console",
      usagePlanCode: "developer",
      usedCredits: 12,
      workspaceId: "workspace_mcp"
    });

    expect(MCP_DEVELOPER_CONSOLE_VERSION).toBe(
      "2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0"
    );
    expect(getMcpDeveloperConsoleCapabilities()).toMatchObject({
      api_key_create_route: "POST /mcp/api-keys/create/plan",
      api_key_secret_generation_live: false,
      compatibility_status_route: "GET /mcp/compatibility/status",
      connection_guide_artifact: "docs/public/mcp.md",
      developer_console_live: false,
      first_call_time_target_minutes: 10,
      frontend_rendering: false,
      live_console_log_store: false,
      live_usage_ledger_reads: false,
      oauth_runtime_route: "GET /mcp/oauth/runtime",
      package: "@aiphabee/mcp-runtime",
      protocol_route: "POST /mcp",
      route: "POST /mcp/developer-console/plan",
      runtime_route: "GET /mcp/runtime",
      status: "mcp_developer_console_backend_scaffold",
      usage_request_id_visible: true,
      usage_reconciliation_ready: true,
      version: MCP_DEVELOPER_CONSOLE_VERSION
    });
    expect(plan).toMatchObject({
      data_version: MCP_DEVELOPER_CONSOLE_VERSION,
      developer_console_live: false,
      frontend_rendering: false,
      live_api_key_generation: false,
      live_console_log_store: false,
      live_oauth_provider: false,
      live_tool_execution: false,
      live_usage_ledger_reads: false,
      methodology_version: MCP_DEVELOPER_CONSOLE_VERSION,
      model_calls: false,
      persistent_writes: false,
      route: "POST /mcp/developer-console/plan",
      sql_emitted: false,
      status: "planned_no_live_developer_console",
      version: MCP_DEVELOPER_CONSOLE_VERSION
    });
    expect(plan.release_checks.map((check) => check.check)).toEqual(
      MCP_DEVELOPER_CONSOLE_REQUIRED_CHECKS
    );
    expect(plan.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(plan.connection_guide).toMatchObject({
      artifact: "docs/public/mcp.md",
      first_call_time_target_minutes: 10,
      protocol_route: "POST /mcp"
    });
    expect(plan.connection_guide.steps.map((step) => step.step)).toEqual([
      "choose_credential",
      "initialize",
      "list_tools",
      "first_tool_call"
    ]);
    expect(plan.credentials).toMatchObject({
      api_key: {
        create_route: "POST /mcp/api-keys/create/plan",
        live_secret_generation: false,
        one_time_display: true,
        server_to_server_only: true
      },
      oauth: {
        authorize_route: "POST /mcp/oauth/authorize/plan",
        live_oauth_provider: false,
        pkce_methods: ["S256"],
        token_storage_live: false
      }
    });
    expect(plan.scope_panel.scope_catalog.map((definition) => definition.scope)).toContain(
      "market.read"
    );
    expect(plan.quota_panel).toMatchObject({
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      request_id: "req-mcp-developer-console",
      request_id_visible: true
    });
    expect(plan.request_log_panel.fields).toEqual([
      "request_id",
      "workspace_id",
      "client_name",
      "client_version",
      "credential_kind",
      "credential_reference",
      "scope",
      "tool_name",
      "tool_version",
      "status",
      "standard_error_code",
      "credits",
      "credits_remaining",
      "usage_event_id",
      "data_version",
      "methodology_version",
      "source_record_id"
    ]);
    expect(plan.request_log_panel.forbidden_fields).toContain("raw_api_key");
    expect(plan.request_log_panel.sample_rows[0]).toMatchObject({
      client_name: "mcp-inspector",
      credential_kind: "oauth_connection",
      request_id: "req-mcp-developer-console:example-tools-call",
      scope: "quotes:read",
      tool_name: "get_quote_snapshot",
      workspace_id: "workspace_mcp"
    });
    expect(plan.examples.calls.map((example) => example.method)).toEqual([
      "initialize",
      "tools/list",
      "tools/call"
    ]);
    expect(plan.examples.calls.every((example) => example.live_execution === false)).toBe(true);
    expect(plan.release_gate).toMatchObject({
      blockers: [
        "developer_console_ui_missing",
        "live_console_log_store_missing",
        "live_usage_ledger_reads_missing",
        "live_api_key_secret_generation_missing",
        "live_oauth_provider_missing",
        "live_target_client_e2e_missing"
      ],
      gate_status: "blocked_live_mcp_developer_console_validation",
      no_live_release_claim: true
    });
    expect(Object.values(plan.validation).every(Boolean)).toBe(true);
    expect(plan.usage).toMatchObject({
      credits: 0,
      request_id: "req-mcp-developer-console",
      rows: 8,
      usage_reconciliation_status: "planned_no_live"
    });
  });

  it("plans MCP resources prompts and interactive apps client maturity without live publication", () => {
    const plan = createMcpClientMaturityPlan({
      clientName: "ChatGPT Connector",
      clientVersion: "apps-sdk-preview",
      requestId: "req-mcp-client-maturity",
      requestedFeature: "interactive apps",
      usagePlanCode: "developer",
      workspaceId: "workspace_mcp"
    });

    expect(MCP_CLIENT_MATURITY_VERSION).toBe(
      "2026-06-22.phase4.mcp-client-maturity-scaffold.v0"
    );
    expect(getMcpClientMaturityCapabilities()).toMatchObject({
      fallback_mode: "tools_only",
      interactive_apps_live: false,
      live_client_e2e_passed: false,
      package: "@aiphabee/mcp-runtime",
      prompts_live: false,
      resources_live: false,
      route: "POST /mcp/client-maturity/plan",
      runtime_route: "GET /mcp/runtime",
      status: "mcp_client_maturity_scaffold",
      target_client_matrix_ready: true,
      tools_only_fallback_ready: true,
      version: MCP_CLIENT_MATURITY_VERSION
    });
    expect(getMcpClientMaturityCapabilities().required_checks).toEqual(
      MCP_CLIENT_MATURITY_REQUIRED_CHECKS
    );
    expect(plan).toMatchObject({
      data_version: MCP_CLIENT_MATURITY_VERSION,
      developer_console_live: false,
      frontend_rendering: false,
      live_client_e2e_passed: false,
      live_db_writes: false,
      live_tool_execution: false,
      methodology_version: MCP_CLIENT_MATURITY_VERSION,
      model_calls: false,
      persistent_writes: false,
      route: "POST /mcp/client-maturity/plan",
      sql_emitted: false,
      status: "planned_no_live_mcp_client_maturity",
      version: MCP_CLIENT_MATURITY_VERSION
    });
    expect(plan.client_maturity_gate).toMatchObject({
      candidate_feature: "interactive_apps",
      requested_client: "chatgpt_connector",
      status: "client_maturity_assessment_only"
    });
    expect(plan.client_maturity_gate.matrix.map((client) => client.client_name)).toEqual([
      "mcp_inspector",
      "typescript_sdk_client",
      "claude_desktop",
      "cursor",
      "chatgpt_connector"
    ]);
    expect(
      plan.client_maturity_gate.matrix.every(
        (client) =>
          client.fallback_mode === "tools_only" &&
          client.live_e2e_passed === false &&
          client.resources.live_enabled === false &&
          client.prompts.live_enabled === false &&
          client.interactive_apps.live_enabled === false &&
          client.tools.live_execution === false
      )
    ).toBe(true);
    expect(plan.publication_policy).toEqual({
      component_widgets_live: false,
      fallback_to_tools_only: true,
      interactive_apps_live: false,
      prompts_live: false,
      resources_live: false,
      tools_call_live_execution: false,
      tool_result_embedded_resources_live: false
    });
    expect(plan.reference_urls).toEqual([
      "https://modelcontextprotocol.io/specification/2025-11-25/server/resources",
      "https://modelcontextprotocol.io/specification/2025-11-25/server/prompts",
      "https://developers.openai.com/apps-sdk/concepts/mcp-server"
    ]);
    expect(plan.release_checks.map((check) => check.check)).toEqual([
      "target_clients_capability_matrix_present",
      "resources_support_guarded_by_client_maturity",
      "prompts_support_guarded_by_client_maturity",
      "interactive_apps_support_blocked_until_client_stable",
      "fallback_to_tools_only_documented",
      "no_live_resources_prompts_apps_claim"
    ]);
    expect(Object.values(plan.validation).every(Boolean)).toBe(true);
    expect(plan.release_gate).toMatchObject({
      blockers: [
        "live_resources_e2e_missing",
        "live_prompts_e2e_missing",
        "interactive_apps_client_stability_missing",
        "client_capability_version_matrix_missing",
        "apps_sdk_security_review_missing"
      ],
      gate_status: "blocked_live_mcp_client_maturity_validation",
      no_live_release_claim: true
    });
    expect(plan.target_clients_console_gate).toMatchObject({
      gate_status: "blocked_live_mcp_target_clients_console_validation",
      route: "POST /mcp/release-gates/target-clients-console/plan"
    });
    expect(plan.usage).toMatchObject({
      credits: 0,
      request_id: "req-mcp-client-maturity",
      rows: 6,
      usage_reconciliation_status: "planned_no_live"
    });
  });

  it("blocks MCP client maturity assessment for unknown clients", () => {
    const plan = createMcpClientMaturityPlan({
      clientName: "unknown-client",
      requestId: "req-mcp-client-maturity-unknown",
      requestedFeature: "resources"
    });

    expect(plan.status).toBe("blocked_unknown_client");
    expect(plan.publication_policy.resources_live).toBe(false);
    expect(plan.publication_policy.prompts_live).toBe(false);
    expect(plan.publication_policy.interactive_apps_live).toBe(false);
    expect(plan.release_gate.no_live_release_claim).toBe(true);
  });

  it("maps MCP runtime input failures to stable PRD standard errors", () => {
    expect(MCP_STANDARD_ERROR_CODES_VERSION).toBe(
      "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0"
    );
    expect(MCP_STANDARD_ERROR_CODES).toEqual(
      getMcpRuntimeCapabilities().standard_error_codes
    );
    expect(getMcpRuntimeStandardError("MCP_REDISTRIBUTION_RIGHTS_REQUIRED")).toBe(
      "DATA_NOT_LICENSED"
    );
    expect(getMcpRuntimeStandardError("TOOL_SCOPE_REQUIRED")).toBe("SCOPE_DENIED");
    expect(getMcpRuntimeStandardError("TOOL_LIMIT_EXCEEDED")).toBe("TOO_MANY_ROWS");
    expect(getMcpRuntimeStandardError("TOOL_TIME_RANGE_EXCEEDED")).toBe(
      "OUT_OF_RANGE"
    );
    expect(getMcpRuntimeStandardError("TOOL_NOT_REGISTERED")).toBe("SCOPE_DENIED");
    expect(getMcpRuntimeStandardError("MCP_CREDENTIAL_REVOKED")).toBe("AUTH_REQUIRED");
    expect(getMcpStandardErrorDefinition("RATE_LIMITED")).toMatchObject({
      category: "limit",
      client_action: "retry_after",
      retry_after_required: true
    });
    expect(getMcpStandardErrorDefinition("DATA_QUALITY_HOLD")).toMatchObject({
      category: "data",
      recoverable: true
    });
  });

  it("reports revocation enforcement capabilities for OAuth connections and API keys", () => {
    expect(MCP_REVOCATION_ENFORCEMENT_VERSION).toBe(
      "2026-06-21.phase2.mcp-revocation-enforcement-scaffold.v0"
    );
    expect(getMcpRevocationEnforcementCapabilities()).toMatchObject({
      api_key_revoke_route: "POST /mcp/api-keys/revoke/plan",
      api_key_rotation_old_key_denied: true,
      credential_kinds: ["oauth_connection", "api_key"],
      denied_statuses: ["revoked", "rotated", "unknown"],
      enforced_before_tool_execution: true,
      enforced_before_usage_debit: true,
      live_auth_middleware: false,
      oauth_revoke_route: "POST /mcp/oauth/revoke/plan",
      persistent_writes: false,
      protocol_route: "POST /mcp",
      route: "POST /mcp/revocations/enforce/plan",
      runtime_route: "GET /mcp/runtime",
      standard_error_code: "AUTH_REQUIRED",
      status: "mcp_revocation_enforcement_scaffold"
    });
  });

  it("plans revocation enforcement with allow and immediate denial decisions", () => {
    const activePlan = createMcpRevocationEnforcementPlan({
      connectionId: "mcp_connection_active",
      credentialKind: "oauth_connection",
      credentialStatus: "active",
      method: "tools/list",
      requestId: "req-mcp-revocation-active"
    });

    expect(activePlan).toMatchObject({
      action: "enforce_revocation",
      credential: {
        connection_id: "mcp_connection_active",
        credential_kind: "oauth_connection",
        credential_reference: "mcp_connection_active",
        raw_credential_stored: false,
        status: "active"
      },
      denial: {
        client_action: "reauthorize",
        decision: "allow_planned",
        denied: false,
        enforced_before_tool_execution: true,
        enforced_before_usage_debit: true,
        standard_error_code: "AUTH_REQUIRED"
      },
      live_auth_middleware: false,
      persistent_writes: false,
      route: "POST /mcp/revocations/enforce/plan",
      status: "planned_no_live_revocation_enforcement"
    });

    const deniedPlan = createMcpRevocationEnforcementPlan({
      credentialKind: "api_key",
      credentialStatus: "rotated",
      keyId: "mcp_key_old",
      method: "tools/call",
      reason: "scheduled_rotation",
      requestId: "req-mcp-revocation-denied",
      rotatedAt: "2026-06-21T11:20:00.000Z",
      toolName: "get_quote_snapshot"
    });

    expect(deniedPlan).toMatchObject({
      credential: {
        credential_kind: "api_key",
        credential_reference: "mcp_key_old",
        key_id: "mcp_key_old",
        status: "rotated"
      },
      denial: {
        decision: "deny_rotated",
        denied: true,
        immediate_failure_after_rotation: true,
        standard_error_code: "AUTH_REQUIRED"
      },
      method: "tools/call",
      rotated_at: "2026-06-21T11:20:00.000Z",
      tool_name: "get_quote_snapshot"
    });
  });

  it("reports OAuth PKCE scope and revocation capabilities", () => {
    expect(getMcpOAuthCapabilities()).toMatchObject({
      authorize_route: "POST /mcp/oauth/authorize/plan",
      live_oauth_provider: false,
      package: "@aiphabee/mcp-runtime",
      pkce_methods: ["S256"],
      revoke_route: "POST /mcp/oauth/revoke/plan",
      runtime_route: "GET /mcp/oauth/runtime",
      scopes_revocable: true,
      status: "mcp_oauth_pkce_scaffold",
      third_party_token_passthrough: false,
      token_route: "POST /mcp/oauth/token/plan"
    });
    expect(getMcpOAuthCapabilities().scope_catalog.map((scope) => scope.scope)).toEqual([
      "security.read",
      "market.read",
      "fundamentals.read",
      "filings.read",
      "analytics.run",
      "portfolio.read",
      "alerts.write",
      "exports.read",
      "admin.usage.read"
    ]);
  });

  it("reports server-to-server API key lifecycle capabilities", () => {
    expect(getMcpApiKeyCapabilities()).toMatchObject({
      api_key_live: false,
      create_route: "POST /mcp/api-keys/create/plan",
      hash_algorithm: "hmac_sha256_with_pepper_planned",
      hash_storage_required: true,
      ip_allowlist_supported: true,
      one_time_display: true,
      revoke_route: "POST /mcp/api-keys/revoke/plan",
      rotate_route: "POST /mcp/api-keys/rotate/plan",
      rotation_supported: true,
      runtime_route: "GET /mcp/api-keys/runtime",
      server_to_server_only: true,
      status: "mcp_api_key_scaffold"
    });
    expect(getMcpApiKeyCapabilities().supported_scopes).toContain("market.read");
  });

  it("plans API key creation with hash-only storage and one-time display metadata", () => {
    const plan = createMcpApiKeyCreatePlan({
      ipAllowlist: ["203.0.113.10", "2001:db8::/48"],
      keyName: "mcp-server-prod",
      ownerId: "owner_platform",
      requestId: "req-mcp-api-key-create",
      requestedScopes: ["security.read", "market.read"],
      rotationAfterDays: 60,
      workspaceId: "workspace_mcp"
    });

    expect(plan).toMatchObject({
      action: "create",
      api_key: {
        issued: false,
        key_name: "mcp-server-prod",
        key_status: "planned_no_live",
        live_secret_generated: false
      },
      api_key_live: false,
      frontend_rendering: false,
      hash_storage: {
        hash_algorithm: "hmac_sha256_with_pepper_planned",
        key_hash_stored: true,
        key_last_four_stored: true,
        pepper_required: true,
        raw_key_stored: false,
        storage_status: "planned_no_live"
      },
      ip_restrictions: {
        allowlist: ["203.0.113.10", "2001:db8::/48"],
        ip_allowlist_supported: true,
        validated: true
      },
      key_material: {
        key_material_returned: false,
        key_prefix: "aipb_srv_",
        one_time_display: true
      },
      route: "POST /mcp/api-keys/create/plan",
      rotation: {
        default_rotation_after_days: 60,
        rotatable: true,
        rotate_route: "POST /mcp/api-keys/rotate/plan"
      },
      server_to_server: {
        allowed_only: true,
        browser_use_allowed: false
      },
      status: "planned_no_live_api_key"
    });
    expect(plan.scope_binding).toMatchObject({
      requested_scopes: ["security.read", "market.read"],
      scopes_bound_to_key: true
    });
    expect(plan.scope_binding.scope_grants.map((scope) => scope.scope)).toEqual([
      "security.read",
      "market.read"
    ]);
  });

  it("plans API key rotation with old-key future calls denied", () => {
    const plan = createMcpApiKeyRotatePlan({
      ipAllowlist: ["203.0.113.10/32"],
      keyId: "mcp_key_123",
      reason: "scheduled_rotation",
      requestId: "req-mcp-api-key-rotate",
      requestedScopes: ["analytics.run"],
      rotationAfterDays: 30
    });

    expect(plan).toMatchObject({
      action: "rotate",
      api_key: {
        key_id: "mcp_key_123",
        live_secret_generated: false,
        new_key_material_display_once: true,
        old_key_future_calls_denied_after_rotation: true,
        rotation_overlap_seconds: 0,
        rotation_status: "planned_no_live"
      },
      reason: "scheduled_rotation",
      route: "POST /mcp/api-keys/rotate/plan",
      rotation: {
        next_rotation_after_days: 30,
        rotatable: true
      },
      status: "planned_no_live_api_key"
    });
  });

  it("plans API key revocation so new calls fail after revoke", () => {
    const plan = createMcpApiKeyRevokePlan({
      keyId: "mcp_key_123",
      reason: "compromised",
      requestId: "req-mcp-api-key-revoke"
    });

    expect(plan).toMatchObject({
      action: "revoke",
      api_key_live: false,
      key_id: "mcp_key_123",
      reason: "compromised",
      revocation_plan: {
        future_calls_denied_after_revoke: true,
        key_hash_disabled: "planned",
        live_invalidation: false,
        revoke_status: "planned_no_live"
      },
      route: "POST /mcp/api-keys/revoke/plan",
      status: "planned_no_live_api_key"
    });
  });

  it("rejects raw API key material and invalid IP allowlists", () => {
    expect(() =>
      createMcpApiKeyCreatePlan({
        keyName: "bad-key",
        rawApiKey: "raw-secret-material",
        requestId: "req-mcp-api-key-raw",
        requestedScopes: ["market.read"]
      })
    ).toThrow(McpRuntimeInputError);

    expect(() =>
      createMcpApiKeyCreatePlan({
        ipAllowlist: ["not-an-ip"],
        keyName: "bad-ip",
        requestId: "req-mcp-api-key-bad-ip",
        requestedScopes: ["market.read"]
      })
    ).toThrow(McpRuntimeInputError);
  });

  it("plans OAuth authorization with S256 PKCE and clear revocable scopes", () => {
    const plan = createMcpOAuthAuthorizePlan({
      clientId: "client_mcp_inspector",
      codeChallenge: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO0123456789_-",
      codeChallengeMethod: "S256",
      redirectUri: "https://client.example/oauth/callback",
      requestId: "req-mcp-oauth-authorize",
      requestedScopes: ["security.read", "market.read", "analytics.run"],
      userId: "user_internal_alpha",
      workspaceId: "workspace_mcp"
    });

    expect(plan).toMatchObject({
      action: "authorize",
      authorization_code: {
        code_emitted: false,
        expires_in_seconds: 300,
        one_time_use: true,
        status: "planned_no_live",
        token_exchange_route: "POST /mcp/oauth/token/plan"
      },
      client_id: "client_mcp_inspector",
      consent: {
        clear_scope_display: true,
        requested_scope_count: 3,
        user_consent_required: true
      },
      live_oauth_provider: false,
      oauth_flow: "authorization_code_pkce",
      pkce: {
        code_challenge_method: "S256",
        code_verifier_stored: false,
        plain_method_allowed: false
      },
      revocation: {
        revoke_route: "POST /mcp/oauth/revoke/plan",
        revocable: true
      },
      route: "POST /mcp/oauth/authorize/plan",
      status: "planned_no_live_oauth",
      third_party_token_passthrough: false,
      token_issued: false
    });
    expect(plan.consent.scopes.map((scope) => scope.scope)).toEqual([
      "security.read",
      "market.read",
      "analytics.run"
    ]);
    expect(plan.consent.scopes.every((scope) => scope.revocable)).toBe(true);
  });

  it("plans OAuth token exchange without issuing or passing through tokens", () => {
    const plan = createMcpOAuthTokenPlan({
      authorizationCode: "auth_code_placeholder",
      clientId: "client_mcp_inspector",
      codeVerifier: "verifier_placeholder",
      requestId: "req-mcp-oauth-token",
      requestedScopes: ["security.read", "market.read"]
    });

    expect(plan).toMatchObject({
      action: "token",
      authorization_code: {
        authorization_code_received: true,
        one_time_use_required: true
      },
      live_oauth_provider: false,
      pkce_verification: {
        code_verifier_received: true,
        verification_status: "planned_no_live",
        verifier_hash_stored: false
      },
      route: "POST /mcp/oauth/token/plan",
      scope_binding: {
        requested_scopes: ["security.read", "market.read"],
        scopes_bound_to_token: true
      },
      status: "planned_no_live_oauth",
      third_party_token_passthrough: false,
      token: {
        access_token_issued: false,
        audience: "aiphabee-mcp",
        expires_in_seconds: 900,
        refresh_token_issued: false
      }
    });
  });

  it("plans OAuth revocation so future calls are denied after revoke", () => {
    const plan = createMcpOAuthRevokePlan({
      connectionId: "mcp_connection_1",
      reason: "user_disconnect",
      requestId: "req-mcp-oauth-revoke"
    });

    expect(plan).toMatchObject({
      action: "revoke",
      connection_id: "mcp_connection_1",
      live_oauth_provider: false,
      reason: "user_disconnect",
      revocation_plan: {
        future_calls_denied_after_revoke: true,
        revoke_status: "planned_no_live",
        scope_grants_removed: "planned",
        token_invalidation_live: false
      },
      route: "POST /mcp/oauth/revoke/plan",
      status: "planned_no_live_oauth"
    });
  });

  it("rejects OAuth authorization without S256 PKCE or supported scopes", () => {
    expect(() =>
      createMcpOAuthAuthorizePlan({
        clientId: "client_mcp_inspector",
        codeChallenge: "short",
        codeChallengeMethod: "plain",
        redirectUri: "https://client.example/oauth/callback",
        requestId: "req-mcp-oauth-invalid",
        requestedScopes: ["market.read"]
      })
    ).toThrow(McpRuntimeInputError);

    expect(() =>
      createMcpOAuthAuthorizePlan({
        clientId: "client_mcp_inspector",
        codeChallenge: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO0123456789_-",
        codeChallengeMethod: "S256",
        redirectUri: "https://client.example/oauth/callback",
        requestId: "req-mcp-oauth-bad-scope",
        requestedScopes: ["unknown.scope"]
      })
    ).toThrow(McpRuntimeInputError);
  });

  it("plans initialize for trusted origins without live OAuth or tool execution", () => {
    const plan = createMcpProtocolPlan({
      clientName: "mcp-inspector",
      clientVersion: "0.16.0",
      method: "initialize",
      origin: "http://localhost:5173",
      requestId: "req-mcp-init"
    });

    expect(plan).toMatchObject({
      api_key_live: false,
      default_deny: true,
      endpoint: "/mcp",
      live_tool_execution: false,
      method: "initialize",
      oauth_live: false,
      origin_check: {
        origin: "http://localhost:5173",
        required: true,
        valid: true
      },
      protocol: {
        json_rpc: "2.0",
        streamable_http: true
      },
      rights_gate: {
        blocked_reason: "MCP_API_REDISTRIBUTION_RIGHTS_NOT_CONFIRMED",
        default_deny: true,
        mcp_api_redistribution_rights_confirmed: false,
        web_rights_do_not_imply_mcp: true
      },
      status: "planned_default_deny",
      transport: "streamable_http"
    });
    expect(plan.initialize).toMatchObject({
      capabilities: {
        tools: {
          listChanged: false
        }
      },
      protocol_version: "2025-03-26"
    });
    expect(plan.response_shape).toMatchObject({
      mcp_error_detail_fields: [
        "category",
        "client_action",
        "internal_code",
        "mcp_error_version",
        "recoverable",
        "request_id",
        "retry_after_required",
        "source_record_id"
      ],
      standard_error_code_version:
        "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
      standard_response_envelope: true,
      structured_content_required: true
    });
    expect(plan.response_shape.standard_error_definitions).toHaveLength(
      MCP_STANDARD_ERROR_CODES.length
    );
  });

  it("returns an empty tools/list while MCP redistribution rights are unconfirmed", () => {
    const plan = createMcpProtocolPlan({
      method: "tools/list",
      origin: "https://app.aiphabee.com",
      requestId: "req-mcp-tools-list"
    });

    expect(plan.status).toBe("planned_default_deny");
    expect(plan.tools_list).toMatchObject({
      blocked_tool_count: 16,
      returned_tool_count: 0,
      schema_snapshot: {
        returned_schema_count: 0,
        runtime_schema_serving: true,
        schema_catalog_available_after_rights_gate: true,
        schema_snapshot_version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
        schema_source_contract: "deploy/tools/tool-schemas.contract.json",
        tool_schema_count: 16,
        tools_list_schema_snapshot: true
      },
      tool_catalog_available_after_rights_gate: true,
      tools: []
    });
    expect(plan.usage.rows).toBe(0);
  });

  it("returns versioned tool descriptors with deprecation policy when rights are confirmed", () => {
    const plan = createMcpProtocolPlan({
      mcpRedistributionRightsConfirmed: true,
      method: "tools/list",
      origin: "https://app.aiphabee.com",
      requestId: "req-mcp-tools-list-versioned"
    });

    expect(plan.tools_list?.returned_tool_count).toBe(16);
    expect(
      plan.tools_list?.tools.every(
        (tool) =>
          tool.public_version === `${tool.name}@1` &&
          tool.major_version === 1 &&
          tool.breaking_changes_require_new_major &&
          tool.deprecation.status === "active" &&
          tool.deprecation.minimum_notice_days === 90 &&
          tool.retrieval_limits.enforced_before_execution &&
          tool.retrieval_limits.plan_or_rights_bypass_blocked &&
          tool.retrieval_limits.row_limit.max_limit >= 1 &&
          tool.schema_snapshot.schema_snapshot_version ===
            MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION &&
          tool.schema_snapshot.input_schema.id === tool.input_schema_id &&
          tool.schema_snapshot.input_schema.additional_properties_allowed === false &&
          tool.schema_snapshot.output_schema.id === tool.output_schema_id &&
          tool.schema_snapshot.output_schema.structured_content_required === true
      )
    ).toBe(true);
    expect(plan.tools_list?.schema_snapshot).toMatchObject({
      returned_schema_count: 16,
      runtime_schema_serving: true,
      schema_catalog_available_after_rights_gate: true,
      tool_schema_count: 16,
      tools_list_schema_snapshot: true
    });
  });

  it("rejects untrusted origins before tool discovery", () => {
    expect(() =>
      createMcpProtocolPlan({
        method: "tools/list",
        origin: "https://evil.example",
        requestId: "req-mcp-origin-denied"
      })
    ).toThrow(McpRuntimeInputError);
  });

  it("rejects tools/call while MCP redistribution rights are unconfirmed", () => {
    expect(() =>
      createMcpProtocolPlan({
        method: "tools/call",
        origin: "https://app.aiphabee.com",
        requestId: "req-mcp-tool-call",
        toolName: "get_quote_snapshot"
      })
    ).toThrow(McpRuntimeInputError);
  });

  it("rejects revoked MCP credentials before tools/call execution planning", () => {
    try {
      createMcpProtocolPlan({
        connectionId: "mcp_connection_revoked",
        credentialKind: "oauth_connection",
        credentialStatus: "revoked",
        grantedScopes: ["quotes:read"],
        mcpRedistributionRightsConfirmed: true,
        method: "tools/call",
        origin: "https://app.aiphabee.com",
        requestId: "req-mcp-revoked-tool-call",
        revokedAt: "2026-06-21T11:20:00.000Z",
        toolArguments: {
          instrument_id: "HK:00700"
        },
        toolName: "get_quote_snapshot"
      });
      throw new Error("expected revoked credential to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(McpRuntimeInputError);
      expect((error as McpRuntimeInputError).code).toBe("MCP_CREDENTIAL_REVOKED");
      expect((error as McpRuntimeInputError).details).toMatchObject({
        credentialKind: "oauth_connection",
        credentialStatus: "revoked",
        decision: "deny_revoked",
        enforcedBeforeToolExecution: true,
        standardErrorCode: "AUTH_REQUIRED"
      });
    }
    expect(getMcpRuntimeStandardError("MCP_CREDENTIAL_REVOKED")).toBe("AUTH_REQUIRED");
  });

  it("plans tools/call without live execution when rights and scope are present", () => {
    const plan = createMcpProtocolPlan({
      connectionId: "mcp_connection_active",
      credentialKind: "oauth_connection",
      credentialStatus: "active",
      grantedScopes: ["quotes:read"],
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin: "https://app.aiphabee.com",
      requestId: "req-mcp-tool-call-planned",
      toolArguments: {
        instrument_id: "HK:00700"
      },
      toolName: "get_quote_snapshot"
    });

    expect(plan).toMatchObject({
      live_tool_execution: false,
      method: "tools/call",
      rights_gate: {
        mcp_api_redistribution_rights_confirmed: true
      },
      status: "planned_no_live_execution",
      revocation_enforcement: {
        credential: {
          credential_kind: "oauth_connection",
          status: "active"
        },
        denial: {
          decision: "allow_planned",
          denied: false,
          enforced_before_tool_execution: true
        }
      },
      tool_call: {
        input_schema_id: "tool.get_quote_snapshot.input.v0",
        input_validation: {
          additional_properties_allowed: false,
          arguments_valid: true,
          missing_required_arguments: [],
          required_fields_present: true,
          schema_validation_status: "validated",
          unsupported_arguments: []
        },
        live_execution: false,
        output_schema_id: "tool.get_quote_snapshot.output.v0",
        output_validation: {
          raw_text_only_response_allowed: false,
          structured_content_matches_output_schema: "planned_no_live",
          structured_content_required: true
        },
        requested_tool_name: "get_quote_snapshot",
        required_scope: "quotes:read",
        schema_validation: "validated",
        structured_content_validation: "planned_no_live"
      }
    });
  });

  it("plans bounded retrieval for paginated tools/call requests", () => {
    const plan = createMcpProtocolPlan({
      accountId: "acct_mcp",
      clientIp: "203.0.113.10",
      clientName: "mcp-inspector",
      clientVersion: "0.16.0",
      grantedScopes: ["prices:read"],
      ipRiskLevel: "medium",
      membershipId: "member_mcp",
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin: "https://app.aiphabee.com",
      requestId: "req-mcp-tool-call-bounded",
      toolArguments: {
        cursor: "cursor_1",
        from: "2026-01-02",
        instrument_id: "HK:00700",
        limit: 3,
        to: "2026-01-07"
      },
      toolName: "get_price_history",
      usagePlanCode: "developer",
      usedCredits: 120,
      workspaceId: "workspace_mcp"
    });

    expect(plan.tool_call?.bounded_retrieval).toMatchObject({
      cursor_pagination: {
        cursor: "cursor_1",
        cursor_bound_to_request: true,
        cursor_opaque: true,
        enabled: true,
        parameter: "cursor"
      },
      enforcement_status: "validated",
      max_rows_enforced: true,
      pagination_limits_version: "2026-06-21.phase2.mcp-pagination-limits-scaffold.v0",
      plan_or_rights_bypass_blocked: true,
      row_limit: {
        default_limit: 3,
        effective_limit: 3,
        max_limit: 3,
        requested_limit: 3,
        requested_limit_parameter: "limit",
        too_many_rows_error_code: "TOO_MANY_ROWS"
      },
      time_range_limit: {
        from: "2026-01-02",
        max_window_days: 366,
        out_of_range_error_code: "OUT_OF_RANGE",
        required: true,
        time_range_enforced: true,
        to: "2026-01-07",
        window_days: 6
      }
    });
    expect(plan.usage).toMatchObject({
      credit_limit: 10000,
      credits: 3,
      credits_remaining: 9877,
      credits_used: 120,
      request_id: "req-mcp-tool-call-bounded",
      request_id_visible: true,
      rows: 3,
      usage_reconciliation_status: "planned_no_live"
    });
    expect(plan.tool_call?.usage_envelope).toMatchObject({
      billable_credits: 0,
      channel: "mcp",
      credits_remaining_after_estimate: 9877,
      estimated_credits: 3,
      live_billing_reconciliation: false,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id: "req-mcp-tool-call-bounded",
      request_id_visible: true,
      usage_envelope_version: "2026-06-21.phase2.mcp-usage-envelope-scaffold.v0"
    });
    expect(plan.tool_call?.usage_envelope.quota_display).toMatchObject({
      channel: "mcp",
      request_id: "req-mcp-tool-call-bounded",
      request_id_visible: true,
      quota: {
        credit_limit: 10000,
        credits_pending: 3,
        credits_remaining: 9877,
        credits_used: 120,
        plan_code: "developer"
      },
      status: "planned_no_write"
    });
    expect(plan.tool_call?.usage_envelope.ledger_event).toMatchObject({
      event: {
        channel: "mcp",
        dataset: "price_history",
        meteredRows: 3,
        operation: "tool_call",
        requestId: "req-mcp-tool-call-bounded",
        toolName: "get_price_history",
        workspaceId: "workspace_mcp"
      },
      ledgerEntry: {
        billableState: "preview",
        creditDelta: 3
      },
      status: "write_planned",
      writeReady: false
    });
    expect(plan.tool_call?.tool_limits).toMatchObject({
      budget: {
        allowed_after_estimate: true,
        budget_exceeded: false,
        budget_exceeded_error_code: "BUDGET_EXCEEDED",
        estimated_credits: 3,
        failure_refund_required: true,
        live_debit: false,
        pre_debit_required: true,
        remaining_credits_after_estimate: 9877
      },
      concurrency: {
        high_cost_pool_isolated: true,
        live_inflight_reads: false,
        max_parallel: 8,
        pool: "mcp_standard"
      },
      durable_queue: {
        enqueue_status: "not_required",
        idempotency_key:
          "mcp_tool_limit_req-mcp-tool-call-bounded_rate_user=acct_mcp_workspace=workspace_mcp_client=mcp-inspector_tool=get_price_history_dataset=price_history_ip_risk=medium",
        live_queue_writes: false,
        queue_name: null,
        required: false
      },
      limiter_version: MCP_TOOL_LIMITER_VERSION,
      ordinary_pool_protection: true,
      rate_limit: {
        burst_limit: 10,
        live_window_reads: false,
        per_minute_limit: 60,
        rate_limited: false,
        rate_limited_error_code: "RATE_LIMITED",
        retry_after_seconds: null,
        status: "planned_no_live"
      },
      scope: {
        client: {
          name: "mcp-inspector",
          origin: "https://app.aiphabee.com",
          source: "request",
          version: "0.16.0"
        },
        dataset: {
          name: "price_history",
          source: "tool_registry_data_class"
        },
        dimension_keys: ["user", "workspace", "client", "tool", "dataset", "ip_risk"],
        ip_risk: {
          client_ip_present: true,
          live_reputation_lookup: false,
          raw_ip_stored: false,
          risk_level: "medium",
          source: "request"
        },
        tool: {
          name: "get_price_history",
          required_scope: "prices:read"
        },
        user: {
          account_id: "acct_mcp",
          membership_id: "member_mcp",
          source: "request"
        },
        workspace: {
          source: "request",
          workspace_id: "workspace_mcp"
        }
      },
      tool_name: "get_price_history",
      weight: {
        credit_weight: 3,
        high_cost: false,
        high_cost_threshold: 8,
        row_estimate: 3
      }
    });
  });

  it("plans high-cost MCP tools/call requests onto the isolated limiter pool", () => {
    const plan = createMcpProtocolPlan({
      accountId: "acct_mcp",
      clientIp: "203.0.113.10",
      clientName: "typescript-sdk-client",
      clientVersion: "1.29.0",
      grantedScopes: ["calendar:read"],
      ipRiskLevel: "high",
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin: "https://app.aiphabee.com",
      requestId: "req-mcp-tool-call-calendar-high-cost",
      toolArguments: {
        from: "2026-01-01",
        market: "HKEX",
        to: "2026-12-31"
      },
      toolName: "get_market_calendar",
      usagePlanCode: "developer",
      usedCredits: 120,
      workspaceId: "workspace_mcp"
    });

    expect(plan.tool_call?.bounded_retrieval).toMatchObject({
      row_limit: {
        default_limit: 366,
        effective_limit: 366,
        max_limit: 366,
        requested_limit: 366,
        requested_limit_parameter: null
      },
      time_range_limit: {
        from: "2026-01-01",
        max_window_days: 366,
        required: true,
        to: "2026-12-31",
        window_days: 365
      }
    });
    expect(plan.tool_call?.usage_envelope).toMatchObject({
      credits_remaining_after_estimate: 9514,
      estimated_credits: 366,
      persistent_writes: false,
      request_id: "req-mcp-tool-call-calendar-high-cost"
    });
    expect(plan.tool_call?.tool_limits).toMatchObject({
      budget: {
        allowed_after_estimate: true,
        budget_exceeded: false,
        budget_exceeded_error_code: "BUDGET_EXCEEDED",
        estimated_credits: 366,
        failure_refund_required: true,
        live_debit: false,
        pre_debit_required: true,
        remaining_credits_after_estimate: 9514
      },
      concurrency: {
        high_cost_pool_isolated: true,
        live_inflight_reads: false,
        max_parallel: 2,
        pool: "mcp_high_cost"
      },
      durable_queue: {
        enqueue_status: "planned_no_live",
        idempotency_key:
          "mcp_tool_limit_req-mcp-tool-call-calendar-high-cost_rate_user=acct_mcp_workspace=workspace_mcp_client=typescript-sdk-client_tool=get_market_calendar_dataset=market_calendar_ip_risk=high",
        live_queue_writes: false,
        queue_name: "mcp-high-cost",
        required: true
      },
      limiter_version: MCP_TOOL_LIMITER_VERSION,
      ordinary_pool_protection: true,
      rate_limit: {
        burst_limit: 10,
        live_window_reads: false,
        per_minute_limit: 60,
        rate_limited: false,
        rate_limited_error_code: "RATE_LIMITED",
        retry_after_seconds: null,
        status: "planned_no_live"
      },
      scope: {
        client: {
          name: "typescript-sdk-client",
          origin: "https://app.aiphabee.com",
          source: "request",
          version: "1.29.0"
        },
        dataset: {
          name: "market_calendar",
          source: "tool_registry_data_class"
        },
        dimension_keys: ["user", "workspace", "client", "tool", "dataset", "ip_risk"],
        ip_risk: {
          client_ip_present: true,
          live_reputation_lookup: false,
          raw_ip_stored: false,
          risk_level: "high",
          source: "request"
        },
        tool: {
          name: "get_market_calendar",
          required_scope: "calendar:read"
        },
        user: {
          account_id: "acct_mcp",
          membership_id: "membership_unresolved",
          source: "request"
        },
        workspace: {
          source: "request",
          workspace_id: "workspace_mcp"
        }
      },
      tool_name: "get_market_calendar",
      weight: {
        credit_weight: 366,
        high_cost: true,
        high_cost_threshold: 8,
        row_estimate: 366
      }
    });
  });

  it("rejects tools/call pagination that exceeds the maximum row limit", () => {
    expect(() =>
      createMcpProtocolPlan({
        grantedScopes: ["prices:read"],
        mcpRedistributionRightsConfirmed: true,
        method: "tools/call",
        origin: "https://app.aiphabee.com",
        requestId: "req-mcp-tool-call-limit-exceeded",
        toolArguments: {
          from: "2026-01-02",
          instrument_id: "HK:00700",
          limit: 4,
          to: "2026-01-07"
        },
        toolName: "get_price_history"
      })
    ).toThrow(McpRuntimeInputError);
  });

  it("rejects tools/call time ranges that exceed the maximum window", () => {
    expect(() =>
      createMcpProtocolPlan({
        grantedScopes: ["prices:read"],
        mcpRedistributionRightsConfirmed: true,
        method: "tools/call",
        origin: "https://app.aiphabee.com",
        requestId: "req-mcp-tool-call-window-exceeded",
        toolArguments: {
          from: "2024-01-01",
          instrument_id: "HK:00700",
          limit: 3,
          to: "2026-01-07"
        },
        toolName: "get_price_history"
      })
    ).toThrow(McpRuntimeInputError);
  });

  it("rejects tools/call arguments that miss required schema fields", () => {
    expect(() =>
      createMcpProtocolPlan({
        grantedScopes: ["quotes:read"],
        mcpRedistributionRightsConfirmed: true,
        method: "tools/call",
        origin: "https://app.aiphabee.com",
        requestId: "req-mcp-tool-call-missing-args",
        toolArguments: {},
        toolName: "get_quote_snapshot"
      })
    ).toThrow(McpRuntimeInputError);
  });

  it("rejects tools/call arguments outside the input schema", () => {
    expect(() =>
      createMcpProtocolPlan({
        grantedScopes: ["quotes:read"],
        mcpRedistributionRightsConfirmed: true,
        method: "tools/call",
        origin: "https://app.aiphabee.com",
        requestId: "req-mcp-tool-call-extra-args",
        toolArguments: {
          instrument_id: "HK:00700",
          sql: "select * from quotes"
        },
        toolName: "get_quote_snapshot"
      })
    ).toThrow(McpRuntimeInputError);
  });
});
