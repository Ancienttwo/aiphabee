import { createErrorEnvelope } from "@aiphabee/data-contracts";
import type { ResponseEnvelope } from "./types";
import { API_BASE_URL } from "./config";

export interface ApiRequest {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Calls a worker route and returns the parsed {@link ResponseEnvelope}.
 *
 * Network or parse failures are normalized into an `INTERNAL_ERROR` error
 * envelope, so callers always receive the discriminated `ok` union and never
 * have to wrap calls in try/catch. The worker already returns envelopes for
 * its own error paths (404/400/500), which pass through untouched.
 */
export async function apiCall<TData>(
  path: string,
  { method = "GET", body, signal }: ApiRequest = {},
): Promise<ResponseEnvelope<TData>> {
  const requestId = crypto.randomUUID();
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    });

    const parsed = (await response.json()) as ResponseEnvelope<TData>;
    // Shape guard: a proxy/CDN can return valid JSON that is not an envelope.
    // Without this, `!env.ok` callers would dereference a missing `.error`.
    if (typeof (parsed as { ok?: unknown }).ok !== "boolean") {
      return createErrorEnvelope("INTERNAL_ERROR", "unexpected response shape", {
        asOf: new Date().toISOString(),
        requestId,
      });
    }
    return parsed;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "network request failed";
    return createErrorEnvelope("INTERNAL_ERROR", message, {
      asOf: new Date().toISOString(),
      requestId,
    });
  }
}
