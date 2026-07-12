import { DurableObject } from "cloudflare:workers";

interface Env {
  ROW10_ACCEPTANCE: {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
  ROW10_OPERATOR_JOBS: DurableObjectNamespace<Row10OperatorJob>;
  ROW10_OPERATOR_TOKEN?: string;
}

interface PendingJob {
  acceptance_id: string;
  index?: number;
  release_at?: string;
  path:
    | "/internal/row10/cleanup"
    | "/internal/row10/prepare"
    | "/internal/row10/run-all"
    | "/internal/row10/run-one";
}

interface StoredJob {
  body?: unknown;
  http_status?: number;
  status: "complete" | "failed" | "pending" | "running";
}

const JOB_ID = /^[a-z0-9-]{1,120}$/u;
const ACCEPTANCE_ID = /^row10-[a-f0-9]{24}$/u;

function json(status: number, body: unknown): Response {
  return Response.json(body, { headers: { "cache-control": "no-store" }, status });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function authorized(request: Request, token: string | undefined): Promise<boolean> {
  const provided = request.headers.get("authorization")?.replace(/^Bearer /u, "") ?? "";
  if (token === undefined || token.length < 32 || provided.length === 0) return false;
  return (await sha256(provided)) === (await sha256(token));
}

function validJob(input: unknown): input is PendingJob {
  if (typeof input !== "object" || input === null) return false;
  const job = input as Record<string, unknown>;
  if (!ACCEPTANCE_ID.test(String(job.acceptance_id ?? ""))) return false;
  if (
    job.path !== "/internal/row10/cleanup" &&
    job.path !== "/internal/row10/prepare" &&
    job.path !== "/internal/row10/run-all" &&
    job.path !== "/internal/row10/run-one"
  ) {
    return false;
  }
  return job.path !== "/internal/row10/run-one" ||
    (Number.isSafeInteger(job.index) &&
      Number(job.index) >= 0 &&
      Number(job.index) < 10 &&
      typeof job.release_at === "string" &&
      Number.isFinite(Date.parse(job.release_at)));
}

export class Row10OperatorJob extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    // This object has no public route: the default Worker authenticates every
    // /jobs request before forwarding through the namespace binding. Repeating
    // the secret check here makes freshly-created objects race secret-version
    // propagation without adding an independently reachable trust boundary.
    if (request.method === "POST") {
      const existing = await this.ctx.storage.get<StoredJob>("result");
      if (existing !== undefined) return json(409, { status: "job_exists" });
      const job = await request.json().catch(() => null);
      if (!validJob(job)) return json(400, { status: "invalid_job" });
      await this.ctx.storage.put({ job, result: { status: "pending" } satisfies StoredJob });
      await this.ctx.storage.setAlarm(Date.now());
      return json(202, { status: "accepted" });
    }
    if (request.method === "GET") {
      return json(200, (await this.ctx.storage.get<StoredJob>("result")) ?? { status: "missing" });
    }
    if (request.method === "DELETE") {
      await this.ctx.storage.deleteAll();
      return new Response(null, { status: 204 });
    }
    return json(405, { status: "method_not_allowed" });
  }

  async alarm(): Promise<void> {
    const job = await this.ctx.storage.get<PendingJob>("job");
    if (job === undefined) {
      await this.ctx.storage.put("result", { status: "failed" } satisfies StoredJob);
      return;
    }
    const existing = await this.ctx.storage.get<StoredJob>("result");
    if (existing?.status === "complete" || existing?.status === "failed") return;
    await this.ctx.storage.put("result", { status: "running" } satisfies StoredJob);
    try {
      const response = await this.env.ROW10_ACCEPTANCE.fetch(
        new Request(`https://row10.internal${job.path}`, {
          body: JSON.stringify({
            acceptance_id: job.acceptance_id,
            index: job.index,
            release_at: job.release_at
          }),
          headers: {
            authorization: `Bearer ${this.env.ROW10_OPERATOR_TOKEN}`,
            "content-type": "application/json"
          },
          method: "POST"
        })
      );
      const text = await response.text();
      const body = JSON.parse(text) as unknown;
      await this.ctx.storage.put("result", {
        body,
        http_status: response.status,
        status: response.ok ? "complete" : "failed"
      } satisfies StoredJob);
    } catch {
      await this.ctx.storage.put("result", { status: "failed" } satisfies StoredJob);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json(200, { service: "row10-live-acceptance-operator", status: "ready" });
    }
    if (!(await authorized(request, env.ROW10_OPERATOR_TOKEN))) {
      return json(403, { status: "forbidden" });
    }
    if (request.method === "POST" && url.pathname === "/internal/row10/auth-readback") {
      return env.ROW10_ACCEPTANCE.fetch(
        new Request("https://row10.internal/internal/row10/auth-readback", {
          headers: { authorization: `Bearer ${env.ROW10_OPERATOR_TOKEN}` },
          method: "POST"
        })
      );
    }
    const match = url.pathname.match(/^\/jobs\/([a-z0-9-]{1,120})$/u);
    if (match === null || !JOB_ID.test(match[1]!)) return json(404, { status: "not_found" });
    const stub = env.ROW10_OPERATOR_JOBS.getByName(match[1]!);
    return stub.fetch(new Request("https://job.internal/", request));
  }
} satisfies ExportedHandler<Env>;
