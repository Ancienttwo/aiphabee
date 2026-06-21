import { describe, expect, it } from "vitest";
import {
  McpRuntimeInputError,
  createMcpApiKeyCreatePlan,
  createMcpApiKeyRevokePlan,
  createMcpApiKeyRotatePlan,
  createMcpOAuthAuthorizePlan,
  createMcpOAuthRevokePlan,
  createMcpOAuthTokenPlan,
  createMcpProtocolPlan,
  getMcpApiKeyCapabilities,
  getMcpOAuthCapabilities,
  getMcpRuntimeCapabilities
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
      oauth_authorize_route: "POST /mcp/oauth/authorize/plan",
      oauth_pkce_ready: true,
      oauth_revoke_route: "POST /mcp/oauth/revoke/plan",
      oauth_token_route: "POST /mcp/oauth/token/plan",
      scopes_revocable: true,
      third_party_token_passthrough: false
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
        live_execution: false,
        requested_tool_name: "get_quote_snapshot",
        required_scope: "quotes:read",
        schema_validation: "planned",
        structured_content_validation: "planned"
      }
    });
  });
});
