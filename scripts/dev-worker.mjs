#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const workerDir = resolve(repoRoot, "apps/worker");
const directPreflightContractPath = resolve(
  repoRoot,
  "deploy/database/planetscale-direct-preflight.contract.json"
);
const requiredHyperdriveEnv =
  "CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_AIPHABEE_HYPERDRIVE";
const wranglerEnvName = resolveWranglerEnvName(process.argv.slice(2));

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

const hyperdriveEnvResolution = resolveLocalHyperdriveEnv(childEnv);

if (!hasValue(childEnv[requiredHyperdriveEnv])) {
  const checked = loadedEnvFiles.length > 0 ? loadedEnvFiles.join(", ") : "none";
  console.error(
    [
      `Missing ${requiredHyperdriveEnv}.`,
      `Checked env files: ${checked}.`,
      `Keychain fallback: ${hyperdriveEnvResolution.status}.`,
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

function resolveLocalHyperdriveEnv(env) {
  if (hasValue(env[requiredHyperdriveEnv])) {
    return { status: "present" };
  }

  for (const fallbackEnv of ["HYPERDRIVE_DATABASE_URL", "PLANETSCALE_DATABASE_URL"]) {
    if (hasValue(env[fallbackEnv])) {
      env[requiredHyperdriveEnv] = env[fallbackEnv];
      return { status: `derived_from_${fallbackEnv}` };
    }
  }

  if (process.platform !== "darwin") {
    return { status: "skipped_non_darwin" };
  }

  if (env.AIPHABEE_WORKER_DEV_DISABLE_KEYCHAIN === "1") {
    return { status: "disabled_by_AIPHABEE_WORKER_DEV_DISABLE_KEYCHAIN" };
  }

  if (wranglerEnvName !== undefined) {
    return { status: `skipped_keychain_for_wrangler_env_${formatStatusValue(wranglerEnvName)}` };
  }

  const connectionString = buildPlanetScaleConnectionStringFromKeychain();

  if (!hasValue(connectionString)) {
    return { status: "missing_planetscale_keychain_password" };
  }

  env[requiredHyperdriveEnv] = connectionString;
  return { status: "derived_from_planetscale_keychain" };
}

function buildPlanetScaleConnectionStringFromKeychain() {
  let contract;

  try {
    contract = JSON.parse(readFileSync(directPreflightContractPath, "utf8"));
  } catch {
    return undefined;
  }

  const target = contract.target;
  const keychainSource = Array.isArray(contract.credential_sources)
    ? contract.credential_sources.find((source) => source?.source === "macos_keychain")
    : undefined;

  if (
    contract.provider !== "planetscale_postgres" ||
    !isRecord(target) ||
    !isRecord(keychainSource) ||
    !hasValue(target.host) ||
    !Number.isInteger(target.port) ||
    !hasValue(target.dbname) ||
    !hasValue(target.user) ||
    !hasValue(target.sslmode) ||
    !hasValue(keychainSource.service) ||
    !hasValue(keychainSource.account) ||
    keychainSource.account !== target.user
  ) {
    return undefined;
  }

  const passwordResult = spawnSync(
    "security",
    [
      "find-generic-password",
      "-s",
      keychainSource.service,
      "-a",
      keychainSource.account,
      "-w"
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }
  );

  const password = passwordResult.stdout?.trim();

  if (passwordResult.status !== 0 || !hasValue(password)) {
    return undefined;
  }

  const connectionString = new URL("postgresql://localhost");
  connectionString.hostname = target.host;
  connectionString.port = String(target.port);
  connectionString.username = target.user;
  connectionString.password = password;
  connectionString.pathname = `/${target.dbname}`;
  connectionString.searchParams.set("sslmode", target.sslmode);

  return connectionString.toString();
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveWranglerEnvName(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if ((arg === "--env" || arg === "-e") && hasValue(args[index + 1])) {
      return args[index + 1].trim();
    }

    if (arg.startsWith("--env=")) {
      const [, value = ""] = arg.split("=", 2);
      return hasValue(value) ? value.trim() : undefined;
    }
  }

  return undefined;
}

function formatStatusValue(value) {
  return value.replaceAll(/[^A-Za-z0-9_]+/gu, "_").replaceAll(/^_+|_+$/gu, "") || "unknown";
}
