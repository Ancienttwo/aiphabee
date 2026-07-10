import { randomUUID } from "node:crypto";

import { FastClawSandboxSmokeRunner } from "@aiphabee/agent-runtime/fastclaw-sandbox-smoke";
import type { AgentExecutionRequest } from "@aiphabee/agent-runtime";

const required = [
  "AIPHABEE_SANDBOX_BRIDGE_URL",
  "FASTCLAW_ADMIN_API_KEY",
  "FASTCLAW_BASE_URL",
  "FASTCLAW_TEMPLATE_AGENT_ID",
  "SANDBOX_RUN_HMAC_KEY"
] as const;

const missing = required.filter((name) => (process.env[name] ?? "").trim().length === 0);
if (missing.length > 0) {
  process.stderr.write(`${JSON.stringify({ missing, status: "not_run_missing_credentials" })}\n`);
  process.exitCode = 2;
} else {
  const concurrency = Number.parseInt(process.env.AIPHABEE_SMOKE_CONCURRENCY ?? "1", 10);
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 10) {
    throw new Error("AIPHABEE_SMOKE_CONCURRENCY must be an integer between 1 and 10");
  }
  const runner = new FastClawSandboxSmokeRunner({
    apiKey: process.env.FASTCLAW_ADMIN_API_KEY ?? "",
    baseUrl: process.env.FASTCLAW_BASE_URL ?? "",
    sandboxBridgeUrl: process.env.AIPHABEE_SANDBOX_BRIDGE_URL ?? "",
    templateAgentId: process.env.FASTCLAW_TEMPLATE_AGENT_ID ?? "",
    tokenSecret: process.env.SANDBOX_RUN_HMAC_KEY ?? ""
  });
  const outcomes = await Promise.all(
    Array.from({ length: concurrency }, async (_, index) => {
      const runSuffix = randomUUID().replace(/-/gu, "").slice(0, 16);
      const request: AgentExecutionRequest = {
        allowed_tools: ["exec"],
        budget: {
          max_credits: 1,
          max_parallel_tools: 1,
          max_rows: 10,
          max_steps: 2,
          max_tokens: 1_000,
          max_wall_clock_ms: 30_000
        },
        context_refs: {},
        layer: "research",
        mode: "runner_remote",
        request_id: `req_${runSuffix}`,
        run_id: `run_${Date.now()}_${runSuffix}`,
        tenant_id: process.env.AIPHABEE_SMOKE_TENANT_ID ?? "tenant_operator_smoke",
        user_id: `${process.env.AIPHABEE_SMOKE_USER_ID ?? "user_operator_smoke"}_${index}`
      };
      let completed = false;
      for await (const event of runner.run(request)) {
        process.stdout.write(`${JSON.stringify(event)}\n`);
        completed ||= event.event_type === "run.completed";
      }
      return completed;
    })
  );
  if (outcomes.some((completed) => !completed)) process.exitCode = 1;
}
