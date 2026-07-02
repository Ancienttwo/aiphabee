import { describe, expect, it } from "vitest";
import { createChartVisionModel, DEFAULT_CHART_VISION_MODEL_ID } from "./provider";

describe("createChartVisionModel", () => {
  const config = {
    accountId: "acct-1",
    apiToken: "api-key-1",
    gatewayId: "gw-1",
    modelId: DEFAULT_CHART_VISION_MODEL_ID
  };

  it("explicitly enables structured outputs so json_schema never silently downgrades", () => {
    const model = createChartVisionModel(config);
    expect(
      (model as { supportsStructuredOutputs?: boolean }).supportsStructuredOutputs
    ).toBe(true);
  });

  it("routes through the AI Gateway openai-compatible provider with the configured model id", () => {
    const model = createChartVisionModel(config);
    expect(model.modelId).toBe("google-ai-studio/gemini-2.5-flash");
    expect(model.provider).toContain("cloudflare-ai-gateway");
  });
});
