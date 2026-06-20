export const TOOL_REGISTRY_VERSION =
  "2026-06-21.phase1.shared-tool-registry-scaffold.v0";

export type ToolRegistryStatus = "registry_scaffold";
export type RegisteredToolStatus = "planned";
export type RegisteredToolExecutionMode = "read_only_planned";
export type RegisteredToolChannel = "api" | "mcp" | "web";
export type RegisteredToolRiskLevel = "low" | "medium";

export type RegisteredToolName =
  | "resolve_security"
  | "get_security_profile"
  | "get_market_calendar"
  | "get_quote_snapshot"
  | "get_price_history"
  | "get_corporate_actions"
  | "get_financial_facts"
  | "get_data_lineage"
  | "get_entitlements";

export interface RegisteredToolDefinition {
  channels: readonly RegisteredToolChannel[];
  description: string;
  execution: {
    allowArbitrarySql: false;
    allowArbitraryUrl: false;
    handlerReady: false;
    liveDataAccess: false;
    mode: RegisteredToolExecutionMode;
  };
  name: RegisteredToolName;
  permissions: {
    dataClasses: readonly string[];
    requiredScope: string;
    rightsAware: true;
  };
  schema: {
    inputSchemaId: string;
    outputSchemaId: string;
    standardErrorCodes: readonly string[];
    standardResponseEnvelope: true;
  };
  status: RegisteredToolStatus;
  testing: {
    goldenFixtureReady: false;
    requiredGoldenFixture: string;
  };
  version: string;
}

export const REGISTERED_TOOLS = [
  {
    channels: ["web", "mcp", "api"],
    description: "Resolve code, name, or historical identifier to candidate instruments.",
    execution: createPlannedReadOnlyExecution(),
    name: "resolve_security",
    permissions: createPermissions("security:read", ["security_master"]),
    schema: createSchema("resolve_security", [
      "AMBIGUOUS_SECURITY",
      "SYMBOL_AMBIGUOUS",
      "NOT_FOUND"
    ]),
    status: "planned",
    testing: createTesting("resolve_security"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return security profile, status, currency, and coverage metadata.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_security_profile",
    permissions: createPermissions("security:read", ["security_master"]),
    schema: createSchema("get_security_profile", ["DATA_NOT_LICENSED", "NOT_FOUND"]),
    status: "planned",
    testing: createTesting("get_security_profile"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return exchange trading day, half-day, and holiday calendar metadata.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_market_calendar",
    permissions: createPermissions("calendar:read", ["market_calendar"]),
    schema: createSchema("get_market_calendar", ["NOT_FOUND", "OUT_OF_RANGE"]),
    status: "planned",
    testing: createTesting("get_market_calendar"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return an entitled delayed or close quote snapshot.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_quote_snapshot",
    permissions: createPermissions("quotes:read", ["quote_snapshot"]),
    schema: createSchema("get_quote_snapshot", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "POINT_IN_TIME_UNAVAILABLE"
    ]),
    status: "planned",
    testing: createTesting("get_quote_snapshot"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return OHLCV and return series with adjustment methodology metadata.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_price_history",
    permissions: createPermissions("prices:read", ["price_history", "corporate_actions"]),
    schema: createSchema("get_price_history", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "OUT_OF_RANGE",
      "TOO_MANY_ROWS"
    ]),
    status: "planned",
    testing: createTesting("get_price_history"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return dividends, splits, consolidations, buybacks, and placements.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_corporate_actions",
    permissions: createPermissions("corporate_actions:read", ["corporate_actions"]),
    schema: createSchema("get_corporate_actions", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "OUT_OF_RANGE"
    ]),
    status: "planned",
    testing: createTesting("get_corporate_actions"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return standardized financial facts with period, currency, unit, and version.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_financial_facts",
    permissions: createPermissions("financials:read", ["financial_facts"]),
    schema: createSchema("get_financial_facts", [
      "DATA_NOT_LICENSED",
      "DATA_QUALITY_HOLD",
      "POINT_IN_TIME_UNAVAILABLE"
    ]),
    status: "planned",
    testing: createTesting("get_financial_facts"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return lineage metadata for tool outputs and source records.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_data_lineage",
    permissions: createPermissions("lineage:read", ["lineage"]),
    schema: createSchema("get_data_lineage", ["NOT_FOUND"]),
    status: "planned",
    testing: createTesting("get_data_lineage"),
    version: "0.0.0"
  },
  {
    channels: ["web", "mcp", "api"],
    description: "Return data entitlements for a workspace, channel, dataset, and fields.",
    execution: createPlannedReadOnlyExecution(),
    name: "get_entitlements",
    permissions: createPermissions("entitlements:read", ["entitlements"]),
    schema: createSchema("get_entitlements", ["DATA_NOT_LICENSED", "SCOPE_DENIED"]),
    status: "planned",
    testing: createTesting("get_entitlements"),
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
    channels: ["web", "mcp", "api"] as const,
    execution_ready: false,
    golden_fixtures_ready: false,
    registry_status: "registry_scaffold" as ToolRegistryStatus,
    rights_aware: true,
    schema_ready: true,
    standard_response_envelope: true,
    status: "shared_tool_registry_scaffold" as const,
    tool_count: REGISTERED_TOOLS.length,
    tools: REGISTERED_TOOLS,
    version: TOOL_REGISTRY_VERSION
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

function createTesting(toolName: RegisteredToolName): RegisteredToolDefinition["testing"] {
  return {
    goldenFixtureReady: false,
    requiredGoldenFixture: `tests/golden/tools/${toolName}.json`
  };
}
