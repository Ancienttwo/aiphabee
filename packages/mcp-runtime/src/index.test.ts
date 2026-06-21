import { describe, expect, it } from "vitest";
import {
  McpRuntimeInputError,
  createMcpProtocolPlan,
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
