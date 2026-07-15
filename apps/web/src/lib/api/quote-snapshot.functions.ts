import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedQuoteSnapshotRequest,
  validateQuoteSnapshotInput,
  type AuthenticatedQuoteSnapshotBindings,
} from "./quote-snapshot.server";

/** Gated live quote-snapshot lookup (POST). Same session/RPC boundary as
 * resolveAuthenticatedFinancialFacts, on the quote_snapshot dataset. EOD
 * data only, never real-time. */
export const resolveAuthenticatedQuoteSnapshot = createServerFn({ method: "POST" })
  .validator(validateQuoteSnapshotInput)
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
    const result = await resolveAuthenticatedQuoteSnapshotRequest(
      env as unknown as AuthenticatedQuoteSnapshotBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
