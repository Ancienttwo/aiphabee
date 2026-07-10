import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import {
  AuthConfigurationError,
  handleAuthenticatedWebIdentityRequest,
  type AuthenticatedWebIdentityBindings,
} from "../../../lib/auth.server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});

async function handleAuthRequest(request: Request) {
  try {
    if (
      request.method === "GET" &&
      new URL(request.url).pathname === "/api/auth/github/start"
    ) {
      return await startGitHubOAuth(request);
    }
    return await handleAuthenticatedWebIdentityRequest(
      env as unknown as AuthenticatedWebIdentityBindings,
      request,
    );
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      const status = error.code === "AUTH_ENVIRONMENT_DENIED" ? 404 : 503;
      return Response.json(
        {
          error: status === 404 ? "not_found" : "authentication_unavailable",
          reason: error.code.toLowerCase(),
        },
        {
          headers: { "Cache-Control": "no-store" },
          status,
        },
      );
    }
    throw error;
  }
}

async function startGitHubOAuth(request: Request) {
  const origin = new URL(request.url).origin;
  const forwardedHeaders = new Headers({
    "content-type": "application/json",
    origin,
  });
  for (const name of ["CF-Connecting-IP", "Cookie", "User-Agent", "X-Forwarded-For"]) {
    const value = request.headers.get(name);
    if (value) forwardedHeaders.set(name, value);
  }
  const response = await handleAuthenticatedWebIdentityRequest(
    env as unknown as AuthenticatedWebIdentityBindings,
    new Request(`${origin}/api/auth/sign-in/social`, {
      body: JSON.stringify({
        callbackURL: "/account",
        errorCallbackURL: "/login?error=oauth",
        newUserCallbackURL: "/account",
        provider: "github",
        requestSignUp: true,
      }),
      headers: forwardedHeaders,
      method: "POST",
    }),
  );
  const location = response.headers.get("location");
  if (!response.ok || !location) return response;

  const target = new URL(location);
  if (target.protocol !== "https:" || target.hostname !== "github.com") {
    return Response.json(
      { error: "authentication_unavailable" },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }

  const redirectHeaders = new Headers(response.headers);
  redirectHeaders.set("Cache-Control", "no-store");
  redirectHeaders.set("Location", location);
  redirectHeaders.delete("Content-Length");
  redirectHeaders.delete("Content-Type");
  return new Response(null, { headers: redirectHeaders, status: 302 });
}
