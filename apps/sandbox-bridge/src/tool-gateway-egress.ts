import {
  SANDBOX_TOOL_GATEWAY_HOST,
  SANDBOX_TOOL_GATEWAY_URL
} from "@aiphabee/agent-runtime";

export const SANDBOX_TOOL_GATEWAY_OUTBOUND_HANDLER = "toolGateway" as const;
const MAX_REQUEST_BYTES = 65_536;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;

export interface SandboxToolGatewayService {
  fetch(request: Request): Promise<Response>;
}

export interface SandboxToolGatewayEgressEnv {
  TOOL_GATEWAY?: SandboxToolGatewayService;
}

export interface SandboxToolGatewayEgressContext {
  params?: unknown;
}

export interface SandboxToolGatewayEgressParams {
  lease_id: string;
  run_id: string;
  tenant_id: string;
  token: string;
  user_id: string;
}

function denied(status = 403, code = "SANDBOX_EGRESS_DENIED"): Response {
  return Response.json(
    { error: { code }, ok: false },
    { headers: { "cache-control": "no-store" }, status }
  );
}

function trustedParams(params: unknown): SandboxToolGatewayEgressParams | undefined {
  if (typeof params !== "object" || params === null || Array.isArray(params)) return undefined;
  const record = params as Record<string, unknown>;
  if (
    Object.keys(record).sort().join(",") !== "lease_id,run_id,tenant_id,token,user_id" ||
    typeof record.lease_id !== "string" ||
    typeof record.run_id !== "string" ||
    typeof record.tenant_id !== "string" ||
    typeof record.token !== "string" ||
    typeof record.user_id !== "string" ||
    record.token.length > 4_096 ||
    !TOKEN_PATTERN.test(record.token)
  ) {
    return undefined;
  }
  return {
    lease_id: record.lease_id,
    run_id: record.run_id,
    tenant_id: record.tenant_id,
    token: record.token,
    user_id: record.user_id
  };
}

async function boundedBody(request: Request): Promise<Uint8Array | undefined> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) return undefined;
  if (request.body === null) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel("sandbox Tool Gateway request exceeds maximum size");
        return undefined;
      }
      chunks.push(result.value);
    }
  } catch {
    return undefined;
  }
  if (size === 0) return undefined;
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function denySandboxOutbound(): Response {
  return denied();
}

export async function forwardSandboxToolGatewayRequest(
  request: Request,
  env: SandboxToolGatewayEgressEnv,
  context: SandboxToolGatewayEgressContext
): Promise<Response> {
  const url = new URL(request.url);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (
    url.protocol !== "https:" ||
    url.hostname !== SANDBOX_TOOL_GATEWAY_HOST ||
    url.port !== "" ||
    url.pathname !== "/v1/tools/call" ||
    url.search !== "" ||
    url.hash !== "" ||
    request.method !== "POST" ||
    contentType !== "application/json"
  ) {
    return denied();
  }
  const params = trustedParams(context.params);
  if (params === undefined) return denied(503, "SANDBOX_TOOL_GATEWAY_UNAVAILABLE");
  if (env.TOOL_GATEWAY === undefined) {
    return denied(503, "SANDBOX_TOOL_GATEWAY_UNAVAILABLE");
  }
  const body = await boundedBody(request);
  if (body === undefined) return denied(400, "SANDBOX_TOOL_GATEWAY_INVALID_REQUEST");

  const forwardedBody = new Uint8Array(body.byteLength);
  forwardedBody.set(body);
  const forwarded = new Request(SANDBOX_TOOL_GATEWAY_URL, {
    body: forwardedBody.buffer,
    headers: {
      authorization: `Bearer ${params.token}`,
      "content-type": "application/json",
      "x-aiphabee-sandbox-lease-id": params.lease_id,
      "x-aiphabee-sandbox-run-id": params.run_id,
      "x-aiphabee-tenant-id": params.tenant_id,
      "x-aiphabee-user-id": params.user_id
    },
    method: "POST",
    redirect: "manual"
  });
  try {
    return await env.TOOL_GATEWAY.fetch(forwarded);
  } catch {
    return denied(502, "SANDBOX_TOOL_GATEWAY_FAILED");
  }
}
