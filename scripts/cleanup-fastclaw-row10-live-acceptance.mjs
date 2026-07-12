#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const accountId = "ab66185011440a6f8a698d61ad58703a";
const statePath = resolve(root, "_ops/fastclaw-row10/operator-state.json");
const operatorConfig = resolve(root, "deploy/fastclaw/row10-live-acceptance.wrangler.jsonc");
const workerConfig = resolve(root, "apps/worker/wrangler.jsonc");
const operatorName = "aiphabee-row10-live-acceptance-operator";
const operatorUrl = `https://${operatorName}.metalabs.workers.dev`;
const state = JSON.parse(await readFile(statePath, "utf8"));
if (
  typeof state.acceptance_id !== "string" ||
  !/^row10-[a-f0-9]{24}$/u.test(state.acceptance_id) ||
  typeof state.token !== "string" ||
  state.token.length < 32
) {
  fail({ status: "invalid_operator_state" });
}

let operatorDeployed = false;
try {
  await workerSecret("put", state.token);
  await deployWorker();
  await mutation(["deploy", "--config", operatorConfig], "operator deploy");
  operatorDeployed = true;
  await operatorSecret(state.token);
  await waitForReady();
  await waitForAuth();
  await waitForOperatorJobs();
  const body = await runCleanupJob();
  if (body?.status !== "cleanup_confirmed" || body?.residual_rows !== 0) {
    const code =
      typeof body?.failure_code === "string" && /^[A-Z0-9_:.-]{1,160}$/u.test(body.failure_code)
        ? body.failure_code
        : "ROW10_RECOVERY_CLEANUP_FAILED";
    throw new Error(code);
  }
  await workerSecret("delete");
  await rm(statePath, { force: true });
  process.stdout.write(
    `${JSON.stringify(
      {
        acceptance_id_hash: hash(state.acceptance_id),
        residual_rows: 0,
        status: "cleanup_confirmed"
      },
      null,
      2
    )}\n`
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "cleanup failed";
  fail({
    error_hash: hash(message),
    failure_code: /^[A-Za-z0-9_:.-]{1,240}$/u.test(message)
      ? message
      : "ROW10_RECOVERY_CLEANUP_FAILED",
    state_preserved: true,
    status: "cleanup_failed"
  });
} finally {
  if (operatorDeployed) {
    await mutation(
      ["delete", operatorName, "--force", "--config", operatorConfig],
      "operator delete"
    ).catch(() => undefined);
  }
}

async function runCleanupJob() {
  const jobUrl = `${operatorUrl}/jobs/${state.acceptance_id}-cleanup-recovery`;
  let accepted = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const started = await fetch(jobUrl, {
      body: JSON.stringify({
        acceptance_id: state.acceptance_id,
        path: "/internal/row10/cleanup"
      }),
      headers: {
        authorization: `Bearer ${state.token}`,
        "content-type": "application/json"
      },
      method: "POST"
    }).catch(() => null);
    const body = await started?.json().catch(() => null);
    if (
      (started?.status === 202 && body?.status === "accepted") ||
      (started?.status === 409 && body?.status === "job_exists")
    ) {
      accepted = true;
      break;
    }
    if (started?.status === 403) break;
    await delay(1_000);
  }
  if (!accepted) throw new Error("ROW10_RECOVERY_JOB_REJECTED");
  const deadline = Date.now() + 12 * 60_000;
  try {
    while (Date.now() < deadline) {
      await delay(1_000);
      const response = await fetch(jobUrl, {
        headers: { authorization: `Bearer ${state.token}` }
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result === null) throw new Error("ROW10_RECOVERY_JOB_POLL_FAILED");
      if (result.status === "pending" || result.status === "running") continue;
      if (result.status === "complete") return result.body;
      const code = result.body?.failure_code;
      throw new Error(
        typeof code === "string" && /^[A-Z0-9_:.-]{1,180}$/u.test(code)
          ? code
          : "ROW10_RECOVERY_JOB_FAILED"
      );
    }
    throw new Error("ROW10_RECOVERY_JOB_TIMEOUT");
  } finally {
    await fetch(jobUrl, {
      headers: { authorization: `Bearer ${state.token}` },
      method: "DELETE"
    }).catch(() => undefined);
  }
}

async function waitForReady() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${operatorUrl}/health`);
      const body = await response.json();
      if (
        response.ok &&
        body?.service === "row10-live-acceptance-operator" &&
        body?.status === "ready"
      ) {
        return;
      }
    } catch {}
    await delay(500);
  }
  throw new Error("ROW10_OPERATOR_NOT_READY");
}

async function waitForAuth() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`${operatorUrl}/internal/row10/auth-readback`, {
      headers: { authorization: `Bearer ${state.token}` },
      method: "POST"
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (response?.ok && body?.authorization_matches === true) return;
    await delay(1_000);
  }
  throw new Error("ROW10_OPERATOR_AUTH_FAILED");
}

async function waitForOperatorJobs() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(`${operatorUrl}/jobs/operator-preflight`, {
      headers: { authorization: `Bearer ${state.token}` }
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (response?.ok && body?.status === "missing") return;
    await delay(1_000);
  }
  throw new Error("ROW10_OPERATOR_JOB_BINDING_NOT_READY");
}

async function workerSecret(action, value) {
  await spawnWrangler(
    ["secret", action, "FASTCLAW_ROW10_ACCEPTANCE_TOKEN", "--env", "staging", "--config", workerConfig],
    `worker secret ${action}`,
    action === "put" ? value : "y\n"
  );
}

async function operatorSecret(value) {
  await spawnWrangler(
    ["secret", "put", "ROW10_OPERATOR_TOKEN", "--config", operatorConfig],
    "operator secret put",
    value
  );
}

async function deployWorker() {
  await mutation(["deploy", "--env", "staging", "--keep-vars", "--config", workerConfig], "worker deploy");
}

async function mutation(args, label) {
  await spawnWrangler(args, label);
}

async function spawnWrangler(args, label, stdin = "") {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [resolve(root, "node_modules/wrangler/bin/wrangler.js"), ...args],
      {
        cwd: root,
        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
        stdio: ["pipe", "ignore", "pipe"]
      }
    );
    let output = "";
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.once("exit", (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`${label} failed:${hash(output)}`))
    );
    child.stdin.end(stdin);
  });
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function hash(value) {
  return `sha256:${createHash("sha256").update(String(value)).digest("hex")}`;
}

function fail(value) {
  process.stderr.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exitCode = 1;
}
