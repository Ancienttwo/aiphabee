import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedFinancialFactsRequest,
  validateFinancialFactsInput,
  type AuthenticatedFinancialFactsBindings,
} from "./financial-facts.server";

/** Gated live financial-facts lookup (POST). Same session/RPC boundary as
 * resolveAuthenticatedSecurityProfile, on the financial_facts dataset. */
export const resolveAuthenticatedFinancialFacts = createServerFn({ method: "POST" })
  .validator(validateFinancialFactsInput)
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
    const result = await resolveAuthenticatedFinancialFactsRequest(
      env as unknown as AuthenticatedFinancialFactsBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
