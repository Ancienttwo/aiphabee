import {
  SandboxRunTokenError,
  deriveSandboxId,
  verifySandboxRunToken,
  type SandboxRunScope,
  type SandboxRunTokenClaims
} from "./token.js";
import {
  DurableObjectRunGuardClient,
  type RunGuardClient,
  type RunGuardDecision,
  type RunGuardOperation,
  type SandboxExecReceipt
} from "./run-guard.js";

const MAX_BODY_BYTES = 1_048_576;
const MAX_COMMAND_BYTES = 65_536;
const MAX_EXEC_TIMEOUT_MS = 600_000;
const DESTROY_TIMEOUT_MS = 15_000;

export interface SandboxExecResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export interface SandboxFileReadResult {
  content: string;
}

export interface SandboxFileListResult {
  files: unknown[];
}

export interface SandboxHandle {
  destroy(): Promise<void>;
  exec(command: string, options: { cwd?: string; timeout: number }): Promise<SandboxExecResult>;
  isRunning(): Promise<boolean>;
  listFiles(path: string): Promise<SandboxFileListResult>;
  readFile(path: string): Promise<SandboxFileReadResult>;
  writeFile(path: string, content: string): Promise<unknown>;
}

export interface BridgeEnv {
  AIPHABEE_SANDBOX: DurableObjectNamespace;
  RUN_GUARD: DurableObjectNamespace;
  SANDBOX_RUN_HMAC_KEY: string;
}

export interface BridgeDependencies {
  getRunGuard(env: BridgeEnv): RunGuardClient;
  getSandbox(env: BridgeEnv, sandboxId: string): SandboxHandle;
  nowMs(): number;
  resolveWorkspacePath(path: string): string | null;
  shellQuote(argument: string): string;
}

interface AuthorizedRequest {
  claims: SandboxRunTokenClaims;
  sandboxId: string;
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ") || authorization.length <= 7) {
    throw new SandboxRunTokenError("INVALID_TOKEN", "bearer token is required");
  }
  return authorization.slice(7);
}

async function authorize(
  request: Request,
  env: BridgeEnv,
  scope: SandboxRunScope,
  nowMs: number
): Promise<AuthorizedRequest> {
  const claims = await verifySandboxRunToken(bearerToken(request), env.SANDBOX_RUN_HMAC_KEY, {
    nowMs,
    requiredScope: scope
  });
  return { claims, sandboxId: await deriveSandboxId(claims) };
}

function validateRequestedSandboxId(expected: string, actual: string | undefined): Response | undefined {
  if (actual !== undefined && actual !== expected) {
    return jsonError(403, "SANDBOX_ID_MISMATCH", "sandbox id is not authorized for this run");
  }
  return undefined;
}

async function claimOrReject(
  guard: RunGuardClient,
  claims: SandboxRunTokenClaims,
  operation: RunGuardOperation
): Promise<Response | Pick<RunGuardDecision, "exec_receipt" | "terminal">> {
  const decision = await guard.claim(claims, operation);
  if (!decision.allowed) {
    const status = decision.code === "CALL_BUDGET_EXHAUSTED" ? 429 : 409;
    return jsonError(status, decision.code ?? "RUN_GUARD_REJECTED", "run guard rejected operation");
  }
  return { exec_receipt: decision.exec_receipt, terminal: decision.terminal };
}

async function readBoundedBody(request: Request): Promise<string> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new Error("BODY_TOO_LARGE");
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    throw new Error("BODY_TOO_LARGE");
  }
  return body;
}

function base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function execSse(result: SandboxExecResult): Response {
  const frames: string[] = [];
  if (result.stdout.length > 0) {
    frames.push(`event: stdout\ndata: ${base64(result.stdout)}\n\n`);
  }
  if (result.stderr.length > 0) {
    frames.push(`event: stderr\ndata: ${base64(result.stderr)}\n\n`);
  }
  frames.push(`event: exit\ndata: ${JSON.stringify({ exit_code: result.exitCode })}\n\n`);
  return new Response(frames.join(""), {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/event-stream; charset=utf-8"
    }
  });
}

function assertBoundedOutput(result: SandboxExecResult): void {
  const byteLength = new TextEncoder().encode(result.stdout + result.stderr).byteLength;
  if (byteLength > MAX_BODY_BYTES) throw new Error("OUTPUT_TOO_LARGE");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("OPERATION_TIMEOUT")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function route(pathname: string):
  | { kind: "create" }
  | { id: string; kind: "destroy" | "exec" | "files" | "running" }
  | { filePath: string; id: string; kind: "file" }
  | undefined {
  if (pathname === "/v1/sandbox") {
    return { kind: "create" };
  }
  const match = pathname.match(/^\/v1\/sandbox\/([^/]+)(?:\/(.*))?$/u);
  if (match?.[1] === undefined) {
    return undefined;
  }
  const suffix = match[2] ?? "";
  if (suffix === "") return { id: match[1], kind: "destroy" };
  if (suffix === "exec") return { id: match[1], kind: "exec" };
  if (suffix === "files") return { id: match[1], kind: "files" };
  if (suffix === "running") return { id: match[1], kind: "running" };
  if (suffix.startsWith("file/")) {
    try {
      return { filePath: decodeURIComponent(suffix.slice(5)), id: match[1], kind: "file" };
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function tokenErrorResponse(error: SandboxRunTokenError): Response {
  const status = error.code === "INVALID_SCOPE" ? 403 : 401;
  return jsonError(status, error.code, "sandbox authorization rejected");
}

function methodAllowed(
  matched: NonNullable<ReturnType<typeof route>>,
  method: string
): boolean {
  if (matched.kind === "create" || matched.kind === "exec") return method === "POST";
  if (matched.kind === "destroy") return method === "DELETE";
  if (matched.kind === "file") return method === "GET" || method === "PUT";
  return method === "GET";
}

export function createSandboxBridgeHandler(dependencies: BridgeDependencies) {
  return async (request: Request, env: BridgeEnv): Promise<Response> => {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "aiphabee-sandbox-bridge" });
    }

    const matched = route(url.pathname);
    if (matched === undefined) {
      return jsonError(404, "NOT_FOUND", "route not found");
    }
    if (!methodAllowed(matched, request.method)) {
      return jsonError(405, "METHOD_NOT_ALLOWED", "method is not allowed for this route");
    }

    const scope: SandboxRunScope =
      matched.kind === "create"
        ? "sandbox:create"
        : matched.kind === "destroy"
          ? "sandbox:destroy"
          : matched.kind === "exec"
            ? "sandbox:exec"
            : matched.kind === "running"
              ? "sandbox:status"
              : "sandbox:file";

    try {
      const authorized = await authorize(request, env, scope, dependencies.nowMs());
      if ("id" in matched) {
        const rejection = validateRequestedSandboxId(authorized.sandboxId, matched.id);
        if (rejection !== undefined) return rejection;
      }

      const guard = dependencies.getRunGuard(env);
      const operation: RunGuardOperation =
        matched.kind === "file" || matched.kind === "files"
          ? "file"
          : matched.kind === "running"
            ? "status"
            : matched.kind;
      const claim = await claimOrReject(guard, authorized.claims, operation);
      if (claim instanceof Response) return claim;

      if (matched.kind === "create") {
        return Response.json({ id: authorized.sandboxId }, { status: 201 });
      }

      if (matched.kind === "running") {
        if (claim.terminal) {
          return Response.json({
            exec_receipt: claim.exec_receipt,
            running: false,
            terminal: true
          });
        }
        const running = await dependencies.getSandbox(env, authorized.sandboxId).isRunning();
        return Response.json({
          exec_receipt: claim.exec_receipt,
          running,
          terminal: false
        });
      }

      const sandbox = dependencies.getSandbox(env, authorized.sandboxId);
      if (matched.kind === "destroy") {
        if (claim.terminal) return new Response(null, { status: 204 });
        try {
          await withTimeout(sandbox.destroy(), DESTROY_TIMEOUT_MS);
          await guard.finishDestroy(authorized.claims);
          return new Response(null, { status: 204 });
        } catch {
          await guard.abortDestroy(authorized.claims);
          return jsonError(502, "SANDBOX_DESTROY_FAILED", "sandbox destroy failed");
        }
      }

      if (matched.kind === "exec") {
        const input = JSON.parse(await readBoundedBody(request)) as {
          argv?: unknown;
          cwd?: unknown;
          timeout_ms?: unknown;
        };
        if (
          !Array.isArray(input.argv) ||
          input.argv.length === 0 ||
          input.argv.length > 32 ||
          input.argv.some((part) => typeof part !== "string")
        ) {
          return jsonError(400, "INVALID_ARGV", "argv must be a non-empty string array");
        }
        const command = (input.argv as string[]).map(dependencies.shellQuote).join(" ");
        if (new TextEncoder().encode(command).byteLength > MAX_COMMAND_BYTES) {
          return jsonError(413, "COMMAND_TOO_LARGE", "command exceeds maximum size");
        }
        const timeoutMs = input.timeout_ms;
        if (
          typeof timeoutMs !== "number" ||
          !Number.isSafeInteger(timeoutMs) ||
          timeoutMs < 1 ||
          timeoutMs > MAX_EXEC_TIMEOUT_MS
        ) {
          return jsonError(400, "INVALID_TIMEOUT", "timeout_ms must be between 1 and 600000");
        }
        const cwd = input.cwd === undefined ? "/workspace" : input.cwd;
        const resolvedCwd = typeof cwd === "string" ? dependencies.resolveWorkspacePath(cwd) : null;
        if (resolvedCwd === null) {
          return jsonError(400, "INVALID_CWD", "cwd must remain under /workspace");
        }
        const result = await sandbox.exec(command, { cwd: resolvedCwd, timeout: timeoutMs });
        assertBoundedOutput(result);
        const receipt: SandboxExecReceipt = {
          argv_sha256: await sha256Hex(JSON.stringify(input.argv)),
          exit_code: result.exitCode,
          stdout_sha256: await sha256Hex(result.stdout)
        };
        await guard.recordExec(authorized.claims, receipt);
        return execSse(result);
      }

      if (matched.kind === "file") {
        const path = dependencies.resolveWorkspacePath(matched.filePath);
        if (path === null) return jsonError(400, "INVALID_PATH", "path must remain under /workspace");
        if (request.method === "GET") {
          const result = await sandbox.readFile(path);
          if (new TextEncoder().encode(result.content).byteLength > MAX_BODY_BYTES) {
            throw new Error("OUTPUT_TOO_LARGE");
          }
          return new Response(result.content, {
            headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" }
          });
        }
        if (request.method === "PUT") {
          await sandbox.writeFile(path, await readBoundedBody(request));
          return new Response(null, { status: 204 });
        }
        return jsonError(405, "METHOD_NOT_ALLOWED", "GET or PUT required");
      }

      const requestedPath = url.searchParams.get("path") ?? "/workspace";
      const path = dependencies.resolveWorkspacePath(requestedPath);
      if (path === null) return jsonError(400, "INVALID_PATH", "path must remain under /workspace");
      const listing = await sandbox.listFiles(path);
      if (new TextEncoder().encode(JSON.stringify(listing)).byteLength > MAX_BODY_BYTES) {
        throw new Error("OUTPUT_TOO_LARGE");
      }
      return Response.json(listing);
    } catch (error) {
      if (error instanceof SandboxRunTokenError) return tokenErrorResponse(error);
      if (error instanceof SyntaxError) return jsonError(400, "INVALID_JSON", "request body is invalid JSON");
      if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
        return jsonError(413, "BODY_TOO_LARGE", "request body exceeds maximum size");
      }
      if (error instanceof Error && error.message === "OUTPUT_TOO_LARGE") {
        return jsonError(502, "OUTPUT_TOO_LARGE", "sandbox output exceeds maximum size");
      }
      return jsonError(502, "SANDBOX_OPERATION_FAILED", "sandbox operation failed");
    }
  };
}

export const defaultRunGuardFactory = (env: BridgeEnv): RunGuardClient =>
  new DurableObjectRunGuardClient(env.RUN_GUARD);
