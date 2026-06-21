export const TOOL_REGISTRY_VERSION =
  "2026-06-21.phase1.shared-tool-registry-scaffold.v0";

export type ToolRegistryStatus = "registry_scaffold";
export type RegisteredToolStatus = "planned" | "scaffold";
export type RegisteredToolExecutionMode = "read_only_planned" | "read_only_scaffold";
export type RegisteredToolChannel = "api" | "mcp" | "web";
export type RegisteredToolRiskLevel = "low" | "medium";
export type RegisteredToolDeprecationStatus = "active" | "deprecated" | "sunset";

export type RegisteredToolName =
  | "resolve_security"
  | "get_security_profile"
  | "get_market_calendar"
  | "get_quote_snapshot"
  | "get_price_history"
  | "get_corporate_actions"
  | "get_financial_facts"
  | "get_event_timeline"
  | "get_data_lineage"
  | "get_entitlements";

export interface RegisteredToolDefinition {
  channels: readonly RegisteredToolChannel[];
  description: string;
  execution: {
    allowArbitrarySql: false;
    allowArbitraryUrl: false;
    handlerReady: boolean;
    liveDataAccess: false;
    mode: RegisteredToolExecutionMode;
  };
  lifecycle: {
    breakingChangesRequireNewMajor: true;
    compatibility: {
      oldMajorAvailableDuringNotice: true;
      previousMajorSupportWindowDays: number;
    };
    deprecation: {
      announcedAt: null | string;
      migrationGuide: null | string;
      minimumNoticeDays: number;
      status: RegisteredToolDeprecationStatus;
      sunsetAt: null | string;
    };
    majorVersion: number;
    publicVersion: string;
  };
  name: RegisteredToolName;
  permissions: {
    dataClasses: readonly string[];
    requiredScope: string;
    rightsAware: true;
  };
  retrieval: {
    cursorPagination: {
      cursorBoundToRequest: true;
      cursorOpaque: true;
      enabled: boolean;
      parameter: null | string;
    };
    enforcedBeforeExecution: true;
    planOrRightsBypassBlocked: true;
    rowLimit: {
      defaultLimit: number;
      maxLimit: number;
      parameter: null | string;
    };
    timeRangeLimit: {
      fromParameters: readonly string[];
      maxWindowDays: null | number;
      required: boolean;
      toParameters: readonly string[];
    };
  };
  schema: {
    inputSchemaId: string;
    outputSchemaId: string;
    standardErrorCodes: readonly string[];
    standardResponseEnvelope: true;
  };
  status: RegisteredToolStatus;
  testing: {
    goldenFixtureReady: boolean;
    requiredGoldenFixture: string;
  };
  version: string;
}

export const REGISTERED_TOOLS = [
  {
    channels: ["web", "mcp", "api"],
    description: "Resolve code, name, or historical identifier to candidate instruments.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("resolve_security"),
    name: "resolve_security",
    permissions: createPermissions("security:read", ["security_master"]),
    retrieval: createRetrievalLimits({
      defaultLimit: 10,
      maxLimit: 10,
      rowLimitParameter: null
    }),
    schema: createSchema("resolve_security", [
      "AMBIGUOUS_SECURITY",
      "SYMBOL_AMBIGUOUS",
      "NOT_FOUND"
    ]),
    status: "scaffold",
    testing: createTesting("resolve_security", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return security profile, status, currency, and coverage metadata.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_security_profile"),
    name: "get_security_profile",
    permissions: createPermissions("security:read", ["security_master"]),
    retrieval: createRetrievalLimits({
      defaultLimit: 1,
      maxLimit: 1,
      rowLimitParameter: null
    }),
    schema: createSchema("get_security_profile", [
      "DATA_NOT_LICENSED",
      "NOT_FOUND",
      "SCOPE_DENIED"
    ]),
    status: "scaffold",
    testing: createTesting("get_security_profile", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return exchange trading day, half-day, and holiday calendar metadata.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_market_calendar"),
    name: "get_market_calendar",
    permissions: createPermissions("calendar:read", ["market_calendar"]),
    retrieval: createRetrievalLimits({
      defaultLimit: 366,
      maxLimit: 366,
      maxWindowDays: 366,
      requiresTimeRange: true,
      rowLimitParameter: null
    }),
    schema: createSchema("get_market_calendar", [
      "NOT_FOUND",
      "OUT_OF_RANGE",
      "SCOPE_DENIED"
    ]),
    status: "scaffold",
    testing: createTesting("get_market_calendar", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return an entitled delayed or close quote snapshot.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_quote_snapshot"),
    name: "get_quote_snapshot",
    permissions: createPermissions("quotes:read", ["quote_snapshot"]),
    retrieval: createRetrievalLimits({
      defaultLimit: 1,
      maxLimit: 1,
      rowLimitParameter: null
    }),
    schema: createSchema("get_quote_snapshot", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "NOT_FOUND",
      "POINT_IN_TIME_UNAVAILABLE",
      "SCOPE_DENIED"
    ]),
    status: "scaffold",
    testing: createTesting("get_quote_snapshot", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return OHLCV and return series with adjustment methodology metadata.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_price_history"),
    name: "get_price_history",
    permissions: createPermissions("prices:read", ["price_history", "corporate_actions"]),
    retrieval: createRetrievalLimits({
      cursorParameter: "cursor",
      defaultLimit: 3,
      maxLimit: 3,
      maxWindowDays: 366,
      requiresTimeRange: true,
      rowLimitParameter: "limit"
    }),
    schema: createSchema("get_price_history", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "NOT_FOUND",
      "OUT_OF_RANGE",
      "TOO_MANY_ROWS"
    ]),
    status: "scaffold",
    testing: createTesting("get_price_history", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return dividends, splits, consolidations, buybacks, and placements.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_corporate_actions"),
    name: "get_corporate_actions",
    permissions: createPermissions("corporate_actions:read", ["corporate_actions"]),
    retrieval: createRetrievalLimits({
      cursorParameter: "cursor",
      defaultLimit: 3,
      maxLimit: 3,
      maxWindowDays: 366,
      requiresTimeRange: true,
      rowLimitParameter: "limit"
    }),
    schema: createSchema("get_corporate_actions", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "NOT_FOUND",
      "OUT_OF_RANGE"
    ]),
    status: "scaffold",
    testing: createTesting("get_corporate_actions", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return standardized financial facts with period, currency, unit, and version.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_financial_facts"),
    name: "get_financial_facts",
    permissions: createPermissions("financials:read", ["financial_facts"]),
    retrieval: createRetrievalLimits({
      cursorParameter: "cursor",
      defaultLimit: 4,
      maxLimit: 4,
      maxWindowDays: 366,
      requiresTimeRange: true,
      rowLimitParameter: "limit"
    }),
    schema: createSchema("get_financial_facts", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "NOT_FOUND",
      "OUT_OF_RANGE",
      "POINT_IN_TIME_UNAVAILABLE"
    ]),
    status: "scaffold",
    testing: createTesting("get_financial_facts", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return company and market event timeline rows with source-linked related data.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_event_timeline"),
    name: "get_event_timeline",
    permissions: createPermissions("events:read", [
      "announcements",
      "corporate_actions",
      "financial_facts",
      "market_calendar"
    ]),
    retrieval: createRetrievalLimits({
      cursorParameter: "cursor",
      defaultLimit: 5,
      maxLimit: 5,
      maxWindowDays: 366,
      requiresTimeRange: true,
      rowLimitParameter: "limit"
    }),
    schema: createSchema("get_event_timeline", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "NOT_FOUND",
      "OUT_OF_RANGE",
      "TOO_MANY_ROWS"
    ]),
    status: "scaffold",
    testing: createTesting("get_event_timeline", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return lineage metadata for tool outputs and source records.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_data_lineage"),
    name: "get_data_lineage",
    permissions: createPermissions("lineage:read", ["lineage"]),
    retrieval: createRetrievalLimits({
      defaultLimit: 1,
      maxLimit: 1,
      rowLimitParameter: null
    }),
    schema: createSchema("get_data_lineage", [
      "DATA_QUALITY_HOLD",
      "NOT_FOUND",
      "SCOPE_DENIED"
    ]),
    status: "scaffold",
    testing: createTesting("get_data_lineage", true),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return data entitlements for a workspace, channel, dataset, and fields.",
    execution: createScaffoldReadOnlyExecution(),
    lifecycle: createLifecycle("get_entitlements"),
    name: "get_entitlements",
    permissions: createPermissions("entitlements:read", ["entitlements"]),
    retrieval: createRetrievalLimits({
      defaultLimit: 1,
      maxLimit: 500,
      maxWindowDays: 366,
      rowLimitParameter: "requested_rows",
      timeRangeFromParameters: ["time_range.from", "timeRange.from"],
      timeRangeToParameters: ["time_range.to", "timeRange.to"]
    }),
    schema: createSchema("get_entitlements", [
      "DATA_NOT_LICENSED",
      "OUT_OF_RANGE",
      "SCOPE_DENIED",
      "TOO_MANY_ROWS"
    ]),
    status: "scaffold",
    testing: createTesting("get_entitlements", true),
    version: "0.0.0"
  }
] as const satisfies readonly RegisteredToolDefinition[];

export interface ToolRegistryValidationResult {
  allowedTools: RegisteredToolName[];
  deniedTools: string[];
  requestedTools: string[];
}

export function getRegisteredToolNames(): RegisteredToolName[] {
  return REGISTERED_TOOLS.map((tool) => tool.name);
}

export function getToolRegistryCapabilities() {
  return {
    allow_arbitrary_sql: false,
    allow_arbitrary_url: false,
    breaking_changes_require_new_major: true,
    deprecation_policy_ready: true,
    channels: ["web", "mcp", "api"] as const,
    execution_ready: false,
    golden_fixtures_ready: false,
    handler_ready_tool_count: REGISTERED_TOOLS.filter(
      (tool) => tool.execution.handlerReady
    ).length,
    pagination_limits_ready: true,
    pagination_or_rights_bypass_blocked: true,
    registry_status: "registry_scaffold" as ToolRegistryStatus,
    rights_aware: true,
    schema_ready: true,
    standard_response_envelope: true,
    status: "shared_tool_registry_scaffold" as const,
    tool_count: REGISTERED_TOOLS.length,
    tools: REGISTERED_TOOLS,
    version: TOOL_REGISTRY_VERSION,
    versioning_ready: true
  };
}

export function isRegisteredToolName(toolName: string): toolName is RegisteredToolName {
  return getRegisteredToolNames().includes(toolName as RegisteredToolName);
}

export function validateRegisteredTools(
  requestedTools: readonly string[]
): ToolRegistryValidationResult {
  const allowedTools: RegisteredToolName[] = [];
  const deniedTools: string[] = [];

  for (const tool of requestedTools) {
    if (isRegisteredToolName(tool)) {
      allowedTools.push(tool);
    } else {
      deniedTools.push(tool);
    }
  }

  return {
    allowedTools,
    deniedTools,
    requestedTools: [...requestedTools]
  };
}

function createPlannedReadOnlyExecution(): RegisteredToolDefinition["execution"] {
  return {
    allowArbitrarySql: false,
    allowArbitraryUrl: false,
    handlerReady: false,
    liveDataAccess: false,
    mode: "read_only_planned"
  };
}

function createScaffoldReadOnlyExecution(): RegisteredToolDefinition["execution"] {
  return {
    allowArbitrarySql: false,
    allowArbitraryUrl: false,
    handlerReady: true,
    liveDataAccess: false,
    mode: "read_only_scaffold"
  };
}

function createLifecycle(toolName: RegisteredToolName): RegisteredToolDefinition["lifecycle"] {
  return {
    breakingChangesRequireNewMajor: true,
    compatibility: {
      oldMajorAvailableDuringNotice: true,
      previousMajorSupportWindowDays: 180
    },
    deprecation: {
      announcedAt: null,
      migrationGuide: null,
      minimumNoticeDays: 90,
      status: "active",
      sunsetAt: null
    },
    majorVersion: 1,
    publicVersion: `${toolName}@1`
  };
}

function createPermissions(
  requiredScope: string,
  dataClasses: readonly string[]
): RegisteredToolDefinition["permissions"] {
  return {
    dataClasses,
    requiredScope,
    rightsAware: true
  };
}

function createRetrievalLimits(input: {
  cursorParameter?: null | string;
  defaultLimit: number;
  maxLimit: number;
  maxWindowDays?: null | number;
  requiresTimeRange?: boolean;
  rowLimitParameter?: null | string;
  timeRangeFromParameters?: readonly string[];
  timeRangeToParameters?: readonly string[];
}): RegisteredToolDefinition["retrieval"] {
  const cursorParameter = input.cursorParameter ?? null;

  return {
    cursorPagination: {
      cursorBoundToRequest: true,
      cursorOpaque: true,
      enabled: cursorParameter !== null,
      parameter: cursorParameter
    },
    enforcedBeforeExecution: true,
    planOrRightsBypassBlocked: true,
    rowLimit: {
      defaultLimit: input.defaultLimit,
      maxLimit: input.maxLimit,
      parameter: input.rowLimitParameter ?? null
    },
    timeRangeLimit: {
      fromParameters: input.timeRangeFromParameters ?? ["from"],
      maxWindowDays: input.maxWindowDays ?? null,
      required: input.requiresTimeRange ?? false,
      toParameters: input.timeRangeToParameters ?? ["to"]
    }
  };
}

function createSchema(
  toolName: RegisteredToolName,
  errorCodes: readonly string[]
): RegisteredToolDefinition["schema"] {
  return {
    inputSchemaId: `tool.${toolName}.input.v0`,
    outputSchemaId: `tool.${toolName}.output.v0`,
    standardErrorCodes: errorCodes,
    standardResponseEnvelope: true
  };
}

function createTesting(
  toolName: RegisteredToolName,
  goldenFixtureReady: boolean = false
): RegisteredToolDefinition["testing"] {
  return {
    goldenFixtureReady,
    requiredGoldenFixture: `tests/golden/tools/${toolName}.json`
  };
}
