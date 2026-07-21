import { describe, expect, it } from "vitest";
import { agentStreamExecutionKey } from "./useAgentStream";

describe("agentStreamExecutionKey", () => {
  it("does not restart an Agent execution when only the presentation locale changes", () => {
    const zhHant = agentStreamExecutionKey({
      executionId: "run-1",
      locale: "zh-Hant",
      prompt: "Why did the price move?",
    });
    const en = agentStreamExecutionKey({
      executionId: "run-1",
      locale: "en",
      prompt: "Why did the price move?",
    });

    expect(en).toBe(zhHant);
  });

  it("restarts for a new route run even when the prompt text is unchanged", () => {
    const first = agentStreamExecutionKey({
      executionId: "run-1",
      locale: "en",
      prompt: "Why did the price move?",
    });
    const second = agentStreamExecutionKey({
      executionId: "run-2",
      locale: "en",
      prompt: "Why did the price move?",
    });

    expect(second).not.toBe(first);
  });
});
