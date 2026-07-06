import { describe, expect, it } from "vitest";
import {
  REGISTERED_TOOLS,
  getRegisteredToolNames,
  getToolRegistryCapabilities,
  validateRegisteredTools
} from "./index";

const REGISTERED_TOOL_COUNT = REGISTERED_TOOLS.length;

describe("tool registry scaffold", () => {
  it("registers the planned read-only P0 data tools with schema and permissions", () => {
    const capabilities = getToolRegistryCapabilities();

    expect(capabilities.status).toBe("shared_tool_registry_scaffold");
    expect(capabilities.tool_count).toBe(REGISTERED_TOOL_COUNT);
    expect(capabilities.schema_ready).toBe(true);
    expect(capabilities.rights_aware).toBe(true);
    expect(capabilities.execution_ready).toBe(false);
    expect(capabilities.standard_response_envelope).toBe(true);
    expect(capabilities.versioning_ready).toBe(true);
    expect(capabilities.deprecation_policy_ready).toBe(true);
    expect(capabilities.breaking_changes_require_new_major).toBe(true);
    expect(capabilities.pagination_limits_ready).toBe(true);
    expect(capabilities.pagination_or_rights_bypass_blocked).toBe(true);
    expect(capabilities.handler_ready_tool_count).toBe(REGISTERED_TOOL_COUNT);
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
    expect(
      capabilities.tools.find((tool) => tool.name === "analyze_public_technical_signal")
    ).toMatchObject({
      channels: ["web", "api"],
      execution: {
        allowArbitrarySql: false,
        allowArbitraryUrl: false,
        handlerReady: true,
        liveDataAccess: false,
        mode: "read_only_scaffold"
      },
      permissions: {
        dataClasses: [
          "public_observation_signal",
          "ephemeral_public_ohlcv",
          "technical_signal"
        ],
        requiredScope: "technical_analysis:read",
        rightsAware: true
      },
      retrieval: {
        rowLimit: {
          defaultLimit: 1,
          maxLimit: 1,
          parameter: null
        },
        timeRangeLimit: {
          maxWindowDays: 366,
          required: true
        }
      },
      schema: {
        inputSchemaId: "tool.analyze_public_technical_signal.input.v0",
        outputSchemaId: "tool.analyze_public_technical_signal.output.v0",
        standardResponseEnvelope: true
      },
      status: "scaffold",
      testing: {
        goldenFixtureReady: true,
        requiredGoldenFixture:
          "tests/golden/tools/analyze_public_technical_signal.json"
      }
    });
    const signalTool = capabilities.tools.find(
      (tool) => tool.name === "analyze_public_technical_signal"
    );
    expect(signalTool?.schema.standardErrorCodes).toEqual(
      expect.arrayContaining([
        "USER_INITIATION_REQUIRED",
        "GENERIC_AGENT_TOOL_DENIED",
        "RAW_OHLCV_PERSISTENCE_BLOCKED",
        "RAW_OHLCV_BATCH_EXPORT_BLOCKED"
      ])
    );
    const blockedRawOutputErrorCode = ["RAW_OHLCV", "OUTPUT", "BLOCKED"].join("_");
    expect(signalTool?.schema.standardErrorCodes).not.toContain(
      blockedRawOutputErrorCode
    );
    expect(signalTool?.schema.outputSchemaId).not.toBe(
      "tool.get_price_history.output.v0"
    );
  });

  it("keeps registry names stable for agent and tool runtime policy", () => {
    expect(getRegisteredToolNames()).toEqual(REGISTERED_TOOLS.map((tool) => tool.name));
    expect(getRegisteredToolNames()).toContain("parse_chart_image");
    expect(getRegisteredToolNames()).toContain("analyze_public_technical_signal");
  });

  it("rejects unregistered tools without allowing arbitrary SQL or URLs", () => {
    const result = validateRegisteredTools([
      "resolve_security",
      "parse_chart_image",
      "analyze_public_technical_signal",
      "sql.query",
      "fetch_url"
    ]);

    expect(result.allowedTools).toEqual([
      "resolve_security",
      "parse_chart_image",
      "analyze_public_technical_signal"
    ]);
    expect(result.deniedTools).toEqual(["sql.query", "fetch_url"]);
  });
});
