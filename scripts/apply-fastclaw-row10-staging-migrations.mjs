#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const defaultPacketPath = "_ops/fastclaw-row10/migration-readback.json";
const migrations = [
  {
    file: "deploy/database/migrations/20260620090000_usage_ledger_scaffold.sql",
    sha256: "2a9be30af702f4896271b5ad25fd703eb4decc9f95de7d392e13b6f194b9db58"
  },
  {
    file: "deploy/database/migrations/20260710120000_research_agent_lifecycle.sql",
    sha256: "bc34091942b03f30104b0c7015c17fe11337bf5437c41055cb35c098023864b3"
  },
  {
    file: "deploy/database/migrations/20260711140000_durable_memory_artifact_handoff.sql",
    sha256: "61d8434688ffe8b772bb0f570a58f7e750cd8dfc5aea10302349923afff87b23"
  },
  {
    file: "deploy/database/migrations/20260711151100_research_agent_product_control.sql",
    sha256: "87eead99b7e581aaf5a7d9769cf31c1c79f1a18bede3dd641f8d82251fff26b5"
  },
  {
    file: "deploy/database/migrations/20260711164500_fastclaw_live_runtime_policies.sql",
    sha256: "d89477b29152c24dd9fb4c49893cd6a36c1789ef8443414ba79ef0fd27862577"
  }
];

class OperatorFailure extends Error {
  constructor(output) {
    super(String(output?.status ?? "operator failure"));
    this.output = output;
  }
}

const checkPacketIndex = process.argv.indexOf("--check-packet");
if (checkPacketIndex >= 0) {
  const path = process.argv[checkPacketIndex + 1];
  if (!path) fail({ status: "missing_packet_path" });
  const packet = JSON.parse(await readFile(resolve(root, path), "utf8"));
  try {
    validatePacket(packet);
  } catch {
    fail({ status: "invalid_migration_readback_packet" });
  }
  emit({ packet_hash: hash(JSON.stringify(packet)), status: "passed" });
}

const payload = [];
for (const migration of migrations) {
  const sql = await readFile(resolve(root, migration.file), "utf8");
  if (hashRaw(sql) !== migration.sha256) {
    fail({ file: migration.file, status: "migration_hash_mismatch" });
  }
  payload.push({ ...migration, sql });
}

if (process.argv.includes("--dry-run")) {
  emit({
    hyperdrive_id_hash: hash("1e83eb563db44746a168175e065cc958"),
    migration_hashes: payload.map((migration) => `sha256:${migration.sha256}`),
    mode: "wrangler_remote_dev_hyperdrive",
    status: "ready_no_mutation"
  });
}

const packetIndex = process.argv.indexOf("--packet");
const packetPath = packetIndex >= 0 ? process.argv[packetIndex + 1] : defaultPacketPath;
if (!packetPath) fail({ status: "missing_packet_path" });

const token = randomBytes(32).toString("base64url");
const temp = await mkdtemp(join(tmpdir(), "aiphabee-row10-migration-"));
const envFile = join(temp, "operator.env");
await writeFile(envFile, `ROW10_APPLY_TOKEN=${token}\n`, { mode: 0o600 });
const port = await freePort();
const logs = [];
const child = spawn(
  process.execPath,
  [
    resolve(root, "node_modules/wrangler/bin/wrangler.js"),
    "dev",
    "--remote",
    "--config",
    resolve(root, "deploy/fastclaw/row10-migration.wrangler.jsonc"),
    "--env-file",
    envFile,
    "--ip",
    "127.0.0.1",
    "--port",
    String(port)
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      CLOUDFLARE_ACCOUNT_ID: "ab66185011440a6f8a698d61ad58703a"
    },
    stdio: ["ignore", "pipe", "pipe"]
  }
);
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    logs.push(String(chunk));
    if (logs.length > 100) logs.shift();
  });
}

let finalOutput;
let operatorFailure;
try {
  await waitForReady(port, child);
  const identityResponse = await fetch(
    `http://127.0.0.1:${port}/internal/row10/runtime-identity`,
    {
      headers: { authorization: `Bearer ${token}` },
      method: "POST"
    }
  );
  const identity = await identityResponse.json().catch(() => null);
  if (
    !identityResponse.ok ||
    identity?.status !== "passed" ||
    typeof identity?.runtime_role !== "string" ||
    !/^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/u.test(identity.runtime_role)
  ) {
    throw new OperatorFailure({
      identity_response_hash: hash(JSON.stringify(identity)),
      identity_response_status: identityResponse.status,
      operator_log_hash: hash(logs.join("")),
      status: "runtime_identity_failed"
    });
  }
  const response = await fetch(`http://127.0.0.1:${port}/internal/row10/apply-migrations`, {
    body: JSON.stringify({ migrations: payload, runtime_role: identity.runtime_role }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    method: "POST"
  });
  const responseText = await response.text();
  let result = null;
  try {
    result = JSON.parse(responseText);
  } catch {}
  if (!response.ok || result?.status !== "passed") {
    throw new OperatorFailure({
      operator_log_hash: hash(logs.join("")),
      remote_error_hash:
        typeof result?.error_hash === "string" && /^sha256:[0-9a-f]{64}$/u.test(result.error_hash)
          ? result.error_hash
          : null,
      remote_failure_class:
        typeof result?.failure_class === "string" ? result.failure_class : null,
      remote_phase: typeof result?.phase === "string" ? result.phase : null,
      remote_sqlstate:
        typeof result?.sqlstate === "string" && /^[0-9A-Z]{5}$/u.test(result.sqlstate)
          ? result.sqlstate
          : null,
      remote_status: typeof result?.status === "string" ? result.status : "invalid_response",
      response_content_type: response.headers.get("content-type"),
      response_hash: hash(JSON.stringify(result)),
      response_http_status: response.status,
      response_text_hash: hash(responseText),
      status: "remote_migration_failed"
    });
  }
  const packet = {
    ...result,
    environment: "staging",
    hyperdrive_id_hash: hash("1e83eb563db44746a168175e065cc958"),
    observed_at: new Date().toISOString(),
    operator: "wrangler_remote_dev_hyperdrive"
  };
  validatePacket(packet);
  const absolutePacket = resolve(root, packetPath);
  await mkdir(dirname(absolutePacket), { recursive: true });
  await writeFile(absolutePacket, `${JSON.stringify(packet, null, 2)}\n`, { mode: 0o600 });
  finalOutput = {
    packet_hash: hash(JSON.stringify(packet)),
    packet_path: packetPath,
    status: "passed"
  };
} catch (error) {
  operatorFailure =
    error instanceof OperatorFailure
      ? error.output
      : {
          error_hash: hash(error instanceof Error ? error.message : "unknown operator error"),
          operator_log_hash: hash(logs.join("")),
          status: "remote_migration_failed"
        };
} finally {
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => child.once("exit", resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000))
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
  await rm(temp, { force: true, recursive: true });
}
if (operatorFailure !== undefined) fail(operatorFailure);
emit(finalOutput);

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

async function waitForReady(port, child) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("wrangler remote dev exited before readiness");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error("wrangler remote dev did not become ready");
}

function validatePacket(packet) {
  const readback = packet?.readback;
  if (
    packet?.status !== "passed" ||
    packet?.environment !== "staging" ||
    packet?.operator !== "wrangler_remote_dev_hyperdrive" ||
    !Array.isArray(packet?.migration_hashes) ||
    packet.migration_hashes.length !== migrations.length ||
    packet.migration_hashes.some((value, index) => value !== `sha256:${migrations[index].sha256}`) ||
    readback?.lifecycle_profile_table !== true ||
    readback?.durable_handoff_table !== true ||
    readback?.product_usage_table !== true ||
    readback?.admin_audit_table !== true ||
    readback?.usage_meter_rule !== true ||
    readback?.forced_rls_count !== 4 ||
    readback?.runtime_privileges !== true ||
    !/^sha256:[0-9a-f]{64}$/u.test(readback?.origin_user_hash ?? "") ||
    !/^sha256:[0-9a-f]{64}$/u.test(readback?.runtime_origin_user_hash ?? "") ||
    !/^sha256:[0-9a-f]{64}$/u.test(packet?.schema_hash ?? "")
  ) {
    throw new Error("invalid migration readback packet");
  }
}

function hashRaw(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hash(value) {
  return `sha256:${hashRaw(value)}`;
}

function emit(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exit(0);
}

function fail(value) {
  process.stderr.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exit(1);
}
