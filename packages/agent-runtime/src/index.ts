import { isStepCount } from "ai";
import {
  REGISTERED_TOOLS,
  TOOL_REGISTRY_VERSION,
  getRegisteredToolNames,
  validateRegisteredTools,
  type RegisteredToolDefinition,
  type RegisteredToolName
} from "@aiphabee/tool-registry";

export const AGENT_RUNTIME_VERSION = "agent-runtime-scaffold-v0";
export const AGENT_RUN_CONTEXT_VERSION =
  "2026-06-21.phase1.agent-run-context-scaffold.v0";
export const AI_SDK_TARGET_VERSION = "7.0.0-beta.182";

export const AGENT_RUNTIME_LIMITS = {
  maxCredits: 20,
  maxParallelTools: 3,
  maxRows: 500,
  maxSteps: 6,
  maxTokens: 8000,
  maxWallClockMs: 30000,
  minSteps: 1,
  supportedMaxSteps: 8
} as const;

export const REGISTERED_AGENT_TOOLS = REGISTERED_TOOLS;
export type RegisteredAgentToolName = RegisteredToolName;

export interface AgentRunSkeletonInput {
  channel?: string;
  entitlementPolicyVersion?: string;
  maxCredits?: number;
  maxRows?: number;
  maxSteps?: number;
  maxTokens?: number;
  maxWallClockMs?: number;
  modelTier?: string;
  plan?: string;
  prompt: string;
  requestId: string;
  requestedTools?: string[];
  userId?: string;
  workspaceId?: string;
}

export interface AgentRuntimeCapabilities {
  ai_sdk: {
    package_name: "ai";
    target_version: typeof AI_SDK_TARGET_VERSION;
    stop_condition: "isStepCount";
  };
  limits: typeof AGENT_RUNTIME_LIMITS;
  model_provider: "not_configured";
  run_context: {
    budget_dimensions: readonly [
      "steps",
      "parallel_tools",
      "tokens",
      "rows",
      "credits",
      "wall_clock_ms"
    ];
    context_ready: true;
    entitlement_policy_source: "synthetic_default_deny";
    live_entitlement_reads: false;
    model_tiers: readonly ["dry_run"];
    required_fields: readonly [
      "run",
      "user",
      "workspace",
      "subscription",
      "entitlements",
      "toolset",
      "budget",
      "model"
    ];
    status: "agent_run_context_scaffold";
    tool_versions: true;
  };
  registered_tools: typeof REGISTERED_AGENT_TOOLS;
  runtime_version: typeof AGENT_RUNTIME_VERSION;
  surfaces: {
    market_data: false;
    mcp_redistribution: false;
    model_calls: false;
  };
}

export interface AgentRunBudget {
  max_credits: number;
  max_parallel_tools: number;
  max_rows: number;
  max_steps: number;
  max_tokens: number;
  max_wall_clock_ms: number;
}

export interface AgentRunContext {
  budget: AgentRunBudget;
  channel: "api" | "mcp" | "web";
  entitlements: {
    allowed_tools: RegisteredAgentToolName[];
    data_rights_state: "default_deny";
    denied_tools: string[];
    live_policy_source: false;
    partner_rights_matrix_loaded: false;
    policy_version: string;
    required_scopes: string[];
  };
  model: {
    ai_gateway: "not_configured";
    model_calls: false;
    streaming: false;
    tier: "dry_run";
  };
  run: {
    mode: "dry_run";
    request_id: string;
    run_id: string;
    runtime_version: typeof AGENT_RUNTIME_VERSION;
    status: "dry_run";
  };
  subscription: {
    plan: string;
    source: "request" | "synthetic_default";
  };
  toolset: {
    registry_version: typeof TOOL_REGISTRY_VERSION;
    tools: AgentRunToolContext[];
  };
  user: {
    source: "request" | "synthetic_default";
    user_id: string;
  };
  version: typeof AGENT_RUN_CONTEXT_VERSION;
  workspace: {
    source: "request" | "synthetic_default";
    workspace_id: string;
  };
}

export interface AgentRunToolContext {
  input_schema_id: string;
  live_data_access: false;
  name: RegisteredAgentToolName;
  output_schema_id: string;
  required_scope: string;
  version: string;
}

export interface AgentRunSkeleton {
  ai_sdk: {
    package_name: "ai";
    stop_condition: "isStepCount";
    target_version: typeof AI_SDK_TARGET_VERSION;
  };
  budget: {
    max_credits: number;
    max_parallel_tools: number;
    max_rows: number;
    max_steps: number;
    max_tokens: number;
    max_wall_clock_ms: number;
  };
  next_required_binding: "model_provider";
  prompt: {
    characters: number;
    received: true;
  };
  request_id: string;
  run_context: AgentRunContext;
  run_id: string;
  status: "dry_run";
  tool_policy: {
    allow_arbitrary_sql: false;
    allow_arbitrary_url: false;
    denied_tools: string[];
    max_parallel_tools: number;
    registered_tools: RegisteredAgentToolName[];
    requested_tools: string[];
  };
}

export type AgentRuntimeInputErrorCode =
  | "CONTEXT_REQUIRED"
  | "INVALID_CHANNEL"
  | "INVALID_MODEL_TIER"
  | "PROMPT_REQUIRED"
  | "STEP_LIMIT_OUT_OF_RANGE"
  | "UNREGISTERED_TOOL";

export class AgentRuntimeInputError extends Error {
  readonly code: AgentRuntimeInputErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: AgentRuntimeInputErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export function getAgentRuntimeCapabilities(): AgentRuntimeCapabilities {
  return {
    ai_sdk: {
      package_name: "ai",
      stop_condition: "isStepCount",
      target_version: AI_SDK_TARGET_VERSION
    },
    limits: AGENT_RUNTIME_LIMITS,
    model_provider: "not_configured",
    run_context: {
      budget_dimensions: [
        "steps",
        "parallel_tools",
        "tokens",
        "rows",
        "credits",
        "wall_clock_ms"
      ],
      context_ready: true,
      entitlement_policy_source: "synthetic_default_deny",
      live_entitlement_reads: false,
      model_tiers: ["dry_run"],
      required_fields: [
        "run",
        "user",
        "workspace",
        "subscription",
        "entitlements",
        "toolset",
        "budget",
        "model"
      ],
      status: "agent_run_context_scaffold",
      tool_versions: true
    },
    registered_tools: REGISTERED_AGENT_TOOLS,
    runtime_version: AGENT_RUNTIME_VERSION,
    surfaces: {
      market_data: false,
      mcp_redistribution: false,
      model_calls: false
    }
  };
}

export function createAiSdkStopCondition(
  maxSteps: number = AGENT_RUNTIME_LIMITS.maxSteps
) {
  assertStepLimit(maxSteps);
  return isStepCount(maxSteps);
}

export function createAgentRunSkeleton(input: AgentRunSkeletonInput): AgentRunSkeleton {
  const prompt = input.prompt.trim();

  if (prompt.length === 0) {
    throw new AgentRuntimeInputError("PROMPT_REQUIRED", "prompt is required");
  }

  const maxSteps = input.maxSteps ?? AGENT_RUNTIME_LIMITS.maxSteps;
  assertStepLimit(maxSteps);

  const requestedTools = input.requestedTools ?? [
    "resolve_security",
    "get_security_profile",
    "get_data_lineage",
    "get_entitlements"
  ];
  const registeredTools = getRegisteredToolNames();
  const toolValidation = validateRegisteredTools(requestedTools);
  const deniedTools = toolValidation.deniedTools;

  if (deniedTools.length > 0) {
    throw new AgentRuntimeInputError(
      "UNREGISTERED_TOOL",
      "requested tools must be registered before use",
      {
        deniedTools
      }
    );
  }

  const budget = createAgentRunBudget({
    maxCredits: input.maxCredits,
    maxRows: input.maxRows,
    maxSteps,
    maxTokens: input.maxTokens,
    maxWallClockMs: input.maxWallClockMs
  });
  const runId = `dry_${input.requestId}`;
  const runContext = createAgentRunContext({
    budget,
    channel: input.channel,
    entitlementPolicyVersion: input.entitlementPolicyVersion,
    modelTier: input.modelTier,
    plan: input.plan,
    requestId: input.requestId,
    requestedTools,
    runId,
    userId: input.userId,
    workspaceId: input.workspaceId
  });

  return {
    ai_sdk: {
      package_name: "ai",
      stop_condition: "isStepCount",
      target_version: AI_SDK_TARGET_VERSION
    },
    budget: {
      max_credits: budget.max_credits,
      max_parallel_tools: AGENT_RUNTIME_LIMITS.maxParallelTools,
      max_rows: budget.max_rows,
      max_steps: maxSteps,
      max_tokens: budget.max_tokens,
      max_wall_clock_ms: budget.max_wall_clock_ms
    },
    next_required_binding: "model_provider",
    prompt: {
      characters: prompt.length,
      received: true
    },
    request_id: input.requestId,
    run_context: runContext,
    run_id: runId,
    status: "dry_run",
    tool_policy: {
      allow_arbitrary_sql: false,
      allow_arbitrary_url: false,
      denied_tools: [],
      max_parallel_tools: AGENT_RUNTIME_LIMITS.maxParallelTools,
      registered_tools: registeredTools,
      requested_tools: requestedTools
    }
  };
}

function createAgentRunBudget(input: {
  maxCredits?: number;
  maxRows?: number;
  maxSteps: number;
  maxTokens?: number;
  maxWallClockMs?: number;
}): AgentRunBudget {
  return {
    max_credits: normalizePositiveInteger(
      input.maxCredits,
      AGENT_RUNTIME_LIMITS.maxCredits,
      "maxCredits"
    ),
    max_parallel_tools: AGENT_RUNTIME_LIMITS.maxParallelTools,
    max_rows: normalizePositiveInteger(input.maxRows, AGENT_RUNTIME_LIMITS.maxRows, "maxRows"),
    max_steps: input.maxSteps,
    max_tokens: normalizePositiveInteger(
      input.maxTokens,
      AGENT_RUNTIME_LIMITS.maxTokens,
      "maxTokens"
    ),
    max_wall_clock_ms: normalizePositiveInteger(
      input.maxWallClockMs,
      AGENT_RUNTIME_LIMITS.maxWallClockMs,
      "maxWallClockMs"
    )
  };
}

function createAgentRunContext(input: {
  budget: AgentRunBudget;
  channel?: string;
  entitlementPolicyVersion?: string;
  modelTier?: string;
  plan?: string;
  requestId: string;
  requestedTools: string[];
  runId: string;
  userId?: string;
  workspaceId?: string;
}): AgentRunContext {
  const channel = normalizeChannel(input.channel);
  const modelTier = normalizeModelTier(input.modelTier);
  const plan = normalizeText(input.plan, "free", "plan");
  const user = normalizeUserIdentity(input.userId);
  const workspace = normalizeWorkspaceIdentity(input.workspaceId);
  const toolDefinitions = input.requestedTools.map((toolName) =>
    getRegisteredToolDefinition(toolName as RegisteredAgentToolName)
  );

  return {
    budget: input.budget,
    channel,
    entitlements: {
      allowed_tools: toolDefinitions.map((tool) => tool.name),
      data_rights_state: "default_deny",
      denied_tools: [],
      live_policy_source: false,
      partner_rights_matrix_loaded: false,
      policy_version: normalizeText(
        input.entitlementPolicyVersion,
        "entitlement-policy-synthetic-default-deny-v0",
        "entitlementPolicyVersion"
      ),
      required_scopes: [...new Set(toolDefinitions.map((tool) => tool.permissions.requiredScope))]
    },
    model: {
      ai_gateway: "not_configured",
      model_calls: false,
      streaming: false,
      tier: modelTier
    },
    run: {
      mode: "dry_run",
      request_id: input.requestId,
      run_id: input.runId,
      runtime_version: AGENT_RUNTIME_VERSION,
      status: "dry_run"
    },
    subscription: {
      plan,
      source: input.plan === undefined ? "synthetic_default" : "request"
    },
    toolset: {
      registry_version: TOOL_REGISTRY_VERSION,
      tools: toolDefinitions.map((tool) => ({
        input_schema_id: tool.schema.inputSchemaId,
        live_data_access: tool.execution.liveDataAccess,
        name: tool.name,
        output_schema_id: tool.schema.outputSchemaId,
        required_scope: tool.permissions.requiredScope,
        version: tool.version
      }))
    },
    user,
    version: AGENT_RUN_CONTEXT_VERSION,
    workspace
  };
}

function assertStepLimit(maxSteps: number): void {
  if (
    !Number.isInteger(maxSteps) ||
    maxSteps < AGENT_RUNTIME_LIMITS.minSteps ||
    maxSteps > AGENT_RUNTIME_LIMITS.supportedMaxSteps
  ) {
    throw new AgentRuntimeInputError(
      "STEP_LIMIT_OUT_OF_RANGE",
      `maxSteps must be an integer from ${AGENT_RUNTIME_LIMITS.minSteps} to ${AGENT_RUNTIME_LIMITS.supportedMaxSteps}`,
      {
        maxSteps
      }
    );
  }
}

function normalizePositiveInteger(value: number | undefined, fallback: number, field: string) {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new AgentRuntimeInputError(
      "STEP_LIMIT_OUT_OF_RANGE",
      `${field} must be a positive integer`,
      {
        [field]: value
      }
    );
  }

  return value;
}

function normalizeText(value: string | undefined, fallback: string, field: string): string {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new AgentRuntimeInputError("CONTEXT_REQUIRED", `${field} is required`);
  }

  return normalized;
}

function normalizeUserIdentity(value: string | undefined): AgentRunContext["user"] {
  const source = value === undefined ? "synthetic_default" : "request";

  return {
    source,
    user_id: normalizeText(value, "user_local_dry_run", "userId")
  };
}

function normalizeWorkspaceIdentity(value: string | undefined): AgentRunContext["workspace"] {
  const source = value === undefined ? "synthetic_default" : "request";

  return {
    source,
    workspace_id: normalizeText(value, "workspace_local_dry_run", "workspaceId")
  };
}

function normalizeChannel(value: string | undefined): AgentRunContext["channel"] {
  if (value === undefined) {
    return "web";
  }

  if (value === "api" || value === "mcp" || value === "web") {
    return value;
  }

  throw new AgentRuntimeInputError("INVALID_CHANNEL", "channel must be api, mcp, or web", {
    channel: value
  });
}

function normalizeModelTier(value: string | undefined): AgentRunContext["model"]["tier"] {
  if (value === undefined || value === "dry_run") {
    return "dry_run";
  }

  throw new AgentRuntimeInputError(
    "INVALID_MODEL_TIER",
    "modelTier must be dry_run until model provider is configured",
    {
      modelTier: value
    }
  );
}

function getRegisteredToolDefinition(toolName: RegisteredAgentToolName): RegisteredToolDefinition {
  const definition = REGISTERED_TOOLS.find((tool) => tool.name === toolName);

  if (definition === undefined) {
    throw new AgentRuntimeInputError("UNREGISTERED_TOOL", "requested tool is not registered", {
      deniedTools: [toolName]
    });
  }

  return definition;
}
