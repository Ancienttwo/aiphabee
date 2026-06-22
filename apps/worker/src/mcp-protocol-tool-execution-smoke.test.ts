import { describe, expect, it } from "vitest";

import app from "./index";

const SMOKE_TOKEN = "mcp-smoke-token-0000000000000000";

interface ErrorBody {
  error: {
    code: string;
    detail?: {
      internal_code?: string;
      request_id?: string;
    };
  };
  ok: false;
}

interface SuccessBody {
  data: {
    live_tool_execution?: boolean;
    status?: string;
    tool_call?: {
      live_execution?: boolean;
      requested_tool_name?: string;
      structured_content_validation?: string;
    };
    tool_result?: {
      data?: {
        liveDataAccess?: boolean;
        status?: string;
        toolName?: string;
      };
      ok?: boolean;
      request_id?: string;
      route?: string;
      status_code?: number;
    };
  };
  ok: true;
}

describe("MCP protocol tools/call live execution smoke", () => {
  it("keeps public tools/call default-denied without the smoke token", async () => {
    const response = await app.request("/mcp", {
      body: JSON.stringify({
        method: "tools/call",
        params: {
          arguments: {
            instrument_id: "eq_hk_00700",
            mode: "delayed"
          },
          mcp_api_redistribution_rights_confirmed: true,
          name: "get_quote_snapshot",
          scopes: ["quotes:read"]
        }
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-public-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("DATA_NOT_LICENSED");
    expect(body.error.detail).toMatchObject({
      internal_code: "MCP_REDISTRIBUTION_RIGHTS_REQUIRED",
      request_id: "req-mcp-public-denied"
    });
  });

  it("executes a registered Worker tool route with a smoke token, rights, and scope", async () => {
    const response = await app.request(
      "/mcp",
      {
        body: JSON.stringify({
          method: "tools/call",
          params: {
            arguments: {
              instrument_id: "eq_hk_00700",
              mode: "delayed"
            },
            mcp_api_redistribution_rights_confirmed: true,
            name: "get_quote_snapshot",
            plan_code: "pro",
            scopes: ["quotes:read"],
            workspace_id: "ws_demo_pro"
          }
        }),
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "content-type": "application/json",
          origin: "https://app.aiphabee.com",
          "x-request-id": "req-mcp-live-tool-smoke"
        },
        method: "POST"
      },
      {
        AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as SuccessBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("executed_mcp_tool_call_smoke");
    expect(body.data.live_tool_execution).toBe(true);
    expect(body.data.tool_call).toMatchObject({
      live_execution: true,
      requested_tool_name: "get_quote_snapshot",
      structured_content_validation: "executed_synthetic_tool_route"
    });
    expect(body.data.tool_result).toMatchObject({
      ok: true,
      request_id: "req-mcp-live-tool-smoke:tool",
      route: "/tools/get-quote-snapshot",
      status_code: 200
    });
    expect(body.data.tool_result?.data).toMatchObject({
      liveDataAccess: false,
      status: "found",
      toolName: "get_quote_snapshot"
    });
  });

  it("denies smoke execution before route execution when required tool scope is missing", async () => {
    const response = await app.request(
      "/mcp",
      {
        body: JSON.stringify({
          method: "tools/call",
          params: {
            arguments: {
              instrument_id: "eq_hk_00700",
              mode: "delayed"
            },
            mcp_api_redistribution_rights_confirmed: true,
            name: "get_quote_snapshot",
            scopes: []
          }
        }),
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "content-type": "application/json",
          origin: "https://app.aiphabee.com",
          "x-request-id": "req-mcp-smoke-scope-denied"
        },
        method: "POST"
      },
      {
        AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
    expect(body.error.detail).toMatchObject({
      internal_code: "TOOL_SCOPE_REQUIRED",
      request_id: "req-mcp-smoke-scope-denied"
    });
  });

  it("denies revoked credentials before smoke route execution", async () => {
    const response = await app.request(
      "/mcp",
      {
        body: JSON.stringify({
          method: "tools/call",
          params: {
            arguments: {
              instrument_id: "eq_hk_00700",
              mode: "delayed"
            },
            credential_kind: "api_key",
            credential_status: "rotated",
            key_id: "mcp_key_old",
            mcp_api_redistribution_rights_confirmed: true,
            name: "get_quote_snapshot",
            scopes: ["quotes:read"]
          }
        }),
        headers: {
          authorization: ["Bearer", SMOKE_TOKEN].join(" "),
          "content-type": "application/json",
          origin: "https://app.aiphabee.com",
          "x-request-id": "req-mcp-smoke-revoked"
        },
        method: "POST"
      },
      {
        AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN: SMOKE_TOKEN
      }
    );
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("AUTH_REQUIRED");
    expect(body.error.detail).toMatchObject({
      internal_code: "MCP_CREDENTIAL_REVOKED",
      request_id: "req-mcp-smoke-revoked"
    });
  });
});
