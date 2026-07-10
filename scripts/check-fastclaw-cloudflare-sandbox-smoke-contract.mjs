import { readFile } from "node:fs/promises";

const requiredFiles = [
  "apps/sandbox-bridge/Dockerfile",
  "apps/sandbox-bridge/src/index.ts",
  "apps/sandbox-bridge/src/index.test.ts",
  "apps/sandbox-bridge/src/run-guard.ts",
  "apps/sandbox-bridge/src/token.ts",
  "apps/sandbox-bridge/wrangler.jsonc",
  "packages/agent-runtime/src/fastclaw-sandbox-smoke.ts",
  "packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts",
  "packages/sandbox-run-auth/src/index.ts"
];

const files = new Map(
  await Promise.all(requiredFiles.map(async (path) => [path, await readFile(path, "utf8")]))
);
const wrangler = files.get("apps/sandbox-bridge/wrangler.jsonc") ?? "";
const bridge = files.get("apps/sandbox-bridge/src/index.ts") ?? "";
const runner = files.get("packages/agent-runtime/src/fastclaw-sandbox-smoke.ts") ?? "";
const runGuard = files.get("apps/sandbox-bridge/src/run-guard.ts") ?? "";
const auth = files.get("packages/sandbox-run-auth/src/index.ts") ?? "";
const runnerTest = files.get("packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts") ?? "";

const checks = {
  cost_estimate_labelled: runner.includes("included_usage_applied: false"),
  cleanup_budget_reserved:
    runner.includes("MAX_RUN_WALL_CLOCK_MS = 540_000") && runner.includes("+ 60"),
  destroy_readback_required: runner.includes("SANDBOX_DESTROY_READBACK_FAILED"),
  egress_fail_closed: bridge.includes("enableInternet = false"),
  max_instances_10: wrangler.includes('"max_instances": 10'),
  model_echo_not_authority:
    runner.includes("verifySandboxEvidence") && runnerTest.includes("artifactReadback: false"),
  production_runner_not_enabled: !runner.includes("AGENT_EXECUTABLE_RUN_MODES"),
  rpc_transport: wrangler.includes('"SANDBOX_TRANSPORT": "rpc"'),
  sdk_pinned: (await readFile("apps/sandbox-bridge/package.json", "utf8")).includes(
    '"@cloudflare/sandbox": "0.12.3"'
  ),
  standard_1: wrangler.includes('"instance_type": "standard-1"'),
  structured_exec_receipt:
    runGuard.includes("recordExec") && runner.includes("stdout_sha256"),
  tenant_user_bound_sandbox_id:
    auth.includes("claims.tenant_hash") && auth.includes("claims.user_hash")
};

if (Object.values(checks).some((value) => !value)) {
  process.stderr.write(`${JSON.stringify({ checks, status: "failed" })}\n`);
  process.exit(1);
}

const liveRequired = [
  "AIPHABEE_SANDBOX_BRIDGE_URL",
  "FASTCLAW_ADMIN_API_KEY",
  "FASTCLAW_BASE_URL",
  "FASTCLAW_TEMPLATE_AGENT_ID",
  "SANDBOX_RUN_HMAC_KEY"
];
const missing = liveRequired.filter((name) => (process.env[name] ?? "").trim().length === 0);
process.stdout.write(
  `${JSON.stringify({
    checks,
    live_smoke: missing.length === 0 ? "ready" : "not_run_missing_credentials",
    missing,
    status: "ok"
  })}\n`
);
