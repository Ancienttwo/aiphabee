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
export const TOOL_LOOP_AGENT_PLANNER_VERSION =
  "2026-06-21.phase1.tool-loop-agent-planner-scaffold.v0";
export const PRE_TOOL_CALL_RESOLUTION_VERSION =
  "2026-06-21.phase1.pre-tool-call-resolution-scaffold.v0";
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
  asOf?: string;
  channel?: string;
  currency?: string;
  entitlementPolicyVersion?: string;
  maxCredits?: number;
  maxRows?: number;
  maxSteps?: number;
  maxTokens?: number;
  maxWallClockMs?: number;
  modelTier?: string;
  methodology?: string;
  plan?: string;
  prompt: string;
  requestId: string;
  requestedTools?: string[];
  securities?: string[];
  securityQuery?: string;
  timeRange?: {
    end?: string;
    start?: string;
  };
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
  pre_tool_call_resolution: {
    actual_tool_execution: false;
    clarification_supported: true;
    currencies: readonly ["HKD", "USD", "CNY"];
    model_calls: false;
    required_dimensions: readonly ["security", "time", "currency", "methodology"];
    status: "pre_tool_call_resolution_scaffold";
  };
  tool_loop_agent: {
    actual_tool_execution: false;
    chain_of_thought_exposed: false;
    max_parallel_tools: typeof AGENT_RUNTIME_LIMITS.maxParallelTools;
    model_calls: false;
    planner_ready: true;
    progress_events: readonly [
      "run.started",
      "tool.step.planned",
      "tool.call.started",
      "tool.call.completed",
      "tool.call.failed",
      "run.completed",
      "run.stopped"
    ];
    status: "tool_loop_agent_planner_scaffold";
    stop_conditions: readonly [
      "max_steps",
      "budget_exhausted",
      "two_consecutive_same_error",
      "tool_scope_denied",
      "all_planned_tools_completed"
    ];
    streaming_transport: "planned";
  };
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

export type AgentToolLoopStepKind = "answer_contract" | "tool_calls";
export type AgentToolLoopPhase =
  | "answer_contract"
  | "data_fetch"
  | "entitlement_gate"
  | "evidence_binding"
  | "security_resolution";
export type AgentToolLoopProgressEvent =
  | "run.started"
  | "tool.call.completed"
  | "tool.call.failed"
  | "tool.call.started"
  | "tool.step.planned"
  | "run.completed"
  | "run.stopped";
export type AgentToolLoopStatus = "planned_no_model";

export type PreToolCallResolutionStatus =
  | "needs_clarification"
  | "ready"
  | "ready_with_assumptions";
export type PreToolCallDimensionStatus =
  | "assumed"
  | "needs_clarification"
  | "resolved";

export interface PreToolCallAssumption {
  field: string;
  reason: string;
  source: "request" | "synthetic_default";
  value: string;
}

export interface PreToolCallClarification {
  blocking: true;
  field: string;
  question: string;
  reason: string;
}

export interface PreToolCallResolution {
  actual_tool_execution: false;
  assumptions: PreToolCallAssumption[];
  clarification_required: boolean;
  clarifications: PreToolCallClarification[];
  currency: {
    currency: string;
    status: PreToolCallDimensionStatus;
  };
  methodology: {
    financial_facts_version: string;
    price_adjustment: string;
    status: PreToolCallDimensionStatus;
  };
  model_calls: false;
  request_id: string;
  security: {
    ambiguous_candidates: Array<{
      instrument_id: string;
      market: string;
      symbol: string;
    }>;
    query: string;
    resolved: Array<{
      currency: string;
      instrument_id: string;
      market: string;
      symbol: string;
    }>;
    status: PreToolCallDimensionStatus;
  };
  status: PreToolCallResolutionStatus;
  time: {
    as_of: string;
    status: PreToolCallDimensionStatus;
    time_range?: {
      end: string;
      start: string;
    };
  };
  tool_readiness: {
    blocked_tools: RegisteredAgentToolName[];
    can_plan_tools: boolean;
  };
  version: typeof PRE_TOOL_CALL_RESOLUTION_VERSION;
}

export interface AgentToolLoopToolCallPlan {
  execution: "planned_no_call";
  input_schema_id: string;
  live_data_access: false;
  name: RegisteredAgentToolName;
  output_schema_id: string;
  required_scope: string;
  version: string;
}

export interface AgentToolLoopRetryPolicy {
  consecutive_same_error_limit: 2;
  max_attempts_per_tool: 2;
  retry_billable: false;
}

export interface AgentToolLoopStepPlan {
  index: number;
  kind: AgentToolLoopStepKind;
  phase: AgentToolLoopPhase;
  progress_events: AgentToolLoopProgressEvent[];
  public_label: string;
  retry_policy: AgentToolLoopRetryPolicy;
  step_id: string;
  stop_on_error: true;
  tool_calls: AgentToolLoopToolCallPlan[];
}

export interface AgentToolLoopPlan {
  actual_tool_execution: false;
  budget: AgentRunBudget;
  chain_of_thought_exposed: false;
  max_parallel_tools: typeof AGENT_RUNTIME_LIMITS.maxParallelTools;
  model_calls: false;
  planned_step_count: number;
  progress_stream: {
    events: AgentToolLoopProgressEvent[];
    exposes_chain_of_thought: false;
    tool_progress_public: true;
    transport: "planned";
  };
  request_id: string;
  pre_tool_call_resolution: PreToolCallResolution;
  retry_policy: AgentToolLoopRetryPolicy;
  run_context: AgentRunContext;
  run_id: string;
  status: AgentToolLoopStatus;
  steps: AgentToolLoopStepPlan[];
  stop_conditions: Array<
    | "all_planned_tools_completed"
    | "budget_exhausted"
    | "max_steps"
    | "tool_scope_denied"
    | "two_consecutive_same_error"
  >;
  version: typeof TOOL_LOOP_AGENT_PLANNER_VERSION;
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
    pre_tool_call_resolution: {
      actual_tool_execution: false,
      clarification_supported: true,
      currencies: ["HKD", "USD", "CNY"],
      model_calls: false,
      required_dimensions: ["security", "time", "currency", "methodology"],
      status: "pre_tool_call_resolution_scaffold"
    },
    tool_loop_agent: {
      actual_tool_execution: false,
      chain_of_thought_exposed: false,
      max_parallel_tools: AGENT_RUNTIME_LIMITS.maxParallelTools,
      model_calls: false,
      planner_ready: true,
      progress_events: [
        "run.started",
        "tool.step.planned",
        "tool.call.started",
        "tool.call.completed",
        "tool.call.failed",
        "run.completed",
        "run.stopped"
      ],
      status: "tool_loop_agent_planner_scaffold",
      stop_conditions: [
        "max_steps",
        "budget_exhausted",
        "two_consecutive_same_error",
        "tool_scope_denied",
        "all_planned_tools_completed"
      ],
      streaming_transport: "planned"
    },
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

export function createToolLoopAgentPlan(input: AgentRunSkeletonInput): AgentToolLoopPlan {
  const skeleton = createAgentRunSkeleton(input);
  const preToolCallResolution = createPreToolCallResolution(input);
  const retryPolicy = createRetryPolicy();
  const steps =
    preToolCallResolution.clarification_required
      ? [
          createStep(
            1,
            "answer_contract",
            "answer_contract",
            "Request clarification before tool calls",
            [],
            retryPolicy
          )
        ]
      : createToolLoopSteps(skeleton.run_context.toolset.tools, retryPolicy);

  if (steps.length > skeleton.budget.max_steps) {
    throw new AgentRuntimeInputError(
      "STEP_LIMIT_OUT_OF_RANGE",
      `planned step count ${steps.length} exceeds maxSteps ${skeleton.budget.max_steps}`,
      {
        maxSteps: skeleton.budget.max_steps,
        plannedStepCount: steps.length
      }
    );
  }

  return {
    actual_tool_execution: false,
    budget: skeleton.run_context.budget,
    chain_of_thought_exposed: false,
    max_parallel_tools: AGENT_RUNTIME_LIMITS.maxParallelTools,
    model_calls: false,
    planned_step_count: steps.length,
    progress_stream: {
      events: [
        "run.started",
        "tool.step.planned",
        "tool.call.started",
        "tool.call.completed",
        "tool.call.failed",
        "run.completed",
        "run.stopped"
      ],
      exposes_chain_of_thought: false,
      tool_progress_public: true,
      transport: "planned"
    },
    request_id: skeleton.request_id,
    pre_tool_call_resolution: preToolCallResolution,
    retry_policy: retryPolicy,
    run_context: skeleton.run_context,
    run_id: skeleton.run_id,
    status: "planned_no_model",
    steps,
    stop_conditions: [
      "max_steps",
      "budget_exhausted",
      "two_consecutive_same_error",
      "tool_scope_denied",
      "all_planned_tools_completed"
    ],
    version: TOOL_LOOP_AGENT_PLANNER_VERSION
  };
}

export function createPreToolCallResolution(
  input: AgentRunSkeletonInput
): PreToolCallResolution {
  const prompt = input.prompt.trim();

  if (prompt.length === 0) {
    throw new AgentRuntimeInputError("PROMPT_REQUIRED", "prompt is required");
  }

  const requestedTools = input.requestedTools ?? [
    "resolve_security",
    "get_security_profile",
    "get_data_lineage",
    "get_entitlements"
  ];
  const toolValidation = validateRegisteredTools(requestedTools);

  if (toolValidation.deniedTools.length > 0) {
    throw new AgentRuntimeInputError(
      "UNREGISTERED_TOOL",
      "requested tools must be registered before use",
      {
        deniedTools: toolValidation.deniedTools
      }
    );
  }

  const assumptions: PreToolCallAssumption[] = [];
  const clarifications: PreToolCallClarification[] = [];
  const security = resolveSecurityContext(input, assumptions, clarifications);
  const time = resolveTimeContext(input, assumptions);
  const currency = resolveCurrencyContext(input, security.resolved, assumptions);
  const methodology = resolveMethodologyContext(input, assumptions);

  if (currency.status === "needs_clarification") {
    clarifications.push({
      blocking: true,
      field: "currency",
      question: "Which supported reporting currency should be used: HKD, USD, or CNY?",
      reason: "currency must be resolved before tool planning"
    });
  }

  const clarificationRequired = clarifications.length > 0;

  return {
    actual_tool_execution: false,
    assumptions,
    clarification_required: clarificationRequired,
    clarifications,
    currency,
    methodology,
    model_calls: false,
    request_id: input.requestId,
    security,
    status: clarificationRequired
      ? "needs_clarification"
      : assumptions.length > 0
        ? "ready_with_assumptions"
        : "ready",
    time,
    tool_readiness: {
      blocked_tools: clarificationRequired ? toolValidation.allowedTools : [],
      can_plan_tools: !clarificationRequired
    },
    version: PRE_TOOL_CALL_RESOLUTION_VERSION
  };
}

function resolveSecurityContext(
  input: AgentRunSkeletonInput,
  assumptions: PreToolCallAssumption[],
  clarifications: PreToolCallClarification[]
): PreToolCallResolution["security"] {
  const query = normalizeOptionalText(input.securityQuery) ?? input.prompt.trim();
  const securities = normalizeSecurityInputs(input.securities, query);
  const resolved: PreToolCallResolution["security"]["resolved"] = [];
  const ambiguousCandidates: PreToolCallResolution["security"]["ambiguous_candidates"] = [];

  for (const security of securities) {
    const normalized = security.toUpperCase();

    if (normalized === "00700.HK" || normalized === "TENCENT" || normalized === "腾讯") {
      resolved.push({
        currency: "HKD",
        instrument_id: "eq_hk_00700",
        market: "HK",
        symbol: "00700.HK"
      });
      continue;
    }

    if (normalized === "00001.HK") {
      resolved.push({
        currency: "HKD",
        instrument_id: "eq_hk_00001",
        market: "HK",
        symbol: "00001.HK"
      });
      continue;
    }

    if (normalized === "08001.HK") {
      resolved.push({
        currency: "HKD",
        instrument_id: "eq_hk_08001",
        market: "HK",
        symbol: "08001.HK"
      });
      continue;
    }

    if (normalized === "ABC") {
      ambiguousCandidates.push(
        {
          instrument_id: "eq_hk_00001",
          market: "HK",
          symbol: "00001.HK"
        },
        {
          instrument_id: "eq_hk_08001",
          market: "HK",
          symbol: "08001.HK"
        }
      );
      continue;
    }

    clarifications.push({
      blocking: true,
      field: "security",
      question: `Which listed security should be used for \"${security}\"?`,
      reason: "security identifier could not be resolved before tool planning"
    });
  }

  if (securities.length === 0) {
    clarifications.push({
      blocking: true,
      field: "security",
      question: "Which security should AiphaBee analyze before calling tools?",
      reason: "no security identifier or company name was found in the prompt"
    });
  }

  if (ambiguousCandidates.length > 0) {
    clarifications.push({
      blocking: true,
      field: "security",
      question: "Which candidate security should be used for ABC?",
      reason: "security identifier is ambiguous and cannot be silently selected"
    });
  }

  if (resolved.length === 0 && ambiguousCandidates.length === 0 && securities.length > 0) {
    clarifications.push({
      blocking: true,
      field: "security",
      question: "Provide a supported symbol such as 00700.HK before tool calls.",
      reason: "no supported security fixture matched the request"
    });
  }

  if (resolved.length > 0 && input.securities === undefined) {
    assumptions.push({
      field: "security",
      reason: "security was inferred from the prompt before tool planning",
      source: "synthetic_default",
      value: resolved.map((security) => security.symbol).join(",")
    });
  }

  return {
    ambiguous_candidates: ambiguousCandidates,
    query,
    resolved,
    status:
      clarifications.some((clarification) => clarification.field === "security")
        ? "needs_clarification"
        : input.securities === undefined
          ? "assumed"
          : "resolved"
  };
}

function resolveTimeContext(
  input: AgentRunSkeletonInput,
  assumptions: PreToolCallAssumption[]
): PreToolCallResolution["time"] {
  const asOf = normalizeOptionalText(input.asOf);
  const start = normalizeOptionalText(input.timeRange?.start);
  const end = normalizeOptionalText(input.timeRange?.end);

  if (asOf !== undefined) {
    return {
      as_of: asOf,
      status: "resolved",
      ...(start !== undefined && end !== undefined
        ? {
            time_range: {
              end,
              start
            }
          }
        : {})
    };
  }

  assumptions.push({
    field: "time.as_of",
    reason: "no as_of was supplied, so the planner uses the latest available snapshot",
    source: "synthetic_default",
    value: "latest_available"
  });

  return {
    as_of: "latest_available",
    status: "assumed",
    ...(start !== undefined && end !== undefined
      ? {
          time_range: {
            end,
            start
          }
        }
      : {})
  };
}

function resolveCurrencyContext(
  input: AgentRunSkeletonInput,
  securities: PreToolCallResolution["security"]["resolved"],
  assumptions: PreToolCallAssumption[],
): PreToolCallResolution["currency"] {
  const currency = normalizeOptionalText(input.currency)?.toUpperCase();

  if (currency !== undefined) {
    if (currency === "HKD" || currency === "USD" || currency === "CNY") {
      return {
        currency,
        status: "resolved"
      };
    }

    return {
      currency,
      status: "needs_clarification"
    };
  }

  const inferred = securities[0]?.currency ?? "HKD";

  assumptions.push({
    field: "currency",
    reason: "no currency was supplied, so the planner uses the primary security currency",
    source: "synthetic_default",
    value: inferred
  });

  return {
    currency: inferred,
    status: "assumed"
  };
}

function resolveMethodologyContext(
  input: AgentRunSkeletonInput,
  assumptions: PreToolCallAssumption[]
): PreToolCallResolution["methodology"] {
  const methodology = normalizeOptionalText(input.methodology);

  if (methodology !== undefined) {
    return {
      financial_facts_version: methodology,
      price_adjustment: methodology,
      status: "resolved"
    };
  }

  assumptions.push(
    {
      field: "methodology.price_adjustment",
      reason: "no price methodology was supplied before planning",
      source: "synthetic_default",
      value: "split_adjusted"
    },
    {
      field: "methodology.financial_facts_version",
      reason: "no financial-facts methodology was supplied before planning",
      source: "synthetic_default",
      value: "latest_reported"
    }
  );

  return {
    financial_facts_version: "latest_reported",
    price_adjustment: "split_adjusted",
    status: "assumed"
  };
}

function normalizeSecurityInputs(
  explicitSecurities: string[] | undefined,
  query: string
): string[] {
  if (explicitSecurities !== undefined) {
    return explicitSecurities
      .map((security) => security.trim())
      .filter((security) => security.length > 0);
  }

  const matches = new Set<string>();
  const prompt = query.trim();
  const symbolMatches = prompt.match(/\b(?:\d{5}|[A-Z]{1,5})\.HK\b/giu) ?? [];

  for (const match of symbolMatches) {
    matches.add(match.toUpperCase());
  }

  if (/tencent/iu.test(prompt) || /腾讯/u.test(prompt)) {
    matches.add("00700.HK");
  }

  if (/\bABC\b/u.test(prompt)) {
    matches.add("ABC");
  }

  return [...matches];
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
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

function createToolLoopSteps(
  tools: AgentRunToolContext[],
  retryPolicy: AgentToolLoopRetryPolicy
): AgentToolLoopStepPlan[] {
  const steps: AgentToolLoopStepPlan[] = [];
  const resolverTools = tools.filter((tool) => tool.name === "resolve_security");
  const entitlementTools = tools.filter((tool) => tool.name === "get_entitlements");
  const evidenceTools = tools.filter((tool) => tool.name === "get_data_lineage");
  const dataTools = tools.filter(
    (tool) =>
      tool.name !== "resolve_security" &&
      tool.name !== "get_entitlements" &&
      tool.name !== "get_data_lineage"
  );

  pushToolStep(steps, "security_resolution", "Resolve security and time context", resolverTools, retryPolicy);
  pushToolStep(steps, "entitlement_gate", "Check workspace entitlement scope", entitlementTools, retryPolicy);

  for (const chunk of chunkTools(dataTools, AGENT_RUNTIME_LIMITS.maxParallelTools)) {
    pushToolStep(steps, "data_fetch", "Fetch read-only tool data", chunk, retryPolicy);
  }

  pushToolStep(steps, "evidence_binding", "Bind source lineage and evidence", evidenceTools, retryPolicy);
  steps.push(
    createStep(
      steps.length + 1,
      "answer_contract",
      "answer_contract",
      "Prepare evidence-bound answer contract",
      [],
      retryPolicy
    )
  );

  return steps;
}

function pushToolStep(
  steps: AgentToolLoopStepPlan[],
  phase: AgentToolLoopPhase,
  label: string,
  tools: AgentRunToolContext[],
  retryPolicy: AgentToolLoopRetryPolicy
) {
  if (tools.length === 0) {
    return;
  }

  steps.push(createStep(steps.length + 1, "tool_calls", phase, label, tools, retryPolicy));
}

function createStep(
  index: number,
  kind: AgentToolLoopStepKind,
  phase: AgentToolLoopPhase,
  label: string,
  tools: AgentRunToolContext[],
  retryPolicy: AgentToolLoopRetryPolicy
): AgentToolLoopStepPlan {
  return {
    index,
    kind,
    phase,
    progress_events:
      kind === "tool_calls"
        ? ["tool.step.planned", "tool.call.started", "tool.call.completed", "tool.call.failed"]
        : ["tool.step.planned", "run.completed", "run.stopped"],
    public_label: label,
    retry_policy: retryPolicy,
    step_id: `step_${index}`,
    stop_on_error: true,
    tool_calls: tools.map((tool) => ({
      execution: "planned_no_call",
      input_schema_id: tool.input_schema_id,
      live_data_access: tool.live_data_access,
      name: tool.name,
      output_schema_id: tool.output_schema_id,
      required_scope: tool.required_scope,
      version: tool.version
    }))
  };
}

function createRetryPolicy(): AgentToolLoopRetryPolicy {
  return {
    consecutive_same_error_limit: 2,
    max_attempts_per_tool: 2,
    retry_billable: false
  };
}

function chunkTools<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
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
