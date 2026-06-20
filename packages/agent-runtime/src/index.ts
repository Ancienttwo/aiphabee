import { isStepCount } from "ai";

export const AGENT_RUNTIME_VERSION = "agent-runtime-scaffold-v0";
export const AI_SDK_TARGET_VERSION = "7.0.0-beta.182";

export const AGENT_RUNTIME_LIMITS = {
  maxParallelTools: 3,
  maxSteps: 6,
  minSteps: 1,
  supportedMaxSteps: 8
} as const;

export const REGISTERED_AGENT_TOOLS = [
  {
    channel: "web",
    name: "resolve_security",
    requiredScope: "security:read",
    status: "planned",
    version: "0.0.0"
  },
  {
    channel: "web",
    name: "get_security_profile",
    requiredScope: "security:read",
    status: "planned",
    version: "0.0.0"
  },
  {
    channel: "web",
    name: "get_data_lineage",
    requiredScope: "lineage:read",
    status: "planned",
    version: "0.0.0"
  },
  {
    channel: "web",
    name: "get_entitlements",
    requiredScope: "entitlements:read",
    status: "planned",
    version: "0.0.0"
  }
] as const;

export type RegisteredAgentToolName = (typeof REGISTERED_AGENT_TOOLS)[number]["name"];

export interface AgentRunSkeletonInput {
  maxSteps?: number;
  prompt: string;
  requestId: string;
  requestedTools?: string[];
}

export interface AgentRuntimeCapabilities {
  ai_sdk: {
    package_name: "ai";
    target_version: typeof AI_SDK_TARGET_VERSION;
    stop_condition: "isStepCount";
  };
  limits: typeof AGENT_RUNTIME_LIMITS;
  model_provider: "not_configured";
  registered_tools: typeof REGISTERED_AGENT_TOOLS;
  runtime_version: typeof AGENT_RUNTIME_VERSION;
  surfaces: {
    market_data: false;
    mcp_redistribution: false;
    model_calls: false;
  };
}

export interface AgentRunSkeleton {
  ai_sdk: {
    package_name: "ai";
    stop_condition: "isStepCount";
    target_version: typeof AI_SDK_TARGET_VERSION;
  };
  budget: {
    max_parallel_tools: number;
    max_steps: number;
  };
  next_required_binding: "model_provider";
  prompt: {
    characters: number;
    received: true;
  };
  request_id: string;
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
  const registeredTools = REGISTERED_AGENT_TOOLS.map((tool) => tool.name);
  const deniedTools = requestedTools.filter(
    (tool) => !registeredTools.includes(tool as RegisteredAgentToolName)
  );

  if (deniedTools.length > 0) {
    throw new AgentRuntimeInputError(
      "UNREGISTERED_TOOL",
      "requested tools must be registered before use",
      {
        deniedTools
      }
    );
  }

  return {
    ai_sdk: {
      package_name: "ai",
      stop_condition: "isStepCount",
      target_version: AI_SDK_TARGET_VERSION
    },
    budget: {
      max_parallel_tools: AGENT_RUNTIME_LIMITS.maxParallelTools,
      max_steps: maxSteps
    },
    next_required_binding: "model_provider",
    prompt: {
      characters: prompt.length,
      received: true
    },
    request_id: input.requestId,
    run_id: `dry_${input.requestId}`,
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
