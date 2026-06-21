import {
  REGISTERED_TOOLS,
  TOOL_REGISTRY_VERSION,
  isRegisteredToolName,
  type RegisteredToolDefinition,
  type RegisteredToolName
} from "@aiphabee/tool-registry";

export const MCP_RUNTIME_VERSION =
  "2026-06-21.phase2.mcp-endpoint-default-deny-scaffold.v0";
export const MCP_OAUTH_PKCE_VERSION =
  "2026-06-21.phase2.mcp-oauth-pkce-scaffold.v0";

export const MCP_SUPPORTED_METHODS = [
  "initialize",
  "tools/list",
  "tools/call"
] as const;

export const DEFAULT_MCP_ALLOWED_ORIGINS = [
  "https://app.aiphabee.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
] as const;

export const MCP_OAUTH_SCOPE_DEFINITIONS = [
  {
    data_classes: ["security_master"],
    description: "Read security identifiers, listings, and profile metadata.",
    risk_level: "low",
    scope: "security.read",
    write: false
  },
  {
    data_classes: ["market_quote", "price_history", "market_calendar"],
    description: "Read entitled market data through AiphaBee tools.",
    risk_level: "medium",
    scope: "market.read",
    write: false
  },
  {
    data_classes: ["financial_facts", "corporate_actions"],
    description: "Read financial statement facts and related fundamentals.",
    risk_level: "medium",
    scope: "fundamentals.read",
    write: false
  },
  {
    data_classes: ["filings", "announcements"],
    description: "Read filing and announcement excerpts with citations.",
    risk_level: "medium",
    scope: "filings.read",
    write: false
  },
  {
    data_classes: ["analytics"],
    description: "Run deterministic comparison, screening, and calculation tools.",
    risk_level: "medium",
    scope: "analytics.run",
    write: false
  },
  {
    data_classes: ["portfolio"],
    description: "Read user portfolio context after additional privacy review.",
    risk_level: "high",
    scope: "portfolio.read",
    write: false
  },
  {
    data_classes: ["alerts"],
    description: "Create or update alerts after explicit user confirmation.",
    risk_level: "high",
    scope: "alerts.write",
    write: true
  },
  {
    data_classes: ["exports"],
    description: "Read export artifacts; high-risk scope requiring separate consent.",
    risk_level: "high",
    scope: "exports.read",
    write: false
  },
  {
    data_classes: ["usage_admin"],
    description: "Read workspace usage and quota records for administrators.",
    risk_level: "high",
    scope: "admin.usage.read",
    write: false
  }
] as const;

export type McpMethod = (typeof MCP_SUPPORTED_METHODS)[number];
export type McpOAuthScope = (typeof MCP_OAUTH_SCOPE_DEFINITIONS)[number]["scope"];
export type McpRuntimePlanStatus =
  | "planned_default_deny"
  | "planned_no_live_execution";
export type McpOAuthPlanStatus = "planned_no_live_oauth";
export type McpRuntimeInputErrorCode =
  | "AUTHORIZATION_CODE_REQUIRED"
  | "CLIENT_ID_REQUIRED"
  | "CODE_CHALLENGE_METHOD_UNSUPPORTED"
  | "CODE_CHALLENGE_REQUIRED"
  | "CODE_VERIFIER_REQUIRED"
  | "CONNECTION_OR_TOKEN_REQUIRED"
  | "INVALID_CODE_CHALLENGE"
  | "INVALID_REDIRECT_URI"
  | "MCP_REDISTRIBUTION_RIGHTS_REQUIRED"
  | "ORIGIN_NOT_ALLOWED"
  | "ORIGIN_REQUIRED"
  | "REDIRECT_URI_REQUIRED"
  | "SCOPE_REQUIRED"
  | "TOOL_NAME_REQUIRED"
  | "TOOL_NOT_REGISTERED"
  | "TOOL_SCOPE_REQUIRED"
  | "UNSUPPORTED_SCOPE"
  | "UNSUPPORTED_METHOD";

export class McpRuntimeInputError extends Error {
  readonly code: McpRuntimeInputErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: McpRuntimeInputErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export interface CreateMcpProtocolPlanInput {
  allowedOrigins?: readonly string[];
  clientName?: string;
  clientVersion?: string;
  grantedScopes?: readonly string[];
  method?: string;
  mcpRedistributionRightsConfirmed?: boolean;
  origin?: string;
  requestId: string;
  requestedScopes?: readonly string[];
  toolName?: string;
}

export interface CreateMcpOAuthAuthorizePlanInput {
  clientId?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  origin?: string;
  redirectUri?: string;
  requestId: string;
  requestedScopes?: readonly string[];
  userId?: string;
  workspaceId?: string;
}

export interface CreateMcpOAuthTokenPlanInput {
  authorizationCode?: string;
  codeVerifier?: string;
  clientId?: string;
  requestId: string;
  requestedScopes?: readonly string[];
}

export interface CreateMcpOAuthRevokePlanInput {
  connectionId?: string;
  reason?: string;
  requestId: string;
  tokenId?: string;
}

export interface McpToolDescriptor {
  description: string;
  input_schema_id: string;
  name: RegisteredToolName;
  output_schema_id: string;
  required_scope: string;
  version: string;
}

export interface McpOAuthScopeGrant {
  data_classes: readonly string[];
  description: string;
  risk_level: "high" | "low" | "medium";
  revocable: true;
  scope: McpOAuthScope;
  write: boolean;
}

export interface McpOAuthAuthorizePlan {
  action: "authorize";
  authorization_code: {
    code_emitted: false;
    expires_in_seconds: 300;
    one_time_use: true;
    status: "planned_no_live";
    token_exchange_route: "POST /mcp/oauth/token/plan";
  };
  client_id: string;
  consent: {
    clear_scope_display: true;
    requested_scope_count: number;
    scopes: McpOAuthScopeGrant[];
    user_consent_required: true;
  };
  data_version: typeof MCP_OAUTH_PKCE_VERSION;
  live_oauth_provider: false;
  methodology_version: typeof MCP_OAUTH_PKCE_VERSION;
  oauth_flow: "authorization_code_pkce";
  pkce: {
    code_challenge: string;
    code_challenge_method: "S256";
    code_verifier_stored: false;
    plain_method_allowed: false;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  redirect_uri: string;
  request_id: string;
  revocation: {
    revoke_route: "POST /mcp/oauth/revoke/plan";
    revocable: true;
  };
  route: "POST /mcp/oauth/authorize/plan";
  status: McpOAuthPlanStatus;
  third_party_token_passthrough: false;
  token_issued: false;
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  user: {
    source: "request" | "synthetic_default";
    user_id: string;
  };
  version: typeof MCP_OAUTH_PKCE_VERSION;
  workspace: {
    source: "request" | "synthetic_default";
    workspace_id: string;
  };
}

export interface McpOAuthTokenPlan {
  action: "token";
  authorization_code: {
    authorization_code_received: true;
    one_time_use_required: true;
  };
  client_id?: string;
  data_version: typeof MCP_OAUTH_PKCE_VERSION;
  live_oauth_provider: false;
  methodology_version: typeof MCP_OAUTH_PKCE_VERSION;
  pkce_verification: {
    code_verifier_received: true;
    verification_status: "planned_no_live";
    verifier_hash_stored: false;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  route: "POST /mcp/oauth/token/plan";
  scope_binding: {
    requested_scopes: McpOAuthScope[];
    scopes_bound_to_token: true;
  };
  status: McpOAuthPlanStatus;
  third_party_token_passthrough: false;
  token: {
    access_token_issued: false;
    audience: "aiphabee-mcp";
    expires_in_seconds: 900;
    refresh_token_issued: false;
  };
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  version: typeof MCP_OAUTH_PKCE_VERSION;
}

export interface McpOAuthRevokePlan {
  action: "revoke";
  connection_id?: string;
  data_version: typeof MCP_OAUTH_PKCE_VERSION;
  live_oauth_provider: false;
  methodology_version: typeof MCP_OAUTH_PKCE_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  reason?: string;
  request_id: string;
  revocation_plan: {
    future_calls_denied_after_revoke: true;
    revoke_status: "planned_no_live";
    scope_grants_removed: "planned";
    token_invalidation_live: false;
  };
  route: "POST /mcp/oauth/revoke/plan";
  status: McpOAuthPlanStatus;
  token_id?: string;
  usage: {
    cached: false;
    credits: 0;
    rows: 1;
  };
  version: typeof MCP_OAUTH_PKCE_VERSION;
}

export interface McpProtocolPlan {
  api_key_live: false;
  client: {
    name: string;
    version: string;
  };
  data_version: typeof MCP_RUNTIME_VERSION;
  default_deny: true;
  developer_console: {
    console_ready: false;
    first_call_guide: "planned";
    logs_visible: false;
  };
  endpoint: "/mcp";
  frontend_rendering: false;
  initialize?: {
    capabilities: {
      tools: {
        listChanged: false;
      };
    };
    protocol_version: "2025-03-26";
    server_info: {
      name: "aiphabee-mcp";
      version: typeof MCP_RUNTIME_VERSION;
    };
  };
  live_tool_execution: false;
  method: McpMethod;
  methodology_version: typeof MCP_RUNTIME_VERSION;
  oauth_live: false;
  origin_check: {
    allowed_origins: readonly string[];
    origin: string;
    required: true;
    valid: true;
  };
  protocol: {
    json_rpc: "2.0";
    streamable_http: true;
    supported_methods: typeof MCP_SUPPORTED_METHODS;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  response_shape: {
    standard_error_codes: readonly [
      "AUTH_REQUIRED",
      "DATA_NOT_LICENSED",
      "SCOPE_DENIED",
      "RATE_LIMITED",
      "BUDGET_EXCEEDED",
      "INTERNAL_ERROR"
    ];
    standard_response_envelope: true;
    structured_content_required: true;
  };
  rights_gate: {
    blocked_reason?: "MCP_API_REDISTRIBUTION_RIGHTS_NOT_CONFIRMED";
    default_deny: true;
    mcp_api_redistribution_rights_confirmed: boolean;
    web_rights_do_not_imply_mcp: true;
  };
  status: McpRuntimePlanStatus;
  tool_call?: {
    live_execution: false;
    requested_tool_name: RegisteredToolName;
    required_scope: string;
    schema_validation: "planned";
    structured_content_validation: "planned";
  };
  tools_list?: {
    blocked_tool_count: number;
    returned_tool_count: number;
    tool_catalog_available_after_rights_gate: true;
    tools: McpToolDescriptor[];
  };
  transport: "streamable_http";
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  version: typeof MCP_RUNTIME_VERSION;
}

const MCP_STANDARD_ERROR_CODES = [
  "AUTH_REQUIRED",
  "DATA_NOT_LICENSED",
  "SCOPE_DENIED",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "INTERNAL_ERROR"
] as const;

export function getMcpRuntimeCapabilities() {
  return {
    allowed_origins: DEFAULT_MCP_ALLOWED_ORIGINS,
    api_key_live: false,
    default_deny: true,
    developer_console_live: false,
    live_tool_execution: false,
    mcp_api_redistribution_rights_confirmed: false,
    oauth_authorize_route: "POST /mcp/oauth/authorize/plan" as const,
    oauth_live: false,
    oauth_pkce_ready: true,
    oauth_revoke_route: "POST /mcp/oauth/revoke/plan" as const,
    oauth_runtime_route: "GET /mcp/oauth/runtime" as const,
    oauth_token_route: "POST /mcp/oauth/token/plan" as const,
    origin_validation: true,
    package: "@aiphabee/mcp-runtime" as const,
    pkce_methods: ["S256"] as const,
    route: "POST /mcp" as const,
    runtime_route: "GET /mcp/runtime" as const,
    scopes_revocable: true,
    standard_error_codes: MCP_STANDARD_ERROR_CODES,
    status: "mcp_endpoint_default_deny_scaffold" as const,
    supported_oauth_scopes: MCP_OAUTH_SCOPE_DEFINITIONS.map(
      (definition) => definition.scope
    ),
    supported_methods: MCP_SUPPORTED_METHODS,
    third_party_token_passthrough: false,
    tool_registry_version: TOOL_REGISTRY_VERSION,
    tools_list_live: false,
    transport: "streamable_http" as const,
    version: MCP_RUNTIME_VERSION,
    web_rights_do_not_imply_mcp: true
  };
}

export function getMcpOAuthCapabilities() {
  return {
    authorization_code_lifetime_seconds: 300,
    authorize_route: "POST /mcp/oauth/authorize/plan" as const,
    live_oauth_provider: false,
    package: "@aiphabee/mcp-runtime" as const,
    pkce_methods: ["S256"] as const,
    redirect_uri_validation: "planned" as const,
    revoke_route: "POST /mcp/oauth/revoke/plan" as const,
    runtime_route: "GET /mcp/oauth/runtime" as const,
    scope_catalog: MCP_OAUTH_SCOPE_DEFINITIONS,
    scopes_revocable: true,
    status: "mcp_oauth_pkce_scaffold" as const,
    third_party_token_passthrough: false,
    token_lifetime_seconds: 900,
    token_route: "POST /mcp/oauth/token/plan" as const,
    version: MCP_OAUTH_PKCE_VERSION
  };
}

export function createMcpOAuthAuthorizePlan(
  input: CreateMcpOAuthAuthorizePlanInput
): McpOAuthAuthorizePlan {
  const clientId = normalizeText(input.clientId);
  const redirectUri = normalizeText(input.redirectUri);
  const codeChallenge = normalizeText(input.codeChallenge);
  const userId = normalizeText(input.userId);
  const workspaceId = normalizeText(input.workspaceId);

  if (clientId === undefined) {
    throw new McpRuntimeInputError("CLIENT_ID_REQUIRED", "clientId is required");
  }

  if (redirectUri === undefined) {
    throw new McpRuntimeInputError(
      "REDIRECT_URI_REQUIRED",
      "redirectUri is required"
    );
  }

  if (!isAllowedRedirectUri(redirectUri)) {
    throw new McpRuntimeInputError(
      "INVALID_REDIRECT_URI",
      "redirectUri must be https or localhost for this scaffold",
      {
        redirectUri
      }
    );
  }

  if (codeChallenge === undefined) {
    throw new McpRuntimeInputError(
      "CODE_CHALLENGE_REQUIRED",
      "PKCE codeChallenge is required"
    );
  }

  if (input.codeChallengeMethod !== "S256") {
    throw new McpRuntimeInputError(
      "CODE_CHALLENGE_METHOD_UNSUPPORTED",
      "PKCE codeChallengeMethod must be S256",
      {
        codeChallengeMethod: input.codeChallengeMethod
      }
    );
  }

  if (!isValidPkceCodeChallenge(codeChallenge)) {
    throw new McpRuntimeInputError(
      "INVALID_CODE_CHALLENGE",
      "PKCE codeChallenge must be base64url and 43-128 characters"
    );
  }

  const scopes = normalizeAndValidateOAuthScopes(input.requestedScopes);

  return {
    action: "authorize",
    authorization_code: {
      code_emitted: false,
      expires_in_seconds: 300,
      one_time_use: true,
      status: "planned_no_live",
      token_exchange_route: "POST /mcp/oauth/token/plan"
    },
    client_id: clientId,
    consent: {
      clear_scope_display: true,
      requested_scope_count: scopes.length,
      scopes: scopes.map(createScopeGrant),
      user_consent_required: true
    },
    data_version: MCP_OAUTH_PKCE_VERSION,
    live_oauth_provider: false,
    methodology_version: MCP_OAUTH_PKCE_VERSION,
    oauth_flow: "authorization_code_pkce",
    pkce: {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      code_verifier_stored: false,
      plain_method_allowed: false
    },
    provenance: createMcpOAuthProvenance("authorize"),
    redirect_uri: redirectUri,
    request_id: input.requestId,
    revocation: {
      revoke_route: "POST /mcp/oauth/revoke/plan",
      revocable: true
    },
    route: "POST /mcp/oauth/authorize/plan",
    status: "planned_no_live_oauth",
    third_party_token_passthrough: false,
    token_issued: false,
    usage: {
      cached: false,
      credits: 0,
      rows: scopes.length
    },
    user: {
      source: userId === undefined ? "synthetic_default" : "request",
      user_id: userId ?? "user_internal_alpha"
    },
    version: MCP_OAUTH_PKCE_VERSION,
    workspace: {
      source: workspaceId === undefined ? "synthetic_default" : "request",
      workspace_id: workspaceId ?? "workspace_mcp"
    }
  };
}

export function createMcpOAuthTokenPlan(
  input: CreateMcpOAuthTokenPlanInput
): McpOAuthTokenPlan {
  const authorizationCode = normalizeText(input.authorizationCode);
  const codeVerifier = normalizeText(input.codeVerifier);

  if (authorizationCode === undefined) {
    throw new McpRuntimeInputError(
      "AUTHORIZATION_CODE_REQUIRED",
      "authorizationCode is required"
    );
  }

  if (codeVerifier === undefined) {
    throw new McpRuntimeInputError(
      "CODE_VERIFIER_REQUIRED",
      "PKCE codeVerifier is required"
    );
  }

  const scopes = normalizeAndValidateOAuthScopes(input.requestedScopes);

  return {
    action: "token",
    authorization_code: {
      authorization_code_received: true,
      one_time_use_required: true
    },
    client_id: normalizeText(input.clientId),
    data_version: MCP_OAUTH_PKCE_VERSION,
    live_oauth_provider: false,
    methodology_version: MCP_OAUTH_PKCE_VERSION,
    pkce_verification: {
      code_verifier_received: true,
      verification_status: "planned_no_live",
      verifier_hash_stored: false
    },
    provenance: createMcpOAuthProvenance("token"),
    request_id: input.requestId,
    route: "POST /mcp/oauth/token/plan",
    scope_binding: {
      requested_scopes: scopes,
      scopes_bound_to_token: true
    },
    status: "planned_no_live_oauth",
    third_party_token_passthrough: false,
    token: {
      access_token_issued: false,
      audience: "aiphabee-mcp",
      expires_in_seconds: 900,
      refresh_token_issued: false
    },
    usage: {
      cached: false,
      credits: 0,
      rows: scopes.length
    },
    version: MCP_OAUTH_PKCE_VERSION
  };
}

export function createMcpOAuthRevokePlan(
  input: CreateMcpOAuthRevokePlanInput
): McpOAuthRevokePlan {
  const connectionId = normalizeText(input.connectionId);
  const tokenId = normalizeText(input.tokenId);

  if (connectionId === undefined && tokenId === undefined) {
    throw new McpRuntimeInputError(
      "CONNECTION_OR_TOKEN_REQUIRED",
      "connectionId or tokenId is required"
    );
  }

  return {
    action: "revoke",
    connection_id: connectionId,
    data_version: MCP_OAUTH_PKCE_VERSION,
    live_oauth_provider: false,
    methodology_version: MCP_OAUTH_PKCE_VERSION,
    provenance: createMcpOAuthProvenance("revoke"),
    reason: normalizeText(input.reason),
    request_id: input.requestId,
    revocation_plan: {
      future_calls_denied_after_revoke: true,
      revoke_status: "planned_no_live",
      scope_grants_removed: "planned",
      token_invalidation_live: false
    },
    route: "POST /mcp/oauth/revoke/plan",
    status: "planned_no_live_oauth",
    token_id: tokenId,
    usage: {
      cached: false,
      credits: 0,
      rows: 1
    },
    version: MCP_OAUTH_PKCE_VERSION
  };
}

export function createMcpProtocolPlan(
  input: CreateMcpProtocolPlanInput
): McpProtocolPlan {
  const method = normalizeMcpMethod(input.method);
  const allowedOrigins = input.allowedOrigins ?? DEFAULT_MCP_ALLOWED_ORIGINS;
  const origin = normalizeText(input.origin);

  if (method === undefined) {
    throw new McpRuntimeInputError(
      "UNSUPPORTED_METHOD",
      "method must be initialize, tools/list, or tools/call",
      {
        method: input.method,
        supportedMethods: MCP_SUPPORTED_METHODS
      }
    );
  }

  if (origin === undefined) {
    throw new McpRuntimeInputError("ORIGIN_REQUIRED", "Origin header is required");
  }

  if (!allowedOrigins.includes(origin)) {
    throw new McpRuntimeInputError(
      "ORIGIN_NOT_ALLOWED",
      "Origin is not allowed for MCP Streamable HTTP",
      {
        allowedOrigins,
        origin
      }
    );
  }

  const rightsConfirmed = input.mcpRedistributionRightsConfirmed === true;
  const basePlan = createBasePlan({
    allowedOrigins,
    clientName: input.clientName,
    clientVersion: input.clientVersion,
    method,
    origin,
    requestId: input.requestId,
    rightsConfirmed
  });

  if (method === "initialize") {
    return {
      ...basePlan,
      initialize: {
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        protocol_version: "2025-03-26",
        server_info: {
          name: "aiphabee-mcp",
          version: MCP_RUNTIME_VERSION
        }
      }
    };
  }

  if (method === "tools/list") {
    const tools = rightsConfirmed ? createToolDescriptors(REGISTERED_TOOLS) : [];

    return {
      ...basePlan,
      tools_list: {
        blocked_tool_count: rightsConfirmed ? 0 : REGISTERED_TOOLS.length,
        returned_tool_count: tools.length,
        tool_catalog_available_after_rights_gate: true,
        tools
      },
      usage: {
        cached: false,
        credits: 0,
        rows: tools.length
      }
    };
  }

  return createToolCallPlan(basePlan, input);
}

function createBasePlan(input: {
  allowedOrigins: readonly string[];
  clientName?: string;
  clientVersion?: string;
  method: McpMethod;
  origin: string;
  requestId: string;
  rightsConfirmed: boolean;
}): McpProtocolPlan {
  return {
    api_key_live: false,
    client: {
      name: normalizeText(input.clientName) ?? "unknown_mcp_client",
      version: normalizeText(input.clientVersion) ?? "unknown"
    },
    data_version: MCP_RUNTIME_VERSION,
    default_deny: true,
    developer_console: {
      console_ready: false,
      first_call_guide: "planned",
      logs_visible: false
    },
    endpoint: "/mcp",
    frontend_rendering: false,
    live_tool_execution: false,
    method: input.method,
    methodology_version: MCP_RUNTIME_VERSION,
    oauth_live: false,
    origin_check: {
      allowed_origins: input.allowedOrigins,
      origin: input.origin,
      required: true,
      valid: true
    },
    protocol: {
      json_rpc: "2.0",
      streamable_http: true,
      supported_methods: MCP_SUPPORTED_METHODS
    },
    provenance: [
      {
        data_version: MCP_RUNTIME_VERSION,
        methodology_version: MCP_RUNTIME_VERSION,
        source: "mcp-runtime",
        source_record_id: `mcp_${input.method.replace("/", "_")}`
      }
    ],
    request_id: input.requestId,
    response_shape: {
      standard_error_codes: MCP_STANDARD_ERROR_CODES,
      standard_response_envelope: true,
      structured_content_required: true
    },
    rights_gate: {
      blocked_reason: input.rightsConfirmed
        ? undefined
        : "MCP_API_REDISTRIBUTION_RIGHTS_NOT_CONFIRMED",
      default_deny: true,
      mcp_api_redistribution_rights_confirmed: input.rightsConfirmed,
      web_rights_do_not_imply_mcp: true
    },
    status: input.rightsConfirmed
      ? "planned_no_live_execution"
      : "planned_default_deny",
    transport: "streamable_http",
    usage: {
      cached: false,
      credits: 0,
      rows: 0
    },
    version: MCP_RUNTIME_VERSION
  };
}

function createToolCallPlan(
  basePlan: McpProtocolPlan,
  input: CreateMcpProtocolPlanInput
): McpProtocolPlan {
  const toolName = normalizeText(input.toolName);

  if (toolName === undefined) {
    throw new McpRuntimeInputError(
      "TOOL_NAME_REQUIRED",
      "tools/call requires a registered tool name"
    );
  }

  if (!isRegisteredToolName(toolName)) {
    throw new McpRuntimeInputError("TOOL_NOT_REGISTERED", "tool is not registered", {
      toolName
    });
  }

  const tool = REGISTERED_TOOLS.find((candidate) => candidate.name === toolName);

  if (tool === undefined) {
    throw new McpRuntimeInputError("TOOL_NOT_REGISTERED", "tool is not registered", {
      toolName
    });
  }

  if (!basePlan.rights_gate.mcp_api_redistribution_rights_confirmed) {
    throw new McpRuntimeInputError(
      "MCP_REDISTRIBUTION_RIGHTS_REQUIRED",
      "MCP/API redistribution rights are not confirmed",
      {
        toolName
      }
    );
  }

  const grantedScopes = new Set(input.grantedScopes ?? []);
  if (!grantedScopes.has(tool.permissions.requiredScope)) {
    throw new McpRuntimeInputError(
      "TOOL_SCOPE_REQUIRED",
      "required MCP tool scope is missing",
      {
        requiredScope: tool.permissions.requiredScope,
        toolName
      }
    );
  }

  return {
    ...basePlan,
    tool_call: {
      live_execution: false,
      requested_tool_name: tool.name,
      required_scope: tool.permissions.requiredScope,
      schema_validation: "planned",
      structured_content_validation: "planned"
    },
    usage: {
      cached: false,
      credits: 0,
      rows: 1
    }
  };
}

function createToolDescriptors(
  tools: readonly RegisteredToolDefinition[]
): McpToolDescriptor[] {
  return tools.map((tool) => ({
    description: tool.description,
    input_schema_id: tool.schema.inputSchemaId,
    name: tool.name,
    output_schema_id: tool.schema.outputSchemaId,
    required_scope: tool.permissions.requiredScope,
    version: tool.version
  }));
}

function normalizeAndValidateOAuthScopes(
  requestedScopes: readonly string[] | undefined
): McpOAuthScope[] {
  const scopes = [...new Set(requestedScopes ?? [])]
    .map((scope) => normalizeText(scope))
    .filter((scope): scope is string => scope !== undefined);

  if (scopes.length === 0) {
    throw new McpRuntimeInputError(
      "SCOPE_REQUIRED",
      "at least one OAuth scope is required"
    );
  }

  const unsupportedScopes = scopes.filter((scope) => !isMcpOAuthScope(scope));
  if (unsupportedScopes.length > 0) {
    throw new McpRuntimeInputError("UNSUPPORTED_SCOPE", "OAuth scope is unsupported", {
      supportedScopes: MCP_OAUTH_SCOPE_DEFINITIONS.map((definition) => definition.scope),
      unsupportedScopes
    });
  }

  return scopes as McpOAuthScope[];
}

function createScopeGrant(scope: McpOAuthScope): McpOAuthScopeGrant {
  const definition = MCP_OAUTH_SCOPE_DEFINITIONS.find(
    (candidate) => candidate.scope === scope
  );

  if (definition === undefined) {
    throw new McpRuntimeInputError("UNSUPPORTED_SCOPE", "OAuth scope is unsupported", {
      scope
    });
  }

  return {
    data_classes: definition.data_classes,
    description: definition.description,
    risk_level: definition.risk_level,
    revocable: true,
    scope: definition.scope,
    write: definition.write
  };
}

function createMcpOAuthProvenance(action: "authorize" | "revoke" | "token") {
  return [
    {
      data_version: MCP_OAUTH_PKCE_VERSION,
      methodology_version: MCP_OAUTH_PKCE_VERSION,
      source: "mcp-oauth-pkce",
      source_record_id: `mcp_oauth_${action}`
    }
  ];
}

function isMcpOAuthScope(value: string): value is McpOAuthScope {
  return MCP_OAUTH_SCOPE_DEFINITIONS.some((definition) => definition.scope === value);
}

function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

function isValidPkceCodeChallenge(value: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/u.test(value);
}

function normalizeMcpMethod(value: string | undefined): McpMethod | undefined {
  return MCP_SUPPORTED_METHODS.includes(value as McpMethod)
    ? (value as McpMethod)
    : undefined;
}

function normalizeText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}
