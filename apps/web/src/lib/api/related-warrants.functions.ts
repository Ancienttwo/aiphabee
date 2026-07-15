import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedRelatedWarrantsRequest,
  validateRelatedWarrantsInput,
  type AuthenticatedRelatedWarrantsBindings,
} from "./related-warrants.server";

/** Gated live related-warrants (per-underlying-instrument list of
 * associated derivative warrant / CBBC codes) lookup (POST). Same
 * session/RPC boundary as resolveAuthenticatedOwnership, on the
 * related_warrants dataset. */
export const resolveAuthenticatedRelatedWarrants = createServerFn({ method: "POST" })
  .validator(validateRelatedWarrantsInput)
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
    const result = await resolveAuthenticatedRelatedWarrantsRequest(
      env as unknown as AuthenticatedRelatedWarrantsBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
