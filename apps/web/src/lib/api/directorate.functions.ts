import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { createErrorEnvelope } from "@aiphabee/data-contracts";
import {
  resolveAuthenticatedDirectorateRequest,
  validateDirectorateInput,
  type AuthenticatedDirectorateBindings,
} from "./directorate.server";

/** Gated live directorate (director / senior-management biography) lookup
 * (POST). Same session/RPC boundary as resolveAuthenticatedSdiDisclosure,
 * on the directorate dataset. */
export const resolveAuthenticatedDirectorate = createServerFn({ method: "POST" })
  .validator(validateDirectorateInput)
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
    const result = await resolveAuthenticatedDirectorateRequest(
      env as unknown as AuthenticatedDirectorateBindings,
      request,
      data.input,
    );
    setResponseStatus(result.status);
    return result.envelope;
  });
