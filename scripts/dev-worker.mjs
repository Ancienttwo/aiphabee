#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const workerDir = resolve(repoRoot, "apps/worker");
const requiredHyperdriveEnv =
  "CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_AIPHABEE_HYPERDRIVE";

const defaultEnvFiles = [
  resolve(workerDir, ".dev.vars"),
  resolve(workerDir, ".env"),
  resolve(repoRoot, ".env"),
  resolve(repoRoot, "_ops/env/aiphabee-planetscale-prod.private.env"),
  resolve(repoRoot, "_ops/env/aiphabee-live-smoke-private.env"),
];

const envFiles = process.env.AIPHABEE_WORKER_DEV_ENV_FILE
  ? [resolveMaybeRelative(process.env.AIPHABEE_WORKER_DEV_ENV_FILE)]
  : defaultEnvFiles;

const childEnv = { ...process.env };
const loadedEnvFiles = [];

for (const file of envFiles) {
  if (!existsSync(file)) continue;
  const entries = parseEnvFile(file);
  for (const [key, value] of entries) {
    if (childEnv[key] === undefined) {
      childEnv[key] = value;
    }
  }
  loadedEnvFiles.push(relative(repoRoot, file));
}

if (!hasValue(childEnv[requiredHyperdriveEnv])) {
  const checked = loadedEnvFiles.length > 0 ? loadedEnvFiles.join(", ") : "none";
  console.error(
    [
      `Missing ${requiredHyperdriveEnv}.`,
      `Checked env files: ${checked}.`,
      "Set it in the shell, apps/worker/.dev.vars, or AIPHABEE_WORKER_DEV_ENV_FILE."
    ].join("\n")
  );
  process.exit(1);
}

const wranglerBin = existsSync(resolve(repoRoot, "node_modules/.bin/wrangler"))
  ? resolve(repoRoot, "node_modules/.bin/wrangler")
  : "wrangler";

const args = [
  "dev",
  "--config",
  "wrangler.jsonc",
  "--port",
  process.env.AIPHABEE_WORKER_DEV_PORT ?? "8787",
  ...process.argv.slice(2),
];

const child = spawn(wranglerBin, args, {
  cwd: workerDir,
  env: childEnv,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1);
  }
  process.exit(code ?? 1);
});

function parseEnvFile(file) {
  const text = readFileSync(file, "utf8");
  const entries = new Map();

  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u.exec(line);
    if (!match) continue;

    entries.set(match[1], parseEnvValue(match[2].trim()));
  }

  return entries;
}

function parseEnvValue(value) {
  if (value.length < 2) return value;
  const quote = value[0];
  if ((quote === "\"" || quote === "'" || quote === "`") && value.at(-1) === quote) {
    const unquoted = value.slice(1, -1);
    return quote === "\"" ? unescapeDoubleQuotedValue(unquoted) : unquoted;
  }
  return value;
}

function unescapeDoubleQuotedValue(value) {
  return value
    .replaceAll("\\n", "\n")
    .replaceAll("\\r", "\r")
    .replaceAll("\\t", "\t")
    .replaceAll("\\\"", "\"")
    .replaceAll("\\\\", "\\");
}

function resolveMaybeRelative(file) {
  return isAbsolute(file) ? file : resolve(repoRoot, file);
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}
