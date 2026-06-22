import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cloudflareResourceContractPath = "deploy/cloudflare/resource-smoke-readiness.contract.json";
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

export function getLiveSmokeEnvValue(name) {
  if (hasValue(process.env[name])) {
    return process.env[name].trim();
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

  return hasValue(getLiveSmokeEnvValue(name)) ? "contract_partial_provisioning" : "missing";
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
