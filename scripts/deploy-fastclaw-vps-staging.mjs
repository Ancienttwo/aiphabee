#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const fastclawRoot =
  process.env.FASTCLAW_SOURCE_DIR ??
  "/Users/ancienttwo/Projects/fastclaw-wt-aiphabee-external-tool-callback";
const sshTarget = process.env.AIPHABEE_FASTCLAW_VPS_SSH_TARGET ?? "root@89.167.47.141";
const remoteRoot = "/opt/aiphabee-fastclaw";
const hostname = "89-167-47-141.sslip.io";
const publicPrefix = "";
const workerAccountId = "ab66185011440a6f8a698d61ad58703a";
const migrationConfig = resolve(root, "deploy/fastclaw/row10-migration.wrangler.jsonc");
const workerConfig = resolve(root, "apps/worker/wrangler.jsonc");
const deploySource = resolve(root, "deploy/fastclaw/vps");
const apply = process.argv.includes("--apply");
const resume = process.argv.includes("--resume");
const rotateIngress = process.argv.includes("--rotate-ingress");
const rebuild = process.argv.includes("--rebuild");

const sourceCommit = (
  await capture("git", ["rev-parse", "--short=12", "HEAD"], fastclawRoot)
).trim();
const sourceDiff = await capture("git", ["diff", "--binary", "HEAD"], fastclawRoot);
const sourceHash = hash(`${sourceCommit}\u0000${sourceDiff}`).slice(7, 19);
const imageTag = `${sourceCommit}-${sourceHash}`;
const image = `aiphabee/fastclaw:${imageTag}`;

if (!apply) {
  emit({
    fastclaw_source_hash: `sha256:${sourceHash}`,
    hostname,
    image_tag: imageTag,
    mode: "dry_run",
    shared_staging_pg: true,
    status: "ready_no_mutation",
    vps_target_hash: hash(sshTarget)
  });
}

const temp = await mkdtemp(join(tmpdir(), "aiphabee-fastclaw-vps-"));
let databasePassword = randomBytes(48).toString("base64url");
let bootstrapPassword = randomBytes(48).toString("base64url");
let controlApiKey = `fc_${randomBytes(32).toString("hex")}`;
let ingressToken = randomBytes(48).toString("base64url");

try {
  await preflightVps();
  if (resume) {
    ({ bootstrapPassword, controlApiKey, databasePassword, ingressToken } =
      await loadRemoteSecrets());
    if (rotateIngress) ingressToken = randomBytes(48).toString("base64url");
    await renderSecrets({
      bootstrapPassword,
      controlApiKey,
      databasePassword,
      ingressToken
    });
    if (rebuild) await buildAndTransferImage();
    await transferDeployment();
  } else {
    await rotateDatabaseRole(databasePassword);
    await renderSecrets({
      bootstrapPassword,
      controlApiKey,
      databasePassword,
      ingressToken
    });
    await buildAndTransferImage();
    await transferDeployment();
  }
  await startRemoteComposition();
  await waitForVps(controlApiKey, ingressToken);
  await putWorkerSecret("FASTCLAW_ADMIN_API_KEY", controlApiKey);
  await putWorkerSecret("FASTCLAW_VPS_SHARED_TOKEN", ingressToken);
  await deployWorker();
  await verifyIngress(controlApiKey, ingressToken);
  emit({
    fastclaw_source_hash: `sha256:${sourceHash}`,
    hostname_hash: hash(hostname),
    image_tag: imageTag,
    public_unauthenticated_status: 404,
    runtime_status: "ready",
    shared_staging_pg: true,
    status: "passed",
    vps_target_hash: hash(sshTarget)
  });
} finally {
  await rm(temp, { force: true, recursive: true });
}

async function loadRemoteSecrets() {
  const fastclawEnv = join(temp, "fastclaw.env");
  const ingressEnv = join(temp, "ingress.env");
  await run("scp", ["-q", `${sshTarget}:${remoteRoot}/fastclaw.env`, fastclawEnv], root);
  await run("scp", ["-q", `${sshTarget}:${remoteRoot}/ingress.env`, ingressEnv], root);
  const fastclawValues = parseEnv(await readFile(fastclawEnv, "utf8"));
  const ingressValues = parseEnv(await readFile(ingressEnv, "utf8"));
  const dsn = new URL(required(fastclawValues, "FASTCLAW_STORAGE_DSN"));
  return {
    bootstrapPassword: required(fastclawValues, "FASTCLAW_BOOTSTRAP_ADMIN_PASSWORD"),
    controlApiKey: required(fastclawValues, "FASTCLAW_CONTROL_API_KEY"),
    databasePassword: decodeURIComponent(dsn.password),
    ingressToken: required(ingressValues, "AIPHABEE_VPS_SHARED_TOKEN")
  };
}

async function preflightVps() {
  const output = await capture(
    "ssh",
    ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", sshTarget,
      "docker version --format '{{.Server.Version}}'"],
    root
  );
  if (output.trim() === "") throw new Error("VPS_DOCKER_PREFLIGHT_FAILED");
}

async function rotateDatabaseRole(password) {
  const token = randomBytes(32).toString("base64url");
  const envPath = join(temp, "migration.env");
  await writeFile(envPath, `ROW10_APPLY_TOKEN=${token}\n`, { mode: 0o600 });
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [
      resolve(root, "node_modules/wrangler/bin/wrangler.js"),
      "dev",
      "--remote",
      "--config",
      migrationConfig,
      "--env-file",
      envPath,
      "--ip",
      "127.0.0.1",
      "--port",
      String(port)
    ],
    {
      cwd: root,
      env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: workerAccountId },
      stdio: ["ignore", "ignore", "ignore"]
    }
  );
  try {
    await waitForHttp(`http://127.0.0.1:${port}/health`, 90_000);
    const response = await fetch(
      `http://127.0.0.1:${port}/internal/row10/rotate-fastclaw-vps-role`,
      {
        body: JSON.stringify({ password }),
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        method: "POST"
      }
    );
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.status !== "passed") {
      throw new Error(`VPS_ROLE_ROTATION_FAILED_${response.status}`);
    }
  } finally {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolveExit) => child.once("exit", resolveExit)),
      new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000))
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}

async function renderSecrets(input) {
  const databaseUser = "fastclaw_aiphabee_staging.v20dtpdoz3ik";
  const dsn = `postgresql://${databaseUser}:${encodeURIComponent(input.databasePassword)}@ap-southeast-2.pg.psdb.cloud:5432/postgres?sslmode=require`;
  await writeFile(
    join(temp, "fastclaw.env"),
    [
      "FASTCLAW_HOME=/data/.fastclaw",
      "FASTCLAW_BIND=all",
      "FASTCLAW_PORT=18953",
      "FASTCLAW_AIPHABEE_TOOL_CALLBACK_ENABLED=true",
      "FASTCLAW_STORAGE_TYPE=postgres",
      `FASTCLAW_STORAGE_DSN=${dsn}`,
      "FASTCLAW_STORAGE_AUTO_MIGRATE=true",
      "FASTCLAW_STORAGE_MAX_OPEN_CONNS=2",
      "FASTCLAW_OBJECT_STORE_TYPE=local",
      "FASTCLAW_OBJECT_STORE_LOCAL_ROOT=/data/.fastclaw/workspaces",
      "FASTCLAW_SANDBOX_ENABLED=false",
      "FASTCLAW_BOOTSTRAP_MODEL=openai/row10-deterministic",
      "FASTCLAW_BOOTSTRAP_PROVIDER_BASE_URL=http://deterministic-model:18081/v1",
      "OPENAI_API_KEY=staging-deterministic-no-provider-billing",
      `FASTCLAW_BOOTSTRAP_ADMIN_PASSWORD=${input.bootstrapPassword}`,
      `FASTCLAW_CONTROL_API_KEY=${input.controlApiKey}`,
      ""
    ].join("\n"),
    { mode: 0o600 }
  );
  await writeFile(
    join(temp, "ingress.env"),
    `AIPHABEE_VPS_SHARED_TOKEN=${input.ingressToken}\nFASTCLAW_CONTROL_API_KEY=${input.controlApiKey}\n`,
    { mode: 0o600 }
  );
  await writeFile(
    join(temp, ".env"),
    `FASTCLAW_IMAGE_TAG=${imageTag}\n`,
    { mode: 0o600 }
  );
}

async function buildAndTransferImage() {
  await run("docker", [
    "build",
    "--platform",
    "linux/arm64",
    "--build-arg",
    `VERSION=aiphabee-${imageTag}`,
    "--build-arg",
    `COMMIT=${sourceCommit}`,
    "--build-arg",
    `DATE=${new Date().toISOString().slice(0, 10)}`,
    "-t",
    image,
    "."
  ], fastclawRoot);
  const tar = join(temp, "fastclaw-image.tar");
  await run("docker", ["save", "-o", tar, image], root);
  await run("gzip", ["-f", tar], root);
  const remoteTar = `/tmp/aiphabee-fastclaw-${imageTag}.tar.gz`;
  await run("scp", ["-q", `${tar}.gz`, `${sshTarget}:${remoteTar}`], root);
  await run("ssh", [sshTarget, `docker load --input ${remoteTar}`], root);
  await run("ssh", [sshTarget, `rm -f ${remoteTar}`], root);
}

async function transferDeployment() {
  await run("ssh", [sshTarget, `mkdir -p ${remoteRoot}`], root);
  const files = [
    resolve(deploySource, "docker-compose.yml"),
    resolve(deploySource, "Caddyfile"),
    resolve(deploySource, "vps-entrypoint.sh"),
    resolve(deploySource, "deterministic-model.mjs"),
    join(temp, "fastclaw.env"),
    join(temp, "ingress.env"),
    join(temp, ".env")
  ];
  await run("scp", ["-q", ...files, `${sshTarget}:${remoteRoot}/`], root);
  await run("ssh", [sshTarget, `chmod 600 ${remoteRoot}/.env ${remoteRoot}/fastclaw.env ${remoteRoot}/ingress.env`], root);
  await run("ssh", [sshTarget, `chmod 755 ${remoteRoot}/vps-entrypoint.sh`], root);
}

async function updateSaleskoIngress() {
  const current = join(temp, "salesko-Caddyfile.current");
  const next = join(temp, "salesko-Caddyfile.next");
  await run("scp", ["-q", `${sshTarget}:/opt/salesko-sidecar/Caddyfile`, current], root);
  let source = await readFile(current, "utf8");
  const begin = "\t# BEGIN AiphaBee FastClaw VPS route";
  const end = "\t# END AiphaBee FastClaw VPS route";
  const block = `${begin}\n\thandle_path ${publicPrefix}/* {\n\t\treverse_proxy aiphabee-fastclaw-proxy:80\n\t}\n${end}\n`;
  const blockPattern = /\t# BEGIN AiphaBee FastClaw VPS route[\s\S]*?\t# END AiphaBee FastClaw VPS route\n/u;
  if (blockPattern.test(source)) {
    source = source.replace(blockPattern, block);
  } else {
    source = source.replace(":80 {\n", `:80 {\n${block}`);
  }
  if (!source.includes(block)) throw new Error("SALESKO_INGRESS_PATCH_FAILED");
  await writeFile(next, source, { mode: 0o600 });
  await run("ssh", [sshTarget, "rm -rf /opt/salesko-sidecar/Caddyfile.aiphabee-next"], root);
  await run("scp", ["-q", next, `${sshTarget}:/opt/salesko-sidecar/Caddyfile.aiphabee-next`], root);
  await run("ssh", [sshTarget, "docker run --rm -e AIPHABEE_VPS_SHARED_TOKEN=validation-only-token -v /opt/salesko-sidecar/Caddyfile.aiphabee-next:/etc/caddy/Caddyfile:ro caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile"], root);
  await run("ssh", [sshTarget, "cp /opt/salesko-sidecar/Caddyfile /opt/salesko-sidecar/Caddyfile.pre-aiphabee"], root);
  await run("ssh", [sshTarget, "mv /opt/salesko-sidecar/Caddyfile.aiphabee-next /opt/salesko-sidecar/Caddyfile"], root);
}

async function startRemoteComposition() {
  await run("ssh", [sshTarget, `docker compose --project-directory ${remoteRoot} -f ${remoteRoot}/docker-compose.yml config --quiet`], root);
  await run("ssh", [sshTarget, `docker compose --project-directory ${remoteRoot} -f ${remoteRoot}/docker-compose.yml up -d`], root);
}

async function waitForVps(adminKey, sharedToken) {
  const deadline = Date.now() + 420_000;
  while (Date.now() < deadline) {
    const response = await fetch(`https://${hostname}${publicPrefix}/api/status`, {
      headers: {
        authorization: `Bearer ${sharedToken}`
      },
      signal: AbortSignal.timeout(60_000)
    }).catch(() => null);
    if (response?.ok) {
      await response.body?.cancel().catch(() => undefined);
      return;
    }
    await response?.body?.cancel().catch(() => undefined);
    await delay(2_000);
  }
  throw new Error("VPS_FASTCLAW_NOT_READY");
}

async function verifyIngress(adminKey, sharedToken) {
  const denied = await fetch(`https://${hostname}${publicPrefix}/api/status`);
  await denied.body?.cancel().catch(() => undefined);
  if (denied.status !== 404) throw new Error(`VPS_PUBLIC_GATE_FAILED_${denied.status}`);
  const allowed = await fetch(`https://${hostname}${publicPrefix}/api/status`, {
    headers: {
      authorization: `Bearer ${sharedToken}`
    }
  });
  await allowed.body?.cancel().catch(() => undefined);
  if (!allowed.ok) throw new Error(`VPS_AUTHENTICATED_GATE_FAILED_${allowed.status}`);
}

async function putWorkerSecret(name, value) {
  await runWithInput(
    process.execPath,
    [
      resolve(root, "node_modules/wrangler/bin/wrangler.js"),
      "secret",
      "put",
      name,
      "--env",
      "staging",
      "--config",
      workerConfig
    ],
    value,
    root,
    { CLOUDFLARE_ACCOUNT_ID: workerAccountId }
  );
}

async function deployWorker() {
  await run(
    process.execPath,
    [
      resolve(root, "node_modules/wrangler/bin/wrangler.js"),
      "deploy",
      "--env",
      "staging",
      "--keep-vars",
      "--config",
      workerConfig
    ],
    root,
    { CLOUDFLARE_ACCOUNT_ID: workerAccountId }
  );
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(url).catch(() => null);
    if (response?.ok) return;
    await delay(500);
  }
  throw new Error("LOCAL_OPERATOR_NOT_READY");
}

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

async function capture(command, args, cwd, env = {}) {
  return new Promise((resolveOutput, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.once("exit", (code) =>
      code === 0 ? resolveOutput(output) : reject(new Error(`${command.toUpperCase()}_FAILED`))
    );
  });
}

async function run(command, args, cwd, env = {}) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "ignore", "pipe"]
    });
    let errorOutput = "";
    child.stderr.on("data", (chunk) => (errorOutput += String(chunk)));
    child.once("exit", (code) =>
      code === 0
        ? resolveRun()
        : reject(new Error(`${command.toUpperCase()}_FAILED_${hash(errorOutput)}`))
    );
  });
}

async function runWithInput(command, args, input, cwd, env = {}) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["pipe", "ignore", "pipe"]
    });
    let errorOutput = "";
    child.stderr.on("data", (chunk) => (errorOutput += String(chunk)));
    child.once("exit", (code) =>
      code === 0
        ? resolveRun()
        : reject(new Error(`${command.toUpperCase()}_FAILED_${hash(errorOutput)}`))
    );
    child.stdin.end(input);
  });
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function parseEnv(source) {
  return new Map(
    source
      .split(/\r?\n/u)
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/u.test(line))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
}

function required(values, name) {
  const value = values.get(name);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`VPS_SECRET_${name}_MISSING`);
  }
  return value;
}

function hash(value) {
  return `sha256:${createHash("sha256").update(String(value)).digest("hex")}`;
}

function emit(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exit(0);
}
