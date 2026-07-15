import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedOwnershipRequest,
  validateOwnershipInput,
  type AuthenticatedOwnershipBindings,
} from "./ownership.server";

/** Gated live ownership (share capital / free float / substantial-shareholder
 * and cross-holding structure) lookup (POST). Same session/RPC boundary as
 * resolveAuthenticatedDirectorate, on the ownership dataset. */
export const resolveAuthenticatedOwnership = createServerFn({ method: "POST" })
  .validator(validateOwnershipInput)
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
    const result = await resolveAuthenticatedOwnershipRequest(
      env as unknown as AuthenticatedOwnershipBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
