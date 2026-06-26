import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cloudflareResourceContractPath = "deploy/cloudflare/resource-smoke-readiness.contract.json";
const localOpsEnvFileListEnvName = "AIPHABEE_LIVE_SMOKE_ENV_FILES";
const defaultLocalOpsEnvPaths = [
  "_ops/env/aiphabee-planetscale-prod.env",
  "_ops/env/aiphabee-planetscale-prod.private.env",
  "_ops/env/aiphabee-live-smoke-private.env"
];
const resourceNameEnvMap = {
  AI_GATEWAY_NAME: "ai_gateway",
  CLOUDFLARE_D1_DATABASE_NAME: "d1_database",
  CLOUDFLARE_DURABLE_OBJECT_NAMESPACE_NAME: "durable_object_namespace",
  CLOUDFLARE_HYPERDRIVE_CONFIG_NAME: "hyperdrive_config",
  CLOUDFLARE_WORKER_NAME: "worker",
  CLOUDFLARE_WORKFLOW_NAME: "workflow",
  KV_NAMESPACE_ID: "kv_namespace_title",
  QUEUE_NAME: "queue",
  R2_BUCKET_NAME: "r2_bucket"
};

export const cloudflareLiveSmokeDefaultEnvNames = Object.freeze(
  Object.keys(resourceNameEnvMap)
);

let cachedCloudflareResourceNames;
let cachedLocalOpsEnvValues;

export function getLiveSmokeEnvValue(name) {
  if (hasValue(process.env[name])) {
    return process.env[name].trim();
  }

  const localOpsEnvValue = getLocalOpsEnvValue(name);

  if (hasValue(localOpsEnvValue)) {
    return localOpsEnvValue.trim();
  }

  const resourceNameKey = resourceNameEnvMap[name];

  if (!resourceNameKey) {
    return "";
  }

  const resourceNames = getCloudflareResourceNames();
  const value = resourceNames[resourceNameKey];

  return hasValue(value) ? value.trim() : "";
}

export function getMissingLiveSmokeEnv(names) {
  return names.filter((name) => !hasValue(getLiveSmokeEnvValue(name)));
}

export function requireLiveSmokeEnvValue(name) {
  const value = getLiveSmokeEnvValue(name);

  if (!hasValue(value)) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function getLiveSmokeEnvSource(name) {
  if (hasValue(process.env[name])) {
    return "env";
  }

  if (hasValue(getLocalOpsEnvValue(name))) {
    return "local_ops_env_file";
  }

  return hasValue(getLiveSmokeEnvValue(name)) ? "contract_partial_provisioning" : "missing";
}

function getLocalOpsEnvValue(name) {
  const values = getLocalOpsEnvValues();
  const value = values[name];

  return hasValue(value) ? value : "";
}

function getLocalOpsEnvValues() {
  if (cachedLocalOpsEnvValues) {
    return cachedLocalOpsEnvValues;
  }

  cachedLocalOpsEnvValues = {};

  for (const path of getLocalOpsEnvPaths()) {
    Object.assign(cachedLocalOpsEnvValues, readLocalOpsEnvFile(path));
  }

  return cachedLocalOpsEnvValues;
}

function getLocalOpsEnvPaths() {
  const configuredPaths = process.env[localOpsEnvFileListEnvName];

  if (hasValue(configuredPaths)) {
    return configuredPaths
      .split(",")
      .map((value) => value.trim())
      .filter(hasValue);
  }

  return defaultLocalOpsEnvPaths;
}

function readLocalOpsEnvFile(path) {
  try {
    return parseLocalOpsEnv(readFileSync(resolve(process.cwd(), path), "utf8"));
  } catch {
    return {};
  }
}

function parseLocalOpsEnv(value) {
  const parsed = {};

  for (const line of value.split(/\r?\n/u)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)\s*$/u);

    if (!match) {
      continue;
    }

    const [, name, rawValue] = match;
    parsed[name] = normalizeLocalOpsEnvValue(rawValue);
  }

  return parsed;
}

function normalizeLocalOpsEnvValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function getCloudflareResourceNames() {
  if (cachedCloudflareResourceNames) {
    return cachedCloudflareResourceNames;
  }

  try {
    const contract = JSON.parse(
      readFileSync(resolve(process.cwd(), cloudflareResourceContractPath), "utf8")
    );
    cachedCloudflareResourceNames = contract.partial_provisioning?.resource_names ?? {};
  } catch {
    cachedCloudflareResourceNames = {};
  }

  return cachedCloudflareResourceNames;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}
