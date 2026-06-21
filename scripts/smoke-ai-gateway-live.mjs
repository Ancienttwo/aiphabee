#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText } from "ai";

const requiredEnv = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "AI_GATEWAY_NAME",
  "AI_GATEWAY_SMOKE_MODEL"
];
const forbiddenOutputFields = [
  "authorization",
  "api_key",
  "token",
  "secret",
  "raw_prompt",
  "raw_model_output",
  "gateway_id",
  "model"
];
const endpointPath = "/ai/v1/chat/completions";
const providerBasePath = "/ai/v1";
const fixedPrompt = "Return exactly: AIPHABEE_AI_GATEWAY_SMOKE_OK";
const dryRun = process.argv.includes("--dry-run");

if (dryRun) {
  emit(
    {
      endpoint: `https://api.cloudflare.com/client/v4/accounts/{account_id}${endpointPath}`,
      forbidden_output_fields: forbiddenOutputFields,
      gateway_header: "cf-aig-gateway-id",
      method: "ai_sdk_openai_compatible",
      required_env: requiredEnv,
      status: "ready_no_network"
    },
    0
  );
}

const missingEnv = requiredEnv.filter((name) => !hasValue(process.env[name]));

if (missingEnv.length > 0) {
  emit(
    {
      missing_env: missingEnv,
      required_env: requiredEnv,
      status: "missing_env"
    },
    2
  );
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
const apiToken = process.env.CLOUDFLARE_API_TOKEN.trim();
const gatewayId = process.env.AI_GATEWAY_NAME.trim();
const model = process.env.AI_GATEWAY_SMOKE_MODEL.trim();
const httpStatuses = [];
const instrumentedFetch = async (resource, options) => {
  const response = await fetch(resource, options);
  httpStatuses.push(response.status);

  return response;
};

try {
  const provider = createOpenAICompatible({
    apiKey: apiToken,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      accountId
    )}${providerBasePath}`,
    fetch: instrumentedFetch,
    headers: {
      "cf-aig-gateway-id": gatewayId
    },
    includeUsage: true,
    name: "cloudflare-ai-gateway"
  });
  const chatModel = provider.chatModel(model);

  const generateStartedAt = Date.now();
  const generateResult = await generateText({
    maxOutputTokens: 32,
    model: chatModel,
    prompt: fixedPrompt,
    temperature: 0
  });
  const generateOperation = createOperationProof({
    api: "generateText",
    finishReason: generateResult.finishReason,
    latencyMs: Date.now() - generateStartedAt,
    text: generateResult.text,
    usage: generateResult.usage
  });

  const streamStartedAt = Date.now();
  const streamResult = streamText({
    maxOutputTokens: 32,
    model: chatModel,
    prompt: fixedPrompt,
    temperature: 0
  });
  const streamChunks = [];

  for await (const chunk of streamResult.textStream) {
    streamChunks.push(chunk);
  }

  const streamTextValue = streamChunks.join("");
  const streamOperation = createOperationProof({
    api: "streamText",
    chunkCount: streamChunks.length,
    finishReason: await streamResult.finishReason,
    latencyMs: Date.now() - streamStartedAt,
    text: streamTextValue,
    usage: await streamResult.usage
  });
  const status =
    generateOperation.exact_output_match && streamOperation.exact_output_match
      ? "ok"
      : "failed_output_mismatch";
  const responseWithoutHash = {
    endpoint: endpointPath,
    gateway_header: "cf-aig-gateway-id",
    gateway_id_hash: hashString(gatewayId),
    generate_text: generateOperation,
    http_status: httpStatuses.every((status) => status === 200) ? 200 : httpStatuses[0] ?? 0,
    http_statuses: httpStatuses,
    method: "ai_sdk_openai_compatible",
    model_hash: hashString(model),
    operation_count: 2,
    prompt_hash: hashString(fixedPrompt),
    provider: "cloudflare_ai_gateway",
    status,
    stream_text: streamOperation
  };

  emit(
    {
      ...responseWithoutHash,
      response_hash: hashString(JSON.stringify(responseWithoutHash))
    },
    status === "ok" ? 0 : 1
  );
} catch (error) {
  emit(
    {
      error: {
        message_hash: hashString(
          sanitizeText(error instanceof Error ? error.message : String(error)).slice(0, 500)
        ),
        name: error instanceof Error ? error.name : "unknown"
      },
      gateway_id_hash: hashString(gatewayId),
      model_hash: hashString(model),
      status: "request_error"
    },
    1
  );
}

function createOperationProof({ api, chunkCount, finishReason, latencyMs, text, usage }) {
  const normalizedUsage = extractUsage(usage);
  const operation = {
    api,
    char_count: text.length,
    exact_output_match: text.trim() === "AIPHABEE_AI_GATEWAY_SMOKE_OK",
    finish_reason: String(finishReason ?? "unknown"),
    input_tokens: normalizedUsage.input_tokens,
    latency_ms: Math.max(0, Math.trunc(latencyMs)),
    output_hash: hashString(text),
    output_tokens: normalizedUsage.output_tokens,
    status: "passed",
    total_tokens: normalizedUsage.total_tokens
  };

  if (typeof chunkCount === "number") {
    operation.chunk_count = Math.max(0, Math.trunc(chunkCount));
  }

  return operation;
}

function extractUsage(value) {
  const inputTokens = normalizeTokenCount(value?.inputTokens) ?? 0;
  const outputTokens = normalizeTokenCount(value?.outputTokens) ?? 0;
  const totalTokens = normalizeTokenCount(value?.totalTokens) ?? inputTokens + outputTokens;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens
  };
}

function normalizeTokenCount(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : undefined;
}

function sanitizeText(value) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/gu, "sk-[REDACTED]")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/gu, "gh[REDACTED]")
    .replace(/\b[a-f0-9]{32}\b/giu, "[REDACTED_ID]")
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/giu,
      "[REDACTED_UUID]"
    );
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
