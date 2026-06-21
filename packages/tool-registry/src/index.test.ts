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
    expect(capabilities.tool_count).toBe(16);
    expect(capabilities.schema_ready).toBe(true);
    expect(capabilities.rights_aware).toBe(true);
    expect(capabilities.execution_ready).toBe(false);
    expect(capabilities.standard_response_envelope).toBe(true);
    expect(capabilities.versioning_ready).toBe(true);
    expect(capabilities.deprecation_policy_ready).toBe(true);
    expect(capabilities.breaking_changes_require_new_major).toBe(true);
    expect(capabilities.pagination_limits_ready).toBe(true);
    expect(capabilities.pagination_or_rights_bypass_blocked).toBe(true);
    expect(capabilities.handler_ready_tool_count).toBe(16);
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
    expect(
      capabilities.tools.find((tool) => tool.name === "get_market_calendar")
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
    expect(
      capabilities.tools.find((tool) => tool.name === "get_quote_snapshot")
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
    expect(
      capabilities.tools.find((tool) => tool.name === "get_price_history")
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
    expect(
      capabilities.tools.find((tool) => tool.name === "get_corporate_actions")
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
    expect(
      capabilities.tools.find((tool) => tool.name === "get_financial_facts")
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
    expect(
      capabilities.tools.find((tool) => tool.name === "get_event_timeline")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        mode: "read_only_scaffold"
      },
      permissions: {
        dataClasses: [
          "announcements",
          "corporate_actions",
          "financial_facts",
          "market_calendar"
        ],
        requiredScope: "events:read"
      },
      retrieval: {
        cursorPagination: {
          enabled: true,
          parameter: "cursor"
        },
        rowLimit: {
          defaultLimit: 5,
          maxLimit: 5,
          parameter: "limit"
        },
        timeRangeLimit: {
          maxWindowDays: 366,
          required: true
        }
      },
      status: "scaffold",
      testing: {
        goldenFixtureReady: true
      }
    });
    for (const toolName of [
      "get_financial_ratios",
      "search_announcements",
      "get_announcement",
      "screen_securities",
      "compare_securities",
      "calculate_returns_risk"
    ]) {
      expect(capabilities.tools.find((tool) => tool.name === toolName)).toMatchObject({
        execution: {
          handlerReady: true,
          mode: "read_only_scaffold"
        },
        status: "scaffold",
        testing: {
          goldenFixtureReady: true
        }
      });
    }
    expect(
      capabilities.tools.find((tool) => tool.name === "get_data_lineage")
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
    expect(
      capabilities.tools.find((tool) => tool.name === "get_entitlements")
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
    expect(capabilities.tools.every((tool) => tool.lifecycle.majorVersion === 1)).toBe(
      true
    );
    expect(
      capabilities.tools.every(
        (tool) => tool.lifecycle.publicVersion === `${tool.name}@1`
      )
    ).toBe(true);
    expect(
      capabilities.tools.every(
        (tool) =>
          tool.lifecycle.breakingChangesRequireNewMajor &&
          tool.lifecycle.deprecation.status === "active" &&
          tool.lifecycle.deprecation.minimumNoticeDays === 90 &&
          tool.lifecycle.compatibility.oldMajorAvailableDuringNotice
      )
    ).toBe(true);
    expect(
      capabilities.tools.every(
        (tool) =>
          tool.retrieval.enforcedBeforeExecution &&
          tool.retrieval.planOrRightsBypassBlocked &&
          tool.retrieval.rowLimit.defaultLimit <= tool.retrieval.rowLimit.maxLimit &&
          tool.retrieval.rowLimit.maxLimit >= 1
      )
    ).toBe(true);
    expect(capabilities.tools.find((tool) => tool.name === "get_price_history")).toMatchObject({
      retrieval: {
        cursorPagination: {
          cursorBoundToRequest: true,
          cursorOpaque: true,
          enabled: true,
          parameter: "cursor"
        },
        rowLimit: {
          defaultLimit: 3,
          maxLimit: 3,
          parameter: "limit"
        },
        timeRangeLimit: {
          maxWindowDays: 366,
          required: true
        }
      }
    });
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
      "get_financial_ratios",
      "search_announcements",
      "get_announcement",
      "screen_securities",
      "compare_securities",
      "calculate_returns_risk",
      "get_event_timeline",
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
