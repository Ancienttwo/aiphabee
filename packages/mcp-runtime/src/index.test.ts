import { describe, expect, it } from "vitest";
import {
  MCP_COMPATIBILITY_STATUS_VERSION,
  MCP_STANDARD_ERROR_CODES,
  MCP_STANDARD_ERROR_CODES_VERSION,
  MCP_TOOL_LIMITER_VERSION,
  McpRuntimeInputError,
  createMcpApiKeyCreatePlan,
  createMcpApiKeyRevokePlan,
  createMcpApiKeyRotatePlan,
  createMcpCompatibilityStatusPlan,
  createMcpOAuthAuthorizePlan,
  createMcpOAuthRevokePlan,
  createMcpOAuthTokenPlan,
  createMcpProtocolPlan,
  getMcpApiKeyCapabilities,
  getMcpOAuthCapabilities,
  getMcpRuntimeCapabilities,
  getMcpRuntimeStandardError,
  getMcpStandardErrorDefinition
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
      status: "mcp_endpoint_default_deny_scaffold",
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
      api_key_rotate_route: "POST /mcp/api-keys/rotate/plan",
      api_key_rotation_ready: true,
      api_key_runtime_route: "GET /mcp/api-keys/runtime",
      breaking_changes_require_new_major: true,
      deprecation_policy_ready: true,
      oauth_authorize_route: "POST /mcp/oauth/authorize/plan",
      oauth_pkce_ready: true,
      oauth_revoke_route: "POST /mcp/oauth/revoke/plan",
      oauth_token_route: "POST /mcp/oauth/token/plan",
      scopes_revocable: true,
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
      mcp_target_protocol_version: "2025-03-26",
      mcp_limiter_error_codes: ["RATE_LIMITED", "BUDGET_EXCEEDED"],
      mcp_limiter_live: false,
      mcp_tool_limiter_ready: true,
      mcp_tool_limiter_version: "2026-06-21.phase2.mcp-tool-limiter-scaffold.v0",
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
      blocked_tool_count: 9,
      returned_tool_count: 0,
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

    expect(plan.tools_list?.returned_tool_count).toBe(9);
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
          tool.retrieval_limits.row_limit.max_limit >= 1
      )
    ).toBe(true);
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

  it("plans tools/call without live execution when rights and scope are present", () => {
    const plan = createMcpProtocolPlan({
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
      grantedScopes: ["prices:read"],
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
        idempotency_key: "mcp_tool_limit_req-mcp-tool-call-bounded_get_price_history",
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
      grantedScopes: ["calendar:read"],
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
        idempotency_key: "mcp_tool_limit_req-mcp-tool-call-calendar-high-cost_get_market_calendar",
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
