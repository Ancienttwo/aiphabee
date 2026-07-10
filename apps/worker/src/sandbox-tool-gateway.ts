import {
  SandboxRunTokenError,
  verifySandboxToolGatewayToken,
  type SandboxToolGatewayTokenClaims
} from "@aiphabee/sandbox-run-auth";

const MAX_REQUEST_BYTES = 65_536;
const JSON_CONTENT_TYPE = "application/json";
const TOOL_GATEWAY_PATH = "/v1/tools/call";

export interface SandboxToolGatewayExecutionInput {
  arguments: Readonly<Record<string, unknown>>;
  claims: SandboxToolGatewayTokenClaims;
  tool_name: string;
}

export interface SandboxToolGatewayDependencies {
  execute(input: SandboxToolGatewayExecutionInput): Promise<Response>;
  isToolExecutable(toolName: string): boolean;
  nowMs?(): number;
  secret?: string;
}

function errorResponse(status: number, code: string): Response {
  return Response.json(
    { error: { code }, ok: false },
    { headers: { "cache-control": "no-store" }, status }
  );
}

function bearerToken(request: Request): string | undefined {
  const value = request.headers.get("authorization");
  if (value === null || !value.startsWith("Bearer ")) return undefined;
  const token = value.slice("Bearer ".length);
  return token.length > 0 && token.length <= 4_096 ? token : undefined;
}

function trustedLeaseBinding(request: Request):
  | {
      lease_id: string;
      run_id: string;
      tenant_id: string;
      user_id: string;
    }
  | undefined {
  const binding = {
    lease_id: request.headers.get("x-aiphabee-sandbox-lease-id"),
    run_id: request.headers.get("x-aiphabee-sandbox-run-id"),
    tenant_id: request.headers.get("x-aiphabee-tenant-id"),
    user_id: request.headers.get("x-aiphabee-user-id")
  };
  if (
    Object.values(binding).some(
      (value) => value === null || value.length < 1 || value.length > 128
    )
  ) {
    return undefined;
  }
  return binding as {
    lease_id: string;
    run_id: string;
    tenant_id: string;
    user_id: string;
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

async function parseBody(request: Request): Promise<
  | { arguments: Record<string, unknown>; tool_name: string }
  | undefined
> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== JSON_CONTENT_TYPE) return undefined;
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
        await reader.cancel("Tool Gateway request exceeds maximum size");
        return undefined;
      }
      chunks.push(result.value);
    }
  } catch {
    return undefined;
  }
  if (size === 0) return undefined;
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes)
    );
  } catch {
    return undefined;
  }
  if (!isPlainRecord(parsed)) return undefined;
  const keys = Object.keys(parsed).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["arguments", "tool_name"])) return undefined;
  if (!isPlainRecord(parsed.arguments) || typeof parsed.tool_name !== "string") return undefined;
  return { arguments: parsed.arguments, tool_name: parsed.tool_name };
}

function boundedToolResponse(response: Response): Response {
  const headers = new Headers({ "cache-control": "no-store" });
  const contentType = response.headers.get("content-type");
  const requestId = response.headers.get("x-request-id");
  if (contentType !== null) headers.set("content-type", contentType);
  if (requestId !== null) headers.set("x-request-id", requestId);
  return new Response(response.body, { headers, status: response.status });
}

export async function handleSandboxToolGatewayRequest(
  request: Request,
  dependencies: SandboxToolGatewayDependencies
): Promise<Response> {
  const url = new URL(request.url);
  if (
    request.method !== "POST" ||
    url.pathname !== TOOL_GATEWAY_PATH ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    return errorResponse(404, "TOOL_GATEWAY_ROUTE_DENIED");
  }
  if (dependencies.secret === undefined || dependencies.secret.length === 0) {
    return errorResponse(503, "TOOL_GATEWAY_UNAVAILABLE");
  }
  const token = bearerToken(request);
  if (token === undefined) return errorResponse(401, "TOOL_GATEWAY_UNAUTHORIZED");
  const leaseBinding = trustedLeaseBinding(request);
  if (leaseBinding === undefined) return errorResponse(401, "TOOL_GATEWAY_UNAUTHORIZED");
  const body = await parseBody(request);
  if (body === undefined) return errorResponse(400, "TOOL_GATEWAY_INVALID_REQUEST");

  let claims: SandboxToolGatewayTokenClaims;
  try {
    claims = await verifySandboxToolGatewayToken(token, dependencies.secret, {
      nowMs: dependencies.nowMs?.(),
      requiredToolName: body.tool_name
    });
  } catch (error) {
    if (error instanceof SandboxRunTokenError && error.code === "INVALID_SECRET") {
      return errorResponse(503, "TOOL_GATEWAY_UNAVAILABLE");
    }
    return errorResponse(401, "TOOL_GATEWAY_UNAUTHORIZED");
  }
  if (
    claims.lease_id !== leaseBinding.lease_id ||
    claims.run_id !== leaseBinding.run_id ||
    claims.tenant_id !== leaseBinding.tenant_id ||
    claims.user_id !== leaseBinding.user_id
  ) {
    return errorResponse(401, "TOOL_GATEWAY_UNAUTHORIZED");
  }
  if (!dependencies.isToolExecutable(claims.tool_name)) {
    return errorResponse(403, "TOOL_GATEWAY_TOOL_DENIED");
  }
  try {
    const response = await dependencies.execute({
      arguments: body.arguments,
      claims,
      tool_name: claims.tool_name
    });
    return boundedToolResponse(response);
  } catch {
    return errorResponse(502, "TOOL_GATEWAY_EXECUTION_FAILED");
  }
}
