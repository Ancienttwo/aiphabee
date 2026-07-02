import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { OpenAICompatibleProviderSettings } from "@ai-sdk/openai-compatible";

/**
 * Default vision channel: Cloudflare AI Gateway openai-compatible endpoint
 * routing to Google AI Studio. Swapping the model tier or provider is a
 * configuration change only (`{provider}/{model}` string), which keeps the
 * PRD "vision model is replaceable" hard constraint at this single seam.
 */
export const DEFAULT_CHART_VISION_MODEL_ID = "google-ai-studio/gemini-2.5-flash";

export interface ChartVisionModelConfig {
  accountId: string;
  apiToken: string;
  fetch?: OpenAICompatibleProviderSettings["fetch"];
  gatewayId: string;
  modelId: string;
}

export const createChartVisionModel = (config: ChartVisionModelConfig) => {
  const provider = createOpenAICompatible({
    apiKey: config.apiToken,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      config.accountId
    )}/ai/v1`,
    fetch: config.fetch,
    headers: {
      "cf-aig-gateway-id": config.gatewayId
    },
    includeUsage: true,
    name: "cloudflare-ai-gateway",
    // Without this explicit flag @ai-sdk/openai-compatible silently downgrades
    // json_schema strict mode to an unconstrained json_object response format.
    supportsStructuredOutputs: true
  });

  return provider.chatModel(config.modelId);
};
