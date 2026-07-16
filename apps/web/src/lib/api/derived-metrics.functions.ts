import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedDerivedMetricsRequest,
  validateDerivedMetricsInput,
  type AuthenticatedDerivedMetricsBindings,
} from "./derived-metrics.server";

/** Gated live derived-metrics lookup (POST). Same session/RPC boundary as
 * resolveAuthenticatedQuoteSnapshot, on the conjoined financial_facts +
 * quote_snapshot gate. */
export const resolveAuthenticatedDerivedMetrics = createServerFn({ method: "POST" })
  .validator(validateDerivedMetricsInput)
  .handler(async ({ data }) => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "no-store",
        Vary: "Cookie",
      }),
    );
    const request = getRequest();
    if (!data.valid) {
      setResponseStatus(400);
      return createErrorEnvelope("SCOPE_DENIED", "instrument id is invalid", {
        asOf: new Date().toISOString(),
        requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
      });
    }
    const result = await resolveAuthenticatedDerivedMetricsRequest(
      env as unknown as AuthenticatedDerivedMetricsBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
