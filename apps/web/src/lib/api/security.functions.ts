import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedProfileRequest,
  resolveAuthenticatedSecurityRequest,
  validateProfileInput,
  validateSecurityInput,
  type AuthenticatedSecurityBindings,
} from "./security.server";

export const resolveAuthenticatedSecurity = createServerFn({ method: "POST" })
  .validator(validateSecurityInput)
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
      return createErrorEnvelope("SCOPE_DENIED", "security query is invalid", {
        asOf: new Date().toISOString(),
        requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
      });
    }
    const result = await resolveAuthenticatedSecurityRequest(
      env as unknown as AuthenticatedSecurityBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });

/** Gated company-header profile lookup (POST). Same session/RPC boundary as
 * resolveAuthenticatedSecurity, on the security_profile dataset. */
export const resolveAuthenticatedSecurityProfile = createServerFn({ method: "POST" })
  .validator(validateProfileInput)
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
    const result = await resolveAuthenticatedProfileRequest(
      env as unknown as AuthenticatedSecurityBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
