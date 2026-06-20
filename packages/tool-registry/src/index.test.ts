import { describe, expect, it } from "vitest";
import {
  getRegisteredToolNames,
  getToolRegistryCapabilities,
  validateRegisteredTools
} from "./index";

describe("tool registry scaffold", () => {
  it("registers the planned read-only P0 data tools with schema and permissions", () => {
    const capabilities = getToolRegistryCapabilities();

    expect(capabilities.status).toBe("shared_tool_registry_scaffold");
    expect(capabilities.tool_count).toBe(9);
    expect(capabilities.schema_ready).toBe(true);
    expect(capabilities.rights_aware).toBe(true);
    expect(capabilities.execution_ready).toBe(false);
    expect(capabilities.standard_response_envelope).toBe(true);
    expect(capabilities.handler_ready_tool_count).toBe(2);
    expect(capabilities.tools.find((tool) => tool.name === "resolve_security")).toMatchObject({
      execution: {
        handlerReady: true,
        mode: "read_only_scaffold"
      },
      status: "scaffold",
      testing: {
        goldenFixtureReady: true
      }
    });
    expect(
      capabilities.tools.find((tool) => tool.name === "get_security_profile")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        mode: "read_only_scaffold"
      },
      status: "scaffold",
      testing: {
        goldenFixtureReady: true
      }
    });
    expect(capabilities.tools.every((tool) => tool.schema.standardResponseEnvelope)).toBe(
      true
    );
    expect(capabilities.tools.every((tool) => tool.permissions.rightsAware)).toBe(true);
  });

  it("keeps registry names stable for agent and tool runtime policy", () => {
    expect(getRegisteredToolNames()).toEqual([
      "resolve_security",
      "get_security_profile",
      "get_market_calendar",
      "get_quote_snapshot",
      "get_price_history",
      "get_corporate_actions",
      "get_financial_facts",
      "get_data_lineage",
      "get_entitlements"
    ]);
  });

  it("rejects unregistered tools without allowing arbitrary SQL or URLs", () => {
    const result = validateRegisteredTools([
      "resolve_security",
      "sql.query",
      "fetch_url"
    ]);

    expect(result.allowedTools).toEqual(["resolve_security"]);
    expect(result.deniedTools).toEqual(["sql.query", "fetch_url"]);
  });
});
