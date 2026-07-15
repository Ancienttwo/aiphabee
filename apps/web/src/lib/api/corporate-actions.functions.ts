import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedCorporateActionsRequest,
  validateCorporateActionsInput,
  type AuthenticatedCorporateActionsBindings,
} from "./corporate-actions.server";

/** Gated live corporate-actions lookup (POST). Same session/RPC boundary as
 * resolveAuthenticatedFinancialFacts, on the corporate_actions dataset. */
export const resolveAuthenticatedCorporateActions = createServerFn({ method: "POST" })
  .validator(validateCorporateActionsInput)
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
    const result = await resolveAuthenticatedCorporateActionsRequest(
      env as unknown as AuthenticatedCorporateActionsBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
