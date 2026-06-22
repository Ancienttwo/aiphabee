#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  getLiveSmokeEnvValue,
  getMissingLiveSmokeEnv
} from "./lib/live-smoke-defaults.mjs";

const dryRun = process.argv.includes("--dry-run");
const requiredEnv = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "AI_GATEWAY_NAME"];
const requiredForbiddenOutputFields = [
  "authorization",
  "api_key",
  "token",
  "secret",
  "raw_log",
  "raw_response",
  "raw_prompt",
  "raw_model_output",
  "account_id",
  "gateway_id",
  "model"
];
const forbiddenOutputFields = [...requiredForbiddenOutputFields];
const lookbackMinutes = normalizePositiveInteger(
  process.env.AI_GATEWAY_LOG_LOOKBACK_MINUTES,
  180
);

if (dryRun) {
  emit(
    {
      endpoints: ["ai_gateway_logs_list", "graphql_ai_gateway_requests_adaptive_groups"],
      forbidden_output_fields: forbiddenOutputFields,
      required_env: requiredEnv,
      required_permissions: ["AI Gateway Read", "Account Analytics Read"],
      status: "ready_no_network"
    },
    0
  );
}

const missingEnv = getMissingLiveSmokeEnv(requiredEnv);

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

const accountId = getLiveSmokeEnvValue("CLOUDFLARE_ACCOUNT_ID");
const apiToken = getLiveSmokeEnvValue("CLOUDFLARE_API_TOKEN");
const gatewayName = getLiveSmokeEnvValue("AI_GATEWAY_NAME");
const start = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString();
const end = new Date().toISOString();

const logsProbe = await probeLogsApi({ accountId, apiToken, gatewayName });
const analyticsProbe = await probeGraphqlAnalytics({ accountId, apiToken, end, start });

const bodyWithoutHash = {
  analytics_probe: analyticsProbe,
  gateway_name_hash: hashString(gatewayName),
  logs_probe: logsProbe,
  lookback_minutes: lookbackMinutes,
  required_permissions: ["AI Gateway Read", "Account Analytics Read"],
  status: determineStatus(logsProbe, analyticsProbe)
};
const responseHash = hashString(JSON.stringify(bodyWithoutHash));
const body = {
  ...bodyWithoutHash,
  response_hash: responseHash
};

emit(body, body.status === "ok" ? 0 : body.status === "permission_denied" ? 3 : 1);

async function probeLogsApi({ accountId, apiToken, gatewayName }) {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      accountId
    )}/ai-gateway/gateways/${encodeURIComponent(gatewayName)}/logs`
  );
  url.searchParams.set("per_page", "50");
  url.searchParams.set("order_by", "created_at");
  url.searchParams.set("order_by_direction", "desc");

  const response = await fetchJson(url, apiToken);

  if (response.http_status === 401 || response.http_status === 403) {
    return {
      endpoint: "ai_gateway_logs_list",
      error_hash: hashString(JSON.stringify(response.errors ?? [])),
      http_status: response.http_status,
      required_permission: "AI Gateway Read",
      status: "permission_denied"
    };
  }

  if (response.http_status !== 200 || response.success !== true) {
    return {
      endpoint: "ai_gateway_logs_list",
      error_hash: hashString(JSON.stringify(response.errors ?? [])),
      http_status: response.http_status,
      status: "failed"
    };
  }

  const logs = Array.isArray(response.result) ? response.result : [];
  const summary = summarizeLogs(logs);

  return {
    ...summary,
    endpoint: "ai_gateway_logs_list",
    http_status: response.http_status,
    status: summary.log_count > 0 ? "ok" : "no_logs_found"
  };
}

async function probeGraphqlAnalytics({ accountId, apiToken, end, start }) {
  const query = `query AiGatewayUsage($accountTag: string, $start: Time, $end: Time, $limit: uint64) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        requests: aiGatewayRequestsAdaptiveGroups(
          limit: $limit
          filter: { datetimeHour_geq: $start, datetimeHour_leq: $end }
          orderBy: [datetimeMinute_DESC]
        ) {
          count
          dimensions {
            gateway
            model
            provider
            ts: datetimeMinute
          }
        }
      }
    }
  }`;
  const response = await fetchJson("https://api.cloudflare.com/client/v4/graphql", apiToken, {
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        end,
        limit: 100,
        start
      }
    }),
    method: "POST"
  });
  const errors = Array.isArray(response.errors) ? response.errors : [];

  if (errors.length > 0) {
    const notAuthorized = errors.some((error) =>
      String(error?.message ?? "").toLowerCase().includes("not authorized")
    );

    return {
      endpoint: "graphql_ai_gateway_requests_adaptive_groups",
      error_count: errors.length,
      error_hash: hashString(JSON.stringify(errors.map((error) => error?.message ?? ""))),
      http_status: response.http_status,
      required_permission: "Account Analytics Read",
      status: notAuthorized ? "permission_denied" : "failed"
    };
  }

  const groups = response.data?.viewer?.accounts?.[0]?.requests;
  const requests = Array.isArray(groups) ? groups : [];

  return {
    endpoint: "graphql_ai_gateway_requests_adaptive_groups",
    group_count: requests.length,
    http_status: response.http_status,
    request_count: requests.reduce(
      (count, request) => count + normalizeCount(request?.count),
      0
    ),
    status: requests.length > 0 ? "ok" : "no_analytics_found"
  };
}

async function fetchJson(url, apiToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const body = await response.json().catch(() => ({}));

  return {
    ...body,
    http_status: response.status
  };
}

function summarizeLogs(logs) {
  const logSummaries = logs.slice(0, 10).map((log) => ({
    cached: typeof log?.cached === "boolean" ? log.cached : null,
    cost_present: typeof log?.cost === "number",
    log_id_hash: hashString(log?.id ?? ""),
    status_code: typeof log?.status_code === "number" ? log.status_code : null,
    success: log?.success === true,
    tokens_in_present: typeof log?.tokens_in === "number",
    tokens_out_present: typeof log?.tokens_out === "number"
  }));
  const cacheValues = new Set(
    logSummaries
      .map((log) => log.cached)
      .filter((value) => typeof value === "boolean")
      .map((value) => String(value))
  );

  return {
    cache_field_present: logSummaries.some((log) => typeof log.cached === "boolean"),
    cache_observed_values: [...cacheValues].sort(),
    cost_field_present: logSummaries.some((log) => log.cost_present),
    log_count: logs.length,
    log_hashes: logSummaries.map((log) => log.log_id_hash),
    status_code_field_present: logSummaries.some((log) => typeof log.status_code === "number"),
    success_count: logSummaries.filter((log) => log.success).length,
    token_fields_present: logSummaries.some(
      (log) => log.tokens_in_present && log.tokens_out_present
    )
  };
}

function determineStatus(logsProbe, analyticsProbe) {
  if (logsProbe.status === "permission_denied" || analyticsProbe.status === "permission_denied") {
    return "permission_denied";
  }

  if (logsProbe.status !== "ok") {
    return "logs_unverified";
  }

  if (!logsProbe.cost_field_present || !logsProbe.token_fields_present) {
    return "cost_or_token_fields_missing";
  }

  if (!logsProbe.cache_field_present) {
    return "cache_field_missing";
  }

  return "ok";
}

function normalizeCount(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(String(value)).digest("hex")}`;
}

function emit(payload, exitCode) {
  const serialized = JSON.stringify(payload);

  for (const forbiddenField of forbiddenOutputFields) {
    if (Object.prototype.hasOwnProperty.call(payload, forbiddenField)) {
      console.log(
        JSON.stringify(
          {
            forbidden_output_field: forbiddenField,
            status: "invalid_output"
          },
          null,
          2
        )
      );
      process.exit(1);
    }
  }

  if (
    /Bearer\s+[A-Za-z0-9._-]+/u.test(serialized) ||
    /\b[a-f0-9]{32}\b/iu.test(serialized) ||
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu.test(
      serialized
    )
  ) {
    console.log(
      JSON.stringify(
        {
          forbidden_output_pattern: "secret_or_raw_id",
          status: "invalid_output"
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
