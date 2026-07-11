import { describe, expect, it, vi } from "vitest";

import type { AgentExecutionEvent, AgentExecutionRequest } from "./index.js";
import {
  FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION,
  activateFastClawPersonalAgentRunner,
  type FastClawAgentRunnerActivationInput,
  type FastClawCompliantTransport
} from "./fastclaw-agent-runner.js";

function request(overrides: Partial<AgentExecutionRequest> = {}): AgentExecutionRequest {
  return {
    allowed_tools: ["resolve_security"],
    budget: {
      max_credits: 4,
      max_parallel_tools: 1,
      max_rows: 50,
      max_steps: 3,
      max_tokens: 500,
      max_wall_clock_ms: 5_000
    },
    context_refs: {},
    layer: "research",
    mode: "runner_remote",
    prompt: "Resolve the security and summarize the evidence.",
    request_id: "request-row7",
    run_id: "run-row7",
    tenant_id: "workspace-row7",
    user_id: "account-row7",
    ...overrides
  };
}

function transport(
  run: FastClawCompliantTransport["run"] = async (_input, callbacks) => {
    callbacks.onProgress("remote_accepted");
    await callbacks.onToolCall({
      call_id: "call-1",
      input: { symbol: "00700.HK" },
      name: "resolve_security"
    });
    return {
      private_reasoning: "must never be public",
      raw_answer: "untrusted upstream answer",
      usage: { output_tokens: 40, steps: 2 }
    };
  }
): FastClawCompliantTransport {
  return {
    contract_version: FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION,
    run: vi.fn(run),
    tool_interception: "callback_before_execution"
  };
}

function activation(
  overrides: Partial<FastClawAgentRunnerActivationInput> = {}
): FastClawAgentRunnerActivationInput {
  return {
    authority: {
      resolve: vi.fn(async () => ({
        external_user_identity: "protected-external-user",
        fastclaw_agent_id: "protected-agent-id",
        fastclaw_user_id: "protected-user-id",
        profile_id: "profile-row7",
        status: "allowed" as const,
        tenant_id: "workspace-row7",
        user_id: "account-row7"
      }))
    },
    post_check: {
      check: vi.fn(async () => ({
        final_answer: "Approved AiphaBee answer",
        status: "approved" as const
      }))
    },
    sandbox_authorization_issuer: {
      issue: vi.fn(async ({ access_grant }) => {
        expect(Object.isFrozen(access_grant)).toBe(true);
        expect(Object.isFrozen(access_grant.owner)).toBe(true);
        expect(access_grant).toMatchObject({
          layer: "research",
          owner: { kind: "run", run_id: "run-row7" },
          run_mode: "runner_remote",
          runner_family: "fastclaw",
          runner_id: "fastclaw.personal-v0",
          source: "agent_runner_selection",
          tenant_id: "workspace-row7",
          user_id: "account-row7"
        });
        return {
          authorization: "protected-sandbox-token",
          expires_at: "2099-07-11T13:20:00.000Z"
        };
      })
    },
    tool_policy_executor: {
      execute: vi.fn(async () => ({ output: { security_id: "sec-1" }, status: "completed" as const }))
    },
    transport: transport(),
    ...overrides
  };
}

async function collect(input: FastClawAgentRunnerActivationInput, run = request()) {
  const events: AgentExecutionEvent[] = [];
  for await (const event of activateFastClawPersonalAgentRunner(input).run(run)) {
    events.push(event);
  }
  return events;
}

function expectOneTerminal(events: AgentExecutionEvent[]) {
  const terminal = events.filter((event) =>
    ["run.blocked", "run.completed", "run.failed"].includes(event.event_type)
  );
  expect(terminal).toHaveLength(1);
  expect(events.map((event) => event.event_index)).toEqual(
    events.map((_, index) => index)
  );
  return terminal[0];
}

describe("FastClaw personal AgentRunner", () => {
  it("activates the registered runner and exposes only semantic events plus approved final", async () => {
    const input = activation();
    const events = await collect(input);
    const terminal = expectOneTerminal(events);

    expect(events[0]).toMatchObject({ event_index: 0, event_type: "run.requested" });
    expect(events[1]).toMatchObject({ event_index: 1, event_type: "run.started" });
    expect(terminal).toMatchObject({
      event_type: "run.completed",
      payload: {
        answer: "Approved AiphaBee answer",
        runner_id: "fastclaw.personal-v0",
        usage: { output_tokens: 40, steps: 2 }
      }
    });
    const serialized = JSON.stringify(events);
    for (const secret of [
      "protected-external-user",
      "protected-agent-id",
      "protected-user-id",
      "protected-sandbox-token",
      "must never be public",
      "untrusted upstream answer",
      "00700.HK",
      "sec-1"
    ]) {
      expect(serialized).not.toContain(secret);
    }
    expect(input.tool_policy_executor.execute).toHaveBeenCalledTimes(1);
    expect(input.post_check.check).toHaveBeenCalledWith(
      expect.objectContaining({ raw_answer: "untrusted upstream answer" })
    );
  });

  it("blocks invalid input before authority, grant and transport", async () => {
    const input = activation();
    const events = await collect(input, request({ prompt: "" }));
    expect(expectOneTerminal(events)).toMatchObject({
      event_type: "run.blocked",
      payload: { code: "FASTCLAW_RUNNER_INVALID_REQUEST", retryable: false }
    });
    expect(input.authority.resolve).not.toHaveBeenCalled();
    expect(input.transport.run).not.toHaveBeenCalled();
  });

  it.each([
    ["FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE", true],
    ["FASTCLAW_RESEARCH_ENTITLEMENT_REQUIRED", false]
  ] as const)("blocks authority denial %s before token and transport", async (code, retryable) => {
    const input = activation({
      authority: { resolve: vi.fn(async () => ({ code, retryable, status: "blocked" as const })) }
    });
    const events = await collect(input);
    expect(expectOneTerminal(events)).toMatchObject({
      event_type: "run.blocked",
      payload: { code, retryable }
    });
    expect(input.sandbox_authorization_issuer.issue).not.toHaveBeenCalled();
    expect(input.transport.run).not.toHaveBeenCalled();
  });

  it("fails closed when an unlisted or denied tool is requested", async () => {
    const input = activation({
      transport: transport(async (_input, callbacks) => {
        try {
          await callbacks.onToolCall({
            call_id: "call-x",
            input: { secret: true },
            name: "unknown"
          });
        } catch {
          // A non-compliant transport cannot swallow a callback denial and complete.
        }
        return { raw_answer: "should not complete", usage: { output_tokens: 1, steps: 1 } };
      })
    });
    const events = await collect(input);
    expect(expectOneTerminal(events)).toMatchObject({
      event_type: "run.blocked",
      payload: { code: "FASTCLAW_TOOL_DENIED", retryable: false }
    });
    expect(input.tool_policy_executor.execute).not.toHaveBeenCalled();
    expect(JSON.stringify(events)).not.toContain("secret");
  });

  it("blocks a mismatched allowed authority snapshot before grant mint", async () => {
    const input = activation({
      authority: {
        resolve: vi.fn(async () => ({
          external_user_identity: "external-other",
          fastclaw_agent_id: "agent-other",
          fastclaw_user_id: "user-other",
          profile_id: "profile-other",
          status: "allowed" as const,
          tenant_id: "other-workspace",
          user_id: "account-row7"
        }))
      }
    });
    const events = await collect(input);
    expect(expectOneTerminal(events)).toMatchObject({
      event_type: "run.blocked",
      payload: { code: "FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE", retryable: false }
    });
    expect(input.sandbox_authorization_issuer.issue).not.toHaveBeenCalled();
  });

  it("normalizes transport and post-check failures without upstream messages", async () => {
    const transportFailure = activation({
      transport: transport(async () => {
        throw new Error("raw provider failure with protected payload");
      })
    });
    const failed = await collect(transportFailure);
    expect(expectOneTerminal(failed)).toMatchObject({
      event_type: "run.failed",
      payload: { code: "FASTCLAW_TRANSPORT_FAILED", retryable: true }
    });
    expect(JSON.stringify(failed)).not.toContain("raw provider failure");

    const denied = activation({
      post_check: { check: vi.fn(async () => ({ code: "UNSOURCED", status: "denied" as const })) }
    });
    const blocked = await collect(denied);
    expect(expectOneTerminal(blocked)).toMatchObject({
      event_type: "run.blocked",
      payload: { code: "FASTCLAW_POST_CHECK_DENIED", retryable: false }
    });
    expect(JSON.stringify(blocked)).not.toContain("UNSOURCED");
  });

  it("normalizes budget overrun and never publishes raw final", async () => {
    const input = activation({
      transport: transport(async () => ({
        raw_answer: "over-budget raw final",
        usage: { output_tokens: 501, steps: 1 }
      }))
    });
    const events = await collect(input);
    expect(expectOneTerminal(events)).toMatchObject({
      event_type: "run.failed",
      payload: { code: "FASTCLAW_RUN_BUDGET_EXCEEDED", retryable: false }
    });
    expect(input.post_check.check).not.toHaveBeenCalled();
    expect(JSON.stringify(events)).not.toContain("over-budget raw final");
  });

  it("handles pre-abort, in-flight cancellation and timeout with one terminal", async () => {
    const pre = new AbortController();
    pre.abort();
    const preInput = activation();
    const preEvents = await collect(preInput, request({ signal: pre.signal }));
    expect(expectOneTerminal(preEvents)).toMatchObject({
      payload: { code: "FASTCLAW_RUN_CANCELLED" }
    });
    expect(preInput.transport.run).not.toHaveBeenCalled();

    const caller = new AbortController();
    let markStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    let lateToolCall:
      | ((call: { call_id: string; input: unknown; name: string }) => Promise<unknown>)
      | undefined;
    const cancelInput = activation({
      transport: transport((_input, callbacks) => {
        lateToolCall = callbacks.onToolCall;
        markStarted?.();
        return new Promise(() => undefined);
      })
    });
    const collecting = collect(cancelInput, request({ signal: caller.signal }));
    await started;
    caller.abort();
    const cancelled = await collecting;
    expect(expectOneTerminal(cancelled)).toMatchObject({
      payload: { code: "FASTCLAW_RUN_CANCELLED", retryable: false }
    });
    await expect(
      lateToolCall?.({ call_id: "late", input: {}, name: "resolve_security" })
    ).rejects.toThrow("FASTCLAW_RUN_CANCELLED");
    expect(cancelInput.tool_policy_executor.execute).not.toHaveBeenCalled();

    const timeoutInput = activation({
      transport: transport((_input) => new Promise(() => undefined))
    });
    const timedOut = await collect(
      timeoutInput,
      request({ budget: { ...request().budget, max_wall_clock_ms: 5 } })
    );
    expect(expectOneTerminal(timedOut)).toMatchObject({
      payload: { code: "FASTCLAW_RUN_TIMEOUT", retryable: true }
    });
  });

  it("rejects a transport that lacks the callback interception contract", () => {
    const input = activation();
    expect(() =>
      activateFastClawPersonalAgentRunner({
        ...input,
        transport: {
          ...input.transport,
          tool_interception: "opaque" as never
        }
      })
    ).toThrow("FASTCLAW_RUNNER_ACTIVATION_INVALID");
  });
});
