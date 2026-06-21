#!/usr/bin/env node
import { createHash } from "node:crypto";

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
  "raw_model_output"
];
const endpointPath = "/ai/v1/chat/completions";
const fixedPrompt = "Return exactly: AIPHABEE_AI_GATEWAY_SMOKE_OK";
const dryRun = process.argv.includes("--dry-run");

if (dryRun) {
  emit(
    {
      endpoint: `https://api.cloudflare.com/client/v4/accounts/{account_id}${endpointPath}`,
      forbidden_output_fields: forbiddenOutputFields,
      gateway_header: "cf-aig-gateway-id",
      method: "POST",
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
const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
  accountId
)}${endpointPath}`;
const startedAt = Date.now();

try {
  const response = await fetch(url, {
    body: JSON.stringify({
      max_tokens: 32,
      messages: [
        {
          content: fixedPrompt,
          role: "user"
        }
      ],
      model,
      temperature: 0
    }),
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "cf-aig-gateway-id": gatewayId,
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const latencyMs = Date.now() - startedAt;
  const responseText = await response.text();
  const parsed = parseJson(responseText);

  if (!response.ok) {
    emit(
      {
        error: sanitizeCloudflareError(parsed, responseText),
        gateway_id: gatewayId,
        http_status: response.status,
        latency_ms: latencyMs,
        model,
        status: "failed"
      },
      1
    );
  }

  const outputText = extractOutputText(parsed);
  const usage = extractUsage(parsed);

  emit(
    {
      gateway_id: gatewayId,
      http_status: response.status,
      input_tokens: usage.input_tokens,
      latency_ms: latencyMs,
      model,
      output_hash: hashString(outputText),
      output_tokens: usage.output_tokens,
      response_hash: hashString(responseText),
      status: "ok",
      total_tokens: usage.total_tokens
    },
    0
  );
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      gateway_id: gatewayId,
      model,
      status: "request_error"
    },
    1
  );
}

function extractOutputText(value) {
  if (!isRecord(value)) {
    return "";
  }

  const firstChoice = Array.isArray(value.choices) ? value.choices[0] : undefined;

  if (isRecord(firstChoice) && isRecord(firstChoice.message)) {
    return typeof firstChoice.message.content === "string" ? firstChoice.message.content : "";
  }

  if (typeof value.output_text === "string") {
    return value.output_text;
  }

  return "";
}

function extractUsage(value) {
  const usage = isRecord(value) && isRecord(value.usage) ? value.usage : {};
  const inputTokens = normalizeTokenCount(usage.prompt_tokens ?? usage.input_tokens) ?? 0;
  const outputTokens = normalizeTokenCount(usage.completion_tokens ?? usage.output_tokens) ?? 0;
  const totalTokens = normalizeTokenCount(usage.total_tokens) ?? inputTokens + outputTokens;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens
  };
}

function normalizeTokenCount(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : undefined;
}

function sanitizeCloudflareError(parsed, fallbackText) {
  if (isRecord(parsed)) {
    const errors = Array.isArray(parsed.errors)
      ? parsed.errors
          .filter(isRecord)
          .map((error) => ({
            code: typeof error.code === "number" ? error.code : undefined,
            message: sanitizeText(
              typeof error.message === "string" ? error.message : "cloudflare_error"
            )
          }))
      : [];

    return {
      errors,
      success: parsed.success === true
    };
  }

  return {
    errors: [
      {
        message: sanitizeText(fallbackText).slice(0, 200)
      }
    ],
    success: false
  };
}

function sanitizeText(value) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/gu, "sk-[REDACTED]")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/gu, "gh[REDACTED]");
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
