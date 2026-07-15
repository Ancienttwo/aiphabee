import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedSdiDisclosureRequest,
  validateSdiDisclosureInput,
  type AuthenticatedSdiDisclosureBindings,
} from "./sdi-disclosure.server";

/** Gated live SDI (disclosure of interests) lookup (POST). Same session/RPC
 * boundary as resolveAuthenticatedCorporateActions, on the sdi_disclosure
 * dataset. */
export const resolveAuthenticatedSdiDisclosure = createServerFn({ method: "POST" })
  .validator(validateSdiDisclosureInput)
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
    const result = await resolveAuthenticatedSdiDisclosureRequest(
      env as unknown as AuthenticatedSdiDisclosureBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
