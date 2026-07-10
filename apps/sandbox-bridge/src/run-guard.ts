import type { SandboxRunTokenClaims } from "@aiphabee/sandbox-run-auth";

export type RunGuardOperation = "create" | "destroy" | "exec" | "file" | "status";

interface RunGuardState {
  call_count: number;
  destroying: boolean;
  exp: number;
  exec_receipt?: SandboxExecReceipt;
  jti: string;
  max_calls: number;
  scopes: readonly string[];
  terminal: boolean;
  tenant_hash: string;
  user_hash: string;
}

export interface SandboxExecReceipt {
  argv_sha256: string;
  exit_code: number;
  stdout_sha256: string;
}

export interface RunGuardDecision {
  allowed: boolean;
  call_count: number;
  code?: "CALL_BUDGET_EXHAUSTED" | "DESTROY_IN_PROGRESS" | "TOKEN_STATE_MISMATCH";
  exec_receipt?: SandboxExecReceipt;
  terminal: boolean;
}

export interface RunGuardClient {
  abortDestroy(claims: SandboxRunTokenClaims): Promise<void>;
  claim(claims: SandboxRunTokenClaims, operation: RunGuardOperation): Promise<RunGuardDecision>;
  finishDestroy(claims: SandboxRunTokenClaims): Promise<void>;
  recordExec(claims: SandboxRunTokenClaims, receipt: SandboxExecReceipt): Promise<void>;
}

function initialState(claims: SandboxRunTokenClaims): RunGuardState {
  return {
    call_count: 0,
    destroying: false,
    exp: claims.exp,
    jti: claims.jti,
    max_calls: claims.max_calls,
    scopes: claims.scopes,
    terminal: false,
    tenant_hash: claims.tenant_hash,
    user_hash: claims.user_hash
  };
}

function stateMatchesClaims(state: RunGuardState, claims: SandboxRunTokenClaims): boolean {
  return (
    state.exp === claims.exp &&
    state.jti === claims.jti &&
    state.max_calls === claims.max_calls &&
    state.tenant_hash === claims.tenant_hash &&
    state.user_hash === claims.user_hash &&
    JSON.stringify(state.scopes) === JSON.stringify(claims.scopes)
  );
}

function decision(state: RunGuardState, allowed: boolean): RunGuardDecision {
  return {
    allowed,
    call_count: state.call_count,
    exec_receipt: state.exec_receipt,
    terminal: state.terminal
  };
}

export function applyRunGuardClaim(
  current: RunGuardState | undefined,
  claims: SandboxRunTokenClaims,
  operation: RunGuardOperation
): { decision: RunGuardDecision; state: RunGuardState } {
  const state = current ?? initialState(claims);
  if (!stateMatchesClaims(state, claims)) {
    return {
      decision: {
        allowed: false,
        call_count: state.call_count,
        code: "TOKEN_STATE_MISMATCH",
        terminal: state.terminal
      },
      state
    };
  }

  if (operation === "status" && state.terminal) {
    return {
      decision: decision(state, true),
      state
    };
  }
  if (operation === "destroy" && state.terminal) {
    return {
      decision: decision(state, true),
      state
    };
  }
  if (state.destroying || state.terminal) {
    return {
      decision: {
        allowed: false,
        call_count: state.call_count,
        code: "DESTROY_IN_PROGRESS",
        terminal: state.terminal
      },
      state
    };
  }

  if (operation === "destroy") {
    return {
      decision: decision(state, true),
      state: { ...state, destroying: true }
    };
  }
  if (state.call_count >= state.max_calls) {
    return {
      decision: {
        allowed: false,
        call_count: state.call_count,
        code: "CALL_BUDGET_EXHAUSTED",
        terminal: false
      },
      state
    };
  }

  const next = { ...state, call_count: state.call_count + 1 };
  return {
    decision: decision(next, true),
    state: next
  };
}

export interface RunGuardStorage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
}

export async function handleRunGuardRequest(
  storage: RunGuardStorage,
  request: Request
): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST") {
      return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }

    if (url.pathname === "/claim") {
      const input = (await request.json()) as {
        claims: SandboxRunTokenClaims;
        operation: RunGuardOperation;
      };
      const current = await storage.get<RunGuardState>("state");
      const transition = applyRunGuardClaim(current, input.claims, input.operation);
      await storage.put("state", transition.state);
      return Response.json(transition.decision);
    }

    const state = await storage.get<RunGuardState>("state");
    if (state === undefined) {
      return Response.json({ error: "RUN_NOT_INITIALIZED" }, { status: 409 });
    }
    if (url.pathname === "/finish-destroy") {
      await storage.put("state", { ...state, destroying: false, terminal: true });
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/abort-destroy") {
      await storage.put("state", { ...state, destroying: false });
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/record-exec") {
      const input = (await request.json()) as {
        claims: SandboxRunTokenClaims;
        receipt: SandboxExecReceipt;
      };
      if (
        !stateMatchesClaims(state, input.claims) ||
        state.destroying ||
        state.terminal ||
        !/^[a-f0-9]{64}$/u.test(input.receipt?.argv_sha256 ?? "") ||
        !Number.isSafeInteger(input.receipt?.exit_code) ||
        !/^[a-f0-9]{64}$/u.test(input.receipt?.stdout_sha256 ?? "")
      ) {
        return Response.json({ error: "INVALID_EXEC_RECEIPT" }, { status: 409 });
      }
      await storage.put("state", { ...state, exec_receipt: input.receipt });
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
}

export class DurableObjectRunGuardClient implements RunGuardClient {
  constructor(private readonly namespace: DurableObjectNamespace) {}

  private stub(claims: SandboxRunTokenClaims): DurableObjectStub {
    const identity = `${claims.jti}:${claims.tenant_hash}:${claims.user_hash}`;
    return this.namespace.get(this.namespace.idFromName(identity));
  }

  async claim(
    claims: SandboxRunTokenClaims,
    operation: RunGuardOperation
  ): Promise<RunGuardDecision> {
    const response = await this.stub(claims).fetch("https://run-guard.internal/claim", {
      body: JSON.stringify({ claims, operation }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    if (!response.ok) {
      throw new Error("run guard claim failed");
    }
    return response.json<RunGuardDecision>();
  }

  async finishDestroy(claims: SandboxRunTokenClaims): Promise<void> {
    const response = await this.stub(claims).fetch("https://run-guard.internal/finish-destroy", {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error("run guard finish-destroy failed");
    }
  }

  async abortDestroy(claims: SandboxRunTokenClaims): Promise<void> {
    const response = await this.stub(claims).fetch("https://run-guard.internal/abort-destroy", {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error("run guard abort-destroy failed");
    }
  }

  async recordExec(
    claims: SandboxRunTokenClaims,
    receipt: SandboxExecReceipt
  ): Promise<void> {
    const response = await this.stub(claims).fetch("https://run-guard.internal/record-exec", {
      body: JSON.stringify({ claims, receipt }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    if (!response.ok) {
      throw new Error("run guard record-exec failed");
    }
  }
}
