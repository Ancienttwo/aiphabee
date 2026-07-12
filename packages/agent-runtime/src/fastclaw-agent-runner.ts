import {
  selectAgentRunner,
  type AgentExecutionEvent,
  type AgentExecutionRequest,
  type AgentRunBudget,
  type AgentRunner,
  type SandboxBackendAccessGrant
} from "./index.js";
import {
  createInternalFastClawRunnerActivation,
  mintInternalFastClawSandboxGrant,
  type InternalFastClawRunnerActivation
} from "./sandbox-access-grant.js";

export const FASTCLAW_AGENT_RUNNER_CONTRACT_VERSION =
  "2026-07-11.fastclaw-agent-runner.v1" as const;
export const FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION =
  "2026-07-11.aiphabee-tool-callback.v1" as const;

export type FastClawAgentRunnerFailureCode =
  | "FASTCLAW_RUNNER_INVALID_REQUEST"
  | "FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE"
  | "FASTCLAW_RESEARCH_ENTITLEMENT_REQUIRED"
  | "FASTCLAW_SANDBOX_AUTHORIZATION_FAILED"
  | "FASTCLAW_RUN_CANCELLED"
  | "FASTCLAW_RUN_TIMEOUT"
  | "FASTCLAW_RUN_BUDGET_EXCEEDED"
  | "FASTCLAW_TOOL_DENIED"
  | "FASTCLAW_TRANSPORT_FAILED"
  | "FASTCLAW_POST_CHECK_DENIED";

export type FastClawSemanticProgressPhase =
  | "remote_accepted"
  | "policy_check"
  | "tool_completed"
  | "final_check";

export type FastClawDedicatedAgentAuthorityDecision =
  | {
      external_user_identity: string;
      fastclaw_agent_id: string;
      fastclaw_user_id: string;
      profile_id: string;
      status: "allowed";
      tenant_id: string;
      user_id: string;
    }
  | {
      code:
        | "FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE"
        | "FASTCLAW_RESEARCH_ENTITLEMENT_REQUIRED";
      retryable: boolean;
      status: "blocked";
    };

export interface FastClawDedicatedAgentAuthority {
  resolve(input: {
    tenant_id: string;
    user_id: string;
  }): Promise<FastClawDedicatedAgentAuthorityDecision>;
}

export interface FastClawSandboxAuthorizationIssuer {
  issue(input: {
    access_grant: SandboxBackendAccessGrant;
    budget: AgentRunBudget;
  }): Promise<{ authorization: string; expires_at: string }>;
}

export interface FastClawTransportToolCall {
  call_id: string;
  input: unknown;
  name: string;
}

export interface FastClawToolPolicyExecutor {
  execute(input: {
    call: FastClawTransportToolCall;
    request: AgentExecutionRequest;
    sandbox_authorization: string;
  }): Promise<{ output: unknown; status: "completed" } | { code: string; status: "denied" }>;
}

export interface FastClawFinalPostCheck {
  check(input: {
    raw_answer: string;
    request: AgentExecutionRequest;
    usage: FastClawTransportUsage;
  }): Promise<
    | { final_answer: string; status: "approved" }
    | { code: string; status: "denied" }
  >;
}

export interface FastClawTransportUsage {
  input_tokens: number;
  output_tokens: number;
  steps: number;
}

export interface FastClawTransportResult {
  private_reasoning?: string;
  raw_answer: string;
  usage: FastClawTransportUsage;
}

export interface FastClawCompliantTransport {
  readonly contract_version: typeof FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION;
  readonly tool_interception: "callback_before_execution";
  run(
    input: {
      external_user_identity: string;
      fastclaw_agent_id: string;
      fastclaw_user_id: string;
      prompt: string;
      run_id: string;
      sandbox_authorization: string;
      signal: AbortSignal;
    },
    callbacks: {
      onProgress(phase: FastClawSemanticProgressPhase): void;
      onToolCall(call: FastClawTransportToolCall): Promise<unknown>;
    }
  ): Promise<FastClawTransportResult>;
}

export interface FastClawAgentRunnerActivationInput {
  authority: FastClawDedicatedAgentAuthority;
  post_check: FastClawFinalPostCheck;
  sandbox_authorization_issuer: FastClawSandboxAuthorizationIssuer;
  tool_policy_executor: FastClawToolPolicyExecutor;
  transport: FastClawCompliantTransport;
  now?: () => Date;
}

const SEMANTIC_PROGRESS_PHASES = new Set<FastClawSemanticProgressPhase>([
  "remote_accepted",
  "policy_check",
  "tool_completed",
  "final_check"
]);

class FastClawRunnerFailure extends Error {
  constructor(
    readonly code: FastClawAgentRunnerFailureCode,
    readonly retryable: boolean,
    readonly terminalType: "run.blocked" | "run.failed"
  ) {
    super(code);
    this.name = "FastClawRunnerFailure";
  }
}

function event(
  request: AgentExecutionRequest,
  index: number,
  type: AgentExecutionEvent["event_type"],
  payload: Readonly<Record<string, unknown>>,
  visible: boolean,
  now: () => Date
): AgentExecutionEvent {
  return {
    created_at: now().toISOString(),
    event_index: index,
    event_type: type,
    layer: request.layer,
    payload,
    run_id: request.run_id,
    visible_to_user: visible
  };
}

function validateRequest(request: AgentExecutionRequest): void {
  if (
    request.layer !== "research" ||
    request.mode !== "runner_remote" ||
    request.prompt.trim().length === 0 ||
    request.run_id.trim().length === 0 ||
    request.request_id.trim().length === 0 ||
    request.tenant_id.trim().length === 0 ||
    request.user_id.trim().length === 0 ||
    !Number.isSafeInteger(request.budget.max_wall_clock_ms) ||
    request.budget.max_wall_clock_ms < 1 ||
    request.budget.max_wall_clock_ms > 600_000 ||
    !Number.isSafeInteger(request.budget.max_tokens) ||
    request.budget.max_tokens < 1 ||
    request.budget.max_tokens > 8_000 ||
    !Number.isSafeInteger(request.budget.max_steps) ||
    request.budget.max_steps < 1 ||
    request.budget.max_steps > 8 ||
    !Number.isSafeInteger(request.budget.max_parallel_tools) ||
    request.budget.max_parallel_tools < 1 ||
    request.budget.max_parallel_tools > 3
  ) {
    throw new FastClawRunnerFailure("FASTCLAW_RUNNER_INVALID_REQUEST", false, "run.blocked");
  }
}

function failureFromUnknown(error: unknown): FastClawRunnerFailure {
  return error instanceof FastClawRunnerFailure
    ? error
    : new FastClawRunnerFailure("FASTCLAW_TRANSPORT_FAILED", true, "run.failed");
}

function runWithAbort<T>(
  operation: Promise<T>,
  signal: AbortSignal,
  abortFailure: () => FastClawRunnerFailure
): Promise<T> {
  if (signal.aborted) return Promise.reject(abortFailure());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortFailure());
    signal.addEventListener("abort", onAbort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}

class FastClawPersonalAgentRunner {
  readonly family = "fastclaw" as const;
  readonly layer = "research" as const;
  readonly runner_id = "fastclaw.personal-v0" as const;
  readonly supported_modes = ["runner_remote"] as const;

  constructor(
    private readonly activation: InternalFastClawRunnerActivation,
    private readonly input: FastClawAgentRunnerActivationInput
  ) {}

  async *run(request: AgentExecutionRequest): AsyncIterable<AgentExecutionEvent> {
    const now = this.input.now ?? (() => new Date());
    let index = 0;
    yield event(
      request,
      index++,
      "run.requested",
      { mode: request.mode, runner_id: this.runner_id },
      false,
      now
    );

    let controller: AbortController | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let callerAbort: (() => void) | undefined;
    const phases: FastClawSemanticProgressPhase[] = [];
    let acceptingCallbacks = false;
    let activeToolCalls = 0;
    let callbackFailure: FastClawRunnerFailure | undefined;
    let toolCallCount = 0;
    const seenToolCallIds = new Set<string>();
    let terminal:
      | { payload: Readonly<Record<string, unknown>>; type: "run.blocked" | "run.failed" }
      | undefined;
    let completedPayload: Readonly<Record<string, unknown>> | undefined;

    try {
      validateRequest(request);
      if (request.signal?.aborted === true) {
        throw new FastClawRunnerFailure("FASTCLAW_RUN_CANCELLED", false, "run.failed");
      }
      controller = new AbortController();
      let abortKind: "cancelled" | "timeout" = "timeout";
      callerAbort = () => {
        abortKind = "cancelled";
        controller?.abort();
      };
      request.signal?.addEventListener("abort", callerAbort, { once: true });
      timeout = setTimeout(() => controller?.abort(), request.budget.max_wall_clock_ms);
      const abortFailure = () =>
        abortKind === "cancelled"
          ? new FastClawRunnerFailure("FASTCLAW_RUN_CANCELLED", false, "run.failed")
          : new FastClawRunnerFailure("FASTCLAW_RUN_TIMEOUT", true, "run.failed");

      const authority = await runWithAbort(
        this.input.authority.resolve({
          tenant_id: request.tenant_id,
          user_id: request.user_id
        }),
        controller.signal,
        abortFailure
      );
      if (authority.status === "blocked") {
        throw new FastClawRunnerFailure(authority.code, authority.retryable, "run.blocked");
      }
      if (
        authority.tenant_id !== request.tenant_id ||
        authority.user_id !== request.user_id ||
        authority.external_user_identity.trim().length === 0 ||
        authority.fastclaw_agent_id.trim().length === 0 ||
        authority.fastclaw_user_id.trim().length === 0 ||
        authority.profile_id.trim().length === 0
      ) {
        throw new FastClawRunnerFailure(
          "FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE",
          false,
          "run.blocked"
        );
      }
      const accessGrant = mintInternalFastClawSandboxGrant(this.activation, {
        run_id: request.run_id,
        tenant_id: request.tenant_id,
        user_id: request.user_id
      });
      let issued: Awaited<ReturnType<FastClawSandboxAuthorizationIssuer["issue"]>>;
      try {
        issued = await runWithAbort(
          this.input.sandbox_authorization_issuer.issue({
            access_grant: accessGrant,
            budget: request.budget
          }),
          controller.signal,
          abortFailure
        );
      } catch (error) {
        if (error instanceof FastClawRunnerFailure) throw error;
        throw new FastClawRunnerFailure(
          "FASTCLAW_SANDBOX_AUTHORIZATION_FAILED",
          true,
          "run.failed"
        );
      }
      const expiresAt = Date.parse(issued.expires_at);
      if (
        issued.authorization.trim().length === 0 ||
        !Number.isFinite(expiresAt) ||
        expiresAt <= now().getTime()
      ) {
        throw new FastClawRunnerFailure(
          "FASTCLAW_SANDBOX_AUTHORIZATION_FAILED",
          false,
          "run.failed"
        );
      }

      yield event(request, index++, "run.started", { runner_id: this.runner_id }, false, now);
      acceptingCallbacks = true;

      const transportPromise = this.input.transport.run(
        {
          external_user_identity: authority.external_user_identity,
          fastclaw_agent_id: authority.fastclaw_agent_id,
          fastclaw_user_id: authority.fastclaw_user_id,
          prompt: request.prompt.trim(),
          run_id: request.run_id,
          sandbox_authorization: issued.authorization,
          signal: controller.signal
        },
        {
          onProgress: (phase) => {
            if (callbackFailure !== undefined) throw callbackFailure;
            if (!acceptingCallbacks || !SEMANTIC_PROGRESS_PHASES.has(phase)) {
              callbackFailure = new FastClawRunnerFailure(
                "FASTCLAW_TRANSPORT_FAILED",
                false,
                "run.failed"
              );
              throw callbackFailure;
            }
            if (phases.length >= request.budget.max_steps * 4 + 4) {
              callbackFailure = new FastClawRunnerFailure(
                "FASTCLAW_RUN_BUDGET_EXCEEDED",
                false,
                "run.failed"
              );
              throw callbackFailure;
            }
            phases.push(phase);
          },
          onToolCall: async (call) => {
            if (callbackFailure !== undefined) throw callbackFailure;
            if (!acceptingCallbacks) {
              callbackFailure = new FastClawRunnerFailure(
                "FASTCLAW_RUN_CANCELLED",
                false,
                "run.failed"
              );
              throw callbackFailure;
            }
            phases.push("policy_check");
            toolCallCount += 1;
            activeToolCalls += 1;
            if (
              typeof call.call_id !== "string" ||
              call.call_id.trim().length === 0 ||
              seenToolCallIds.has(call.call_id) ||
              typeof call.name !== "string" ||
              !request.allowed_tools.includes(call.name)
            ) {
              activeToolCalls -= 1;
              callbackFailure = new FastClawRunnerFailure(
                "FASTCLAW_TOOL_DENIED",
                false,
                "run.blocked"
              );
              throw callbackFailure;
            }
            seenToolCallIds.add(call.call_id);
            if (
              toolCallCount > request.budget.max_steps ||
              activeToolCalls > request.budget.max_parallel_tools
            ) {
              activeToolCalls -= 1;
              callbackFailure = new FastClawRunnerFailure(
                "FASTCLAW_RUN_BUDGET_EXCEEDED",
                false,
                "run.failed"
              );
              throw callbackFailure;
            }
            try {
              const decision = await this.input.tool_policy_executor.execute({
                call,
                request,
                sandbox_authorization: issued.authorization
              });
              if (decision.status === "denied") {
                callbackFailure = new FastClawRunnerFailure(
                  "FASTCLAW_TOOL_DENIED",
                  false,
                  "run.blocked"
                );
                throw callbackFailure;
              }
              phases.push("tool_completed");
              return decision.output;
            } catch (error) {
              if (error instanceof FastClawRunnerFailure) throw error;
              callbackFailure = new FastClawRunnerFailure(
                "FASTCLAW_TOOL_DENIED",
                true,
                "run.blocked"
              );
              throw callbackFailure;
            } finally {
              activeToolCalls -= 1;
            }
          }
        }
      );
      const result = await runWithAbort(transportPromise, controller.signal, abortFailure);
      acceptingCallbacks = false;
      if (callbackFailure !== undefined) throw callbackFailure;
      if (
        typeof result?.raw_answer !== "string" ||
        typeof result?.usage !== "object" ||
        result.usage === null ||
        !Number.isSafeInteger(result.usage.output_tokens) ||
        !Number.isSafeInteger(result.usage.input_tokens) ||
        !Number.isSafeInteger(result.usage.steps) ||
        result.usage.output_tokens < 0 ||
        result.usage.input_tokens < 0 ||
        result.usage.steps < 0 ||
        result.usage.output_tokens > request.budget.max_tokens ||
        result.usage.steps > request.budget.max_steps
      ) {
        throw new FastClawRunnerFailure("FASTCLAW_RUN_BUDGET_EXCEEDED", false, "run.failed");
      }
      phases.push("final_check");
      let checked: Awaited<ReturnType<FastClawFinalPostCheck["check"]>>;
      try {
        checked = await runWithAbort(
          this.input.post_check.check({
            raw_answer: result.raw_answer,
            request,
            usage: result.usage
          }),
          controller.signal,
          abortFailure
        );
      } catch (error) {
        if (error instanceof FastClawRunnerFailure) throw error;
        throw new FastClawRunnerFailure(
          "FASTCLAW_POST_CHECK_DENIED",
          true,
          "run.blocked"
        );
      }
      if (
        typeof checked !== "object" ||
        checked === null ||
        checked.status === "denied" ||
        typeof checked.final_answer !== "string" ||
        checked.final_answer.trim().length === 0
      ) {
        throw new FastClawRunnerFailure("FASTCLAW_POST_CHECK_DENIED", false, "run.blocked");
      }
      completedPayload = Object.freeze({
        answer: checked.final_answer,
        runner_id: this.runner_id,
        usage: Object.freeze({
          output_tokens: result.usage.output_tokens,
          input_tokens: result.usage.input_tokens,
          steps: result.usage.steps
        })
      });
    } catch (error) {
      const failure = failureFromUnknown(error);
      terminal = {
        payload: Object.freeze({ code: failure.code, retryable: failure.retryable }),
        type: failure.terminalType
      };
    } finally {
      acceptingCallbacks = false;
      if (timeout !== undefined) clearTimeout(timeout);
      if (callerAbort !== undefined) request.signal?.removeEventListener("abort", callerAbort);
      controller?.abort();
    }

    for (const phase of phases) {
      yield event(request, index++, "run.started", { phase, runner_id: this.runner_id }, false, now);
    }
    if (terminal !== undefined) {
      yield event(request, index, terminal.type, terminal.payload, true, now);
      return;
    }
    yield event(request, index, "run.completed", completedPayload ?? {}, true, now);
  }
}

function assertActivationInput(input: FastClawAgentRunnerActivationInput): void {
  if (
    input.transport.contract_version !== FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION ||
    input.transport.tool_interception !== "callback_before_execution" ||
    typeof input.authority?.resolve !== "function" ||
    typeof input.sandbox_authorization_issuer?.issue !== "function" ||
    typeof input.tool_policy_executor?.execute !== "function" ||
    typeof input.post_check?.check !== "function"
  ) {
    throw new Error("FASTCLAW_RUNNER_ACTIVATION_INVALID");
  }
}

export function activateFastClawPersonalAgentRunner(
  input: FastClawAgentRunnerActivationInput
): AgentRunner {
  assertActivationInput(input);
  const selection = selectAgentRunner({
    activatedRunnerId: "fastclaw.personal-v0",
    mode: "runner_remote",
    requestedRunnerFamily: "fastclaw"
  });
  if (
    selection.status !== "selected" ||
    selection.selected_runner_id !== "fastclaw.personal-v0"
  ) {
    throw new Error("FASTCLAW_RUNNER_SELECTION_NOT_EXECUTABLE");
  }
  return Object.freeze(
    new FastClawPersonalAgentRunner(createInternalFastClawRunnerActivation(), input)
  ) as AgentRunner;
}
